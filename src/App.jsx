import { RouterProvider } from 'react-router-dom';
import axios from 'axios';
import router from './router';

// 请求拦截器：自动带 Token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// 响应拦截器：Token 过期才跳转，登录页不跳转
axios.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    const isPublicPage = ['/login', '/forgot-password'].includes(currentPath);
    
    // 只在"真的没登录或Token过期"且"不在登录页"时才跳转
    if ((status === 401 || status === 403) && !isPublicPage) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;