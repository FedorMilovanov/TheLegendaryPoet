import { ChevronRight } from 'lucide-react';
import { Link } from '../ui/Link';
import type { SeoBreadcrumb } from '../../lib/seoSchema';

interface BreadcrumbsProps {
  items: SeoBreadcrumb[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (items.length < 2) return null;

  return (
    <nav aria-label="Хлебные крошки" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs text-cyan-100/45">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={`${item.path}-${item.name}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight size={13} aria-hidden="true" className="shrink-0 text-cyan-300/25" />}
              {isCurrent ? (
                <span aria-current="page" className="max-w-[min(70vw,32rem)] truncate text-cyan-100/65">
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="inline-flex min-h-9 items-center rounded-md px-1.5 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
