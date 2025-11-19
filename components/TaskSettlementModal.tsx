
import React, { useState } from 'react';
import { DailyTask, ResourceType } from '../types';
import { CheckCircle2, AlertCircle, PenLine, Target } from 'lucide-react';

interface TaskSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (wrongCount: number, knowledgePoint: string) => void;
  task: DailyTask | null;
  resourceType?: ResourceType;
}

export const TaskSettlementModal: React.FC<TaskSettlementModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  task,
  resourceType = ResourceType.QUESTIONS
}) => {
  const [wrongCount, setWrongCount] = useState<string>('');
  const [knowledgePoint, setKnowledgePoint] = useState<string>('');

  if (!isOpen || !task) return null;

  const isQuestionType = resourceType === ResourceType.QUESTIONS;

  const handleSubmit = () => {
    const count = parseInt(wrongCount) || 0;
    onConfirm(count, knowledgePoint);
    // Reset
    setWrongCount('');
    setKnowledgePoint('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-green-50 p-6 text-center border-b border-green-100">
          <div className="mx-auto bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-3 text-green-600">
             <CheckCircle2 size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">太棒了！完成任務</h3>
          <p className="text-sm text-gray-500 mt-1">{task.resourceName} - {task.moduleName}</p>
        </div>

        <div className="p-6 space-y-5">
           {/* Input 1: Wrong Count */}
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                {isQuestionType ? '錯題數量' : '需要回顧的點'}
                <span className="text-xs text-gray-400 font-normal">輸入 0 則直接通過</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  min="0"
                  max={task.targetAmount}
                  value={wrongCount}
                  onChange={(e) => setWrongCount(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 pl-10 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="0"
                  autoFocus
                />
                <div className="absolute left-3 top-3.5 text-gray-400">
                   <AlertCircle size={20} />
                </div>
              </div>
           </div>

           {/* Input 2: Specific Knowledge Point - EMPHASIZED */}
           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
                 <Target size={14} className="text-indigo-500"/>
                 精確制導（選填）
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={knowledgePoint}
                  onChange={(e) => setKnowledgePoint(e.target.value)}
                  className="w-full border border-indigo-200 rounded-lg p-2.5 pl-9 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  placeholder="例如：職業理念、拼音..."
                />
                <div className="absolute left-3 top-2.5 text-indigo-300">
                   <PenLine size={16} />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-2 leading-tight">
                 💡 這裡填寫的內容，將成為下次「回鍋任務」的<span className="font-bold text-indigo-600">任務標題</span>。
              </p>
           </div>
        </div>

        <div className="p-4 border-t border-gray-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            取消
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 py-2.5 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 text-sm"
          >
            確認打卡
          </button>
        </div>
      </div>
    </div>
  );
};
