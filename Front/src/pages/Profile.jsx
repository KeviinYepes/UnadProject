import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import AuthService from "../services/AuthService";
import UserService from "../services/UserService";

const getPhotoKey = (userId) => `profilePhoto:${userId || "current"}`;

const buildDefaultPhoto = (firstName, lastName) => {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || "Usuario UNAD";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&size=256`;
};

const toProfileForm = (user, photo) => ({
  firstName: user?.firstName || "",
  lastName: user?.lastName || "",
  email: user?.email || "",
  documentType: user?.documentType || "",
  documentNumber: user?.documentNumber || "",
  roleName: user?.role?.roleName || "USER",
  photo: photo || buildDefaultPhoto(user?.firstName, user?.lastName),
});

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const currentUser = AuthService.getCurrentUser();
  const photoKey = useMemo(() => getPhotoKey(currentUser?.userId), [currentUser?.userId]);
  const [savedProfile, setSavedProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const user = await UserService.getMe();
        const savedPhoto = localStorage.getItem(photoKey);
        const profile = toProfileForm(user, savedPhoto);
        setSavedProfile(profile);
        setForm(profile);
      } catch (requestError) {
        console.error("Error cargando perfil:", requestError);
        setError(
          requestError.response?.data?.error ||
            requestError.response?.data?.message ||
            "No se pudo cargar la informacion del perfil."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [photoKey]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form) return;

    try {
      setSaving(true);
      setError("");
      const updated = await UserService.updateMe(form);
      localStorage.setItem(photoKey, form.photo);
      window.dispatchEvent(new CustomEvent("profile-photo-changed"));

      const profile = toProfileForm(updated, form.photo);
      setSavedProfile(profile);
      setForm(profile);
      showToast("Perfil actualizado correctamente.");
    } catch (requestError) {
      console.error("Error guardando perfil:", requestError);
      const message =
        requestError.response?.data?.error ||
        requestError.response?.data?.message ||
        "No se pudo guardar el perfil.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!savedProfile) return;
    setForm(savedProfile);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Selecciona una imagen valida.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((current) => ({
      ...current,
      photo: buildDefaultPhoto(current?.firstName, current?.lastName),
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(photoKey);
    AuthService.logout();
    window.dispatchEvent(new CustomEvent("profile-photo-changed"));
    navigate("/login", { replace: true });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(currentUser?.role === "ADMIN" ? "/admin/dashboard" : "/main", { replace: true });
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedProfile);

  return (
    <div className="flex h-screen w-full font-display bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 p-8 dark:border-slate-800">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-primary transition hover:underline"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Volver
                  </button>
                  <h1 className="text-3xl font-black">Editar Perfil</h1>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Administra tu informacion visible en la organizacion.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Cerrar sesion
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                Cargando perfil...
              </div>
            ) : !form ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : (
              <>
                {error && (
                  <div className="mx-8 mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20">
                    {error}
                  </div>
                )}

                <div className="flex flex-col items-center gap-8 p-8 md:flex-row">
                  <div className="relative">
                    <div
                      className="size-32 rounded-full bg-cover bg-center shadow-lg ring-4 ring-slate-50 dark:ring-slate-800"
                      style={{ backgroundImage: `url(${form.photo})` }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white shadow-md transition hover:scale-105"
                      aria-label="Cambiar foto de perfil"
                    >
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>

                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold">Foto de Perfil</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      La imagen se guarda localmente en este navegador.
                    </p>

                    <div className="mt-4 flex justify-center gap-3 md:justify-start">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 rounded-lg bg-primary px-4 font-bold text-white transition hover:bg-primary/90"
                      >
                        Cambiar Foto
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="h-10 rounded-lg border border-slate-200 px-4 font-bold transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 px-8 pb-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input
                      label="Nombre"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      disabled={saving}
                    />
                    <Input
                      label="Apellido"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      disabled={saving}
                    />

                    <ReadOnlyInput label="Correo Electronico" value={form.email} />
                    <ReadOnlyInput label="Rol" value={form.roleName} />

                    <Input
                      label="Tipo de Documento"
                      name="documentType"
                      value={form.documentType}
                      onChange={handleChange}
                      disabled={saving}
                    />
                    <Input
                      label="Numero de Documento"
                      name="documentNumber"
                      value={form.documentNumber}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex justify-end gap-4 border-t border-slate-100 pt-6 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving || !isDirty}
                      className="h-11 rounded-lg px-6 font-bold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={saving || !isDirty}
                      className="flex h-11 items-center gap-2 rounded-lg bg-primary px-8 font-bold text-white shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-bold">{label}</label>
    <input {...props} className="input" required />
  </div>
);

const ReadOnlyInput = ({ label, value }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-bold">{label}</label>
    <div className="relative">
      <input value={value} disabled className="input cursor-not-allowed bg-slate-100 pr-10 dark:bg-slate-800" />
      <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400">lock</span>
    </div>
  </div>
);

export default Profile;
