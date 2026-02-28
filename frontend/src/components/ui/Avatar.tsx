import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-red-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-teal-600",
  "bg-pink-600",
  "bg-indigo-600",
  "bg-orange-600",
  "bg-cyan-600",
];

function getColorFromName(name: string): string {
  const safeName = name || "?";
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: keyof typeof sizeClasses;
}

export function Avatar({
  name,
  size = "default",
  className,
  ...props
}: AvatarProps) {
  const initials = getInitials(name);
  const colorClass = getColorFromName(name);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-white shrink-0",
        colorClass,
        sizeClasses[size],
        className
      )}
      title={name}
      {...props}
    >
      {initials}
    </div>
  );
}
