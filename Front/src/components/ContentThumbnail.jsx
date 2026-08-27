function extractYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function isImageUrl(url) {
  if (!url) return false;
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
}

export default function ContentThumbnail({ type, url, thumbnailUrl, title }) {
  const t = (type || 'VIDEO').toUpperCase();

  if (thumbnailUrl) {
    return (
      <div className="h-full w-full">
        <img src={thumbnailUrl} alt={title || ''} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (t === 'PDF') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-rose-100 text-rose-500">
        <span className="material-symbols-outlined text-6xl">picture_as_pdf</span>
        <span className="text-lg font-black tracking-widest">PDF</span>
      </div>
    );
  }

  if (t === 'IMAGE') {
    if (isImageUrl(url)) {
      return (
        <div className="h-full w-full">
          <img src={url} alt={title || ''} className="h-full w-full object-cover" />
        </div>
      );
    }
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-sky-100 text-sky-500">
        <span className="material-symbols-outlined text-6xl">image</span>
        <span className="text-sm font-bold">Imagen</span>
      </div>
    );
  }

  // VIDEO
  const yt = extractYoutubeId(url);
  if (yt) {
    return (
      <div className="h-full w-full">
        <img
          src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`}
          alt={title || ''}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-violet-100 text-violet-500">
      <span className="material-symbols-outlined text-6xl">play_circle</span>
      <span className="text-sm font-bold">Video</span>
    </div>
  );
}
