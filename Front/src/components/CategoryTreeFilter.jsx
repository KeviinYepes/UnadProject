import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CategoryTreeFilter({
  categories = [],
  videos = [],
  selectedCategory = "",
  onSelectCategory,
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(() => new Set());

  const categoryNodes = useMemo(() => {
    const fallbackCategories =
      categories.length > 0
        ? categories
        : [...new Set(videos.map((video) => video.category).filter(Boolean))].map((categoryName) => ({
            categoryName,
          }));

    return fallbackCategories
      .map((category) => {
        const name = category.categoryName || category.name || String(category);
        const children = videos.filter((video) => video.category === name);
        return {
          id: category.id ?? name,
          name,
          videos: children,
        };
      })
      .filter((category) => category.name);
  }, [categories, videos]);

  const totalVideos = videos.length;

  const toggleExpanded = (categoryName) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const selectCategory = (categoryName) => {
    onSelectCategory?.(selectedCategory === categoryName ? "" : categoryName);
  };

  const handleCategoryKeyDown = (event, categoryName) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectCategory(categoryName);
  };

  const handleToggleKeyDown = (event, categoryName) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleExpanded(categoryName);
  };

  const goToVideo = (video) => {
    navigate("/video", { state: video });
  };

  return (
    <aside className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <details className="group lg:hidden" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">
          Categorias
          <span className="material-symbols-outlined text-lg transition group-open:rotate-180">
            expand_more
          </span>
        </summary>
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <TreeContent
            categoryNodes={categoryNodes}
            expanded={expanded}
            handleCategoryKeyDown={handleCategoryKeyDown}
            handleToggleKeyDown={handleToggleKeyDown}
            goToVideo={goToVideo}
            onSelectCategory={onSelectCategory}
            selectedCategory={selectedCategory}
            selectCategory={selectCategory}
            toggleExpanded={toggleExpanded}
            totalVideos={totalVideos}
          />
        </div>
      </details>

      <div className="hidden lg:block">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Categorias</h2>
        </div>
        <div className="p-3">
          <TreeContent
            categoryNodes={categoryNodes}
            expanded={expanded}
            handleCategoryKeyDown={handleCategoryKeyDown}
            handleToggleKeyDown={handleToggleKeyDown}
            goToVideo={goToVideo}
            onSelectCategory={onSelectCategory}
            selectedCategory={selectedCategory}
            selectCategory={selectCategory}
            toggleExpanded={toggleExpanded}
            totalVideos={totalVideos}
          />
        </div>
      </div>
    </aside>
  );
}

const TreeContent = ({
  categoryNodes,
  expanded,
  handleCategoryKeyDown,
  handleToggleKeyDown,
  goToVideo,
  onSelectCategory,
  selectedCategory,
  selectCategory,
  toggleExpanded,
  totalVideos,
}) => (
  <div className="flex flex-col gap-1">
    <button
      type="button"
      onClick={() => onSelectCategory?.("")}
      className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
        !selectedCategory
          ? "bg-primary/10 font-bold text-primary dark:bg-primary/20"
          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="material-symbols-outlined text-lg">account_tree</span>
        <span className="truncate">Todas las categorias</span>
      </span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {totalVideos}
      </span>
    </button>

    {categoryNodes.map((category) => {
      const isExpanded = expanded.has(category.name);
      const isSelected = selectedCategory === category.name;

      return (
        <div key={category.id} className="flex flex-col">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleExpanded(category.name)}
              onKeyDown={(event) => handleToggleKeyDown(event, category.name)}
              aria-expanded={isExpanded}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"
              title={isExpanded ? "Contraer categoria" : "Expandir categoria"}
            >
              <span className={`material-symbols-outlined text-lg transition ${isExpanded ? "rotate-90" : ""}`}>
                chevron_right
              </span>
            </button>
            <button
              type="button"
              onClick={() => selectCategory(category.name)}
              onKeyDown={(event) => handleCategoryKeyDown(event, category.name)}
              className={`flex min-h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                isSelected
                  ? "bg-primary/10 font-bold text-primary dark:bg-primary/20"
                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span className="truncate">{category.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {category.videos.length}
              </span>
            </button>
          </div>

          {isExpanded && (
            <div className="ml-9 mt-1 flex flex-col gap-1 border-l border-slate-200 pl-2 dark:border-slate-700">
              {category.videos.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">Sin videos</p>
              ) : (
                category.videos.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => goToVideo(video)}
                    className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-base">play_circle</span>
                    <span className="min-w-0 break-words">{video.title}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);
