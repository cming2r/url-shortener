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
  
		// 只處理 POST 和短網址請求
		if (url.pathname === '/') {
		  // 讓根路徑請求通過
		  return fetch(request);
		}
  
		// API 端點處理
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
  
		  const shortCode = Math.random().toString(36).substring(2, 8);
		  await env.URL_STORE.put(shortCode, longUrl);
		  
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
		if (request.method === 'GET' && url.pathname.length > 1) {
		  const shortCode = url.pathname.slice(1);
		  const originalUrl = await env.URL_STORE.get(shortCode);
  
		  if (originalUrl) {
			return Response.redirect(originalUrl, 302);
		  }
		}
  
		// 其他請求通過
		return fetch(request);
  
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