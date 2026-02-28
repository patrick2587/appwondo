import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  default: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizeClasses;
}

export function Spinner({ size = "default", className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Laden"
      className={cn(
        "animate-spin rounded-full border-primary/30 border-t-primary",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Laden...</span>
    </div>
  );
}
