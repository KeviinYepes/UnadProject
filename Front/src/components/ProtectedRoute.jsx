import { Navigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

/**
 * Componente para proteger rutas que requieren autenticación
 * Redirige a /login si el usuario no está autenticado
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = AuthService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length) {
    const currentUser = AuthService.getCurrentUser();
    const currentRole = normalizeRole(currentUser?.role);
    const hasAccess = allowedRoles.map(normalizeRole).includes(currentRole);

    if (!hasAccess) {
      return <Navigate to="/admin/biblioteca" replace />;
    }
  }

  return children;
};

const normalizeRole = (role) =>
  String(role || "USER")
    .replace(/^ROLE_/i, "")
    .toUpperCase();

export default ProtectedRoute;
