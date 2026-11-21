import { NavLink, Outlet } from 'react-router-dom';
import { navigation } from '../../constants/nav';

export function AdminLayout() {
  return <main><header><h1>Mineral Bridge Admin</h1><nav aria-label="Main">
    {navigation.map(item => <NavLink key={item.path} to={item.path}>{item.label}</NavLink>)}
  </nav></header><Outlet /></main>;
}
