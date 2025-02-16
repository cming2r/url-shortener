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
		
		// GET 請求處理
		if (request.method === 'GET') {
		  // 如果是根路徑，重定向到前端頁面
		  if (url.pathname === '/') {
			return Response.redirect('https://url-shortener-279.pages.dev', 302);
		  }
		  
		  // 如果有短碼，嘗試重定向到原始 URL
		  if (url.pathname.length > 1) {
			const shortCode = url.pathname.slice(1);
			const originalUrl = await env.URL_STORE.get(shortCode);
			
			if (!originalUrl) {
			  return Response.redirect('https://url-shortener-279.pages.dev', 302);
			}
			
			return Response.redirect(originalUrl, 302);
		  }
		}
		
		// 處理其他情況
		return Response.redirect('https://url-shortener-279.pages.dev', 302);
		
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