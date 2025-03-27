import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketOptions {
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
  heartbeatInterval?: number;
}

export function useStableWebSocket(url: string | null, options: WebSocketOptions) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout>();
  const heartbeatTimer = useRef<NodeJS.Timeout>();
  const isMounted = useRef(true);
  const [isManualClose, setIsManualClose] = useState(false);

  // 稳定的options引用
  const stableOptions = useRef(options);
  useEffect(() => {
    stableOptions.current = options;
  }, [options]);

  const resetHeartbeat = useCallback(() => {
    clearTimeout(heartbeatTimer.current);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      heartbeatTimer.current = setTimeout(() => {
        if (isMounted.current && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send('heartbeat'); // 发送纯文本心跳
        }
      }, stableOptions.current.heartbeatInterval || 20000);
    }
  }, []);

  const close = useCallback((code = 1000, reason?: string) => {
    setIsManualClose(true);
    if (wsRef.current) {
      try {
        wsRef.current.close(code, reason);
      } catch (e) {
        console.warn('关闭连接时出错:', e);
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (!isMounted.current || !url) return;
    setIsManualClose(false);

    // 清理旧连接
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      try {
        wsRef.current.close();
      } catch (e) {
        console.warn('关闭旧连接时出错:', e);
      }
      wsRef.current = null;
    }

    clearTimeout(reconnectTimer.current);
    clearTimeout(heartbeatTimer.current);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted.current) return;
        setStatus('connected');
        reconnectAttempts.current = 0;
        resetHeartbeat();
        console.log('WebSocket连接成功');
      };

      ws.onmessage = (event) => {
        // 处理纯文本心跳
        if (event.data === 'heartbeat') {
          resetHeartbeat();
          return;
        }

        try {
          const data = JSON.parse(event.data);
          resetHeartbeat();
          if (data.type !== 'heartbeat') {
            stableOptions.current.onMessage(data);
          }
        } catch (error) {
          console.error('消息解析失败:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        stableOptions.current.onError?.(error);
      };

      ws.onclose = (event) => {
        if (!isMounted.current) return;

        if (isManualClose) {
          console.log('手动关闭连接');
          setStatus('disconnected');
          return;
        }

        console.log(`连接断开，代码: ${event.code}`);
        setStatus('disconnected');

        // 智能重连策略
        const baseDelay = Math.min(30000, 1000 * Math.pow(2, Math.min(reconnectAttempts.current, 5)));
        const delay = baseDelay + Math.random() * 2000;
        reconnectAttempts.current += 1;

        stableOptions.current.onReconnect?.(reconnectAttempts.current);

        reconnectTimer.current = setTimeout(() => {
          if (isMounted.current) {
            console.log(`第${reconnectAttempts.current}次重连...`);
            connect();
          }
        }, delay);
      };

    } catch (e) {
      console.error('创建WebSocket失败:', e);
      setStatus('disconnected');
    }
  }, [url, resetHeartbeat, isManualClose]);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      close(1000, '组件卸载');
      clearTimeout(reconnectTimer.current);
      clearTimeout(heartbeatTimer.current);
    };
  }, [connect, close]);

  return {
    status,
    reconnect: connect,
    close,
    getWebSocket: () => wsRef.current
  };
}
