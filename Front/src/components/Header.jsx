import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

export default function Header() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const currentUser = AuthService.getCurrentUser();
  const initial = (currentUser?.email?.[0] || '?').toUpperCase();

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const goToProfile = () => {
    setIsProfileMenuOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsProfileMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between whitespace-nowrap border-b border-border-light bg-card-light px-8 dark:border-border-dark dark:bg-card-dark">
      <div />
      <div className="flex items-center gap-4">
        <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-background-light text-text-light-secondary transition-colors hover:bg-primary/10 hover:text-primary dark:bg-background-dark dark:text-dark-secondary dark:hover:bg-primary/20 dark:hover:text-primary">
          <span className="material-symbols-outlined text-2xl">notifications</span>
        </button>
        <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-background-light text-text-light-secondary transition-colors hover:bg-primary/10 hover:text-primary dark:bg-background-dark dark:text-dark-secondary dark:hover:bg-primary/20 dark:hover:text-primary">
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
        </button>

        {/* Contenedor del avatar con menú */}
        <div className="relative" ref={menuRef}>
          <div
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary font-bold text-white"
            onClick={toggleProfileMenu}
            title={currentUser?.email || 'Cuenta'}
          >
            {initial}
          </div>

          {/* Menú desplegable */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
              <button
                onClick={goToProfile}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Ver perfil
              </button>
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
