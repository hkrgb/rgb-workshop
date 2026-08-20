import { useRef, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { getBearerToken } from "@/lib/auth/client";
import { ACCEPT_ATTR, MAX_FILE_BYTES, isAllowedFile, shareUrl } from "@/lib/media";
import type { MediaItem } from "@/lib/media";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  onUploaded: (item: MediaItem) => void;
};

export function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<MediaItem> {
    const headers: Record<string, string> = {};
    const token = getBearerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body,
      headers,
    });
    if (!res.ok) {
      const text = (await res.text()).trim();
      throw new Error(text || `上載失敗（${res.status}）`);
    }
    return (await res.json()) as MediaItem;
  }

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (!files.length) return;
    setBusy(true);
    let ok = 0;
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      setProgress(`${i + 1} / ${files.length} · ${file.name}`);
      if (!isAllowedFile(file.type, file.name)) {
        toast.error(`不支援：${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} 超過 12 MB`);
        continue;
      }
      try {
        const item = await uploadOne(file);
        onUploaded(item);
        ok += 1;
        if (files.length === 1) {
          const url = shareUrl(item, window.location.origin);
          try {
            await navigator.clipboard.writeText(url);
            toast.success("已複製公開檔案連結");
          } catch {
            toast.success(`已上載 ${item.slug}`);
          }
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `無法上載 ${file.name}`);
      }
    }
    setBusy(false);
    setProgress(null);
    if (ok > 1) toast.success(`已上載 ${ok} 個檔案`);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "rounded-[28px] border border-dashed border-border bg-surface p-5 transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-8",
        dragging && "border-accent bg-raised",
      )}
    >
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-raised text-fg">
            <ImagePlus className="size-5" strokeWidth={1.6} />
          </span>
          <div>
            <p className="font-display text-xl tracking-tight text-fg">
              上載相片、MP4、MP3
            </p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
              拖入檔案，或從電腦選擇。每個檔案最多 {formatBytes(MAX_FILE_BYTES)}。
              上載後會即時產生公開直連，例如 xxxxx.jpg。
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-12 min-w-[9.5rem] items-center justify-center gap-2 rounded-[14px] bg-accent px-5 text-[15px] font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
        >
          <Upload className="size-4" />
          {busy ? "上載中…" : "選擇檔案"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
          }}
        />
      </div>
      {progress ? (
        <p className="mt-4 text-xs tabular-nums text-subtle">{progress}</p>
      ) : null}
    </div>
  );
}
