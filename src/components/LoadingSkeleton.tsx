import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'table' | 'text' | 'circle';
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  count = 1, 
  type = 'text',
  className = '' 
}) => {
  const getSkeletonClass = () => {
    const baseClass = 'skeleton rounded animate-pulse';
    
    switch (type) {
      case 'card':
        return `${baseClass} h-48 w-full mb-4`;
      case 'table':
        return `${baseClass} h-16 w-full mb-2`;
      case 'circle':
        return `${baseClass} h-12 w-12 rounded-full`;
      case 'text':
      default:
        return `${baseClass} h-4 w-full mb-2`;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${getSkeletonClass()} ${className}`} />
      ))}
    </>
  );
};

export const StudentCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
    <div className="flex items-start space-x-3 sm:space-x-4 mb-3 sm:mb-4">
      <LoadingSkeleton type="circle" />
      <div className="flex-1">
        <LoadingSkeleton className="h-5 w-3/4 mb-2" />
        <LoadingSkeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <LoadingSkeleton className="h-3 w-full" />
      <LoadingSkeleton className="h-3 w-5/6" />
      <LoadingSkeleton className="h-3 w-2/3" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="bg-white dark:bg-gray-800">
    <td className="px-6 py-4">
      <LoadingSkeleton className="h-4 w-32" />
    </td>
    <td className="px-6 py-4">
      <LoadingSkeleton className="h-4 w-48" />
    </td>
    <td className="px-6 py-4">
      <LoadingSkeleton className="h-4 w-40" />
    </td>
    <td className="px-6 py-4">
      <LoadingSkeleton className="h-6 w-20" />
    </td>
    <td className="px-6 py-4">
      <LoadingSkeleton className="h-8 w-24" />
    </td>
  </tr>
);

export default LoadingSkeleton;