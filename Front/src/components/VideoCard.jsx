import { getPrimaryMaterialFormat } from "../utils/materialFormats";
import ContentThumbnail from "./ContentThumbnail";

export default function VideoCard({
  title,
  category,
  duration,
  imageUrl,
  isMaterialOnly = false,
  materials = [],
}) {
  const primaryFormat = getPrimaryMaterialFormat(materials);
  const actionIcon = isMaterialOnly ? primaryFormat.icon : "play_arrow";

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card-light p-3 transition-shadow hover:shadow-lg dark:bg-card-dark dark:hover:shadow-primary/10">
      <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-surface-light dark:bg-surface-dark">
        <ContentThumbnail
          title={title}
          imageUrl={imageUrl}
          materials={materials}
          isMaterialOnly={isMaterialOnly}
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm">
            <span
              className="material-symbols-outlined text-3xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {actionIcon}
            </span>
          </div>
        </div>
        {materials.length > 0 && (
          <div
            className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black shadow-sm ${primaryFormat.tone}`}
          >
            <span className="material-symbols-outlined text-sm">{primaryFormat.icon}</span>
            {primaryFormat.label}
          </div>
        )}
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
