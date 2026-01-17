import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      role="progressbar"
      aria-label="Loading..."
    />
  );
}

export function ClinicCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export function MemberListSkeleton() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {[1, 2, 3, 4, 5].map((i) => (
          <li key={i} className="px-4 py-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-16" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="min-w-full divide-y divide-gray-200">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-4" />
            ))}
          </div>
        </div>
        
        {/* Rows */}
        <div className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="px-6 py-4">
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}