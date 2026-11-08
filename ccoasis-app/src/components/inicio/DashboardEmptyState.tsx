import React from 'react';
import { Inbox } from 'lucide-react';
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
  className?: string;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
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
