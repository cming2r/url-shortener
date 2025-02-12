import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";

const URLShortener = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShortUrl('');
    
    if (!originalUrl) {
      setError('請輸入網址');
      return;
    }

    try {
      // 這裡稍後會加入與後端的連接
      setShortUrl('https://short.url/abc123');
    } catch (err) {
      setError('發生錯誤，請稍後再試');
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
                placeholder="請輸入要縮短的網址"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              縮短網址
            </Button>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {shortUrl && (
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <p className="text-sm font-medium text-green-800">縮短後的網址：</p>
                <a 
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {shortUrl}
                </a>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default URLShortener;