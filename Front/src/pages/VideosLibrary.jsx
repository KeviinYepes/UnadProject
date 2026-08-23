import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import VideoCard from "../components/VideoCard";
import Toast from "../components/Toast";
import CategoryTreeFilter from "../components/CategoryTreeFilter";
import Pagination from "../components/Pagination";
import AuthService from "../services/AuthService";
import CategoryService from "../services/CategoryService";
import VideoService from "../services/VideoService";

const PAGE_SIZE = 12;

export default function VideosLibrary() {
  const currentUser = AuthService.getCurrentUser();
  const canManageContent = ["ADMIN", "MODERATOR"].includes(normalizeRole(currentUser?.role));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [durations, setDurations] = useState({});
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    description: "",
    urlVideo: "",
    materials: [],
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    const loadDurations = async () => {
      const entries = videos
        .map((video) => {
          const videoId = getYouTubeVideoId(video.urlVideo);
          return videoId ? { key: video.id, videoId } : null;
        })
        .filter(Boolean)
        .filter(({ key }) => !durations[key]);

      if (entries.length === 0) return;

      const results = await Promise.all(
        entries.map(async ({ key, videoId }) => {
          const seconds = await getYouTubeDuration(videoId);
          return [key, formatDuration(seconds)];
        })
      );

      setDurations((prev) => ({
        ...prev,
        ...Object.fromEntries(results.filter(([, value]) => value)),
      }));
    };

    loadDurations();
  }, [videos, durations]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [contentData, categoryData] = await Promise.all([
        VideoService.getAll(),
        CategoryService.getAll(),
      ]);

      setVideos(Array.isArray(contentData) ? contentData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setError("");
    } catch (e) {
      console.error("Error cargando contenido:", e);
      const msg =
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        "Error al cargar contenido";
      setError(msg);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm({ title: "", categoryId: "", description: "", urlVideo: "", materials: [] });
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm({ title: "", categoryId: "", description: "", urlVideo: "", materials: [] });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, materials: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!form.urlVideo.trim() && form.materials.length === 0) {
        throw new Error("Agrega una URL de video o al menos un PDF como material de apoyo.");
      }

      const currentUser = AuthService.getCurrentUser();
      if (!currentUser?.userId) {
        throw new Error("No se encontro el usuario actual. Vuelve a iniciar sesion.");
      }

      await VideoService.create({
        title: form.title,
        urlVideo: form.urlVideo,
        categoryId: form.categoryId,
        description: form.description || null,
        createdById: currentUser.userId,
        materials: form.materials,
      });

      showToast("Contenido agregado correctamente.");
      handleCloseModal();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      const apiMessage = err.response?.data?.error || err.response?.data?.message;
      const fallbackMessage = err.message || "Error al guardar el contenido";
      const msg = apiMessage || fallbackMessage;
      showToast("Error al guardar el contenido: " + msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const fallbackImage =
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=500&auto=format&fit=crop";

  const getYouTubeVideoId = (url) => {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.replace(/^www\./, "");

      if (host === "youtu.be") {
        return parsedUrl.pathname.split("/").filter(Boolean)[0] || null;
      }

      if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
        if (parsedUrl.pathname === "/watch") {
          return parsedUrl.searchParams.get("v");
        }

        const parts = parsedUrl.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0])) {
          return parts[1] || null;
        }
      }
    } catch {
      const match = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
      return match?.[1] || null;
    }

    return null;
  };

  const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : fallbackImage;
  };

  const toCardItem = (video) => {
    const hasVideoUrl = Boolean(String(video.urlVideo || "").trim());
    const isMaterialOnly = !hasVideoUrl && (video.materials || []).length > 0;

    return {
      id: video.id,
      title: video.title,
      category: video.category?.categoryName || "Sin categoria",
      createdBy: video.createdBy,
      duration: isMaterialOnly ? "PDF" : durations[video.id] || "...",
      imageUrl: getYouTubeThumbnail(video.urlVideo),
      url: video.urlVideo,
      isMaterialOnly,
      description: video.description,
      materials: video.materials || [],
      createdAt: video.createdAt,
    };
  };

  const items = videos.map(toCardItem);

  const filteredTutorials = useMemo(() => {
    const q = searchQuery
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    const normalize = (value) =>
      String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const selected = normalize(selectedCategory);

    const filtered = items.filter((tutorial) => {
      const haystack = `${normalize(tutorial.title)} ${normalize(tutorial.category)}`;
      const matchesSearch = !q || haystack.includes(q);
      const matchesCategory = !selected || normalize(tutorial.category) === selected;
      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "title") {
        return String(a.title).localeCompare(String(b.title), "es", { sensitivity: "base" });
      }

      if (sortBy === "category") {
        return String(a.category).localeCompare(String(b.category), "es", { sensitivity: "base" });
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [searchQuery, selectedCategory, sortBy, items]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const paginatedTutorials = useMemo(
    () => paginate(filteredTutorials, currentPage, PAGE_SIZE),
    [filteredTutorials, currentPage]
  );

  return (
    <div className="flex h-screen w-full font-display bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#101922] dark:text-white">
                  Biblioteca de Guias Visuales
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Selecciona un formulario para ver el video instructivo y seguir los pasos.
                </p>
              </div>

              {canManageContent && (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Agregar contenido
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="relative flex w-full max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-symbols-outlined text-xl text-text-light-secondary dark:text-dark-secondary">
                    search
                  </span>
                </div>
                <input
                  className="form-input h-10 w-full flex-1 rounded-lg border-none bg-background-light pl-10 text-sm placeholder:text-text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-background-dark dark:placeholder:text-dark-secondary"
                  placeholder="Buscar contenido..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>

              <label className="relative h-9 shrink-0">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-9 appearance-none rounded-lg border border-slate-300 bg-white pl-4 pr-10 text-sm font-medium transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <option value="recent">Ordenar por: Recientes</option>
                  <option value="title">Ordenar por: Titulo</option>
                  <option value="category">Ordenar por: Categoria</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                  expand_more
                </span>
              </label>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <CategoryTreeFilter
                categories={categories}
                videos={items}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              <div className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8">
                {loading && filteredTutorials.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-text-light-secondary dark:text-dark-secondary">
                    Cargando contenido...
                  </div>
                ) : !error && videos.length === 0 ? (
                  <div className="col-span-full flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border-light bg-card-light p-10 text-center dark:border-border-dark dark:bg-card-dark">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-3xl">video_library</span>
                    </div>
                    <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                      No hay contenido registrado
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      Agrega tu primer contenido para que aparezca en la biblioteca de guias visuales.
                    </p>
                    {canManageContent && (
                      <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-md transition hover:bg-primary/90"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Agregar contenido
                      </button>
                    )}
                  </div>
                ) : filteredTutorials.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-text-light-secondary dark:text-dark-secondary">
                    No hay contenido que coincida con la busqueda.
                  </div>
                ) : (
                  paginatedTutorials.map((tutorial, index) => (
                    <Link
                      key={tutorial.id ?? index}
                      to="/video"
                      state={tutorial}
                      className="group block transition-transform duration-300 hover:scale-[1.03]"
                    >
                      <VideoCard
                        title={tutorial.title}
                        category={tutorial.category}
                        duration={tutorial.duration}
                        imageUrl={tutorial.imageUrl}
                        isMaterialOnly={tutorial.isMaterialOnly}
                      />
                      <div className="mt-2 flex items-center gap-1 text-sm font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="material-symbols-outlined text-base">
                          {tutorial.isMaterialOnly ? "picture_as_pdf" : "play_circle"}
                        </span>
                        {tutorial.isMaterialOnly ? "Ver material de apoyo" : "Ver paso a paso"}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <Pagination
              page={currentPage}
              totalItems={filteredTutorials.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />

            {canManageContent && isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/50"
                  onClick={handleCloseModal}
                  aria-label="Cerrar modal"
                />

                <div className="relative w-full max-w-3xl rounded-xl bg-card-light p-6 shadow-lg dark:bg-card-dark border border-border-light dark:border-border-dark">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                        Agregar contenido multimedia
                      </h2>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        Completa la informacion del contenido. Puedes registrar solo PDFs si no hay video.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-background-light text-text-light-secondary transition-colors hover:bg-primary/10 hover:text-primary dark:bg-background-dark dark:text-dark-secondary dark:hover:bg-primary/20 dark:hover:text-primary"
                      aria-label="Cerrar"
                      disabled={loading}
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Titulo"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      disabled={loading}
                    />

                    <Select
                      label="Categoria"
                      name="categoryId"
                      value={form.categoryId}
                      onChange={handleChange}
                      disabled={loading}
                      options={categories.map((category) => ({
                        value: category.id,
                        label: category.categoryName,
                      }))}
                    />

                    <div className="md:col-span-2">
                      <Textarea
                        label="Descripcion"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        disabled={loading}
                        required={false}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="URL del video"
                        name="urlVideo"
                        value={form.urlVideo}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="https://..."
                        required={false}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FileInput
                        label="Materiales PDF"
                        name="materials"
                        files={form.materials}
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-6 py-2 rounded-lg bg-surface-light dark:bg-surface-dark font-semibold"
                        disabled={loading}
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-2 rounded-lg bg-primary text-white font-bold shadow-md hover:bg-primary/90 transition disabled:opacity-50"
                      >
                        {loading ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const Input = ({ label, type = "text", required = true, disabled = false, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold">{label}</label>
    <input type={type} {...props} className="input" required={required} disabled={disabled} />
  </div>
);

const Select = ({ label, options, disabled = false, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold">{label}</label>
    <select {...props} className="input" required disabled={disabled}>
      <option value="">Seleccionar...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const Textarea = ({ label, required = true, disabled = false, rows = 4, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold">{label}</label>
    <textarea {...props} rows={rows} className="input" required={required} disabled={disabled} />
  </div>
);

const FileInput = ({ label, files = [], disabled = false, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold">{label}</label>
    <input
      {...props}
      type="file"
      accept="application/pdf,.pdf"
      multiple
      className="input file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
      disabled={disabled}
    />
    {files.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {files.map((file) => (
          <span
            key={`${file.name}-${file.size}`}
            title={file.name}
            className="inline-flex max-w-full items-center gap-1 rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/20 sm:max-w-xs"
          >
            <span className="material-symbols-outlined shrink-0 text-sm">picture_as_pdf</span>
            <span className="min-w-0 truncate">{file.name}</span>
          </span>
        ))}
      </div>
    )}
  </div>
);

let youtubeApiPromise;

const loadYouTubeApi = () => {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
  });

  return youtubeApiPromise;
};

const getYouTubeDuration = async (videoId) => {
  if (!videoId) return null;

  try {
    const YT = await loadYouTubeApi();
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    document.body.appendChild(container);

    return await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        player?.destroy();
        container.remove();
        resolve(null);
      }, 8000);

      let player = new YT.Player(container, {
        width: "1",
        height: "1",
        videoId,
        events: {
          onReady: (event) => {
            const duration = event.target.getDuration();
            clearTimeout(timeout);
            event.target.destroy();
            container.remove();
            resolve(duration);
          },
          onError: () => {
            clearTimeout(timeout);
            player?.destroy();
            container.remove();
            resolve(null);
          },
        },
      });
    });
  } catch {
    return null;
  }
};

const formatDuration = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return null;

  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const normalizeRole = (role) =>
  String(role || "USER")
    .replace(/^ROLE_/i, "")
    .toUpperCase();

const paginate = (items, page, pageSize) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};
