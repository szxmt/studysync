
import React, { useState } from 'react';
import { ResourceApp, SubModule, ResourceType } from '../types';
import { ProgressBar } from './ProgressBar';
import { Plus, ChevronDown, ChevronUp, Trash2, Dice5, Check, X, Edit2 } from 'lucide-react';

interface ResourceCardProps {
  resource: ResourceApp;
  onAddToPlan: (resourceId: string, module: SubModule) => void;
  onDeleteResource: (id: string) => void;
  onEditName: (id: string, name: string) => void;
  onAddModule: (resourceId: string, name: string, totalItems: number, type: ResourceType) => void;
  onDeleteModule: (resourceId: string, moduleId: string) => void;
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

export const ResourceCard: React.FC<ResourceCardProps> = ({ 
  resource, 
  onAddToPlan, 
  onDeleteResource,
  onEditName,
  onAddModule,
  onDeleteModule
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed to save space
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(resource.name);
  
  // State for Adding Module
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModName, setNewModName] = useState('');
  const [newModTotal, setNewModTotal] = useState('');

  const totalItems = resource.modules.reduce((acc, m) => acc + m.totalItems, 0);
  const totalCompleted = resource.modules.reduce((acc, m) => acc + m.completedItems, 0);
  const overallProgress = totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0;

  const handleRandomPick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resource.modules.length === 0) return;
    const incomplete = resource.modules.filter(m => m.completedItems < m.totalItems);
    const pool = incomplete.length > 0 ? incomplete : resource.modules;
    const randomModule = pool[Math.floor(Math.random() * pool.length)];
    onAddToPlan(resource.id, randomModule);
  };

  const handleSaveName = () => {
      if (tempName.trim()) {
          onEditName(resource.id, tempName);
      }
      setIsEditingName(false);
  };

  const handleSaveModule = () => {
      if (newModName.trim() && parseInt(newModTotal) > 0) {
          const type = resource.modules.length > 0 ? resource.modules[0].type : ResourceType.QUESTIONS;
          onAddModule(resource.id, newModName, parseInt(newModTotal), type);
          setNewModName('');
          setNewModTotal('');
          setIsAddingModule(false);
      }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
      <div className="p-5 relative">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 mr-2">
            <div className="flex items-center gap-2">
                {isEditingName ? (
                    <div className="flex items-center gap-1">
                        <input 
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="border border-indigo-300 rounded px-1 py-0.5 text-lg font-bold text-gray-800 w-full max-w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            autoFocus
                        />
                        <button onClick={handleSaveName} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check size={16}/></button>
                        <button onClick={() => {setIsEditingName(false); setTempName(resource.name);}} className="text-red-400 hover:bg-red-50 p-1 rounded"><X size={16}/></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group/title cursor-pointer" onClick={() => setIsEditingName(true)}>
                        <h3 className="font-bold text-lg text-gray-800">{resource.name}</h3>
                        <Edit2 size={12} className="text-gray-300 opacity-100 md:opacity-0 md:group-hover/title:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
          </div>
          
          <div className="flex items-center gap-1">
              <button 
                onClick={handleRandomPick}
                title="隨機抽取一個單元加入計劃"
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors mr-1"
              >
                <Dice5 size={14} />
                隨機
              </button>
              <button 
                onClick={() => onDeleteResource(resource.id)}
                className="text-gray-300 hover:text-red-400 hover:bg-red-50 p-1.5 rounded transition-all"
              >
                <Trash2 size={16} />
              </button>
          </div>
        </div>

        <div className="mb-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <ProgressBar 
            current={totalCompleted} 
            total={totalItems} 
            height="h-2.5" 
            showLabel 
            label="總體進度"
            color={overallProgress === 100 ? '#22c55e' : '#3b82f6'}
          />
        </div>

        <div className="flex items-center justify-between border-t border-gray-50 pt-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-gray-500 flex items-center gap-1 hover:text-gray-700"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {resource.modules.length} 個單元
          </button>
          
          <button 
             onClick={() => { setIsExpanded(true); setIsAddingModule(true); }}
             className="text-xs text-indigo-600 font-medium hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
          >
              + 新增單元
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-gray-50/50 border-t border-gray-100 max-h-[300px] overflow-y-auto">
          {resource.modules.map((module) => (
            <div key={module.id} className="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-100 transition-colors group flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: module.color || '#ccc' }} />
                        <span className="font-medium text-gray-700 text-sm truncate" title={module.name}>{module.name}</span>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                         <div className="flex-1">
                            <ProgressBar 
                                current={module.completedItems} 
                                total={module.totalItems} 
                                height="h-1" 
                                color={module.color}
                            />
                         </div>
                         <span className="text-[10px] text-gray-400 whitespace-nowrap w-16 text-right">
                            {module.completedItems}/{module.totalItems} {getUnitLabel(module.type)}
                         </span>
                    </div>
                </div>

                {/* Actions: Always visible on Mobile, Hover on Desktop */}
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={() => onAddToPlan(resource.id, module)}
                        className="p-1.5 bg-black text-white rounded hover:bg-gray-800 shadow-sm"
                        title="加入計劃"
                    >
                        <Plus size={14} />
                    </button>
                     <button 
                        onClick={() => onDeleteModule(resource.id, module.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        title="刪除單元"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
          ))}

          {isAddingModule && (
              <div className="p-3 bg-indigo-50 border-b border-indigo-100">
                  <div className="flex gap-2 mb-2">
                      <input 
                        className="flex-1 text-sm border border-indigo-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-400"
                        placeholder="單元名稱"
                        value={newModName}
                        onChange={e => setNewModName(e.target.value)}
                        autoFocus
                      />
                      <input 
                        className="w-20 text-sm border border-indigo-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-400"
                        placeholder="數量"
                        type="number"
                        value={newModTotal}
                        onChange={e => setNewModTotal(e.target.value)}
                      />
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsAddingModule(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">取消</button>
                      <button onClick={handleSaveModule} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 font-medium">新增</button>
                  </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};
