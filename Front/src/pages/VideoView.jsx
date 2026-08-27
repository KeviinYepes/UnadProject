import { Link, useLocation } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import ContentThumbnail from '../components/ContentThumbnail';
import { API_BASE_URL } from '../config/api';

function getYoutubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function VideoView() {
  const location = useLocation();
  const tutorial = location.state || {};

  // Datos por defecto si no vienen del state
  const defaultTitle = "Declaración de Renta 2024: Guía Completa";
  const defaultCategory = "Impuestos";

  const embedUrl = getYoutubeEmbed(tutorial.url);
  const type = (tutorial.type || 'VIDEO').toUpperCase();
  const contentUrl = tutorial.url?.startsWith('/') ? `${API_BASE_URL}${tutorial.url}` : tutorial.url;
  const thumbUrl = tutorial.thumbnailUrl?.startsWith('/')
    ? `${API_BASE_URL}${tutorial.thumbnailUrl}`
    : tutorial.thumbnailUrl;

  return (
    <div className="font-display bg-background-light text-[#0d141b] dark:bg-background-dark dark:text-slate-200 transition-colors duration-300">
      <div className="relative flex min-h-screen w-full flex-col">
        <TopNavBar />
        
        <main className="w-full grow">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              
              {/* Contenido Principal: Video y Detalles */}
              <div className="flex flex-col gap-6 lg:col-span-2">
                
                {/* Migas de pan (Breadcrumbs) */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/admin/videos"
                    className="text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400"
                  >
                    Tutoriales
                  </Link>
                  <span className="material-symbols-outlined text-base text-slate-400">chevron_right</span>
                  <Link
                    to="#"
                    className="text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400"
                  >
                    {tutorial.category || defaultCategory}
                  </Link>
                  <span className="material-symbols-outlined text-base text-slate-400">chevron_right</span>
                  <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200">
                    {tutorial.title || defaultTitle}
                  </span>
                </div>

                {/* Encabezado de la Página */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-black leading-tight tracking-tight text-[#0d141b] dark:text-white">
                      {tutorial.title || defaultTitle}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Actualizado hace 2 días • Duración: 15:20 min
                    </p>
                  </div>
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>Marcar Completado</span>
                  </button>
                </div>

                {type === 'IMAGE' ? (
                  <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
                    <img
                      src={contentUrl}
                      alt={tutorial.title || 'Imagen'}
                      className="max-h-[70vh] w-full object-contain"
                    />
                  </div>
                ) : type === 'PDF' && !thumbUrl ? (
                  <div className="aspect-video overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <iframe className="h-full w-full" src={contentUrl} title={tutorial.title || 'PDF'} />
                  </div>
                ) : type === 'VIDEO' ? (
                  embedUrl ? (
                    <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
                      <iframe
                        className="h-full w-full"
                        src={embedUrl}
                        title={tutorial.title || 'Video'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="group relative overflow-hidden rounded-2xl bg-black shadow-2xl">
                      <div
                        className="relative aspect-video flex items-center justify-center bg-cover bg-center transition-transform duration-500 group-hover:scale-105 opacity-80"
                        style={{
                          backgroundImage: `url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200')`,
                        }}
                      >
                        <button className="flex size-20 items-center justify-center rounded-full bg-primary text-white shadow-2xl shadow-primary/40 backdrop-blur-sm transition-all hover:scale-110 active:scale-95">
                          <span className="material-symbols-outlined !text-5xl fill">play_arrow</span>
                        </button>
                      </div>
                      {contentUrl && (
                        <a
                          href={contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-4 text-center text-sm font-bold text-white hover:text-primary"
                        >
                          Abrir contenido
                        </a>
                      )}
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-border-light bg-white p-6 shadow-2xl dark:border-border-dark dark:bg-slate-900">
                    <div className="mx-auto max-w-xl overflow-hidden rounded-xl">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={tutorial.title || 'Vista previa'} className="w-full object-contain" />
                      ) : (
                        <div className="aspect-video">
                          <ContentThumbnail type={type} url={contentUrl} thumbnailUrl={null} title={tutorial.title} />
                        </div>
                      )}
                    </div>
                    <div className="mt-5 flex flex-col items-center gap-3">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {type === 'PDF'
                          ? 'Documento PDF'
                          : type === 'EXCEL'
                            ? 'Hoja de cálculo (Excel)'
                            : 'Documento (Word)'}
                      </p>
                      <a
                        href={contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-bold text-white shadow-md hover:bg-primary/90"
                      >
                        <span className="material-symbols-outlined">open_in_new</span>
                        Abrir / Descargar documento
                      </a>
                    </div>
                  </div>
                )}

                {/* Sección de Información del Tutorial */}
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <h2 className="text-xl font-bold text-[#0d141b] dark:text-white mb-4">Sobre este entrenamiento</h2>
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p>
                      En esta sesión aprenderás a navegar el nuevo portal tributario para realizar tu 
                      <strong> Declaración de Renta 2024</strong> de forma segura. Cubriremos desde la carga 
                      automática de datos hasta la validación manual de anexos.
                    </p>
                    <h3 className="text-lg font-bold">Puntos clave:</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                        Configuración de perfil tributario
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                        Carga de certificados laborales
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                        Deducciones y beneficios de ley
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                        Generación del recibo de pago
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Sección de Preguntas Rápidas (Vinculado al Foro) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">Dudas y Discusión</h2>
                    <Link to="/foro" className="text-sm font-bold text-primary hover:underline">Ver foro completo</Link>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    {/* Input de comentario rápido */}
                    <div className="flex gap-4">
                      <div className="size-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">edit_note</span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          className="w-full rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                          placeholder="¿Tienes alguna duda sobre este video? Pregunta aquí..."
                          rows="2"
                        />
                        <button className="mt-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90">
                          Enviar Pregunta
                        </button>
                      </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Preview de la duda que vimos en el foro */}
                    <div className="flex gap-4 opacity-80">
                      <div className="size-10 shrink-0 rounded-full bg-[url('https://i.pravatar.cc/150?u=ana')] bg-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">Ana García</p>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">hace 2 días</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 italic">
                          "En el minuto 4:15 no me aparece el botón de adjuntar..."
                        </p>
                        <Link to="/foro" className="mt-2 inline-block text-xs font-bold text-primary">
                          Ver respuesta experta (1)
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar: Recursos y Progreso */}
              <aside className="lg:col-span-1">
                <div className="sticky top-24 flex flex-col gap-6">
                  
                  {/* Documentos Relacionados */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                    <h3 className="mb-4 text-lg font-bold text-[#0d141b] dark:text-white">Material de apoyo</h3>
                    <div className="flex flex-col gap-3">
                      <button className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30">
                          <span className="material-symbols-outlined">picture_as_pdf</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Checklist Renta 2024</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">PDF • 1.2 MB</p>
                        </div>
                      </button>
                      
                      <button className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                          <span className="material-symbols-outlined">table_view</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Calculadora de Retenciones</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">EXCEL • 850 KB</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Siguientes Pasos */}
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 dark:bg-primary/10">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Siguiente Lección</h3>
                    <div className="group cursor-pointer">
                      <p className="text-base font-bold text-[#0d141b] group-hover:text-primary dark:text-white transition-colors">
                        Manejo de requerimientos especiales
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Duración: 08:45 min</span>
                        <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  </div>

                </div>
              </aside>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}