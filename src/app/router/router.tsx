import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../../layouts/AdminLayout/AdminLayout';
import { ConsoleRoot } from '../../layouts/ConsoleLayout/ConsoleRoot';
import { ConsoleLayout } from '../../layouts/ConsoleLayout/ConsoleLayout';
import { SamplePage } from '../../modules/sample/pages/SamplePage';
import { SignInPage } from '../../modules/console/pages/SignInPage';
import { ConsoleScreen } from '../../modules/console/pages/ConsoleScreen';
import { CONSOLE_HOME } from '../../constants/nav';

export const router = createBrowserRouter([{
  path: '/', children: [
    { index: true, element: <Navigate to={CONSOLE_HOME} replace /> },
    { element: <AdminLayout />, children: [
      { path: 'samples', element: <SamplePage /> },
    ] },
    // Admin console: /signin, then /<screen> (e.g. /buy) and /<screen>/<order id>.
    { element: <ConsoleRoot />, children: [
      { path: 'signin', element: <SignInPage /> },
      { element: <ConsoleLayout />, children: [
        { path: ':nav', element: <ConsoleScreen /> },
        { path: ':nav/:orderId', element: <ConsoleScreen /> },
      ] },
    ] },
  ],
}]);
