import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto max-w-[1400px] w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
