export default function ConfirmDialog({
  open,
  title = "Confirmar accion",
  message,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        onClick={() => {
          if (!loading) onCancel?.();
        }}
        aria-label="Cerrar confirmacion"
      />

      <div
        className="relative w-full max-w-md rounded-xl border border-border-light bg-card-light p-6 shadow-xl dark:border-border-dark dark:bg-card-dark"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary-light dark:text-text-secondary-dark">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg bg-surface-light px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-surface-dark dark:hover:bg-slate-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg">
              {loading ? "hourglass_empty" : "delete"}
            </span>
            {loading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
