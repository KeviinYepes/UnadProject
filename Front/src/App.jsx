import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Main from './pages/Main';
import Forum from './pages/Forum';
import VideoView from './pages/VideoView';
import Profile from './pages/Profile';
import Users from './pages/Users';
import AdminDashboard from './pages/AdminDashboard';
import VideosLibrary from './pages/VideosLibrary';
import Roles from './pages/Roles';
import Categories from './pages/Categories';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/main" element={<ProtectedRoute><Main /></ProtectedRoute>} />
        <Route path="/foro" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
        <Route path="/video" element={<ProtectedRoute><VideoView /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Rutas administrativas protegidas */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/historico" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><Users /></ProtectedRoute>} />
        <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['ADMIN']}><Roles /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['ADMIN']}><Categories /></ProtectedRoute>} />
        <Route path="/admin/biblioteca" element={<ProtectedRoute><VideosLibrary /></ProtectedRoute>} />
        <Route path="/admin/videos" element={<Navigate to="/admin/biblioteca" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
