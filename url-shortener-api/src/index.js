export default {
	async fetch(request, env) {
	  // 設置 CORS 標頭
	  const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Credentials': 'true',
	  };
	
	  // 處理預檢請求
	  if (request.method === 'OPTIONS') {
		return new Response(null, {
		  headers: corsHeaders
		});
	  }
	
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
	
	  try {
		// 確保是 POST 請求
		if (request.method !== 'POST') {
		  return new Response(
			JSON.stringify({ 
			  success: false, 
			  error: '僅支持 POST 請求' 
			}), 
			{
			  status: 405,
			  headers: {
				'Content-Type': 'application/json',
				...corsHeaders
			  }
			}
		  );
		}
	
		// 安全地解析 JSON
		let body;
		try {
		  body = await request.json();
		} catch (error) {
		  console.error('JSON解析錯誤:', error);
		  return new Response(
			JSON.stringify({ 
			  success: false, 
			  error: '無效的 JSON 數據' 
			}), 
			{
			  status: 400,
			  headers: {
				'Content-Type': 'application/json',
				...corsHeaders
			  }
			}
		  );
		}
	
		// 檢查 URL
		const longUrl = body.url;
		if (!longUrl) {
		  return new Response(
			JSON.stringify({ 
			  success: false, 
			  error: '請提供要縮短的網址' 
			}), 
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
			JSON.stringify({ 
			  success: false, 
			  error: '無效的 URL。請確保使用 http 或 https 協議。' 
			}), 
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
		  clicks: 0,
		  lastAccessedAt: null,
		  creator: {
			ip: request.headers.get('CF-Connecting-IP') || 'Unknown'
		  }
		});
	
		// 儲存到 KV
		await env.URL_STORE.put(shortCode, urlRecord);
	
		// 構造完整的短網址
		const shortUrl = `https://vvrl.cc/${shortCode}`;
	
		// 回傳短網址
		return new Response(
		  JSON.stringify({ 
			success: true,
			shortUrl: shortUrl,
			originalUrl: longUrl 
		  }), 
		  {
			headers: {
			  'Content-Type': 'application/json',
			  ...corsHeaders
			}
		  }
		);
	
	  } catch (err) {
		console.error('伺服器錯誤:', err);
		return new Response(
		  JSON.stringify({ 
			success: false, 
			error: err.message || '伺服器內部錯誤' 
		  }), 
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