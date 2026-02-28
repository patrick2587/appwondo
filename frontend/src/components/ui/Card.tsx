import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-white p-4 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
