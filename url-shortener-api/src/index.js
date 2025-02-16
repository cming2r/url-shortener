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
		// 使用固定的域名，而不是request的origin
		const domain = 'https://vvrl.cc';
		
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
		
		if (request.method === 'GET' && request.url.includes('/')) {
		  const urlParts = request.url.split('/');
		  const shortCode = urlParts[urlParts.length - 1];
		  
		  if (shortCode) {
			const originalUrl = await env.URL_STORE.get(shortCode);
			
			if (!originalUrl) {
			  return new Response('Short URL not found', { 
				status: 404,
				headers: corsHeaders 
			  });
			}
			
			return Response.redirect(originalUrl, 302);
		  }
		}
		
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