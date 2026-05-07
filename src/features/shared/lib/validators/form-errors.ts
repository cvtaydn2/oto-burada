import type { FieldErrors } from "react-hook-form";

/**
 * Maps Zod issues or custom errors to React Hook Form field errors.
 */
export function mapApiErrorsToForm(
  errors: Record<string, string>,
  setError: (name: string, error: { type: string; message: string }) => void
) {
  Object.entries(errors).forEach(([field, message]) => {
    setError(field, {
      type: "manual",
      message,
    });
  });
}

export function getFirstError(errors: FieldErrors): string | undefined {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return undefined;

  const error = errors[firstKey];
  if (!error) return undefined;

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return undefined;
}
