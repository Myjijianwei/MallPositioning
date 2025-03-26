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

  const resetHeartbeat = useCallback(() => {
    clearTimeout(heartbeatTimer.current);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      heartbeatTimer.current = setTimeout(() => {
        if (isMounted.current && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, options.heartbeatInterval || 20000);
    }
  }, [options.heartbeatInterval]);

  const connect = useCallback(() => {
    if (!isMounted.current || !url) return;

    // 清除现有状态
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      try {
        wsRef.current.close();
      } catch (e) {
        console.warn('关闭WebSocket时出错:', e);
      }
      wsRef.current = null;
    }
    clearTimeout(reconnectTimer.current);
    clearTimeout(heartbeatTimer.current);

    // 创建新连接
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
      try {
        const data = JSON.parse(event.data);
        // 重置心跳计时器
        resetHeartbeat();

        // 忽略心跳消息
        if (data.type !== 'heartbeat') {
          options.onMessage(data);
        }
      } catch (error) {
        console.error('消息解析失败:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket错误:', {
        type: error.type,
        url: ws.url,
        readyState: ws.readyState,
        error: error
      });
      options.onError?.(error);
    };

    ws.onclose = (event) => {
      if (!isMounted.current) return;

      setStatus('disconnected');
      console.log(`WebSocket连接断开，代码: ${event.code}, 原因: ${event.reason}`);

      // 不自动重连的情况
      if ([1000, 1001].includes(event.code)) {
        console.log('正常关闭，不重连');
        clearTimeout(reconnectTimer.current);
        clearTimeout(heartbeatTimer.current);
        wsRef.current = null;
        return;
      }

      // 指数退避重连 (最多30秒间隔)
      const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(reconnectAttempts.current, 5)));
      reconnectAttempts.current += 1;

      options.onReconnect?.(reconnectAttempts.current);

      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) {
          console.log(`尝试重新连接(第${reconnectAttempts.current}次)...`);
          connect();
        }
      }, delay);
    };
  }, [url, options, resetHeartbeat]);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      if (wsRef.current) {
        wsRef.current.close(1000, '组件卸载');
        wsRef.current = null;
      }
      clearTimeout(reconnectTimer.current);
      clearTimeout(heartbeatTimer.current);
    };
  }, [connect]);

  return {
    status,
    reconnect: connect,
    getWebSocket: () => wsRef.current
  };
}
