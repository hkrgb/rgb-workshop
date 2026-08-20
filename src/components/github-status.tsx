import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectGithub, getGithubStatus } from "@/lib/media.functions";
import { githubRepoUrl } from "@/lib/github";

export function GithubStatus() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const status = useQuery({
    queryKey: ["github-status"],
    queryFn: () => getGithubStatus(),
  });
  const save = useMutation({
    mutationFn: (value: string) => connectGithub({ data: value }),
    onSuccess: () => {
      setToken("");
      toast.success("GitHub 已接駁");
      void queryClient.invalidateQueries({ queryKey: ["github-status"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "接駁失敗");
    },
  });

  const data = status.data;
  const configured = Boolean(data?.configured);
  const repoHref = githubRepoUrl();

  return (
    <section className="rounded-[24px] border border-border bg-surface px-5 py-4 sm:px-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-raised text-fg">
          <Github className="size-4" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">
            {configured ? "檔案會公開放到 GitHub" : "尚未接駁 GitHub"}
          </p>
          {configured ? (
            <p className="mt-1 text-sm leading-relaxed text-muted">
              上載後會得到一條公開直連，結尾係 .jpg / .mp4 / .mp3，任何人打開都係檔案本身。存放喺{" "}
              <a
                href={repoHref}
                target="_blank"
                rel="noreferrer"
                className="text-fg underline decoration-border underline-offset-4"
              >
                {data?.owner}/{data?.repo}
              </a>
              。
            </p>
          ) : (
            <div className="mt-2 space-y-3">
              <p className="text-sm leading-relaxed text-muted">
                預覽環境的連結出到外面用唔到。接駁 GitHub 之後，檔案會放到公開庫，複製到的網址可以隨時用。
              </p>
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!token.trim()) return;
                  save.mutate(token.trim());
                }}
              >
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder="GitHub token（Contents 寫入）"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <Button type="submit" disabled={save.isPending || !token.trim()}>
                  {save.isPending ? "接駁中…" : "接駁"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}