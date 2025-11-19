
import React, { useEffect, useState } from 'react';
import { DailyTask } from '../types';
import { CheckCircle2, Circle, Trash2, Calendar, Zap, AlertCircle, Sparkles, Loader2, Lightbulb, Edit3 } from 'lucide-react';
import { EditTaskModal } from './EditTaskModal';

interface DailyPlannerProps {
  tasks: DailyTask[];
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAskAI?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, newTarget: number, newCompleted: number) => void;
}

export const DailyPlanner: React.FC<DailyPlannerProps> = ({ tasks, onToggleComplete, onDeleteTask, onAskAI, onUpdateTask }) => {
  const [todayStr, setTodayStr] = useState('');
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);

  useEffect(() => {
    const date = new Date();
    const formatted = date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
    setTodayStr(formatted);
  }, []);

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const getTagColor = (tag?: string) => {
    switch(tag) {
      case '核心 A': return 'bg-pink-100 text-pink-700';
      case '輔助 B': return 'bg-blue-100 text-blue-700';
      case '副線 C': return 'bg-emerald-100 text-emerald-700';
      case '額外充電 E': return 'bg-purple-100 text-purple-700';
      case '回鍋 R': return 'bg-red-100 text-red-700 font-bold border border-red-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleEditSave = (taskId: string, t: number, c: number) => {
      if (onUpdateTask) onUpdateTask(taskId, t, c);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 h-full flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2 opacity-80 mb-1">
          <Calendar size={16} />
          <span className="text-xs font-semibold uppercase tracking-widest">今日清單</span>
        </div>
        <h2 className="text-2xl font-bold mb-4">{todayStr}</h2>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold">{completedCount}<span className="text-lg opacity-50 font-normal">/{tasks.length}</span></div>
            <div className="text-xs opacity-70 mt-1">已完成任務</div>
          </div>
          <div className="h-12 w-12">
            <svg viewBox="0 0 36 36" className="transform -rotate-90 w-full h-full">
              <path className="text-indigo-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
              <path className="text-white transition-all duration-1000 ease-out" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
            <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
              <Zap size={32} className="text-yellow-400" />
            </div>
            <h3 className="text-gray-600 font-semibold mb-1">還沒有計劃</h3>
            <p className="text-sm">點擊「小豬快跑」或手動添加任務。</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className={`group relative bg-white p-4 rounded-xl border transition-all duration-300 ${
                task.isCompleted 
                  ? 'border-gray-100 opacity-60 bg-gray-50' 
                  : 'border-gray-200 shadow-sm hover:border-indigo-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <button 
                  onClick={() => onToggleComplete(task.id)}
                  className={`mt-1 flex-shrink-0 transition-colors ${task.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-indigo-500'}`}
                >
                  {task.isCompleted ? <CheckCircle2 size={24} className="fill-green-50" /> : <Circle size={24} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-semibold text-gray-800 truncate ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                      {/* Progress Display: Show 5/10 if partial, otherwise just 10 */}
                      {!task.isCompleted && task.completedAmount > 0 
                        ? <span className="text-indigo-600">{task.completedAmount}/</span> 
                        : ''}
                      {task.targetAmount} {task.moduleName.split(/[-_]/)[0]}
                    </h4>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onUpdateTask && (
                            <button 
                                onClick={() => setEditingTask(task)}
                                className="p-1 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all"
                                title="調整進度"
                            >
                                <Edit3 size={15} />
                            </button>
                        )}
                        <button 
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded transition-all"
                            title="刪除"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                  </div>
                  
                  {/* Notes/Context Section */}
                  {task.notes && (
                     <div className="mt-2 flex flex-col gap-2">
                       <div className="flex items-center justify-between bg-amber-50 p-2 rounded border border-amber-100">
                          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                              <AlertCircle size={14} className="flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{task.notes}</span>
                          </div>
                          
                          {!task.aiTip && !task.isAiLoading && onAskAI && (
                             <button 
                                onClick={() => onAskAI(task.id)}
                                className="flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded hover:bg-violet-200 transition-colors font-bold"
                             >
                                <Sparkles size={12} />
                                AI 點撥
                             </button>
                          )}
                          {task.isAiLoading && (
                              <div className="flex items-center gap-1 text-xs text-violet-500 px-2 py-1">
                                <Loader2 size={12} className="animate-spin" />
                                生成中...
                              </div>
                          )}
                       </div>

                       {/* AI Tip Content */}
                       {task.aiTip && (
                         <div className="bg-violet-50 p-3 rounded-lg border border-violet-100 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-700 mb-1.5">
                               <Lightbulb size={14} />
                               AI 學習錦囊
                            </div>
                            <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {task.aiTip}
                            </div>
                         </div>
                       )}
                     </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${getTagColor(task.tag)}`}>
                      {task.tag || '手動'}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 truncate">{task.resourceName}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <EditTaskModal 
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSave={handleEditSave}
      />
    </div>
  );
};
