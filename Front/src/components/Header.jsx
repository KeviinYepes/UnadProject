import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import ForumService from '../services/ForumService';

const getProfilePhotoUrl = () => {
  const currentUser = AuthService.getCurrentUser();
  const storedPhoto = localStorage.getItem(`profilePhoto:${currentUser?.userId || "current"}`);

  return (
    storedPhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.email || "Usuario")}&background=2563eb&color=fff&size=256`
  );
};

export default function Header() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationItems, setNotificationItems] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(getProfilePhotoUrl);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser?.userId) {
        setNotificationCount(0);
        setNotificationItems([]);
        return;
      }

      const summary = await ForumService.getNotifications(currentUser.userId);
      setNotificationCount(Number(summary?.total) || 0);
      setNotificationItems(Array.isArray(summary?.items) ? summary.items : []);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      setNotificationCount(0);
      setNotificationItems([]);
    }
  };

  const loadProfilePhoto = () => {
    setProfilePhoto(getProfilePhotoUrl());
  };

  useEffect(() => {
    window.addEventListener('profile-photo-changed', loadProfilePhoto);
    return () => window.removeEventListener('profile-photo-changed', loadProfilePhoto);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadNotifications, 0);
    window.addEventListener('forum-notifications-changed', loadNotifications);
    window.addEventListener('focus', loadNotifications);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener('forum-notifications-changed', loadNotifications);
      window.removeEventListener('focus', loadNotifications);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((current) => !current);
  };

  const openNotificationMenu = async () => {
    setIsNotificationMenuOpen(true);
    await loadNotifications();

    const currentUser = AuthService.getCurrentUser();
    if (!currentUser?.userId) return;

    try {
      await ForumService.markNotificationsSeen(currentUser.userId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marcando notificaciones como vistas:', error);
    }
  };

  const toggleNotificationMenu = () => {
    if (isNotificationMenuOpen) {
      setIsNotificationMenuOpen(false);
      return;
    }

    openNotificationMenu();
  };

  const goToProfile = () => {
    setIsProfileMenuOpen(false);
    navigate('/profile');
  };

  const goToNotification = (notification) => {
    const content = notification.content || {};
    setIsNotificationMenuOpen(false);

    navigate('/video', {
      state: {
        id: content.id,
        title: content.title,
        category: content.category?.categoryName || 'Sin categoria',
        description: content.description,
        url: content.urlVideo,
        createdBy: content.createdBy,
      },
    });
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between whitespace-nowrap border-b border-border-light bg-card-light px-8 dark:border-border-dark dark:bg-card-dark">
      <div />
      <div className="flex items-center gap-4">
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={toggleNotificationMenu}
            className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-background-light text-text-light-secondary transition-colors hover:bg-primary/10 hover:text-primary dark:bg-background-dark dark:text-dark-secondary dark:hover:bg-primary/20 dark:hover:text-primary"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black leading-none text-white ring-2 ring-card-light dark:ring-card-dark">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {isNotificationMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-gray-900">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Notificaciones</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {notificationCount > 0 ? `${notificationCount} conversaciones pendientes` : 'No tienes pendientes'}
                </p>
              </div>

              {notificationItems.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No hay conversaciones nuevas por revisar.
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto py-1">
                  {notificationItems.map((notification) => (
                    <button
                      key={`${notification.type}-${notification.conversationId}`}
                      type="button"
                      onClick={() => goToNotification(notification)}
                      className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
                        <span className="material-symbols-outlined text-lg">
                          {notification.type === 'ANSWER' ? 'reply' : 'forum'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {notification.conversationTitle || 'Conversacion sin titulo'}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {notification.content?.title || 'Contenido no disponible'}
                        </p>
                        <p className="mt-1 text-[11px] font-bold uppercase text-primary">
                          {notification.type === 'ANSWER' ? 'Te respondieron' : 'Nueva duda'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <div
            className="h-10 w-10 cursor-pointer rounded-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${profilePhoto})`,
            }}
            onClick={toggleProfileMenu}
          />

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
              <button
                type="button"
                onClick={goToProfile}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Ver perfil
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
