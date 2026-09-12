import { NavLink } from 'react-router-dom';
import AuthService from '../services/AuthService';

export default function Sidebar() {
  const currentUser = AuthService.getCurrentUser();
  const currentRole = normalizeRole(currentUser?.role);
  
  const navItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Panel Admin', roles: ['ADMIN'] },
    { path: '/admin/users', icon: 'group', label: 'Usuarios', roles: ['ADMIN'] },
    { path: '/admin/roles', icon: 'admin_panel_settings', label: 'Roles', roles: ['ADMIN'] },
    { path: '/admin/categories', icon: 'category', label: 'Categorias', roles: ['ADMIN'] },
    { path: '/admin/biblioteca', icon: 'library_books', label: 'Biblioteca', roles: ['ADMIN', 'USER', 'MODERATOR'] },
    { path: '/foro', icon: 'forum', label: 'Foro', roles: ['ADMIN', 'USER', 'MODERATOR'] },
  ].filter((item) => item.roles.includes(currentRole));

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark">
      <div className="flex flex-col gap-4">
        {/* Logo y nombre */}
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined text-2xl">all_inclusive</span>
          </div>
          <h1 className="text-base font-bold leading-normal text-text-light-primary dark:text-text-dark-primary">
            Guia Corp Forms
          </h1>
        </div>

        {/* Navegación principal */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300'
                    : 'text-text-light-secondary hover:bg-primary/10 hover:text-primary dark:text-dark-secondary dark:hover:bg-primary/20 dark:hover:text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <p className="text-sm font-medium leading-normal">{item.label}</p>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

const normalizeRole = (role) =>
  String(role || "USER")
    .replace(/^ROLE_/i, "")
    .toUpperCase();
