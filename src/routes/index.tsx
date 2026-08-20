import { createFileRoute, Navigate } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isAllowedEmail } from "@/lib/allowlist";
import { SiteHeader } from "@/components/site-header";
import { LibraryPage } from "@/components/library-page";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <div className="flex min-h-dvh flex-col bg-bg">
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
          <div className="h-12 w-48 animate-pulse rounded-[12px] bg-surface" />
          <div className="h-40 animate-pulse rounded-[28px] bg-surface" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-56 animate-pulse rounded-[24px] bg-surface" />
            <div className="h-56 animate-pulse rounded-[24px] bg-surface" />
            <div className="h-56 animate-pulse rounded-[24px] bg-surface" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <RedirectToSignIn />;
  if (!isAllowedEmail(user.primaryEmail)) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />
      <main className="flex-1">
        <LibraryPage />
      </main>
    </div>
  );
}
