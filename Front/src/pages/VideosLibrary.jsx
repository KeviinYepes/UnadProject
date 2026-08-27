import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import VideoCard from '../components/VideoCard';
import VideoService from '../services/VideoService';

export default function VideosLibrary() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await VideoService.getAll();
        setContents(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error cargando contenidos:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    if (!q) return contents;
    const normalize = (v) =>
      String(v ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    return contents.filter((c) => {
      const haystack = `${normalize(c.title)} ${normalize(c.category)} ${normalize(c.description)}`;
      return haystack.includes(q);
    });
  }, [searchQuery, contents]);

  return (
    <div className="flex h-screen w-full font-display bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#101922] dark:text-white">
                  Biblioteca de Contenidos
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Videos, PDFs e imágenes para consultar.
                </p>
              </div>

              <Link
                to="/admin/videos/agregar"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-md transition hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Agregar contenido
              </Link>
            </div>

            <label className="relative flex w-full max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="material-symbols-outlined text-xl text-text-light-secondary dark:text-text-dark-secondary">
                  search
                </span>
              </div>
              <input
                className="form-input h-10 w-full flex-1 rounded-lg border-none bg-background-light pl-10 text-sm placeholder:text-text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-background-dark dark:placeholder:text-text-dark-secondary"
                placeholder="Buscar contenidos..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>

            {loading ? (
              <p className="text-text-secondary-light dark:text-text-secondary-dark">Cargando contenidos...</p>
            ) : filtered.length === 0 ? (
              <p className="text-text-secondary-light dark:text-text-secondary-dark">No hay contenidos disponibles.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8">
                {filtered.map((content) => (
                  <Link
                    key={content.id}
                    to="/video"
                    state={content}
                    className="group block transition-transform duration-300 hover:scale-[1.03]"
                  >
                    <VideoCard
                      title={content.title}
                      category={content.category || 'General'}
                      type={content.type}
                      url={content.url}
                      thumbnailUrl={content.thumbnailUrl}
                    />
                    <div className="mt-2 flex items-center gap-1 text-sm font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="material-symbols-outlined text-base">play_circle</span>
                      Ver contenido
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
