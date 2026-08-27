import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import UserService from '../services/UserService';
import { API_BASE_URL } from '../config/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', cargo: '', phone: '', bio: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await UserService.getMe();
      setUser(data);
      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        cargo: data.cargo || '',
        phone: data.phone || '',
        bio: data.bio || '',
      });
    } catch (e) {
      setError('No se pudo cargar tu perfil. Asegúrate de haber iniciado sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await UserService.updateMe(form);
      setUser(updated);
      setMessage('Perfil actualizado correctamente.');
    } catch (e2) {
      setError(e2.response?.data?.error || e2.response?.data?.message || 'Error al guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await UserService.uploadPhoto(file);
      setUser(updated);
      setMessage('Foto de perfil actualizada correctamente.');
    } catch (e2) {
      setError(e2.response?.data?.error || e2.response?.data?.message || 'Error al subir la foto.');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await UserService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMessage('Contraseña actualizada correctamente.');
    } catch (e2) {
      setError(e2.response?.data?.error || e2.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  const photoUrl = user?.photoUrl ? `${API_BASE_URL}${user.photoUrl}` : null;
  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || '?';

  if (loading) {
    return (
      <div className="flex h-screen w-full font-display bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <Header />
          <main className="flex flex-1 items-center justify-center">
            <p className="text-text-secondary-light dark:text-text-secondary-dark">Cargando perfil...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full font-display bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold">Mi Perfil</h1>
              <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">
                Administra tu información personal y tu foto de perfil.
              </p>
            </div>

            {message && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Foto de perfil */}
            <section className="card p-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Foto de perfil"
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/20"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                    {initials}
                  </div>
                )}
                <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                  <p className="text-lg font-bold">
                    {form.firstName} {form.lastName}
                  </p>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {user?.email}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={saving}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? 'Subiendo...' : 'Cambiar foto'}
                  </button>
                </div>
              </div>
            </section>

            {/* Datos personales */}
            <form onSubmit={handleSave} className="card space-y-6 p-6">
              <h2 className="text-lg font-bold">Información personal</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Nombre" name="firstName" value={form.firstName} onChange={handleChange} />
                <Field label="Apellido" name="lastName" value={form.lastName} onChange={handleChange} />
                <Field label="Cargo" name="cargo" value={form.cargo} onChange={handleChange} />
                <Field label="Teléfono" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Biografía</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows="4" className="input resize-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Correo Electrónico</label>
                <input type="email" value={user?.email || ''} disabled className="input cursor-not-allowed opacity-60" />
                <span className="text-xs italic text-text-secondary-light dark:text-text-secondary-dark">
                  El correo es tu identificador de acceso y no se puede modificar.
                </span>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-lg bg-primary px-8 font-bold text-white shadow-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>

            {/* Cambiar contraseña */}
            <form onSubmit={handlePasswordSubmit} className="card space-y-6 p-6">
              <h2 className="text-lg font-bold">Cambiar contraseña</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Contraseña actual"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
                <Field
                  label="Nueva contraseña"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-lg bg-primary px-8 font-bold text-white shadow-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Actualizar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold">{label}</label>
      <input {...props} className="input" />
    </div>
  );
}
