import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import AuthService from "../services/AuthService";
import VideoStatsService from "../services/VideoStatsService";
import ForumService from "../services/ForumService";
import VideoService from "../services/VideoService";
import CategoryService from "../services/CategoryService";
import { buildApiUrl } from "../config/api";

export default function VideoView() {
  const location = useLocation();
  const navigate = useNavigate();
  const tutorial = location.state || {};
  const [content, setContent] = useState(tutorial);

  const title = content.title || "Contenido sin titulo";
  const category = getCategoryLabel(content.category);
  const authorName = getUserName(content.createdBy);
  const description = content.description || "Este contenido aun no tiene descripcion registrada.";
  const materials = Array.isArray(content.materials) ? content.materials : [];
  const currentUser = AuthService.getCurrentUser();
  const canReplyToQuestions = normalizeRole(currentUser?.role) !== "USER";
  const canManageMaterials = normalizeRole(currentUser?.role) !== "USER";
  const canEditContent = ["ADMIN", "MODERATOR"].includes(normalizeRole(currentUser?.role));
  const canDeleteContent = normalizeRole(currentUser?.role) === "ADMIN";
  const contentUrl = getContentUrl(content);
  const hasVideoUrl = Boolean(contentUrl.trim());
  const videoId = getYouTubeVideoId(contentUrl);
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const lastStartedAtRef = useRef(null);
  const pendingSecondsRef = useRef(0);
  const viewRecordedRef = useRef(false);
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [forumLoading, setForumLoading] = useState(false);
  const [forumSubmitting, setForumSubmitting] = useState(false);
  const [replySubmittingId, setReplySubmittingId] = useState(null);
  const [forumError, setForumError] = useState("");
  const [materialFiles, setMaterialFiles] = useState([]);
  const [materialSubmitting, setMaterialSubmitting] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState(null);
  const [materialError, setMaterialError] = useState("");
  const [contentDeleting, setContentDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentError, setContentError] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    categoryId: "",
    description: "",
    urlVideo: "",
  });

  const accumulateWatchTime = ({ keepRunning = false } = {}) => {
    if (!lastStartedAtRef.current) return;

    const elapsed = Math.floor((Date.now() - lastStartedAtRef.current) / 1000);
    if (elapsed > 0) {
      pendingSecondsRef.current += elapsed;
    }

    lastStartedAtRef.current = keepRunning ? Date.now() : null;
  };

  const flushWatchTime = async () => {
    if (!content.id) return;

    const seconds = pendingSecondsRef.current;
    if (seconds <= 0) return;

    pendingSecondsRef.current = 0;

    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser?.userId) return;

        await VideoStatsService.record({
          userId: currentUser.userId,
          contentId: content.id,
          watchTimeSeconds: seconds,
          countView: false,
        });
    } catch (error) {
      pendingSecondsRef.current += seconds;
      console.error("Error registrando tiempo visto:", error);
    }
  };

  useEffect(() => {
    const recordInitialView = async () => {
      if (!content.id || viewRecordedRef.current) return;

      try {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser?.userId) return;

        viewRecordedRef.current = true;
        await VideoStatsService.record({
          userId: currentUser.userId,
          contentId: content.id,
          watchTimeSeconds: 0,
          countView: true,
        });
      } catch (error) {
        viewRecordedRef.current = false;
        console.error("Error registrando vista:", error);
      }
    };

    recordInitialView();
  }, [content.id]);

  useEffect(() => {
    if (!canEditContent) return;

    const loadCategories = async () => {
      try {
        const data = await CategoryService.getAll();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando categorias:", error);
      }
    };

    loadCategories();
  }, [canEditContent]);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!content.id) return;

      setForumLoading(true);
      setForumError("");

      try {
        const data = await ForumService.getQuestionsByContent(content.id);
        setQuestions(data);
      } catch (error) {
        console.error("Error cargando preguntas:", error);
        setForumError("No se pudieron cargar las preguntas de este contenido.");
      } finally {
        setForumLoading(false);
      }
    };

    loadQuestions();
  }, [content.id]);

  useEffect(() => {
    if (!videoId || !playerContainerRef.current) return;

    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !playerContainerRef.current) return;

      playerRef.current = new YT.Player(playerContainerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              isPlayingRef.current = true;
              lastStartedAtRef.current = Date.now();
            } else if (
              event.data === YT.PlayerState.PAUSED ||
              event.data === YT.PlayerState.ENDED ||
              event.data === YT.PlayerState.BUFFERING
            ) {
              accumulateWatchTime();
              isPlayingRef.current = false;
              flushWatchTime();
            }
          },
        },
      });
    });

    const interval = setInterval(() => {
      if (!isPlayingRef.current) return;
      accumulateWatchTime({ keepRunning: true });
      flushWatchTime();
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        accumulateWatchTime();
        isPlayingRef.current = false;
        flushWatchTime();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      accumulateWatchTime();
      isPlayingRef.current = false;
      flushWatchTime();
      playerRef.current?.destroy?.();
    };
  }, [videoId, content.id]);

  const createForumMessage = async (descriptionValue) => {
    try {
      if (!currentUser?.userId) {
        setForumError("Debes iniciar sesion para publicar una pregunta.");
        return null;
      }

      setForumError("");

      const created = await ForumService.createQuestion({
        contentId: content.id,
        userId: currentUser.userId,
        title: `Dudas sobre ${title}`,
        description: descriptionValue,
      });

      setQuestions((currentQuestions) => [...currentQuestions, created]);
      return created;
    } catch (error) {
      console.error("Error publicando mensaje:", error);
      setForumError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "No se pudo publicar el mensaje."
      );
      return null;
    }
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();

    const descriptionValue = questionText.trim();
    if (!descriptionValue || !content.id) return;

    try {
      setForumSubmitting(true);
      const created = await createForumMessage(descriptionValue);
      if (created) {
        setQuestionText("");
      }
    } finally {
      setForumSubmitting(false);
    }
  };

  const handleReplySubmit = async (question, replyText) => {
    const replyValue = replyText.trim();
    if (!replyValue || !content.id) return null;

    try {
      setReplySubmittingId(question.id);
      return await createForumMessage(`Respuesta a ${getUserName(question.user)}: ${replyValue}`);
    } finally {
      setReplySubmittingId(null);
    }
  };

  const handleMaterialSubmit = async (event) => {
    event.preventDefault();

    if (!content.id || materialFiles.length === 0) return;

    try {
      setMaterialSubmitting(true);
      setMaterialError("");
      const updated = await VideoService.addMaterials(content.id, materialFiles);
      setContent((current) => ({
        ...current,
        ...updated,
        category: getCategoryLabel(updated.category ?? current.category),
        url: getContentUrl(updated) || getContentUrl(current),
        materials: Array.isArray(updated.materials) ? updated.materials : current.materials,
      }));
      setMaterialFiles([]);
    } catch (error) {
      console.error("Error subiendo materiales:", error);
      setMaterialError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "No se pudieron subir los materiales."
      );
    } finally {
      setMaterialSubmitting(false);
    }
  };

  const handleMaterialDelete = async (material) => {
    if (!content.id || !material?.id) return;

    try {
      setDeletingMaterialId(material.id);
      setMaterialError("");
      const updated = await VideoService.deleteMaterial(content.id, material.id);
      setContent((current) => ({
        ...current,
        ...updated,
        category: getCategoryLabel(updated.category ?? current.category),
        url: getContentUrl(updated) || getContentUrl(current),
        materials: Array.isArray(updated.materials)
          ? updated.materials
          : current.materials.filter((item) => item.id !== material.id),
      }));
    } catch (error) {
      console.error("Error eliminando material:", error);
      setMaterialError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "No se pudo eliminar el material."
      );
    } finally {
      setDeletingMaterialId(null);
    }
  };

  const handleContentDelete = async () => {
    if (!content.id || contentDeleting) return;

    try {
      setContentDeleting(true);
      await VideoService.delete(content.id);
      navigate("/admin/biblioteca", { replace: true });
    } catch (error) {
      console.error("Error eliminando contenido:", error);
      setMaterialError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "No se pudo eliminar el contenido."
      );
      setContentDeleting(false);
    }
  };

  const openEditModal = () => {
    const currentCategoryId =
      content.category?.id ||
      categories.find((item) => getCategoryLabel(item) === getCategoryLabel(content.category))?.id ||
      "";

    setEditForm({
      title: content.title || "",
      categoryId: currentCategoryId ? String(currentCategoryId) : "",
      description: content.description || "",
      urlVideo: content.urlVideo || getContentUrl(content) || "",
    });
    setContentError("");
    setIsEditModalOpen(true);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
    setContentError("");
  };

  const handleContentUpdate = async (event) => {
    event.preventDefault();
    if (!content.id || contentSaving) return;

    try {
      if (!editForm.urlVideo.trim() && materials.length === 0) {
        throw new Error("Agrega una URL de video o conserva al menos un PDF como material de apoyo.");
      }

      setContentSaving(true);
      setContentError("");

      const updated = await VideoService.update(content.id, {
        ...editForm,
        createdById: content.createdBy?.id || currentUser?.userId,
      });

      setContent((current) => ({
        ...current,
        ...updated,
        url: getContentUrl(updated) || editForm.urlVideo,
        materials: Array.isArray(updated.materials) ? updated.materials : current.materials,
      }));
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error actualizando contenido:", error);
      setContentError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "No se pudo actualizar el contenido."
      );
    } finally {
      setContentSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full font-display bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="flex flex-col gap-6 lg:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      to="/admin/biblioteca"
                      className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-base">arrow_back</span>
                      Volver a la biblioteca
                    </Link>
                    <h1 className="text-3xl font-black leading-tight tracking-tight text-[#0d141b] dark:text-white">
                      {title}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                      <MetaBadge icon="category" label={category} />
                      <MetaBadge icon="person" label={`Subido por ${authorName}`} />
                    </div>
                  </div>

                  {(canEditContent || canDeleteContent) && (
                    <div className="flex flex-wrap justify-end gap-3">
                      {canEditContent && (
                        <button
                          type="button"
                          onClick={openEditModal}
                          disabled={contentDeleting || contentSaving}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                          Editar contenido
                        </button>
                      )}

                      {canDeleteContent && (
                        <button
                          type="button"
                          onClick={() => setIsDeleteModalOpen(true)}
                          disabled={contentDeleting}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {contentDeleting ? "hourglass_empty" : "delete"}
                          </span>
                          {contentDeleting ? "Eliminando..." : "Eliminar contenido"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
                  {videoId ? (
                    <div className="aspect-video w-full">
                      <div ref={playerContainerRef} className="h-full w-full" title={title} />
                    </div>
                  ) : !hasVideoUrl ? (
                    <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-surface-light p-8 text-center dark:bg-surface-dark">
                      <span className="material-symbols-outlined text-5xl text-primary">picture_as_pdf</span>
                      <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                        Contenido con material de apoyo
                      </h2>
                      <p className="max-w-md text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Este contenido no tiene video asociado. Revisa los PDFs disponibles en Material de apoyo.
                      </p>
                    </div>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-surface-light p-8 text-center dark:bg-surface-dark">
                      <span className="material-symbols-outlined text-5xl text-primary">video_library</span>
                      <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                        No se pudo cargar el video
                      </h2>
                      <p className="max-w-md text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        La URL registrada no parece ser un enlace valido de YouTube.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <h2 className="mb-4 text-xl font-bold text-[#0d141b] dark:text-white">
                    Sobre este contenido
                  </h2>
                  <p className="whitespace-pre-line leading-7 text-slate-700 dark:text-slate-300">
                    {description}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">
                      Dudas y Discusion
                    </h2>
                    <Link to="/foro" className="text-sm font-bold text-primary hover:underline">
                      Ver foro completo
                    </Link>
                  </div>

                  <form className="mt-6 flex gap-4" onSubmit={handleQuestionSubmit}>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">edit_note</span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        className="w-full rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                        placeholder="Tienes alguna duda sobre este video? Pregunta aqui..."
                        rows="2"
                        value={questionText}
                        onChange={(event) => setQuestionText(event.target.value)}
                      />
                      {forumError && (
                        <p className="mt-2 text-sm font-medium text-red-500">{forumError}</p>
                      )}
                      <button
                        className="mt-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        type="submit"
                        disabled={forumSubmitting || !questionText.trim()}
                      >
                        {forumSubmitting ? "Enviando..." : "Enviar Pregunta"}
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 flex flex-col gap-4">
                    {forumLoading ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Cargando preguntas...</p>
                    ) : questions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        Todavia no hay preguntas para este contenido. Se el primero en iniciar la conversacion.
                      </div>
                    ) : (
                      questions.map((question) => (
                        <QuestionItem
                          key={question.id}
                          question={question}
                          canReply={canReplyToQuestions}
                          isSubmittingReply={replySubmittingId === question.id}
                          onReplySubmit={handleReplySubmit}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              <aside className="lg:col-span-1">
                <div className="sticky top-24 flex flex-col gap-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                    <h3 className="mb-4 text-lg font-bold text-[#0d141b] dark:text-white">
                      Material de apoyo
                    </h3>
                    <div className="flex flex-col gap-3">
                      {canManageMaterials && (
                        <form className="flex flex-col gap-3" onSubmit={handleMaterialSubmit}>
                          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-3 text-sm font-bold text-primary transition hover:bg-primary/10">
                            <span className="material-symbols-outlined text-lg">upload_file</span>
                            Seleccionar PDF
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              multiple
                              className="hidden"
                              disabled={materialSubmitting}
                              onChange={(event) => setMaterialFiles(Array.from(event.target.files || []))}
                            />
                          </label>

                          {materialFiles.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {materialFiles.map((file) => (
                                <span
                                  key={`${file.name}-${file.size}`}
                                  className="truncate rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/20"
                                  title={file.name}
                                >
                                  {file.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {materialError && (
                            <p className="text-sm font-medium text-red-500">{materialError}</p>
                          )}

                          <button
                            type="submit"
                            disabled={materialSubmitting || materialFiles.length === 0}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {materialSubmitting ? "Subiendo..." : "Subir material"}
                          </button>
                        </form>
                      )}

                      {materials.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          Este contenido no tiene materiales PDF asociados.
                        </p>
                      ) : (
                        materials.map((material) => (
                          <SupportButton
                            key={material.id || material.driveFileId}
                            title={material.fileName || "Material PDF"}
                            meta={formatFileSize(material.sizeBytes)}
                            href={getMaterialUrl(material)}
                            canDelete={canManageMaterials}
                            isDeleting={deletingMaterialId === material.id}
                            onDelete={() => setMaterialToDelete(material)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!contentSaving) setIsEditModalOpen(false);
            }}
            aria-label="Cerrar modal"
          />

          <div className="relative w-full max-w-3xl rounded-xl border border-border-light bg-card-light p-6 shadow-xl dark:border-border-dark dark:bg-card-dark">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                  Editar contenido
                </h2>
                <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Actualiza la informacion principal del video.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={contentSaving}
                className="inline-flex size-9 items-center justify-center rounded-lg bg-background-light text-text-light-secondary transition hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:bg-background-dark dark:text-dark-secondary dark:hover:bg-primary/20"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleContentUpdate} className="grid gap-5 md:grid-cols-2">
              <FormInput
                label="Titulo"
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                disabled={contentSaving}
              />

              <FormSelect
                label="Categoria"
                name="categoryId"
                value={editForm.categoryId}
                onChange={handleEditChange}
                disabled={contentSaving}
                options={categories.map((item) => ({
                  value: item.id,
                  label: item.categoryName,
                }))}
              />

              <div className="md:col-span-2">
                <FormInput
                  label="URL del video"
                  name="urlVideo"
                  value={editForm.urlVideo}
                  onChange={handleEditChange}
                  disabled={contentSaving}
                  placeholder="https://..."
                  required={false}
                />
              </div>

              <div className="md:col-span-2">
                <FormTextarea
                  label="Descripcion"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  disabled={contentSaving}
                  required={false}
                />
              </div>

              {contentError && (
                <p className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                  {contentError}
                </p>
              )}

              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={contentSaving}
                  className="rounded-lg bg-surface-light px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-surface-dark dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contentSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-lg">
                    {contentSaving ? "hourglass_empty" : "save"}
                  </span>
                  {contentSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!contentDeleting) setIsDeleteModalOpen(false);
            }}
            aria-label="Cerrar modal"
          />

          <div className="relative w-full max-w-md rounded-xl border border-border-light bg-card-light p-6 shadow-xl dark:border-border-dark dark:bg-card-dark">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                  Eliminar contenido
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary-light dark:text-text-secondary-dark">
                  Esta accion eliminara el contenido, sus materiales de apoyo, estadisticas e hilos de conversacion.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={contentDeleting}
                className="rounded-lg bg-surface-light px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-surface-dark dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleContentDelete}
                disabled={contentDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg">
                  {contentDeleting ? "hourglass_empty" : "delete"}
                </span>
                {contentDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!deletingMaterialId) setMaterialToDelete(null);
            }}
            aria-label="Cerrar modal"
          />

          <div className="relative w-full max-w-md rounded-xl border border-border-light bg-card-light p-6 shadow-xl dark:border-border-dark dark:bg-card-dark">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300">
                <span className="material-symbols-outlined">picture_as_pdf</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                  Eliminar material
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary-light dark:text-text-secondary-dark">
                  Este archivo se eliminara del contenido y tambien se borrara del almacenamiento local.
                </p>
                <p className="mt-3 break-words rounded-lg bg-surface-light px-3 py-2 text-sm font-semibold text-text-primary-light [overflow-wrap:anywhere] dark:bg-surface-dark dark:text-text-primary-dark">
                  {materialToDelete.fileName || "Material PDF"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                disabled={Boolean(deletingMaterialId)}
                className="rounded-lg bg-surface-light px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-surface-dark dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleMaterialDelete(materialToDelete);
                  setMaterialToDelete(null);
                }}
                disabled={Boolean(deletingMaterialId)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg">
                  {deletingMaterialId ? "hourglass_empty" : "delete"}
                </span>
                {deletingMaterialId ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MetaBadge = ({ icon, label }) => (
  <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
    <span className="material-symbols-outlined text-base text-primary">{icon}</span>
    <span className="truncate">{label}</span>
  </span>
);

const FormInput = ({ label, type = "text", required = true, disabled = false, ...props }) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
      {label}
    </span>
    <input
      type={type}
      required={required}
      disabled={disabled}
      className="input disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    />
  </label>
);

const FormSelect = ({ label, options, required = true, disabled = false, ...props }) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
      {label}
    </span>
    <select
      required={required}
      disabled={disabled}
      className="input disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      <option value="">Seleccionar...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const FormTextarea = ({ label, required = true, disabled = false, rows = 4, ...props }) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
      {label}
    </span>
    <textarea
      required={required}
      disabled={disabled}
      rows={rows}
      className="input disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    />
  </label>
);

const SupportButton = ({ title, meta, href, canDelete = false, isDeleting = false, onDelete }) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
      <a className="flex min-w-0 flex-1 items-center gap-3" href={href} target="_blank" rel="noreferrer">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30">
          <span className="material-symbols-outlined">picture_as_pdf</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold leading-5 [overflow-wrap:anywhere]">{title}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{meta}</p>
        </div>
      </a>

      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-900/20"
          aria-label={`Eliminar ${title}`}
          title="Eliminar material"
        >
          <span className="material-symbols-outlined text-lg">
            {isDeleting ? "hourglass_empty" : "delete"}
          </span>
        </button>
      )}
    </div>
  );
};

const QuestionItem = ({ question, canReply, isSubmittingReply, onReplySubmit }) => {
  const authorName = getUserName(question.user);
  const dateLabel = formatDate(question.createdAt);
  const authorRole = normalizeRole(question.user?.role?.roleName);
  const isStaffResponse = authorRole && authorRole !== "USER";
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const submitReply = async (event) => {
    event.preventDefault();

    const created = await onReplySubmit(question, replyText);
    if (created) {
      setReplyText("");
      setIsReplyOpen(false);
    }
  };

  return (
    <article className={`rounded-xl border p-4 ${
      isStaffResponse
        ? "border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10"
        : "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {authorName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-[#0d141b] dark:text-white">{authorName}</p>
            {isStaffResponse && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                Respuesta del equipo
              </span>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">{dateLabel}</p>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-300">
            {question.description}
          </p>
          {canReply && !isStaffResponse && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsReplyOpen((current) => !current)}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-base">reply</span>
                Responder
              </button>

              {isReplyOpen && (
                <form className="mt-3 flex flex-col gap-2" onSubmit={submitReply}>
                  <textarea
                    className="w-full rounded-xl border-slate-200 bg-white p-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    placeholder={`Responder a ${authorName}...`}
                    rows="2"
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyText("");
                        setIsReplyOpen(false);
                      }}
                      className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReply || !replyText.trim()}
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingReply ? "Enviando..." : "Publicar respuesta"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const getUserName = (user) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return fullName || user?.email || "Usuario";
};

const getCategoryLabel = (category) => {
  if (typeof category === "string" && category.trim()) return category;
  return category?.categoryName || "Sin categoria";
};

const getContentUrl = (content) => content?.url || content?.urlVideo || "";

const getMaterialUrl = (material) => {
  if (material?.driveFileId) {
    return buildApiUrl(`/api/content/materials/${material.driveFileId}`);
  }

  return buildApiUrl(material?.driveUrl);
};

const normalizeRole = (role) =>
  String(role || "USER")
    .replace(/^ROLE_/i, "")
    .toUpperCase();

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatFileSize = (value) => {
  const bytes = Number(value);
  if (!bytes || Number.isNaN(bytes)) return "PDF";

  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

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
