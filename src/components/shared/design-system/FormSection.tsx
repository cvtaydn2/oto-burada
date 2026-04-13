import { cn } from "@/lib/utils";

interface FormSectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared FormSection component following the Showroom Elite design system.
 * Matches the HTML reference: Number in blue circle + White card with border.
 */
export function FormSection({ number, title, children, className }: FormSectionProps) {
  return (
    <div className={cn("animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold mr-3 text-sm shadow-sm ring-1 ring-blue-100">
          {number}
        </div>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_10px_40px_-10px_rgba(0,0,0,0.04)]">
        {children}
      </div>
    </div>
  );
}
