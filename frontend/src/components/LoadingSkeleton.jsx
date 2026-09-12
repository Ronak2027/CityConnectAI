import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-brand-border p-6 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-card border border-brand-border p-4 animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
      ))}
    </div>
  );
}
