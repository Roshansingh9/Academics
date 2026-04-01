import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-zinc-100 border border-zinc-200 mb-5 shadow-sm">
        <Icon className="h-6 w-6 text-zinc-400" />
      </div>
      <h3 className="text-[15px] font-semibold text-zinc-800">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 mt-1.5 max-w-xs leading-relaxed">{description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
