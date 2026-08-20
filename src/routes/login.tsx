import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ALLOWED_EMAIL, isAllowedEmail } from "@/lib/allowlist";
import { Button } from "@/components/ui/button";
import { RgbMark } from "@/components/rgb-mark";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  if (!isPending && user && isAllowedEmail(user.primaryEmail)) {
    return <Navigate to="/" />;
  }

  const google = GROK_PROVIDERS.find((p) => p.idp === "google");
  const blocked = Boolean(user && !isAllowedEmail(user.primaryEmail));

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />
      <main className="grid flex-1 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between border-r border-border px-12 py-16 lg:flex">
          <div>
            <RgbMark className="mb-8" />
            <h1 className="max-w-md font-display text-5xl leading-[1.08] tracking-tight">
              工作室的私人媒體庫
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              上載相片、MP4 與 MP3，檔案會放到 GitHub 公開庫，即時得到像 xxxxx.jpg 咁嘅直接檔案網址。之後貼去簡報、網站或訊息都用得着。
            </p>
          </div>
          <p className="text-xs tracking-[0.16em] text-subtle uppercase">
            RGB Workshop
          </p>
        </section>
        <section className="flex items-center justify-center px-5 py-16 sm:px-10">
          <div className="w-full max-w-sm">
            <RgbMark className="mb-6 lg:hidden" />
            <p className="text-xs uppercase tracking-[0.18em] text-subtle">
              Sign in
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-tight">
              用 Google 登入
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              此空間只限{" "}
              <span className="text-fg">{ALLOWED_EMAIL}</span> 使用。
            </p>
            {blocked ? (
              <p className="mt-4 rounded-[16px] border border-border bg-raised px-4 py-3 text-sm leading-relaxed text-danger">
                這個 Google 帳戶沒有權限。請改用 {ALLOWED_EMAIL} 再試。
              </p>
            ) : null}
            <div className="mt-8 space-y-3">
              {authEnabled && google ? (
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={() =>
                    void signIn(google.providerId, { callbackURL: "/" })
                  }
                >
                  繼續使用 Google
                </Button>
              ) : (
                <p className="text-sm text-muted">登入功能暫時關閉。</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
