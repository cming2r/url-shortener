export default {
	async fetch(request, env) {
		// 設置 CORS 標頭
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// URL 驗證函數
		function isValidUrl(url) {
			try {
				const parsedUrl = new URL(url);
				// 限制只允許 http 和 https 協議
				return ['http:', 'https:'].includes(parsedUrl.protocol);
			} catch (error) {
				return false;
			}
		}

		// 生成唯一短代碼
		async function generateUniqueShortCode(env) {
			const shortCode = crypto.randomUUID().slice(0, 8);

			// 快速檢查是否存在
			const existingUrl = await env.URL_STORE.get(shortCode);

			return existingUrl ? generateUniqueShortCode(env) : shortCode;
		}

		// 獲取 IP 地理位置信息
		async function getGeoLocation(ip, request) {
			try {
				// 使用 Cloudflare 的地理位置信息
				const geoData = request.cf || {};

				return {
					country: geoData.country || 'Unknown',
					city: geoData.city || 'Unknown',
					region: geoData.region || 'Unknown',
					latitude: geoData.latitude || null,
					longitude: geoData.longitude || null,
					timezone: geoData.timezone || 'Unknown'
				};
			} catch (error) {
				console.error('Geo location lookup error:', error);
				return {
					country: 'Unknown',
					city: 'Unknown',
					region: 'Unknown',
					latitude: null,
					longitude: null,
					timezone: 'Unknown'
				};
			}
		}

		// 更新統計信息
		async function updateTrafficStats(shortCode, geoInfo, env) {
			const now = new Date();
			const statsKey = `stats:${shortCode}`;

			// 獲取現有統計數據
			const existingStatsString = await env.URL_STORE.get(statsKey);
			const existingStats = existingStatsString
				? JSON.parse(existingStatsString)
				: {
					dailyClicks: {},
					weeklyClicks: {},
					monthlyClicks: {},
					totalClicks: 0,
					geoData: {
						countries: {},
						cities: {}
					}
				};

			// 格式化日期
			const dateFormats = {
				daily: now.toISOString().split('T')[0],
				weekly: `${now.getFullYear()}-W${getWeekNumber(now)}`,
				monthly: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
			};

			// 更新點擊統計
			existingStats.dailyClicks[dateFormats.daily] =
				(existingStats.dailyClicks[dateFormats.daily] || 0) + 1;
			existingStats.weeklyClicks[dateFormats.weekly] =
				(existingStats.weeklyClicks[dateFormats.weekly] || 0) + 1;
			existingStats.monthlyClicks[dateFormats.monthly] =
				(existingStats.monthlyClicks[dateFormats.monthly] || 0) + 1;

			// 更新總點擊次數
			existingStats.totalClicks += 1;

			// 更新地理位置統計
			const country = geoInfo.country || 'Unknown';
			const city = geoInfo.city || 'Unknown';
			existingStats.geoData.countries[country] =
				(existingStats.geoData.countries[country] || 0) + 1;
			existingStats.geoData.cities[city] =
				(existingStats.geoData.cities[city] || 0) + 1;

			// 儲存更新後的統計
			await env.URL_STORE.put(statsKey, JSON.stringify(existingStats));

			return existingStats;
		}

		// 獲取當前週數
		function getWeekNumber(d) {
			d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
			const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
			const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
			return weekNo;
		}

		// 獲取短網址統計信息的端點
		async function getUrlStats(shortCode, env) {
			// 先嘗試直接獲取短網址記錄
			let urlRecordString = await env.URL_STORE.get(shortCode);

			// 如果沒找到，嘗試使用 stats: 前綴
			if (!urlRecordString) {
				urlRecordString = await env.URL_STORE.get(`stats:${shortCode}`);
			}

			if (!urlRecordString) {
				return null;
			}

			const urlRecord = JSON.parse(urlRecordString);

			// 獲取統計信息
			const statsKey = `stats:${shortCode}`;
			const statsRecordString = await env.URL_STORE.get(statsKey);
			const statsRecord = statsRecordString
				? JSON.parse(statsRecordString)
				: {
					dailyClicks: {},
					weeklyClicks: {},
					monthlyClicks: {},
					totalClicks: 0,
					geoData: {
						countries: {},
						cities: {}
					}
				};

			// 合併基本信息和統計信息
			return {
				shortCode,
				longUrl: urlRecord.longUrl || 'N/A',
				createdAt: urlRecord.createdAt,
				lastAccessedAt: urlRecord.lastAccessedAt,
				...statsRecord
			};
		}

		// 概率性清理超過一個月的短網址
		async function probabilisticCleanup(env) {
			// 10% 的概率執行清理
			if (Math.random() < 0.1) {
				const oneMonthAgo = new Date();
				oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

				let cursor = null;
				let deletedCount = 0;

				do {
					const listResult = await env.URL_STORE.list({
						cursor: cursor,
						limit: 100
					});

					const deletePromises = listResult.keys.map(async (key) => {
						// 忽略統計相關的 KV 鍵
						if (key.name.startsWith('stats:')) return;

						const urlRecordString = await env.URL_STORE.get(key.name);

						if (urlRecordString) {
							const urlRecord = JSON.parse(urlRecordString);
							const createdDate = new Date(urlRecord.createdAt);

							// 如果短網址超過一個月，則刪除
							if (createdDate < oneMonthAgo) {
								// 刪除短網址
								await env.URL_STORE.delete(key.name);
								// 刪除對應的統計信息
								await env.URL_STORE.delete(`stats:${key.name}`);
								deletedCount++;
							}
						}
					});

					await Promise.all(deletePromises);

					cursor = listResult.cursor;
				} while (listResult.list_complete === false);

				console.log(`probabilistic cleanup：刪除了 ${deletedCount} 個超過一個月的短網址`);
			}
		}

		// 處理預檢請求
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: corsHeaders
			});
		}

		try {
			const url = new URL(request.url);

			// 在每次請求時進行概率性清理
			await probabilisticCleanup(env);

			// 新增統計信息查詢端點
			if (request.method === 'GET' && url.pathname.startsWith('/stats/')) {
				const shortCode = url.pathname.split('/').pop();

				const stats = await getUrlStats(shortCode, env);

				if (!stats) {
					return new Response(
						JSON.stringify({ error: '找不到該短網址的統計信息' }),
						{
							status: 404,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						}
					);
				}

				return new Response(
					JSON.stringify(stats),
					{
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					}
				);
			}

			// POST 請求 - 建立短網址
			if (request.method === 'POST') {
				const { url: longUrl } = await request.json();

				if (!longUrl) {
					return new Response(
						JSON.stringify({ error: '請提供要縮短的網址' }),
						{
							status: 400,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						}
					);
				}

				// URL 驗證
				if (!isValidUrl(longUrl)) {
					return new Response(
						JSON.stringify({ error: '無效的 URL。請確保使用 http 或 https 協議。' }),
						{
							status: 400,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						}
					);
				}

				// 生成唯一短代碼
				const shortCode = await generateUniqueShortCode(env);

				// 創建包含追蹤信息的網址記錄
				const urlRecord = JSON.stringify({
					longUrl,
					createdAt: new Date().toISOString(),
					clicks: 0,  // 初始化點擊次數
					lastAccessedAt: null,
					creator: {
						ip: request.headers.get('CF-Connecting-IP') || 'Unknown'
					}
				});

				// 初始化統計記錄
				const initialStats = JSON.stringify({
					dailyClicks: {},
					weeklyClicks: {},
					monthlyClicks: {},
					totalClicks: 0,
					geoData: {
						countries: {},
						cities: {}
					}
				});

				// 儲存到 KV
				await env.URL_STORE.put(shortCode, urlRecord);
				await env.URL_STORE.put(`stats:${shortCode}`, initialStats);

				// 回傳短網址
				return new Response(
					JSON.stringify({
						shortUrl: `${url.origin}/${shortCode}`,
						originalUrl: longUrl
					}),
					{
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					}
				);
			}

			// GET 請求 - 重定向到原始網址
			if (request.method === 'GET' && url.pathname.length > 1) {
				const shortCode = url.pathname.slice(1);

				// 從 KV 中獲取原始網址記錄
				const urlRecordString = await env.URL_STORE.get(shortCode);

				if (!urlRecordString) {
					return new Response('Short URL not found', {
						status: 404,
						headers: corsHeaders
					});
				}

				// 解析網址記錄並更新點擊統計
				const urlRecord = JSON.parse(urlRecordString);
				urlRecord.clicks += 1;
				urlRecord.lastAccessedAt = new Date().toISOString();

				// 獲取地理位置信息
				const geoInfo = await getGeoLocation(
					request.headers.get('CF-Connecting-IP') || 'Unknown',
					request
				);

				// 更新統計信息
				const trafficStats = await updateTrafficStats(shortCode, geoInfo, env);

				// 更新 KV 中的記錄
				await env.URL_STORE.put(shortCode, JSON.stringify(urlRecord));

				// 重定向到原始網址
				return Response.redirect(urlRecord.longUrl, 302);
			}

			// 首頁或其他請求
			return new Response('URL Shortener API', {
				headers: corsHeaders
			});

		} catch (err) {
			return new Response(
				JSON.stringify({ error: err.message }),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders
					}
				}
			);
		}
	}
};