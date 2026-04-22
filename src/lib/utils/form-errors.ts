import { FieldValues, Path, UseFormSetError } from "react-hook-form";

/**
 * World-Class UX: Precise Field Errors (Issue 2 - "The Seam")
 * Maps structured server errors directly to form input fields using react-hook-form.
 * Ensures the error appears UNDER the relevant input, not just as a generic toast.
 */

export interface ServerErrorResponse {
  errors?: Record<string, string[]>;
  message?: string;
}

export function handleServerErrors<T extends FieldValues>(
  response: ServerErrorResponse,
  setError: UseFormSetError<T>
) {
  if (response.errors) {
    Object.entries(response.errors).forEach(([field, messages]) => {
      setError(field as Path<T>, {
        type: "server",
        message: messages[0],
      });
    });
    return true;
  }
  return false;
}
