import * as React from "react";

import { useFieldContext } from "./field";
import { cn } from "./utils";

function mergeDescribedBy(...values: Array<string | undefined>) {
  const merged = values.filter(Boolean).join(" ").trim();
  return merged.length > 0 ? merged : undefined;
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  (
    {
      className,
      type,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref
  ) => {
    const field = useFieldContext();

    return (
      <input
        ref={ref}
        type={type}
        id={id ?? field?.inputId}
        aria-labelledby={ariaLabelledBy ?? field?.labelId}
        aria-describedby={mergeDescribedBy(ariaDescribedBy, field?.descriptionId, field?.messageId)}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground/90 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input/90 flex h-11 w-full min-w-0 rounded-xl border bg-background/95 px-3.5 py-2 text-base shadow-sm shadow-slate-950/5 transition-[border-color,box-shadow,color,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:bg-background focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
