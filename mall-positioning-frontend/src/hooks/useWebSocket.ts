import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketOptions {
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(url: string, options: WebSocketOptions) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const connect = useCallback(() => {
    if (wsRef.current || retryCount.current >= maxRetries) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCount.current = 0;
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        options.onMessage(data);
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    ws.onerror = (error) => {
      options.onError?.(error);
      ws.close();
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;

      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        setTimeout(connect, 3000 * retryCount.current);
      }
    };

    return () => {
      ws.close();
    };
  }, [url, options]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, reconnect: connect };
}
