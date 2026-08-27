import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await AuthService.login(formData);
      navigate('/main');
    } catch (err) {
      console.error('Error de login:', err);
      setError(err.message || 'Credenciales inválidas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark">
      <div className="relative flex min-h-screen w-full flex-col">
        <div className="flex h-full min-h-screen grow flex-col">
          <div className="flex flex-1">
            {/* Lado izquierdo (Hero / Imagen) */}
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
                  Domina tus dudas en Minutos
                </h1>
                <p className="text-lg font-normal text-white/90">
                  Guías paso a paso en video para que nunca vuelvas a cometer un error en un formulario.
                </p>
              </div>
            </div>

            {/* Lado derecho (Formulario) */}
            <div className="flex w-full flex-col items-center justify-center bg-background-light px-4 py-12 dark:bg-background-dark sm:px-6 lg:px-8">
              <div className="flex w-full max-w-md flex-col items-center gap-10">
                {/* Logo y texto informativo */}
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
                      ¡Hola de nuevo!
                    </h1>
                    <p className="text-base font-normal text-slate-600 dark:text-slate-400">
                      Ingresa para continuar aprendiendo y completar tus formularios con éxito.
                    </p>
                  </div>
                </div>

                <form className="flex w-full flex-col gap-6" onSubmit={handleSubmit}>
                  {/* Mensaje de error */}
                  {error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Correo Electrónico */}
                  <label className="flex w-full flex-col">
                    <p className="pb-2 text-sm font-medium leading-normal text-[#101922] dark:text-slate-300">
                      Correo Electrónico
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

                  {/* Contraseña */}
                  <label className="flex w-full flex-col">
                    <p className="pb-2 text-sm font-medium leading-normal text-[#101922] dark:text-slate-300">
                      Contraseña
                    </p>
                    <div className="flex w-full flex-1 items-stretch rounded-lg">
                      <div className="flex items-center justify-center rounded-l-lg border border-r-0 border-slate-300 bg-background-light pl-4 text-slate-500 dark:border-slate-700 dark:bg-background-dark">
                        <span className="material-symbols-outlined text-base">lock</span>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-input h-12 w-full min-w-0 flex-1 border border-r-0 border-slate-300 bg-background-light p-3 text-base font-normal text-[#101922] focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-background-dark dark:text-white"
                        placeholder="Tu contraseña"
                        name="password"
                        value={formData.password}
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
                    className="flex h-12 w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary px-5 text-base font-bold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </span>
                  </button>
                  
                  <div className="flex flex-col gap-2">
                    <p className="cursor-pointer text-center text-sm font-normal text-slate-600 underline hover:text-primary dark:text-slate-400">
                      ¿Olvidaste tu contraseña?
                    </p>
                    <p className="text-center text-sm font-normal text-slate-600 dark:text-slate-400">
                      ¿No tienes cuenta? <span className="cursor-pointer font-bold text-primary hover:underline">Regístrate gratis</span>
                    </p>
                  </div>
                </form>

                {/* Footer del Formulario */}
                <div className="w-full text-center text-xs text-slate-500 dark:text-slate-500">
                  <p>© 2024 GuíaFácil S.A. Simplificando tus trámites.</p>
                  <p className="mt-1">
                    ¿Necesitas ayuda con un formulario específico?{' '}
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
    </div>
  );
}