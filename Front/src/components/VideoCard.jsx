export default function VideoCard({ title, category, duration, imageUrl, isMaterialOnly = false }) {
  const fallbackImage =
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=500&auto=format&fit=crop";

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card-light p-3 transition-shadow hover:shadow-lg dark:bg-card-dark dark:hover:shadow-primary/10">
      <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-surface-light dark:bg-surface-dark">
        <img
          src={imageUrl || fallbackImage}
          alt={title}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm">
            <span
              className="material-symbols-outlined text-3xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isMaterialOnly ? "picture_as_pdf" : "play_arrow"}
            </span>
          </div>
        </div>
      </div>
      <div>
        <p className="font-semibold leading-normal text-text-light-primary dark:text-text-dark-primary">
          {title}
        </p>
        <p className="text-sm font-normal leading-normal text-text-light-secondary dark:text-text-dark-secondary">
          {category}{duration ? ` | ${duration}` : ""}
        </p>
      </div>
    </div>
  );
}
