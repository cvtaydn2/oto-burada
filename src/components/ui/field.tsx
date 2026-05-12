"use client";

import * as React from "react";

type FieldContextValue = {
  inputId: string;
  labelId: string;
  descriptionId: string;
  messageId: string;
};

const FieldContext = React.createContext<FieldContextValue | null>(null);

function useFieldContext() {
  return React.useContext(FieldContext);
}

type FieldProps = React.ComponentProps<"div"> & {
  id?: string;
};

function Field({ id, children, ...props }: FieldProps) {
  const reactId = React.useId();
  const baseId = id ?? `field-${reactId.replace(/:/g, "")}`;

  const value = React.useMemo<FieldContextValue>(
    () => ({
      inputId: `${baseId}-input`,
      labelId: `${baseId}-label`,
      descriptionId: `${baseId}-description`,
      messageId: `${baseId}-message`,
    }),
    [baseId]
  );

  return (
    <FieldContext.Provider value={value}>
      <div data-slot="field" {...props}>
        {children}
      </div>
    </FieldContext.Provider>
  );
}

export { Field, useFieldContext };
