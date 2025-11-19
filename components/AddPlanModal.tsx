
import React, { useState } from 'react';
import { SubModule } from '../types';

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  module: SubModule | null;
  resourceName: string;
}

const getUnitLabel = (type: string) => {
    switch (type) {
      case 'Questions': return '題';
      case 'Sections': return '節';
      case 'Articles': return '篇';
      case 'Pages': return '頁';
      default: return '項';
    }
};

export const AddPlanModal: React.FC<AddPlanModalProps> = ({ isOpen, onClose, onConfirm, module, resourceName }) => {
  const [amount, setAmount] = useState<string>('10');

  if (!isOpen || !module) return null;

  const remaining = module.totalItems - module.completedItems;
  const unitLabel = getUnitLabel(module.type);
  
  // Smart defaults based on type
  const presets = module.type === 'Questions' 
    ? [10, 20, 30, 50] 
    : [1, 2, 3, 5];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(amount);
    if (val > 0) {
      onConfirm(val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">加入今日計劃</h3>
          <p className="text-sm text-gray-500 mt-1">
            {resourceName} <span className="mx-1">/</span> {module.name}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              今日目標 ({unitLabel})
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max={remaining > 0 ? remaining : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full rounded-lg border-gray-300 border p-3 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                autoFocus
              />
              <span className="text-gray-500 font-medium whitespace-nowrap">
                / 剩餘 {remaining} {unitLabel}
              </span>
            </div>
            
            {/* Quick Selectors */}
            <div className="flex gap-2 mt-3">
              {presets.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
                >
                  +{val} {unitLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors text-sm font-medium"
            >
              確認加入
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
