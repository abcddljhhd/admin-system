import { useEffect, useRef } from 'react';

export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    
    // 如果没有配置 WebSocket 地址，直接跳过
    if (!wsUrl) {
      console.warn('VITE_WS_URL 未配置，跳过 WebSocket 连接');
      return;
    }
    
    // 如果已经连接，不再创建新连接
    if (connectedRef.current) return;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    connectedRef.current = true;

    ws.onopen = () => {
      console.log('WebSocket 连接成功');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('WebSocket 消息解析失败:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket 断开');
      connectedRef.current = false;
    };

    return () => {
      ws.close();
      connectedRef.current = false;
    };
  }, []);  // 空依赖，只执行一次

  return wsRef;
}