import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import VideoService from "../services/VideoService";

const VideosAdmin = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingVideo, setEditingVideo] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    category: "",
    type: "VIDEO",
    visibility: "internal",
    commentsEnabled: false,
  });

  const [tags, setTags] = useState(["Capacitación"]);
  const [newTag, setNewTag] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [wantsPreview, setWantsPreview] = useState(false);

  /* ================== CARGAR VIDEOS ================== */
  useEffect(() => {
    cargarVideos();
  }, []);

  const cargarVideos = async () => {
    try {
      setLoading(true);
      const data = await VideoService.getAll();
      setVideos(data);
      setError("");
    } catch (error) {
      console.error("Error cargando videos:", error);
      setError("Error al cargar videos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const addTag = (e) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      if (editingVideo) {
        // Actualizar contenido existente (conserva o quita el preview)
        const videoData = {
          ...form,
          tags,
          thumbnailUrl: wantsPreview ? (editingVideo.thumbnailUrl || "") : "",
        };
        await VideoService.update(editingVideo.id, videoData);
        alert("Contenido actualizado correctamente");
      } else if (selectedFile && form.type !== "VIDEO") {
        // Subir archivo (PDF, Excel, Word o imagen)
        await VideoService.upload(selectedFile, {
          title: form.title,
          description: form.description,
          category: form.category || "General",
          type: form.type,
          thumbnail: wantsPreview ? (selectedThumbnail || null) : null,
        });
        alert("Contenido publicado correctamente");
      } else {
        // Crear contenido por URL (video u otro enlace)
        const videoData = { ...form, tags, category: form.category || "General" };
        await VideoService.create(videoData);
        alert("Contenido publicado correctamente");
      }

      resetForm();
      cargarVideos();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al guardar el contenido");
      alert("Error al guardar el contenido: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setForm({
      title: video.title || "",
      description: video.description || "",
      url: video.url || "",
      category: video.category || "",
      type: video.type || "VIDEO",
      visibility: video.visibility || "internal",
      commentsEnabled: video.commentsEnabled || false,
    });
    setTags(video.tags || ["Capacitación"]);
    setSelectedFile(null);
    setSelectedThumbnail(null);
    setWantsPreview(!!video.thumbnailUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este video?")) return;

    try {
      setLoading(true);
      await VideoService.delete(id);
      alert("Video eliminado correctamente");
      cargarVideos();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar video: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingVideo(null);
    setForm({
      title: "",
      description: "",
      url: "",
      category: "",
      type: "VIDEO",
      visibility: "internal",
      commentsEnabled: false,
    });
    setTags(["Capacitación"]);
    setNewTag("");
    setSelectedFile(null);
    setSelectedThumbnail(null);
    setWantsPreview(false);
  };

  const handleDiscard = () => {
    resetForm();
    navigate('/admin/videos');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
              {editingVideo ? "Editar Video" : "Subir Nuevo Video"}
            </h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
              Completa la información para agregar contenido a la biblioteca.
            </p>
          </div>

          <div className="hidden lg:flex gap-4">
            {editingVideo && (
              <button
                onClick={resetForm}
                className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark"
                disabled={loading}
              >
                Cancelar Edición
              </button>
            )}
            <button
              onClick={handleDiscard}
              className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark"
              disabled={loading}
            >
              Descartar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? "Guardando..." : editingVideo ? "Actualizar Video" : "Publicar Video"}
            </button>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">

          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-2 space-y-8">

            {/* Metadata */}
            <section className="card p-6 space-y-6">
              <SectionTitle icon="description" title="Información del Video" />

              <Input
                label="Título"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ej: Capacitación Seguridad 2026"
                disabled={loading}
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Tipo de contenido</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    disabled={loading}
                    className="input"
                  >
                    <option value="VIDEO">Video</option>
                    <option value="PDF">PDF</option>
                    <option value="IMAGE">Imagen</option>
                    <option value="EXCEL">Excel</option>
                    <option value="WORD">Word</option>
                  </select>
                </div>
                <Input
                  label="Categoría"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Ej: Capacitación, Trámites"
                  disabled={loading}
                />
              </div>

              <Textarea
                label="Descripción"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe brevemente el contenido del video..."
                disabled={loading}
              />

              {/* Tags */}
              <div>
                <label className="label">Palabras Clave</label>
                <div className="flex flex-wrap gap-2 p-3 border border-border-light dark:border-border-dark rounded-lg">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold flex items-center gap-1"
                    >
                      {tag}
                      <span
                        className="material-symbols-outlined text-[14px] cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        close
                      </span>
                    </span>
                  ))}
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={addTag}
                    className="bg-transparent outline-none text-sm flex-1"
                    placeholder="Agregar etiqueta..."
                  />
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Presiona Enter para añadir
                </p>
              </div>
            </section>

            {/* Fuente del Contenido */}
            <section className="card p-6 space-y-6">
              <SectionTitle icon="cloud_upload" title="Fuente del Contenido" />

              <Input
                label={form.type === "VIDEO" ? "URL del Video" : "URL externa (opcional)"}
                name="url"
                value={form.url}
                onChange={handleChange}
                placeholder={form.type === "VIDEO" ? "YouTube, Vimeo o enlace interno" : "https://..."}
                disabled={loading}
              />

              {form.type !== "VIDEO" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold">Subir archivo (PDF, Excel, Word o imagen)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.xlsx,.xls,.docx,.doc"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      disabled={loading}
                      className="input"
                    />
                    {selectedFile && (
                      <p className="mt-2 text-sm font-semibold text-primary">
                        Archivo seleccionado: {selectedFile.name}
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-border-light p-4 dark:border-border-dark">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={wantsPreview}
                        onChange={(e) => setWantsPreview(e.target.checked)}
                        disabled={loading}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm font-semibold">Agregar imagen de preview personalizada</span>
                    </label>

                    {wantsPreview && !editingVideo && (
                      <div className="mt-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelectedThumbnail(e.target.files?.[0] || null)}
                          disabled={loading}
                          className="input"
                        />
                        {selectedThumbnail && (
                          <p className="mt-2 text-sm font-semibold text-primary">
                            Preview seleccionado: {selectedThumbnail.name}
                          </p>
                        )}
                      </div>
                    )}

                    {wantsPreview && editingVideo?.thumbnailUrl && (
                      <p className="mt-3 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        Este contenido ya tiene una imagen de preview. Desmarca la casilla para quitarla al guardar.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-6">

            {/* Visibilidad */}
            <section className="card p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase text-text-secondary-light dark:text-text-secondary-dark">
                Visibilidad
              </h3>

              {["internal", "public", "restricted"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border-light dark:border-border-dark cursor-pointer hover:bg-background-light dark:hover:bg-background-dark"
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option}
                    checked={form.visibility === option}
                    onChange={handleChange}
                    className="text-primary"
                  />
                  <span className="font-semibold capitalize">
                    {option === "internal"
                      ? "Solo Interno"
                      : option === "public"
                      ? "Público"
                      : "Por Departamento"}
                  </span>
                </label>
              ))}

              <div className="flex items-center justify-between pt-4 border-t border-border-light dark:border-border-dark">
                <span className="font-semibold">Permitir Comentarios</span>
                <input
                  type="checkbox"
                  name="commentsEnabled"
                  checked={form.commentsEnabled}
                  onChange={handleChange}
                  className="accent-primary"
                />
              </div>
            </section>

            {/* Consejo */}
            <div className="p-6 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2 text-primary mb-2">
                <span className="material-symbols-outlined">lightbulb</span>
                <h4 className="font-bold text-sm">Consejo</h4>
              </div>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Usa al menos 3 etiquetas relevantes para mejorar la búsqueda dentro de la plataforma.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Mobile */}
        <div className="lg:hidden flex gap-4 mt-8">
          <button
            onClick={handleDiscard}
            className="flex-1 bg-surface-light dark:bg-surface-dark py-3 rounded-lg font-bold"
            disabled={loading}
          >
            Descartar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-primary text-white py-3 rounded-lg font-bold disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Publicar"}
          </button>
        </div>

        {/* ================= LISTA DE VIDEOS ================= */}
        <div className="mt-12 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border-light dark:border-border-dark">
            <h2 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
              Videos Publicados
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-light dark:bg-surface-dark text-xs uppercase font-bold tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                <tr>
                  <th className="px-6 py-3">Título</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">URL</th>
                  <th className="px-6 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && videos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                      Cargando videos...
                    </td>
                  </tr>
                ) : videos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                      No hay videos publicados aún.
                    </td>
                  </tr>
                ) : (
                  videos.map((video) => (
                    <tr
                      key={video.id}
                      className="border-b border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition"
                    >
                      <td className="px-6 py-4 font-semibold">{video.title}</td>
                      <td className="px-6 py-4">{tipoLabel(video.type)}</td>
                      <td className="px-6 py-4 text-sm">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {video.url?.substring(0, 40)}...
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(video)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-semibold"
                            disabled={loading}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-semibold"
                            disabled={loading}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/* COMPONENTES AUXILIARES */

const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="material-symbols-outlined text-primary">
      {icon}
    </span>
    <h3 className="font-bold text-lg">{title}</h3>
  </div>
);

const Input = ({ label, disabled = false, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="label">{label}</label>
    <input {...props} className="input" disabled={disabled} />
  </div>
);

const Textarea = ({ label, disabled = false, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="label">{label}</label>
    <textarea {...props} rows="4" className="input" disabled={disabled} />
  </div>
);

const tipoLabel = (t) => {
  const u = (t || "VIDEO").toUpperCase();
  return u === "PDF" ? "PDF"
    : u === "IMAGE" ? "Imagen"
    : u === "EXCEL" ? "Excel"
    : u === "WORD" ? "Word"
    : "Video";
};

export default VideosAdmin;