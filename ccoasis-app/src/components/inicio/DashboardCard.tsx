import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface DashboardCardAction {
  label: string;
  to?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export interface DashboardCardProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: DashboardCardAction;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  subtitle,
  action,
  badge,
  children,
  className = '',
  headerClassName = '',
}) => {
  return (
    <section
      aria-label={title}
      className={`bg-white rounded-[12px] border border-[#d4d7dc] p-4 sm:p-5 shadow-xs transition-shadow ${className}`}
    >
      <header
        className={`flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#ebedef] ${headerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <div
              className="w-9 h-9 rounded-[10px] bg-[#d9f7f8] text-[#0e7c86] border border-[#0e7c86]/20 flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#1a1a1a] truncate">
                {title}
              </h2>
              {badge && <span className="flex-shrink-0">{badge}</span>}
            </div>
            {subtitle && (
              <p className="text-xs text-[#4a4f57] truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {action && (
          <div className="flex-shrink-0">
            {action.to ? (
              <Link
                to={action.to}
                aria-label={action.ariaLabel || action.label}
                className="inline-flex items-center gap-1 min-h-[44px] px-3 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px] transition-colors"
              >
                <span>{action.label}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            ) : action.onClick ? (
              <button
                type="button"
                onClick={action.onClick}
                aria-label={action.ariaLabel || action.label}
                className="inline-flex items-center gap-1 min-h-[44px] px-3 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px] transition-colors"
              >
                <span>{action.label}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}
      </header>

      <div className="pt-3.5">{children}</div>
    </section>
  );
};
