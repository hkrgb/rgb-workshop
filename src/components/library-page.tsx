import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GithubStatus } from "@/components/github-status";
import { UploadZone } from "@/components/upload-zone";
import { MediaGrid } from "@/components/media-grid";
import { listMyMedia, removeMedia } from "@/lib/media.functions";
import type { MediaItem, MediaKind } from "@/lib/media";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | MediaKind; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "image", label: "相片" },
  { id: "video", label: "影片" },
  { id: "audio", label: "音訊" },
];

export function LibraryPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");

  const listQuery = useQuery({
    queryKey: ["media"],
    queryFn: () => listMyMedia(),
  });

  const del = useMutation({
    mutationFn: (id: string) => removeMedia({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media"] }),
  });

  const items = listQuery.data ?? [];
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.kind !== filter) return false;
      if (needle && !item.filename.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, filter, q]);

  function onUploaded(item: MediaItem) {
    queryClient.setQueryData<MediaItem[]>(["media"], (prev) => {
      const next = prev ?? [];
      return [item, ...next.filter((row) => row.id !== item.id)];
    });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-subtle">
          Private vault
        </p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          媒體庫
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          只限 RGB Workshop。上載相片、MP4、MP3 之後，檔案會放到 GitHub，得到一條公開直連（例如 xxxxx.jpg），之後嵌入或分享都用得着。
        </p>
      </div>

      <GithubStatus />

      <UploadZone onUploaded={onUploaded} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "h-10 rounded-full px-4 text-sm transition-colors duration-150",
                filter === item.id
                  ? "bg-accent text-accent-fg"
                  : "bg-raised text-muted hover:text-fg",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋檔名"
            className="pl-9"
          />
        </label>
      </div>

      {listQuery.isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-[24px] bg-surface"
            />
          ))}
        </div>
      ) : listQuery.isError ? (
        <p className="text-sm text-danger">無法載入媒體庫，請重新整理。</p>
      ) : (
        <MediaGrid
          items={visible}
          onDelete={async (id) => {
            await del.mutateAsync(id);
          }}
        />
      )}
    </div>
  );
}
