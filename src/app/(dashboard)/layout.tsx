import { DashboardShell } from "@/components/layout/dashboard-shell";

// All dashboard pages require auth and live data — never statically render
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
