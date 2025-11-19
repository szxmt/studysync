
import React, { useState, useEffect } from 'react';
import { DailyTask } from '../types';
import { X, Save, RotateCcw } from 'lucide-react';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, newTarget: number, newCompleted: number) => void;
  task: DailyTask | null;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, onSave, task }) => {
  const [target, setTarget] = useState<string>('');
  const [completed, setCompleted] = useState<string>('');

  useEffect(() => {
    if (task) {
      setTarget(task.targetAmount.toString());
      setCompleted(task.completedAmount.toString());
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseInt(target);
    const c = parseInt(completed);
    if (!isNaN(t) && !isNaN(c)) {
      onSave(task.id, t, c);
      onClose();
    }
  };

  const handleReset = () => {
      setCompleted('0');
  };

  const handleMax = () => {
      setCompleted(target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">調整進度</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">目標數量</label>
                <input 
                    type="number" 
                    min="1"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">已完成</label>
                    <div className="flex gap-1">
                         <button type="button" onClick={handleReset} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600 hover:bg-gray-200">歸零</button>
                         <button type="button" onClick={handleMax} className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 hover:bg-indigo-100">做完</button>
                    </div>
                </div>
                <input 
                    type="number" 
                    min="0"
                    value={completed}
                    onChange={e => setCompleted(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
            
            <div className="pt-2 flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-md shadow-indigo-100">
                    <Save size={16} /> 保存
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
