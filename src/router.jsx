import Sales from './pages/Sales';
import { createBrowserRouter } from 'react-router-dom';
import BasicLayout from './layouts/BasicLayout';
import Dashboard from './pages/Dashboard';
import UserList from './pages/UserList';
import Login from './pages/Login';
import ProductList from './pages/ProductList';
import ForgotPassword from './pages/ForgotPassword';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  {
    path: '/',
    element: <BasicLayout />,
    children: [
      { path: '', element: <Dashboard /> },
      { path: 'users', element: <UserList /> },
      { path: 'sales', element: <Sales /> },
      { path: 'products', element: <ProductList /> },
      
    ],
  },
]);

export default router;