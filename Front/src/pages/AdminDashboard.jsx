import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import VideoService from '../services/VideoService';
import UserService from '../services/UserService';
import RoleService from '../services/RoleService';

export default function AdminDashboard() {
  const [contents, setContents] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [vids, usrs, rls] = await Promise.all([
          VideoService.getAll(),
          UserService.getAll(),
          RoleService.getAll(),
        ]);
        setContents(Array.isArray(vids) ? vids : []);
        setUsers(Array.isArray(usrs) ? usrs : []);
        setRoles(Array.isArray(rls) ? rls : []);
      } catch (e) {
        console.error('Error cargando estadísticas:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const normType = (t) => (t || 'VIDEO').toUpperCase();
  const videoCount = contents.filter((c) => normType(c.type) === 'VIDEO').length;
  const pdfCount = contents.filter((c) => normType(c.type) === 'PDF').length;
  const imageCount = contents.filter((c) => normType(c.type) === 'IMAGE').length;

  const categoryMap = {};
  contents.forEach((c) => {
    const key = c.category?.trim() || 'Sin categoría';
    categoryMap[key] = (categoryMap[key] || 0) + 1;
  });
  const categories = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const roleMap = {};
  users.forEach((u) => {
    const key = u.role?.roleName || 'Sin rol';
    roleMap[key] = (roleMap[key] || 0) + 1;
  });
  const rolesBreakdown = Object.entries(roleMap).map(([name, count]) => ({ name, count }));

  const recent = [...contents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div className="flex h-screen w-full font-display bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold">Panel Administrativo</h1>
              <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">
                Estadísticas generales de la plataforma.
              </p>
            </div>

            {loading ? (
              <p className="text-text-secondary-light dark:text-text-secondary-dark">Cargando estadísticas...</p>
            ) : (
              <>
                {/* Tarjetas de métricas */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    icon="inventory_2"
                    titulo="Contenidos"
                    valor={contents.length}
                    color="bg-primary/10 text-primary"
                  />
                  <MetricCard icon="play_circle" titulo="Videos" valor={videoCount} color="bg-violet-100 text-violet-600" />
                  <MetricCard icon="picture_as_pdf" titulo="PDFs" valor={pdfCount} color="bg-rose-100 text-rose-600" />
                  <MetricCard icon="image" titulo="Imágenes" valor={imageCount} color="bg-sky-100 text-sky-600" />
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                  {/* Columna izquierda */}
                  <div className="space-y-8 lg:col-span-2">
                    <Card title="Contenido por categoría">
                      {categories.length === 0 ? (
                        <Empty />
                      ) : (
                        <BarList items={categories} max={categories[0].count} />
                      )}
                    </Card>

                    <Card title="Contenidos recientes">
                      {recent.length === 0 ? (
                        <Empty />
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                              <tr>
                                <th className="px-4 py-2">Título</th>
                                <th className="px-4 py-2">Tipo</th>
                                <th className="px-4 py-2">Categoría</th>
                                <th className="px-4 py-2">Fecha</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recent.map((c) => (
                                <tr key={c.id} className="border-t border-border-light dark:border-border-dark">
                                  <td className="px-4 py-3 font-semibold">{c.title}</td>
                                  <td className="px-4 py-3">
                                    <TypeBadge type={c.type} />
                                  </td>
                                  <td className="px-4 py-3">{c.category || '—'}</td>
                                  <td className="px-4 py-3">
                                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Columna derecha */}
                  <div className="space-y-8">
                    <Card title="Distribución por tipo">
                      <TypeBreakdown video={videoCount} pdf={pdfCount} image={imageCount} total={contents.length} />
                    </Card>

                    <Card title="Usuarios por rol">
                      {rolesBreakdown.length === 0 ? (
                        <Empty />
                      ) : (
                        <BarList items={rolesBreakdown} max={Math.max(...rolesBreakdown.map((r) => r.count), 1)} />
                      )}
                    </Card>

                    <Card title="Resumen">
                      <SummaryRow label="Usuarios registrados" value={users.length} />
                      <SummaryRow label="Roles" value={roles.length} />
                      <SummaryRow label="Categorías" value={categories.length} />
                    </Card>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ===== Componentes auxiliares ===== */

function MetricCard({ icon, titulo, valor, color }) {
  return (
    <div className="card p-6">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{titulo}</p>
      <p className="mt-1 text-3xl font-bold">{valor}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border-light p-5 dark:border-border-dark">
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function BarList({ items, max }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const pct = max > 0 ? Math.round((item.count / max) * 100) : 0;
        return (
          <li key={item.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="font-bold">{item.count}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TypeBreakdown({ video, pdf, image, total }) {
  const rows = [
    { label: 'Videos', value: video, color: 'bg-violet-500', icon: 'play_circle' },
    { label: 'PDFs', value: pdf, color: 'bg-rose-500', icon: 'picture_as_pdf' },
    { label: 'Imágenes', value: image, color: 'bg-sky-500', icon: 'image' },
  ];
  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        const pct = total > 0 ? Math.round((r.value / total) * 100) : 0;
        return (
          <li key={r.label} className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-xl ${r.color.replace('bg-', 'text-')}`}>{r.icon}</span>
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{r.label}</span>
                <span className="font-bold">{r.value}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
                <div className={`h-full rounded-full ${r.color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border-light py-3 last:border-0 dark:border-border-dark">
      <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function TypeBadge({ type }) {
  const t = (type || 'VIDEO').toUpperCase();
  const label = t === 'PDF' ? 'PDF' : t === 'IMAGE' ? 'Imagen' : 'Video';
  const cls =
    t === 'PDF'
      ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
      : t === 'IMAGE'
        ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400'
        : 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400';
  return <span className={`rounded px-2 py-0.5 text-xs font-bold ${cls}`}>{label}</span>;
}

function Empty() {
  return <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Sin datos.</p>;
}
