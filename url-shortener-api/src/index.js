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
  
		  // 生成短網址
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
  
		// 如果不是短網址請求，直接返回 404，讓請求繼續到 Pages
		return new Response(null, { 
		  status: 404,
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