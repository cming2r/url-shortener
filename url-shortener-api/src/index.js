export default {
	async fetch(request, env) {
	  // 設置 CORS 標頭，允許前端網站訪問
	  const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	  };
  
	  // 處理預檢請求
	  if (request.method === 'OPTIONS') {
		return new Response(null, {
		  headers: corsHeaders
		});
	  }
  
	  try {
		const url = new URL(request.url);
		
		// POST 請求 - 建立短網址
		if (request.method === 'POST') {
		  // 解析請求內容
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
  
		  // 生成 6 位數的短代碼
		  const shortCode = Math.random().toString(36).substring(2, 8);
		  
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
		
		// GET 請求 - 重定向到原始網址（目前返回模擬資料）
		if (request.method === 'GET' && url.pathname.length > 1) {
		  const shortCode = url.pathname.slice(1);
		  
		  // 模擬找到原始網址（之後會改用 KV 儲存）
		  const mockOriginalUrl = 'https://example.com';
		  
		  return Response.redirect(mockOriginalUrl, 302);
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