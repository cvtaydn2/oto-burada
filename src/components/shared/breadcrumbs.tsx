import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex px-4 py-3 text-slate-500 bg-slate-50/50 rounded-xl border border-slate-100 mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium hover:text-indigo-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5 mr-2" />
            Ana Sayfa
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.url}>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
              {index === items.length - 1 ? (
                <span className="ml-1 text-sm font-semibold text-slate-800 md:ml-2">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="ml-1 text-sm font-medium hover:text-indigo-600 transition-colors md:ml-2"
                >
                  {item.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
