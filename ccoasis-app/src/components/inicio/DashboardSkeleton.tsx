import React from 'react';

export interface DashboardSkeletonProps {
  lines?: number;
  hasHeader?: boolean;
  className?: string;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  lines = 3,
  hasHeader = true,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label="Cargando contenido"
      className={`bg-white rounded-[12px] border border-[#d4d7dc] p-4 sm:p-5 animate-pulse space-y-4 ${className}`}
    >
      {hasHeader && (
        <div className="flex items-center justify-between pb-3 border-b border-[#ebedef]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#ebedef]" />
            <div className="space-y-1.5">
              <div className="w-32 h-4 rounded bg-[#ebedef]" />
              <div className="w-20 h-2.5 rounded bg-[#ebedef]" />
            </div>
          </div>
          <div className="w-16 h-4 rounded bg-[#ebedef]" />
        </div>
      )}

      <div className="space-y-2.5 pt-1">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className="p-3 rounded-[10px] bg-[#f5f5f5] border border-[#ebedef] space-y-2"
          >
            <div className="flex items-center justify-between">
              <div
                className="h-3.5 rounded bg-[#ebedef]"
                style={{ width: `${Math.max(40, 75 - idx * 15)}%` }}
              />
              <div className="w-12 h-3 rounded bg-[#ebedef]" />
            </div>
            <div className="w-1/2 h-2.5 rounded bg-[#ebedef]" />
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando...</span>
    </div>
  );
};
