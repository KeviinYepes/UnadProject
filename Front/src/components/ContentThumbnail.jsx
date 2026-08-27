import { API_BASE_URL } from '../config/api';

function resolveUrl(url) {
  if (!url) return url;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
}

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
  const resolvedUrl = resolveUrl(url);

  if (thumbnailUrl) {
    return (
      <div className="h-full w-full">
        <img src={resolveUrl(thumbnailUrl)} alt={title || ''} className="h-full w-full object-cover" />
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

  if (t === 'EXCEL') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-emerald-100 text-emerald-600">
        <span className="material-symbols-outlined text-6xl">table_chart</span>
        <span className="text-lg font-black tracking-widest">Excel</span>
      </div>
    );
  }

  if (t === 'WORD') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-blue-100 text-blue-600">
        <span className="material-symbols-outlined text-6xl">description</span>
        <span className="text-lg font-black tracking-widest">Word</span>
      </div>
    );
  }

  if (t === 'IMAGE') {
    if (isImageUrl(resolvedUrl)) {
      return (
        <div className="h-full w-full">
          <img src={resolvedUrl} alt={title || ''} className="h-full w-full object-cover" />
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
