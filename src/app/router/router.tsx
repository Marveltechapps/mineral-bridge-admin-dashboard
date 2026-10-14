import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../../layouts/AdminLayout/AdminLayout';
import { SamplePage } from '../../modules/sample/pages/SamplePage';

export const router = createBrowserRouter([{
  path: '/', element: <AdminLayout />, children: [
    { index: true, element: <Navigate to="/samples" replace /> },
    { path: 'samples', element: <SamplePage /> },
  ],
}]);
