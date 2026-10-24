import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[12px] bg-[var(--muted-light)]/60 dark:bg-[var(--muted-light)]/30",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
