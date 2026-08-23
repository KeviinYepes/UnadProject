import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Pagination from "../components/Pagination";
import UserService from "../services/UserService";
import VideoService from "../services/VideoService";
import VideoStatsService from "../services/VideoStatsService";

const PAGE_SIZE = 6;

const AdminDashboard = () => {
  const [videos, setVideos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("resumen");
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError("");

      try {
        const [contentData, userData, statsData] = await Promise.all([
          VideoService.getAll(),
          UserService.getAll(),
          VideoStatsService.getAll(),
        ]);

        setVideos(Array.isArray(contentData) ? contentData : []);
        setUsuarios(Array.isArray(userData) ? userData : []);
        setStats(Array.isArray(statsData) ? statsData : []);
      } catch (requestError) {
        console.error("Error cargando dashboard:", requestError);
        setError(
          requestError.response?.data?.error ||
            requestError.response?.data?.message ||
            "No se pudo cargar la informacion del panel."
        );
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const periods = useMemo(() => buildPeriods(stats), [stats]);
  const filteredStats = useMemo(
    () => filterStatsByPeriod(stats, selectedPeriod),
    [stats, selectedPeriod]
  );
  const analytics = useMemo(
    () => buildAnalytics({ videos, users: usuarios, stats: filteredStats, allStats: stats }),
    [videos, usuarios, filteredStats, stats]
  );
  const paginatedVideoRows = useMemo(
    () => paginate(analytics.videoRows, currentPage, PAGE_SIZE),
    [analytics.videoRows, currentPage]
  );

  useEffect(() => {
    setCurrentPage((page) => clampPage(page, analytics.videoRows.length, PAGE_SIZE));
  }, [analytics.videoRows.length]);

  const exportReport = () => {
    const existingFrame = document.getElementById("pdf-report-frame");
    existingFrame?.remove();

    const frame = document.createElement("iframe");
    frame.id = "pdf-report-frame";
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.style.opacity = "0";
    document.body.appendChild(frame);

    const frameDocument = frame.contentWindow?.document;
    if (!frameDocument) return;

    const periodLabel =
      selectedPeriod === "all"
        ? "Todo el historico"
        : periods.find((period) => period.key === selectedPeriod)?.label || selectedPeriod;

    frameDocument.open();
    frameDocument.write(buildPdfReportHtml(analytics, periodLabel));
    frameDocument.close();

    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 1000);
    };
  };

  return (
    <div className="flex h-screen w-full font-display bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                  Panel Administrativo
                </h1>
                <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">
                  Historico y analitica de consumo de contenido.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex flex-col gap-1 text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  Periodo
                  <select
                    value={selectedPeriod}
                    onChange={(event) => {
                      setSelectedPeriod(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="input h-10 min-w-48"
                  >
                    <option value="all">Todo el historico</option>
                    {periods.map((period) => (
                      <option key={period.key} value={period.key}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={exportReport}
                  disabled={analytics.videoRows.length === 0}
                  className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-white shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  Exportar reporte
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon="visibility"
                title="Visualizaciones"
                value={analytics.metrics.totalViews.toLocaleString("es-CO")}
                detail={`${analytics.metrics.uniqueViewers} usuarios unicos`}
              />
              <MetricCard
                icon="schedule"
                title="Tiempo visto"
                value={formatHours(analytics.metrics.watchTimeSeconds)}
                detail={`${analytics.metrics.avgMinutesPerView} min por vista`}
              />
              <MetricCard
                icon="trending_up"
                title="Contenido con uso"
                value={`${analytics.metrics.contentWithViews}/${analytics.metrics.totalContent}`}
                detail={`${analytics.metrics.contentWithoutViews} sin visualizaciones`}
              />
              <MetricCard
                icon="group"
                title="Usuarios activos"
                value={analytics.metrics.activeUsers.toLocaleString("es-CO")}
                detail={`${analytics.metrics.viewerCoverage}% han visto contenido`}
              />
            </div>

            <div className="flex flex-wrap gap-2 border-b border-border-light dark:border-border-dark">
              {[
                ["resumen", "Resumen"],
                ["historico", "Historico"],
                ["usuarios", "Usuarios"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
                    activeTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary-light hover:text-primary dark:text-text-secondary-dark"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="rounded-xl border border-border-light bg-card-light p-10 text-center text-text-secondary-light shadow-sm dark:border-border-dark dark:bg-card-dark dark:text-text-secondary-dark">
                Cargando metricas...
              </div>
            ) : activeTab === "historico" ? (
              <HistoricalView analytics={analytics} />
            ) : activeTab === "usuarios" ? (
              <UsersAnalyticsView analytics={analytics} />
            ) : (
              <SummaryView
                analytics={analytics}
                paginatedVideoRows={paginatedVideoRows}
                currentPage={currentPage}
                onPageChange={(page) =>
                  setCurrentPage(clampPage(page, analytics.videoRows.length, PAGE_SIZE))
                }
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const SummaryView = ({ analytics, paginatedVideoRows, currentPage, onPageChange }) => (
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
    <section className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Tendencia mensual" subtitle="Visualizaciones registradas por mes">
          <TrendChart data={analytics.trendRows} />
        </Panel>
        <Panel title="Categorias con mayor uso" subtitle="Participacion por visualizaciones">
          <HorizontalBarChart
            data={analytics.categoryRows.slice(0, 6)}
            valueKey="views"
            labelKey="category"
            emptyText="Todavia no hay visualizaciones por categoria."
          />
        </Panel>
      </div>

      <Panel title="Rendimiento por contenido" subtitle="Ranking accionable para priorizar mejoras">
        <ContentTable rows={paginatedVideoRows} />
        <Pagination
          page={currentPage}
          totalItems={analytics.videoRows.length}
          pageSize={PAGE_SIZE}
          onPageChange={onPageChange}
        />
      </Panel>
    </section>

    <aside className="flex flex-col gap-6">
      <Panel title="Lecturas rapidas" subtitle="Hallazgos utiles del periodo">
        <div className="flex flex-col gap-3">
          {analytics.insights.map((insight) => (
            <InsightCard key={insight.title} insight={insight} />
          ))}
        </div>
      </Panel>

      <Panel title="Top usuarios" subtitle="Personas con mayor actividad">
        <div className="flex flex-col gap-3">
          {analytics.userRows.slice(0, 5).length === 0 ? (
            <EmptyState text="No hay actividad de usuarios en este periodo." />
          ) : (
            analytics.userRows.slice(0, 5).map((user, index) => (
              <RankItem
                key={user.id}
                index={index}
                title={user.name}
                detail={`${user.views} vistas | ${formatMinutes(user.watchTimeSeconds)}`}
              />
            ))
          )}
        </div>
      </Panel>
    </aside>
  </div>
);

const HistoricalView = ({ analytics }) => (
  <div className="grid gap-6 lg:grid-cols-2">
    <Panel title="Historico de visualizaciones" subtitle="Evolucion mensual de vistas y usuarios">
      <TrendChart data={analytics.trendRows} showViewers />
    </Panel>

    <Panel title="Tiempo de consumo" subtitle="Horas vistas por mes">
      <VerticalBarChart
        data={analytics.trendRows}
        valueKey="watchTimeSeconds"
        labelFormatter={(row) => row.shortLabel}
        valueFormatter={(value) => formatHours(value)}
        emptyText="No hay tiempo de reproduccion registrado."
      />
    </Panel>

    <Panel title="Ranking historico por categoria" subtitle="Categorias que concentran el consumo">
      <HorizontalBarChart
        data={analytics.categoryRows}
        valueKey="watchTimeSeconds"
        labelKey="category"
        valueFormatter={formatHours}
        emptyText="No hay consumo por categoria."
      />
    </Panel>

    <Panel title="Contenidos por estado" subtitle="Oportunidades de mantenimiento">
      <StatusBreakdown metrics={analytics.metrics} />
    </Panel>
  </div>
);

const UsersAnalyticsView = ({ analytics }) => (
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
    <Panel title="Actividad por usuario" subtitle="Quien consume contenido y cuanto tiempo invierte">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-light text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:bg-surface-dark dark:text-text-secondary-dark">
            <tr>
              <th className="px-5 py-3">Usuario</th>
              <th className="px-5 py-3">Rol</th>
              <th className="px-5 py-3 text-right">Vistas</th>
              <th className="px-5 py-3 text-right">Contenidos</th>
              <th className="px-5 py-3 text-right">Tiempo</th>
              <th className="px-5 py-3">Ultima actividad</th>
            </tr>
          </thead>
          <tbody>
            {analytics.userRows.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-text-secondary-light dark:text-text-secondary-dark">
                  No hay usuarios con actividad en este periodo.
                </td>
              </tr>
            ) : (
              analytics.userRows.map((row) => (
                <tr key={row.id} className="border-b border-border-light last:border-b-0 dark:border-border-dark">
                  <td className="px-5 py-4 font-semibold">{row.name}</td>
                  <td className="px-5 py-4">{row.role}</td>
                  <td className="px-5 py-4 text-right font-bold">{row.views}</td>
                  <td className="px-5 py-4 text-right">{row.contentCount}</td>
                  <td className="px-5 py-4 text-right">{formatMinutes(row.watchTimeSeconds)}</td>
                  <td className="px-5 py-4">{formatDate(row.lastViewAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>

    <aside className="flex flex-col gap-6">
      <Panel title="Cobertura de usuarios" subtitle="Relacion entre usuarios y consumo">
        <CoverageMeter value={analytics.metrics.viewerCoverage} />
      </Panel>
      <Panel title="Usuarios sin actividad" subtitle="Candidatos para acompanamiento">
        <div className="flex flex-col gap-3">
          {analytics.inactiveUsers.slice(0, 8).length === 0 ? (
            <EmptyState text="Todos los usuarios han tenido actividad registrada." />
          ) : (
            analytics.inactiveUsers.slice(0, 8).map((user) => (
              <div key={user.id} className="rounded-lg border border-border-light p-3 dark:border-border-dark">
                <p className="font-semibold">{getUserName(user)}</p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {normalizeRole(user.role?.roleName)}
                </p>
              </div>
            ))
          )}
        </div>
      </Panel>
    </aside>
  </div>
);

const MetricCard = ({ icon, title, value, detail }) => (
  <div className="rounded-xl border border-border-light bg-card-light p-5 shadow-sm dark:border-border-dark dark:bg-card-dark">
    <div className="mb-4 flex items-center justify-between">
      <div className="rounded-lg bg-primary/10 p-2 text-primary">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{title}</p>
    <p className="mt-1 text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
      {value}
    </p>
    <p className="mt-2 text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
      {detail}
    </p>
  </div>
);

const Panel = ({ title, subtitle, children }) => (
  <section className="overflow-hidden rounded-xl border border-border-light bg-card-light shadow-sm dark:border-border-dark dark:bg-card-dark">
    <div className="border-b border-border-light p-5 dark:border-border-dark">
      <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">{subtitle}</p>
      )}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const ContentTable = ({ rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead className="bg-surface-light text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:bg-surface-dark dark:text-text-secondary-dark">
        <tr>
          <th className="px-5 py-3">Contenido</th>
          <th className="px-5 py-3">Categoria</th>
          <th className="px-5 py-3">Tipo</th>
          <th className="px-5 py-3 text-right">Vistas</th>
          <th className="px-5 py-3 text-right">Usuarios</th>
          <th className="px-5 py-3 text-right">Tiempo</th>
          <th className="px-5 py-3">Ultima actividad</th>
          <th className="px-5 py-3">Estado</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan="8" className="px-5 py-10 text-center text-text-secondary-light dark:text-text-secondary-dark">
              No hay contenido registrado para mostrar estadisticas.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border-light transition last:border-b-0 hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark"
            >
              <td className="min-w-56 px-5 py-4 font-semibold">{row.title}</td>
              <td className="px-5 py-4">{row.category}</td>
              <td className="px-5 py-4">{row.type}</td>
              <td className="px-5 py-4 text-right font-bold">{row.views.toLocaleString("es-CO")}</td>
              <td className="px-5 py-4 text-right">{row.uniqueUsers}</td>
              <td className="px-5 py-4 text-right">{formatMinutes(row.watchTimeSeconds)}</td>
              <td className="px-5 py-4">{formatDate(row.lastViewAt)}</td>
              <td className="px-5 py-4">
                <StatusPill status={row.status} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const StatusPill = ({ status }) => {
  const styles = {
    Alto: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
    Medio: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    Bajo: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    "Sin uso": "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status] || styles.Bajo}`}>
      {status}
    </span>
  );
};

const TrendChart = ({ data, showViewers = false }) => {
  const maxViews = Math.max(...data.map((row) => row.views), 1);

  if (data.length === 0) {
    return <EmptyState text="No hay datos historicos para graficar." />;
  }

  return (
    <div className="flex h-72 items-end gap-3 overflow-x-auto pb-2">
      {data.map((row) => {
        const height = Math.max(8, (row.views / maxViews) * 210);
        const viewerHeight = Math.max(6, (row.viewers / maxViews) * 210);

        return (
          <div key={row.key} className="flex min-w-16 flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-56 items-end gap-1">
              {showViewers && (
                <div
                  className="w-4 rounded-t bg-slate-300 dark:bg-slate-600"
                  style={{ height: `${viewerHeight}px` }}
                  title={`${row.viewers} usuarios`}
                />
              )}
              <div
                className="w-6 rounded-t bg-primary"
                style={{ height: `${height}px` }}
                title={`${row.views} visualizaciones`}
              />
            </div>
            <p className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark">
              {row.shortLabel}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const HorizontalBarChart = ({
  data,
  labelKey,
  valueKey,
  valueFormatter = (value) => Number(value || 0).toLocaleString("es-CO"),
  emptyText,
}) => {
  const max = Math.max(...data.map((row) => Number(row[valueKey] || 0)), 1);

  if (data.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((row) => {
        const value = Number(row[valueKey] || 0);
        const width = Math.max(4, (value / max) * 100);

        return (
          <div key={row[labelKey]} className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-semibold">{row[labelKey]}</span>
              <span className="shrink-0 font-bold text-primary">{valueFormatter(value)}</span>
            </div>
            <div className="h-3 rounded-full bg-surface-light dark:bg-surface-dark">
              <div className="h-3 rounded-full bg-primary" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const VerticalBarChart = ({
  data,
  valueKey,
  labelFormatter,
  valueFormatter,
  emptyText,
}) => {
  const max = Math.max(...data.map((row) => Number(row[valueKey] || 0)), 1);

  if (data.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="flex h-72 items-end gap-3 overflow-x-auto pb-2">
      {data.map((row) => {
        const value = Number(row[valueKey] || 0);
        const height = Math.max(8, (value / max) * 210);

        return (
          <div key={row.key} className="flex min-w-16 flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-8 rounded-t bg-primary"
              style={{ height: `${height}px` }}
              title={valueFormatter(value)}
            />
            <p className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark">
              {labelFormatter(row)}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const StatusBreakdown = ({ metrics }) => {
  const items = [
    ["Alto", metrics.highUseContent],
    ["Medio", metrics.mediumUseContent],
    ["Bajo", metrics.lowUseContent],
    ["Sin uso", metrics.contentWithoutViews],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([status, value]) => (
        <div key={status} className="rounded-lg border border-border-light p-4 dark:border-border-dark">
          <StatusPill status={status} />
          <p className="mt-3 text-3xl font-bold">{value}</p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">contenidos</p>
        </div>
      ))}
    </div>
  );
};

const CoverageMeter = ({ value }) => (
  <div>
    <div className="flex items-end justify-between">
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Usuarios con actividad</p>
      <p className="text-3xl font-bold text-primary">{value}%</p>
    </div>
    <div className="mt-4 h-4 rounded-full bg-surface-light dark:bg-surface-dark">
      <div className="h-4 rounded-full bg-primary" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

const InsightCard = ({ insight }) => (
  <div className="rounded-lg border border-border-light p-4 dark:border-border-dark">
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined text-primary">{insight.icon}</span>
      <div>
        <p className="font-bold">{insight.title}</p>
        <p className="mt-1 text-sm leading-6 text-text-secondary-light dark:text-text-secondary-dark">
          {insight.text}
        </p>
      </div>
    </div>
  </div>
);

const RankItem = ({ index, title, detail }) => (
  <div className="flex items-center gap-3 rounded-lg border border-border-light p-3 dark:border-border-dark">
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
      {index + 1}
    </div>
    <div className="min-w-0">
      <p className="truncate font-semibold">{title}</p>
      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{detail}</p>
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="rounded-lg border border-dashed border-border-light p-6 text-center text-sm text-text-secondary-light dark:border-border-dark dark:text-text-secondary-dark">
    {text}
  </div>
);

const buildAnalytics = ({ videos, users, stats, allStats }) => {
  const totalViews = stats.reduce((acc, stat) => acc + Number(stat.totalViews || 0), 0);
  const watchTimeSeconds = stats.reduce((acc, stat) => acc + Number(stat.watchTimeSeconds || 0), 0);
  const viewedContentIds = new Set(stats.filter(hasActivity).map((stat) => Number(stat.content?.id)));
  const uniqueViewerIds = new Set(stats.filter(hasActivity).map((stat) => Number(stat.user?.id)));
  const activeUsers = users.filter((user) => user.status === true).length;
  const totalUsers = users.length;

  const videoRows = videos
    .map((video) => buildVideoRow(video, stats))
    .sort((a, b) => b.views - a.views || b.watchTimeSeconds - a.watchTimeSeconds || a.title.localeCompare(b.title));

  const userRows = buildUserRows(stats);
  const categoryRows = buildCategoryRows(stats);
  const trendRows = buildTrendRows(allStats);
  const inactiveUsers = users.filter((user) => !uniqueViewerIds.has(Number(user.id)));
  const contentWithoutViews = videos.length - viewedContentIds.size;

  const metrics = {
    totalViews,
    watchTimeSeconds,
    uniqueViewers: uniqueViewerIds.size,
    activeUsers,
    totalUsers,
    totalContent: videos.length,
    contentWithViews: viewedContentIds.size,
    contentWithoutViews,
    avgMinutesPerView: totalViews > 0 ? (watchTimeSeconds / 60 / totalViews).toFixed(1) : "0.0",
    viewerCoverage: totalUsers > 0 ? Math.round((uniqueViewerIds.size / totalUsers) * 100) : 0,
    highUseContent: videoRows.filter((row) => row.status === "Alto").length,
    mediumUseContent: videoRows.filter((row) => row.status === "Medio").length,
    lowUseContent: videoRows.filter((row) => row.status === "Bajo").length,
  };

  return {
    metrics,
    videoRows,
    userRows,
    categoryRows,
    trendRows,
    inactiveUsers,
    insights: buildInsights({ videoRows, categoryRows, userRows, metrics }),
  };
};

const buildVideoRow = (video, stats) => {
  const videoStats = stats.filter((stat) => Number(stat.content?.id) === Number(video.id));
  const views = videoStats.reduce((acc, stat) => acc + Number(stat.totalViews || 0), 0);
  const watchTimeSeconds = videoStats.reduce((acc, stat) => acc + Number(stat.watchTimeSeconds || 0), 0);
  const uniqueUsers = new Set(videoStats.filter(hasActivity).map((stat) => Number(stat.user?.id))).size;
  const latestStat = videoStats.reduce(getLatestStat, null);
  const hasVideo = Boolean(String(video.urlVideo || "").trim());
  const hasMaterials = Array.isArray(video.materials) && video.materials.length > 0;

  return {
    id: video.id,
    title: video.title || "Sin titulo",
    category: video.category?.categoryName || "Sin categoria",
    views,
    uniqueUsers,
    watchTimeSeconds,
    avgMinutesPerView: views > 0 ? watchTimeSeconds / 60 / views : 0,
    lastUser: latestStat?.user ? getUserName(latestStat.user) : "Sin visualizaciones",
    lastViewAt: latestStat?.lastViewAt,
    type: hasVideo ? (hasMaterials ? "Video + PDF" : "Video") : "Solo PDF",
    status: getUsageStatus(views),
  };
};

const buildUserRows = (stats) => {
  const rows = new Map();

  stats.filter(hasActivity).forEach((stat) => {
    const userId = Number(stat.user?.id);
    if (!userId) return;

    const current = rows.get(userId) || {
      id: userId,
      name: getUserName(stat.user),
      role: normalizeRole(stat.user?.role?.roleName),
      views: 0,
      watchTimeSeconds: 0,
      contentIds: new Set(),
      lastViewAt: null,
    };

    current.views += Number(stat.totalViews || 0);
    current.watchTimeSeconds += Number(stat.watchTimeSeconds || 0);
    if (stat.content?.id) current.contentIds.add(Number(stat.content.id));
    current.lastViewAt = maxDate(current.lastViewAt, stat.lastViewAt);
    rows.set(userId, current);
  });

  return Array.from(rows.values())
    .map((row) => ({ ...row, contentCount: row.contentIds.size }))
    .sort((a, b) => b.views - a.views || b.watchTimeSeconds - a.watchTimeSeconds);
};

const buildCategoryRows = (stats) => {
  const rows = new Map();

  stats.filter(hasActivity).forEach((stat) => {
    const category = stat.content?.category?.categoryName || "Sin categoria";
    const current = rows.get(category) || {
      category,
      views: 0,
      watchTimeSeconds: 0,
      userIds: new Set(),
      contentIds: new Set(),
    };

    current.views += Number(stat.totalViews || 0);
    current.watchTimeSeconds += Number(stat.watchTimeSeconds || 0);
    if (stat.user?.id) current.userIds.add(Number(stat.user.id));
    if (stat.content?.id) current.contentIds.add(Number(stat.content.id));
    rows.set(category, current);
  });

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      users: row.userIds.size,
      contents: row.contentIds.size,
    }))
    .sort((a, b) => b.views - a.views || b.watchTimeSeconds - a.watchTimeSeconds);
};

const buildTrendRows = (stats) => {
  const rows = new Map();

  stats.filter(hasActivity).forEach((stat) => {
    const key = getPeriodKey(stat);
    const current = rows.get(key) || {
      key,
      date: getPeriodDate(stat),
      label: formatPeriod(stat),
      shortLabel: formatShortPeriod(stat),
      views: 0,
      watchTimeSeconds: 0,
      userIds: new Set(),
    };

    current.views += Number(stat.totalViews || 0);
    current.watchTimeSeconds += Number(stat.watchTimeSeconds || 0);
    if (stat.user?.id) current.userIds.add(Number(stat.user.id));
    rows.set(key, current);
  });

  return Array.from(rows.values())
    .map((row) => ({ ...row, viewers: row.userIds.size }))
    .sort((a, b) => a.date - b.date);
};

const buildPeriods = (stats) =>
  buildTrendRows(stats)
    .map((row) => ({ key: row.key, label: row.label }))
    .sort((a, b) => b.key.localeCompare(a.key));

const buildInsights = ({ videoRows, categoryRows, userRows, metrics }) => {
  const topVideo = videoRows[0];
  const topCategory = categoryRows[0];
  const lowEngagement = videoRows
    .filter((row) => row.views > 0)
    .sort((a, b) => a.avgMinutesPerView - b.avgMinutesPerView)[0];
  const topUser = userRows[0];

  return [
    {
      icon: "workspace_premium",
      title: "Contenido mas consultado",
      text: topVideo
        ? `${topVideo.title} concentra ${topVideo.views} visualizaciones y ${formatMinutes(topVideo.watchTimeSeconds)}.`
        : "Aun no hay visualizaciones registradas.",
    },
    {
      icon: "category",
      title: "Categoria lider",
      text: topCategory
        ? `${topCategory.category} suma ${topCategory.views} visualizaciones de ${topCategory.users} usuarios.`
        : "Todavia no existe una categoria con consumo registrado.",
    },
    {
      icon: "person_search",
      title: "Usuario mas activo",
      text: topUser
        ? `${topUser.name} ha visto ${topUser.views} veces en ${topUser.contentCount} contenidos.`
        : "No hay usuarios con actividad en el periodo.",
    },
    {
      icon: "priority_high",
      title: "Oportunidad de mejora",
      text:
        metrics.contentWithoutViews > 0
          ? `${metrics.contentWithoutViews} contenidos no tienen visualizaciones. Conviene revisar titulos, categorias o difusion.`
          : lowEngagement
            ? `${lowEngagement.title} tiene el menor tiempo promedio por vista: ${lowEngagement.avgMinutesPerView.toFixed(1)} min.`
            : "Todos los contenidos publicados tienen actividad registrada.",
    },
  ];
};

const filterStatsByPeriod = (stats, selectedPeriod) => {
  if (selectedPeriod === "all") return stats;
  return stats.filter((stat) => getPeriodKey(stat) === selectedPeriod);
};

const getUsageStatus = (views) => {
  if (views <= 0) return "Sin uso";
  if (views >= 20) return "Alto";
  if (views >= 5) return "Medio";
  return "Bajo";
};

const hasActivity = (stat) =>
  Number(stat.totalViews || 0) > 0 || Number(stat.watchTimeSeconds || 0) > 0;

const getLatestStat = (latest, stat) => {
  if (!latest) return stat;
  return new Date(stat.lastViewAt || 0) > new Date(latest.lastViewAt || 0) ? stat : latest;
};

const maxDate = (current, candidate) => {
  if (!candidate) return current;
  if (!current) return candidate;
  return new Date(candidate) > new Date(current) ? candidate : current;
};

const getPeriodKey = (stat) => {
  const year = Number(stat.periodYear || new Date(stat.lastViewAt || Date.now()).getFullYear());
  const month = Number(stat.periodMonth || new Date(stat.lastViewAt || Date.now()).getMonth() + 1);
  return `${year}-${String(month).padStart(2, "0")}`;
};

const getPeriodDate = (stat) => {
  const [year, month] = getPeriodKey(stat).split("-").map(Number);
  return new Date(year, month - 1, 1);
};

const getUserName = (user) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return fullName || user?.email || "Usuario";
};

const normalizeRole = (role) =>
  String(role || "USER")
    .replace(/^ROLE_/i, "")
    .toUpperCase();

const formatPeriod = (stat) =>
  new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(getPeriodDate(stat));

const formatShortPeriod = (stat) =>
  new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit" }).format(getPeriodDate(stat));

const formatDate = (value) => {
  if (!value) return "Sin actividad";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin actividad";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatMinutes = (seconds) => {
  const minutes = Math.round(Number(seconds || 0) / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} h ${remaining} min` : `${hours} h`;
};

const formatHours = (seconds) => {
  const hours = Number(seconds || 0) / 3600;
  if (hours < 1) return `${Math.round(Number(seconds || 0) / 60)} min`;
  return `${hours.toFixed(1)} h`;
};

const paginate = (items, page, pageSize) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const clampPage = (page, totalItems, pageSize) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(1, page), totalPages);
};

const buildPdfReportHtml = (analytics, periodLabel) => {
  const generatedAt = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const { metrics, videoRows, categoryRows, trendRows, insights, userRows } = analytics;

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Reporte historico de metricas</title>
        <style>
          @page { margin: 18mm 14mm; }
          * { box-sizing: border-box; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          body { color: #101922; font-family: Arial, sans-serif; margin: 0; }
          h1 { font-size: 22px; margin: 0 0 6px; }
          h2 { font-size: 14px; margin: 0 0 2px; }
          h3 { font-size: 10px; color: #5f6f82; font-weight: 400; margin: 0 0 10px; }
          .subtitle { color: #5f6f82; font-size: 11px; margin-bottom: 18px; }
          .metrics { display: grid; gap: 10px; grid-template-columns: repeat(4, 1fr); margin-bottom: 22px; }
          .metric { border: 1px solid #d9e2ec; border-radius: 8px; padding: 12px; }
          .metric-label { color: #5f6f82; font-size: 9px; margin-bottom: 6px; }
          .metric-value { font-size: 17px; font-weight: 700; }
          .metric-detail { color: #5f6f82; font-size: 9px; margin-top: 4px; }
          .panel { border: 1px solid #d9e2ec; border-radius: 8px; padding: 14px; margin-bottom: 18px; break-inside: avoid; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          table { border-collapse: collapse; font-size: 9.5px; width: 100%; }
          th { background: #eef5ff; color: #2f5f9f; font-size: 8.5px; letter-spacing: .04em; text-align: left; text-transform: uppercase; }
          th, td { border-bottom: 1px solid #e5ebf1; padding: 7px 6px; vertical-align: top; }
          .right { text-align: right; }
          .pill { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 8.5px; font-weight: 700; }
          .pill-alto { background: #d1fae5; color: #047857; }
          .pill-medio { background: #dbeafe; color: #1d4ed8; }
          .pill-bajo { background: #fef3c7; color: #b45309; }
          .pill-sinuso { background: #fee2e2; color: #b91c1c; }
          .trend { display: flex; gap: 6px; height: 110px; }
          .trend-col { flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px; }
          .trend-bar { width: 60%; min-height: 2px; background: #2563eb; border-radius: 3px 3px 0 0; }
          .trend-label { font-size: 8px; color: #5f6f82; }
          .hbar-row { margin-bottom: 10px; }
          .hbar-head { display: flex; justify-content: space-between; font-size: 9.5px; margin-bottom: 3px; }
          .hbar-track { height: 7px; background: #eef2f6; border-radius: 999px; }
          .hbar-fill { height: 7px; background: #2563eb; border-radius: 999px; }
          .insight { border: 1px solid #e5ebf1; border-radius: 6px; padding: 9px 10px; margin-bottom: 8px; }
          .insight-title { font-size: 10px; font-weight: 700; margin-bottom: 2px; }
          .insight-text { font-size: 9.5px; color: #445064; line-height: 1.4; }
          .rank { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f0f3f7; font-size: 9.5px; }
          .rank:last-child { border-bottom: none; }
          .rank-index { flex-shrink: 0; width: 18px; height: 18px; border-radius: 6px; background: #eef5ff; color: #2f5f9f; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
          .empty { color: #7c879e; font-size: 9.5px; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>Reporte historico de metricas</h1>
        <div class="subtitle">Periodo: ${escapeHtml(periodLabel)} | Generado el ${escapeHtml(generatedAt)}</div>

        <section class="metrics">
          <div class="metric">
            <div class="metric-label">Visualizaciones</div>
            <div class="metric-value">${metrics.totalViews.toLocaleString("es-CO")}</div>
            <div class="metric-detail">${metrics.uniqueViewers} usuarios unicos</div>
          </div>
          <div class="metric">
            <div class="metric-label">Tiempo visto</div>
            <div class="metric-value">${escapeHtml(formatHours(metrics.watchTimeSeconds))}</div>
            <div class="metric-detail">${metrics.avgMinutesPerView} min por vista</div>
          </div>
          <div class="metric">
            <div class="metric-label">Contenido con uso</div>
            <div class="metric-value">${metrics.contentWithViews}/${metrics.totalContent}</div>
            <div class="metric-detail">${metrics.contentWithoutViews} sin visualizaciones</div>
          </div>
          <div class="metric">
            <div class="metric-label">Usuarios activos</div>
            <div class="metric-value">${metrics.activeUsers.toLocaleString("es-CO")}</div>
            <div class="metric-detail">${metrics.viewerCoverage}% han visto contenido</div>
          </div>
        </section>

        <div class="two-col">
          <div class="panel">
            <h2>Tendencia mensual</h2>
            <h3>Visualizaciones registradas por mes</h3>
            ${buildTrendChartHtml(trendRows)}
          </div>
          <div class="panel">
            <h2>Categorias con mayor uso</h2>
            <h3>Participacion por visualizaciones</h3>
            ${buildCategoryBarsHtml(categoryRows.slice(0, 6))}
          </div>
        </div>

        <div class="panel">
          <h2>Rendimiento por contenido</h2>
          <h3>Ranking accionable para priorizar mejoras</h3>
          ${buildContentTableHtml(videoRows)}
        </div>

        <div class="two-col">
          <div class="panel">
            <h2>Lecturas rapidas</h2>
            <h3>Hallazgos utiles del periodo</h3>
            ${buildInsightsHtml(insights)}
          </div>
          <div class="panel">
            <h2>Top usuarios</h2>
            <h3>Personas con mayor actividad</h3>
            ${buildTopUsersHtml(userRows.slice(0, 10))}
          </div>
        </div>
      </body>
    </html>
  `;
};

const buildTrendChartHtml = (trendRows) => {
  if (trendRows.length === 0) {
    return `<p class="empty">No hay datos historicos para graficar.</p>`;
  }

  const max = Math.max(...trendRows.map((row) => row.views), 1);

  return `
    <div class="trend">
      ${trendRows
        .map((row) => {
          const heightPct = Math.max(4, Math.round((row.views / max) * 100));
          return `
            <div class="trend-col">
              <div style="font-size:8px;color:#2563eb;font-weight:700;">${row.views}</div>
              <div class="trend-bar" style="height:${heightPct}%;"></div>
              <div class="trend-label">${escapeHtml(row.shortLabel)}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
};

const buildCategoryBarsHtml = (categoryRows) => {
  if (categoryRows.length === 0) {
    return `<p class="empty">Todavia no hay visualizaciones por categoria.</p>`;
  }

  const max = Math.max(...categoryRows.map((row) => row.views), 1);

  return categoryRows
    .map((row) => {
      const widthPct = Math.max(4, Math.round((row.views / max) * 100));
      return `
        <div class="hbar-row">
          <div class="hbar-head">
            <span>${escapeHtml(row.category)}</span>
            <strong>${row.views.toLocaleString("es-CO")}</strong>
          </div>
          <div class="hbar-track"><div class="hbar-fill" style="width:${widthPct}%;"></div></div>
        </div>
      `;
    })
    .join("");
};

const buildContentTableHtml = (videoRows) => {
  if (videoRows.length === 0) {
    return `<p class="empty">No hay contenido registrado para mostrar estadisticas.</p>`;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Contenido</th><th>Categoria</th><th>Tipo</th><th class="right">Vistas</th>
          <th class="right">Usuarios</th><th class="right">Tiempo</th><th>Ultima actividad</th><th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${videoRows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.title)}</td>
                <td>${escapeHtml(row.category)}</td>
                <td>${escapeHtml(row.type)}</td>
                <td class="right">${row.views.toLocaleString("es-CO")}</td>
                <td class="right">${row.uniqueUsers}</td>
                <td class="right">${escapeHtml(formatMinutes(row.watchTimeSeconds))}</td>
                <td>${escapeHtml(formatDate(row.lastViewAt))}</td>
                <td>${buildStatusPillHtml(row.status)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
};

const buildStatusPillHtml = (status) => {
  const classByStatus = {
    Alto: "pill-alto",
    Medio: "pill-medio",
    Bajo: "pill-bajo",
    "Sin uso": "pill-sinuso",
  };

  return `<span class="pill ${classByStatus[status] || "pill-bajo"}">${escapeHtml(status)}</span>`;
};

const buildInsightsHtml = (insights) => {
  if (insights.length === 0) {
    return `<p class="empty">No hay hallazgos para este periodo.</p>`;
  }

  return insights
    .map(
      (insight) => `
        <div class="insight">
          <div class="insight-title">${escapeHtml(insight.title)}</div>
          <div class="insight-text">${escapeHtml(insight.text)}</div>
        </div>
      `
    )
    .join("");
};

const buildTopUsersHtml = (userRows) => {
  if (userRows.length === 0) {
    return `<p class="empty">No hay actividad de usuarios en este periodo.</p>`;
  }

  return userRows
    .map(
      (user, index) => `
        <div class="rank">
          <div class="rank-index">${index + 1}</div>
          <div style="min-width:0;flex:1;">
            <div style="font-weight:700;">${escapeHtml(user.name)}</div>
            <div style="color:#5f6f82;font-size:8.5px;">${user.views} vistas | ${escapeHtml(formatMinutes(user.watchTimeSeconds))}</div>
          </div>
        </div>
      `
    )
    .join("");
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default AdminDashboard;
