import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 pb-1", className)}>
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-zinc-900 leading-tight">{title}</h1>
        {description && (
          <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0 pt-0.5">{children}</div>
      )}
    </div>
  );
}
