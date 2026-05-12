"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";

import { useFieldContext } from "./field";
import { cn } from "./utils";

function Label({
  className,
  htmlFor,
  id,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const field = useFieldContext();

  return (
    <LabelPrimitive.Root
      id={id ?? field?.labelId}
      htmlFor={htmlFor ?? field?.inputId}
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Label };
