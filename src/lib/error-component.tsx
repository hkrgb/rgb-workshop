import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={1.6} />
      </span>
      <h1 className="font-display text-2xl tracking-tight">出咗問題</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {error.message || "發生未預期的錯誤，請重新整理頁面。"}
      </p>
    </main>
  );
}
