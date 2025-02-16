import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import Toast from "../components/ui/toast";

const URLShortener = () => {
  const [state, setState] = useState({
    originalUrl: '',
    shortUrl: '',
    error: '',
    isLoading: false,
    toast: null
  });

  const showToast = (message) => {
    setState(prev => ({ ...prev, toast: message }));
  };

  const hideToast = () => {
    setState(prev => ({ ...prev, toast: null }));
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setState(prev => ({ ...prev, error: '', shortUrl: '', isLoading: true }));
    
    if (!state.originalUrl) {
      setState(prev => ({ ...prev, error: '請輸入網址', isLoading: false }));
      return;
    }

    if (!validateUrl(state.originalUrl)) {
      setState(prev => ({ ...prev, error: '請輸入有效的網址', isLoading: false }));
      return;
    }

    try {
      const response = await fetch('https://vvrl.cc/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: state.originalUrl })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '發生錯誤，請稍後再試');
      }

      setState(prev => ({ ...prev, shortUrl: data.shortUrl, isLoading: false }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  }, [state.originalUrl]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.shortUrl);
      showToast('已複製到剪貼簿！');
    } catch (err) {
      setState(prev => ({ ...prev, error: '複製失敗，請手動複製' }));
    }
  }, [state.shortUrl]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
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
                value={state.originalUrl}
                onChange={(e) => setState(prev => ({ 
                  ...prev, 
                  originalUrl: e.target.value,
                  error: '' // 清除錯誤訊息
                }))}
                className="w-full"
                disabled={state.isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <div className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⟳</span>
                  處理中...
                </div>
              ) : '縮短網址'}
            </Button>
            
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            
            {state.shortUrl && (
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <p className="text-sm font-medium text-green-800">縮短後的網址：</p>
                <div className="flex items-center gap-2">
                  <a 
                    href={state.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {state.shortUrl}
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
      
      {state.toast && (
        <Toast 
          message={state.toast}
          onClose={hideToast}
          position="bottom-center"
        />
      )}
    </div>
  );
};

export default URLShortener;