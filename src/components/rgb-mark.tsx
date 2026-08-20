import { cn } from "@/lib/utils";

export function RgbMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-hidden="true"
    >
      <span className="size-2 rounded-[2px] bg-signal-r" />
      <span className="size-2 rounded-[2px] bg-signal-g" />
      <span className="size-2 rounded-[2px] bg-signal-b" />
    </span>
  );
}
