
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  total, 
  color = '#3b82f6', 
  height = 'h-2',
  showLabel = false,
  label
}) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1 text-gray-500 font-medium">
          <span>{label || '進度'}</span>
          <span>{percentage.toFixed(1)}% ({current}/{total})</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${height}`}>
        <div 
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
};
