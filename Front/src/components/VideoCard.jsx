import ContentThumbnail from './ContentThumbnail';

export default function VideoCard({ title, category, type, url, thumbnailUrl, duration }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card-light p-3 transition-shadow hover:shadow-lg dark:bg-card-dark dark:hover:shadow-primary/10">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <ContentThumbnail type={type} url={url} thumbnailUrl={thumbnailUrl} title={title} />
      </div>
      <div>
        <p className="font-semibold leading-normal text-text-light-primary dark:text-text-dark-primary">
          {title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <TypeBadge type={type} />
          <p className="text-sm font-normal leading-normal text-text-light-secondary dark:text-text-dark-secondary">
            {category}{duration ? ` | ${duration}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const t = (type || 'VIDEO').toUpperCase();
  const map = {
    PDF: { label: 'PDF', cls: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' },
    IMAGE: { label: 'Imagen', cls: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400' },
    EXCEL: { label: 'Excel', cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' },
    WORD: { label: 'Word', cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
    VIDEO: { label: 'Video', cls: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400' },
  };
  const { label, cls } = map[t] || map.VIDEO;
  return <span className={`rounded px-2 py-0.5 text-xs font-bold ${cls}`}>{label}</span>;
}
