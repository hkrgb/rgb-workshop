import { useState } from "react";
import { Copy, Check, Film, Music, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fileUrl, shareUrl, type MediaItem, type MediaKind } from "@/lib/media";
import { cn, formatBytes, formatStamp } from "@/lib/utils";

type Props = {
  items: MediaItem[];
  onDelete: (id: string) => Promise<void>;
};

function kindLabel(kind: MediaKind): string {
  if (kind === "image") return "相片";
  if (kind === "video") return "影片";
  return "音訊";
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function MediaGrid({ items, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-[28px] border border-border bg-surface px-6 py-16 text-center">
        <p className="font-display text-2xl tracking-tight">尚未有檔案</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          上載後會得到一條公開的直接檔案網址，例如 xxxxx.jpg，貼去邊度都用得着。
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <MediaCard item={item} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}

function MediaCard({
  item,
  onDelete,
}: {
  item: MediaItem;
  onDelete: (id: string) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(false);
  const path = fileUrl(item);
  const direct = typeof window === "undefined" ? shareUrl(item) : shareUrl(item, window.location.origin);

  async function copy() {
    await copyText(direct);
    setCopied(true);
    toast.success("已複製檔案連結");
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function remove() {
    setRemoving(true);
    try {
      await onDelete(item.id);
      toast.success("已刪除");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "刪除失敗");
      setRemoving(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-[24px] border border-border bg-surface">
      <div className="relative aspect-[16/10] bg-raised">
        {item.kind === "image" ? (
          <img
            src={path}
            alt={item.filename}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted">
            {item.kind === "video" ? (
              <Film className="size-8" strokeWidth={1.4} />
            ) : (
              <Music className="size-8" strokeWidth={1.4} />
            )}
            <span className="text-xs uppercase tracking-[0.14em]">
              {kindLabel(item.kind)}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-4 p-4">
        <div>
          <h3 className="truncate text-sm font-medium text-fg" title={item.filename}>
            {item.filename}
          </h3>
          <p className="mt-1 truncate font-mono text-xs text-muted" title={direct}>
            {path}
          </p>
          <p className="mt-1 text-xs tabular-nums text-subtle">
            {kindLabel(item.kind)} · {formatBytes(item.sizeBytes)} ·{" "}
            {formatStamp(item.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => void copy()} className="flex-1">
            {copied ? <Check /> : <Copy />}
            複製連結
          </Button>
          <a
            href={path}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-[12px] border border-border bg-raised text-fg transition-opacity hover:opacity-80",
            )}
            title="開啟檔案"
          >
            <ExternalLink className="size-4" />
          </a>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-11 text-muted hover:text-danger"
            disabled={removing}
            onClick={() => void remove()}
            title="刪除"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </article>
  );
}
