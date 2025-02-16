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
		console.log('Requested URL:', url.pathname); // 添加日誌
  
		// 如果是根路徑，不做任何處理，讓 Pages 處理
		if (url.pathname === '/') {
		  return new Response(null, { 
			status: 404,
			headers: corsHeaders 
		  });
		}
  
		// 處理 API 請求
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
			  shortUrl: `https://vvrl.cc/${shortCode}`,
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
  
		// 處理短網址重定向
		if (url.pathname.length > 1) {
		  const shortCode = url.pathname.slice(1);
		  console.log('Short code:', shortCode); // 添加日誌
		  
		  const originalUrl = await env.URL_STORE.get(shortCode);
		  console.log('Original URL:', originalUrl); // 添加日誌
		  
		  if (originalUrl) {
			return Response.redirect(originalUrl, 302);
		  }
		}
  
		// 如果沒有匹配的短碼，讓 Pages 處理
		return new Response(null, { 
		  status: 404,
		  headers: corsHeaders 
		});
	  } catch (err) {
		console.error('Error:', err); // 添加錯誤日誌
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