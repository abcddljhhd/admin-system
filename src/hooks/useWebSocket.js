import { useEffect, useRef } from 'react';

export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const connectedRef = useRef(false);   // ← 新增：标记连接状态

  useEffect(() => {
    // 如果已经连接，不再创建新连接
    if (connectedRef.current) return;
    
    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;
    connectedRef.current = true;        // ← 标记已连接

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
      connectedRef.current = false;     // ← 重置连接状态
      // 不重连，让 useEffect 下次执行时重新连接
    };

    return () => {
      ws.close();
      connectedRef.current = false;     // ← 清理时重置
    };
  }, []);  // ← 空依赖，只执行一次

  return wsRef;
}