import { Sidebar } from "@/components/app-shell/sidebar";

// The app frame with the sidebar, shared by every signed-in page (DESIGN.md sections 1 and 7).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-[calc(100dvh-2*var(--s4))] flex-col overflow-hidden rounded-xl border border-line bg-surface wide:flex-row">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
