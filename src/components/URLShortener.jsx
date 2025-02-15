import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";

const URLShortener = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 更嚴格的 URL 驗證函數
  const isValidUrl = (url) => {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShortUrl('');
    setIsLoading(true);
    
    // 更嚴格的輸入驗證
    if (!originalUrl) {
      setError('請輸入網址');
      setIsLoading(false);
      return;
    }

    if (!isValidUrl(originalUrl)) {
      setError('請輸入有效的 HTTP 或 HTTPS 網址');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://vvrl.cc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: originalUrl })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '伺服器錯誤');
      }

      setShortUrl(data.shortUrl);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : '無法連接到服務器，請稍後再試';
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      alert('已複製到剪貼簿！');
    } catch {
      alert('複製失敗，請手動複製');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-center">網址縮短服務</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="url"
                placeholder="請輸入要縮短的網址 (須包含 http:// 或 https://)"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value.trim())}
                className="w-full"
                disabled={isLoading}
                required
                pattern="https?://.*"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? '處理中...' : '縮短網址'}
            </Button>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {shortUrl && (
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <p className="text-sm font-medium text-green-800">縮短後的網址：</p>
                <div className="flex items-center gap-2">
                  <a 
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {shortUrl}
                  </a>
                  <Button 
                    type="button"
                    onClick={handleCopy}
                    className="ml-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    複製
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default URLShortener;