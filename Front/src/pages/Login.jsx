import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    documentNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoverOpen, setIsRecoverOpen] = useState(false);
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverError, setRecoverError] = useState('');
  const [recoverForm, setRecoverForm] = useState({
    email: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleRecoverChange = (e) => {
    setRecoverForm({
      ...recoverForm,
      [e.target.name]: e.target.value
    });
    setRecoverError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await AuthService.login(formData);
      navigate('/main');
    } catch (err) {
      console.error('Error de login:', err);
      setError(err.message || 'Credenciales invalidas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const openRecoverModal = () => {
    setRecoverForm({
      email: formData.email
    });
    setRecoverError('');
    setIsRecoverOpen(true);
  };

  const handleRecoverSubmit = async (e) => {
    e.preventDefault();
    setRecoverLoading(true);
    setRecoverError('');

    try {
      await AuthService.recoverPassword(recoverForm);
      setFormData((current) => ({
        ...current,
        email: recoverForm.email
      }));
      setSuccess('Te enviamos las instrucciones al correo registrado.');
      setIsRecoverOpen(false);
    } catch (err) {
      setRecoverError(err.message || 'No se pudo enviar el correo de recuperacion.');
    } finally {
      setRecoverLoading(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark">
      <div className="relative flex min-h-screen w-full flex-col">
        <div className="flex h-full min-h-screen grow flex-col">
          <div className="flex flex-1">
            <div className="relative hidden h-full w-full flex-col justify-end bg-blue-900 p-8 lg:flex">
              <div
                className="absolute inset-0 z-0 h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop')",
                }}
              />
              <div className="absolute inset-0 z-10 h-full w-full bg-primary/60 dark:bg-primary/75" />
              <div className="relative z-20 flex flex-col gap-4 text-white">
                <h1 className="text-4xl font-bold leading-tight">
                  Domina tus dudas en minutos
                </h1>
                <p className="text-lg font-normal text-white/90">
                  Guias paso a paso en video para que nunca vuelvas a cometer un error en un formulario.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col items-center justify-center bg-background-light px-4 py-12 dark:bg-background-dark sm:px-6 lg:px-8">
              <div className="flex w-full max-w-md flex-col items-center gap-10">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg
                      fill="none"
                      height="40"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="40"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2c.46-1.7.46-5.33.46-5.33s0-3.65-.46-5.33Z" />
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-[#101922] dark:text-white">
                      Hola de nuevo
                    </h1>
                    <p className="text-base font-normal text-slate-600 dark:text-slate-400">
                      Ingresa para continuar aprendiendo y completar tus formularios con exito.
                    </p>
                  </div>
                </div>

                <form className="flex w-full flex-col gap-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                      <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                    </div>
                  )}

                  <label className="flex w-full flex-col">
                    <p className="pb-2 text-sm font-medium leading-normal text-[#101922] dark:text-slate-300">
                      Correo Electronico
                    </p>
                    <div className="flex w-full flex-1 items-stretch rounded-lg">
                      <div className="flex items-center justify-center rounded-l-lg border border-r-0 border-slate-300 bg-background-light pl-4 text-slate-500 dark:border-slate-700 dark:bg-background-dark">
                        <span className="material-symbols-outlined text-base">mail</span>
                      </div>
                      <input
                        type="email"
                        className="form-input h-12 w-full min-w-0 flex-1 rounded-lg rounded-l-none border border-l-0 border-slate-300 bg-background-light p-3 text-base font-normal text-[#101922] focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-background-dark dark:text-white"
                        placeholder="tu@correo.com"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </label>

                  <label className="flex w-full flex-col">
                    <p className="pb-2 text-sm font-medium leading-normal text-[#101922] dark:text-slate-300">
                      Numero de Documento
                    </p>
                    <div className="flex w-full flex-1 items-stretch rounded-lg">
                      <div className="flex items-center justify-center rounded-l-lg border border-r-0 border-slate-300 bg-background-light pl-4 text-slate-500 dark:border-slate-700 dark:bg-background-dark">
                        <span className="material-symbols-outlined text-base">lock</span>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-input h-12 w-full min-w-0 flex-1 border border-r-0 border-slate-300 bg-background-light p-3 text-base font-normal text-[#101922] focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-background-dark dark:text-white"
                        placeholder="Tu numero de documento"
                        name="documentNumber"
                        value={formData.documentNumber}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex cursor-pointer items-center justify-center rounded-r-lg border border-l-0 border-slate-300 bg-background-light pr-4 text-slate-500 dark:border-slate-700 dark:bg-background-dark"
                      >
                        <span className="material-symbols-outlined text-base">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary px-5 text-base font-bold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="truncate">
                      {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={openRecoverModal}
                    className="text-center text-sm font-normal text-slate-600 underline hover:text-primary dark:text-slate-400"
                  >
                    Olvidaste tu contrasena?
                  </button>
                </form>

                <div className="w-full text-center text-xs text-slate-500 dark:text-slate-500">
                  <p>2024 GuiaFacil S.A. Simplificando tus tramites.</p>
                  <p className="mt-1">
                    Necesitas ayuda con un formulario especifico?{' '}
                    <a href="#" className="font-medium underline hover:text-primary">
                      Contactar a un experto
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isRecoverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              if (!recoverLoading) setIsRecoverOpen(false);
            }}
            aria-label="Cerrar recuperacion"
          />

          <form
            onSubmit={handleRecoverSubmit}
            className="relative w-full max-w-md rounded-xl border border-slate-700 bg-background-light p-6 shadow-xl dark:bg-background-dark"
          >
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#101922] dark:text-white">
                Recuperar contrasena
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Escribe tu correo registrado y enviaremos instrucciones de recuperacion.
              </p>
            </div>

            {recoverError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">{recoverError}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <label className="flex flex-col">
                <span className="pb-2 text-sm font-medium text-[#101922] dark:text-slate-300">
                  Correo electronico
                </span>
                <input
                  type="email"
                  name="email"
                  value={recoverForm.email}
                  onChange={handleRecoverChange}
                  disabled={recoverLoading}
                  required
                  className="form-input h-11 rounded-lg border border-slate-300 bg-background-light p-3 text-sm text-[#101922] focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-background-dark dark:text-white"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRecoverOpen(false)}
                disabled={recoverLoading}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={recoverLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {recoverLoading ? 'Enviando...' : 'Enviar instrucciones'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
