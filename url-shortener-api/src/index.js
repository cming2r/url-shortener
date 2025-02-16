export default {
	async fetch(request, env) {
	  const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	  };
  
	  if (request.method === 'OPTIONS') {
		return new Response(null, { headers: corsHeaders });
	  }
  
	  try {
		const url = new URL(request.url);
		const domain = 'https://vvrl.cc';
  
		// API 端點處理
		if (url.pathname === '/api' && request.method === 'POST') {
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
  
		  // 驗證 URL 格式
		  try {
			new URL(longUrl);
		  } catch {
			return new Response(
			  JSON.stringify({ error: '無效的 URL 格式' }), 
			  {
				status: 400,
				headers: {
				  'Content-Type': 'application/json',
				  ...corsHeaders
				}
			  }
			);
		  }
  
		  // 使用更安全的短碼生成方法
		  const generateShortCode = () => {
			const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
			const length = 6;
			return Array.from(crypto.getRandomValues(new Uint8Array(length)))
			  .map(x => chars[x % chars.length])
			  .join('');
		  };
  
		  const shortCode = generateShortCode();
		  
		  // 檢查短碼是否已存在
		  const existing = await env.URL_STORE.get(shortCode);
		  if (existing) {
			return new Response(
			  JSON.stringify({ error: '請重試' }), 
			  {
				status: 409,
				headers: {
				  'Content-Type': 'application/json',
				  ...corsHeaders
				}
			  }
			);
		  }
  
		  // 設定 URL 過期時間（例如 30 天）
		  await env.URL_STORE.put(shortCode, longUrl, { expirationTtl: 2592000 });
		  
		  return new Response(
			JSON.stringify({
			  shortUrl: `${domain}/${shortCode}`,
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
  
		// 短網址重定向處理
		if (request.method === 'GET' && url.pathname.length > 1 && url.pathname !== '/api') {
		  const shortCode = url.pathname.slice(1);
		  const originalUrl = await env.URL_STORE.get(shortCode);
  
		  if (originalUrl) {
			return Response.redirect(originalUrl, 302);
		  }
  
		  // 找不到對應的短網址時返回自訂錯誤頁面
		  return new Response(
			'找不到對應的網址',
			{ 
			  status: 404,
			  headers: {
				'Content-Type': 'text/plain;charset=UTF-8',
				...corsHeaders
			  }
			}
		  );
		}
  
		return fetch(request);
  
	  } catch (err) {
		return new Response(
		  JSON.stringify({ error: '系統錯誤，請稍後再試' }), 
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