import { NotFoundError } from "@/features/shared/components/error-state";

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center">
      <NotFoundError />
    </main>
  );
}
