import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ForumService from "../services/ForumService";
import AuthService from "../services/AuthService";

export default function Forum() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = AuthService.getCurrentUser();
  const currentUserId = Number(currentUser?.userId);
  const participatedConversationsCount = conversations.filter(
    (conversation) => hasUserParticipated(conversation, currentUserId)
  ).length;

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await ForumService.getConversations();
        setConversations(data);
      } catch (requestError) {
        console.error("Error cargando conversaciones:", requestError);
        setError("No se pudieron cargar las conversaciones del foro.");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  return (
    <div className="flex h-screen w-full font-display bg-background-light text-[#0d141b] dark:bg-background-dark dark:text-slate-200">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-[#0d141b] dark:text-white">
                  Foro de Ayuda
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Conversaciones abiertas desde los contenidos de la plataforma.
                </p>
                {!loading && conversations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-lg border border-slate-200 px-3 py-1 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      {conversations.length} en total
                    </span>
                    <span className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
                      {participatedConversationsCount} participas
                    </span>
                  </div>
                )}
              </div>
              <Link
                to="/admin/biblioteca"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
              >
                <span className="material-symbols-outlined text-base">library_books</span>
                Ver contenidos
              </Link>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="border-b border-slate-200 p-6 dark:border-slate-800">
                <h2 className="text-lg font-bold text-[#0d141b] dark:text-white">
                  Conversaciones recientes
                </h2>
              </div>

              {loading ? (
                <div className="p-8 text-sm text-slate-500 dark:text-slate-400">
                  Cargando conversaciones...
                </div>
              ) : error ? (
                <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-500">
                  {error}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">forum</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0d141b] dark:text-white">
                    Aun no hay conversaciones
                  </h3>
                  <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Abre un contenido y publica una pregunta para iniciar el foro.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {conversations.map((conversation) => (
                    <ConversationRow
                      key={conversation.conversation?.id || conversation.id}
                      conversation={conversation}
                      isParticipant={hasUserParticipated(conversation, currentUserId)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

const ConversationRow = ({ conversation, isParticipant }) => {
  const conversationData = conversation.conversation || conversation;
  const content = conversationData.content || {};
  const authorName = getUserName(conversationData.createdBy);
  const dateLabel = formatDate(conversationData.createdAt);
  const categoryName = content.category?.categoryName || "Sin categoria";
  const questionCount = conversation.questionCount ?? 0;

  return (
    <Link
      to="/video"
      state={{
        id: content.id,
        title: content.title,
        category: categoryName,
        description: content.description,
        url: content.urlVideo,
        createdBy: content.createdBy,
      }}
      className={`group flex flex-col gap-3 p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 ${
        isParticipant ? "bg-primary/[0.04] dark:bg-primary/[0.06]" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 text-base font-bold text-[#0d141b] group-hover:text-primary dark:text-white">
              {conversationData.title || "Conversacion sin titulo"}
            </h3>
            {isParticipant && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase text-primary">
                <span className="material-symbols-outlined text-sm">forum</span>
                Participante
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {content.title || "Contenido no disponible"}
          </p>
        </div>
        <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
          {categoryName}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Publicado por {authorName}</span>
        <span aria-hidden="true">-</span>
        <span>{dateLabel}</span>
        <span aria-hidden="true">-</span>
        <span>{questionCount} {questionCount === 1 ? "pregunta" : "preguntas"}</span>
      </div>
    </Link>
  );
};

const hasUserParticipated = (conversation, userId) => {
  if (!userId) return false;

  const participantIds = conversation.participantIds || [];
  return participantIds.some((participantId) => Number(participantId) === userId);
};

const getUserName = (user) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return fullName || user?.email || "Usuario";
};

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
