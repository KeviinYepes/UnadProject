import { useState } from "react";
import { getMaterialFormat, getMaterialUrl, isImageMaterial } from "../utils/materialFormats";

const videoFallback = {
  label: "VIDEO",
  displayName: "Video",
  icon: "play_circle",
  tone: "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300",
};

export default function ContentThumbnail({ title, imageUrl, materials = [], isMaterialOnly = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageMaterial = materials.find(isImageMaterial);
  const primaryMaterial = materials[0];
  const primaryFormat = primaryMaterial ? getMaterialFormat(primaryMaterial) : videoFallback;
  const materialImageUrl = imageMaterial ? getMaterialUrl(imageMaterial) : "";
  const resolvedImageUrl = imageUrl || (isMaterialOnly ? materialImageUrl : "");
  const shouldShowImage = resolvedImageUrl && !imageFailed;
  const displayFormat = isMaterialOnly && primaryMaterial ? primaryFormat : videoFallback;

  if (shouldShowImage) {
    return (
      <img
        src={resolvedImageUrl}
        alt={title || displayFormat.displayName}
        className="h-full w-full object-cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 ${displayFormat.tone}`}>
      <span className="material-symbols-outlined text-5xl">{displayFormat.icon}</span>
      <span className="text-sm font-black uppercase tracking-wider">{displayFormat.label}</span>
      <span className="max-w-[80%] truncate text-xs font-semibold opacity-80">
        {displayFormat.displayName}
      </span>
    </div>
  );
}
