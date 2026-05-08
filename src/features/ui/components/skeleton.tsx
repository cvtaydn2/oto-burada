import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("shimmer bg-muted/20 rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
