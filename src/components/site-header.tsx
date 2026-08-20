import { Link, useRouterState } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import { isAllowedEmail } from "@/lib/allowlist";
import { Button } from "@/components/ui/button";
import { RgbMark } from "@/components/rgb-mark";

export function SiteHeader() {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const allowed = isAllowedEmail(user?.primaryEmail);
  const onLogin = pathname === "/login";

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 text-fg no-underline">
          <RgbMark />
          <span className="font-display text-lg tracking-tight">
            RGB Workshop
          </span>
        </Link>
        <div className="flex min-h-11 items-center gap-3">
          {isPending ? (
            <div className="size-8 animate-pulse rounded-full bg-raised" />
          ) : user && allowed ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-[14rem] truncate text-xs text-muted sm:inline">
                {user.primaryEmail}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void signOut("/login")}
              >
                登出
              </Button>
            </div>
          ) : user ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void signOut("/login")}
            >
              登出
            </Button>
          ) : onLogin ? null : (
            <Button asChild size="sm">
              <Link to="/login">登入</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
