import { RouteMark } from "@/components/app-shell/route-mark";

// Sign-in and sign-up sit outside the app frame: one card centered on the desk.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-[calc(100dvh-2*var(--s4))] items-center justify-center">
      <div className="flex w-full max-w-auth flex-col gap-s6 rounded-xl border border-line bg-surface px-s6 py-s8">
        <div className="flex items-center gap-s2">
          <span className="inline-flex size-control-md items-center justify-center rounded-md bg-accent text-on-accent">
            <RouteMark className="size-s4" />
          </span>
          <span className="text-base font-semibold">AI Planning Companion</span>
        </div>
        {children}
      </div>
    </div>
  );
}
