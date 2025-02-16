export default {
	async fetch(request, env) {
	  const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	  };
  
	  if (request.method === 'OPTIONS') {
		return new Response(null, {
		  headers: corsHeaders
		});
	  }
  
	  try {
		const url = new URL(request.url);
		const domain = 'https://vvrl.cc';
		
		// GET 請求處理 - 放在最前面優先處理短網址重定向
		if (request.method === 'GET' && url.pathname.length > 1) {
		  const shortCode = url.pathname.slice(1);
		  const originalUrl = await env.URL_STORE.get(shortCode);
		  
		  if (originalUrl) {
			// 如果找到對應的原始網址，立即重定向
			return Response.redirect(originalUrl, 302);
		  }
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
		
		// 對於任何其他請求，包括根路徑，不做任何處理
		// 這樣 Pages 可以正常處理前端頁面
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