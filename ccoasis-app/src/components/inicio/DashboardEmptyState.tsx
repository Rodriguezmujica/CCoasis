import React from 'react';
import { Inbox, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface DashboardEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
  compact?: boolean;
  className?: string;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = true,
  className = '',
}) => {
  if (compact) {
    return (
      <div
        className={`py-2.5 px-3.5 rounded-[10px] bg-[#f5f5f5] border border-[#d4d7dc] flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-6 h-6 rounded-full bg-[#e3f5e9] border border-[#2f7d4f]/30 text-[#14532d] flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <CheckCircle2 className="w-4 h-4 text-[#14532d]" />
          </span>
          <p className="text-xs sm:text-sm font-semibold text-[#1a1a1a] truncate">
            {title}
          </p>
          {description && (
            <span className="hidden lg:inline text-xs text-[#4a4f57] truncate">
              · {description}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`py-6 px-4 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div
        className="w-11 h-11 rounded-full bg-[#f5f5f5] border border-[#d4d7dc] text-[#4a4f57] flex items-center justify-center flex-shrink-0"
        aria-hidden="true"
      >
        {icon || <Inbox className="w-5 h-5 text-[#4a4f57]" />}
      </div>

      <div className="space-y-1 max-w-sm">
        <p className="text-sm font-semibold text-[#1a1a1a]">{title}</p>
        {description && (
          <p className="text-xs text-[#4a4f57] leading-relaxed">{description}</p>
        )}
      </div>

      {action && (
        <div className="pt-1">
          {action.to ? (
            <Link
              to={action.to}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-[10px] border border-[#767b83] bg-white text-xs font-semibold text-[#1a1a1a] hover:bg-[#ebedef] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0e7c86]"
            >
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-[10px] border border-[#767b83] bg-white text-xs font-semibold text-[#1a1a1a] hover:bg-[#ebedef] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0e7c86]"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};
