
import React from 'react';
import { ResourceApp } from '../types';
import { Trophy } from 'lucide-react';

interface GlobalProgressProps {
  resources: ResourceApp[];
}

export const GlobalProgress: React.FC<GlobalProgressProps> = ({ resources }) => {
  const totalItems = resources.reduce((acc, res) => 
    acc + res.modules.reduce((mAcc, m) => mAcc + m.totalItems, 0), 0);
    
  const completedItems = resources.reduce((acc, res) => 
    acc + res.modules.reduce((mAcc, m) => mAcc + m.completedItems, 0), 0);

  const percentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="bg-white border-b border-gray-200 p-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="bg-yellow-50 p-2 rounded-lg text-yellow-600">
            <Trophy size={20} />
          </div>
          <div>
             <h3 className="text-sm font-bold text-gray-800">全域備考進度</h3>
             <p className="text-xs text-gray-500">不放過任何死角</p>
          </div>
        </div>
        
        <div className="flex-1 w-full">
           <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-600">
              <span>總完成率</span>
              <span>{percentage.toFixed(2)}%</span>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              />
           </div>
           <p className="text-[10px] text-gray-400 mt-1 text-right">
             累計攻克 {completedItems} / {totalItems} 個知識點
           </p>
        </div>
      </div>
    </div>
  );
};
