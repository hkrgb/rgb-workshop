import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { fetchMediaMeta } from "@/lib/media.functions";
import { fileUrl, shareUrl, type MediaItem } from "@/lib/media";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RgbMark } from "@/components/rgb-mark";

export const Route = createFileRoute("/f/$slug")({
  component: FileView,
});

function FileView() {
  const { slug } = Route.useParams();
  const query = useQuery({
    queryKey: ["media-meta", slug],
    queryFn: () => fetchMediaMeta({ data: slug }),
  });

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="border-b border-border/80">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 text-fg no-underline">
            <RgbMark />
            <span className="font-display text-lg tracking-tight">
              RGB Workshop
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-[12px] px-3 text-sm text-muted no-underline hover:text-fg"
          >
            <ArrowLeft className="size-4" />
            媒體庫
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-10 sm:px-6">
        {query.isPending ? (
          <div className="h-80 animate-pulse rounded-[28px] bg-surface" />
        ) : query.data ? (
          <Viewer item={query.data} />
        ) : (
          <div className="rounded-[28px] border border-border bg-surface px-6 py-16 text-center">
            <h1 className="font-display text-3xl">找不到這個檔案</h1>
            <p className="mt-2 text-sm text-muted">連結可能已刪除或打錯。</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Viewer({ item }: { item: MediaItem }) {
  const [copied, setCopied] = useState(false);
  const src = fileUrl(item);

  async function copy() {
    const url = shareUrl(item, window.location.origin);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-border bg-surface">
        {item.kind === "image" ? (
          <img
            src={src}
            alt={item.filename}
            className="mx-auto max-h-[70vh] w-full object-contain"
          />
        ) : item.kind === "video" ? (
          <video src={src} controls className="w-full bg-bg" />
        ) : (
          <div className="px-6 py-16">
            <audio src={src} controls className="w-full" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{item.filename}</h1>
          <p className="mt-1 font-mono text-sm text-muted">{src}</p>
          <p className="mt-1 text-sm tabular-nums text-subtle">
            {formatBytes(item.sizeBytes)}
          </p>
        </div>
        <Button type="button" onClick={() => void copy()}>
          {copied ? <Check /> : <Copy />}
          {copied ? "已複製" : "複製檔案連結"}
        </Button>
      </div>
    </article>
  );
}
