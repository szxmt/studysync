
import React, { useState } from 'react';
import { ResourceApp, ResourceType } from '../types';
import { generateStudyStructure } from '../services/geminiService';
import { Sparkles, Loader2, BookOpen, Plus } from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (resource: ResourceApp) => void;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [mode, setMode] = useState<'manual' | 'ai'>('ai');
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Manual State
  const [name, setName] = useState('');
  const [totalItems, setTotalItems] = useState('100');
  const [moduleName, setModuleName] = useState('單元 1');

  if (!isOpen) return null;

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    try {
      const result = await generateStudyStructure(aiPrompt);
      if (result) {
        onAdd(result);
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert("無法生成計劃，請重試。");
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = () => {
    const newResource: ResourceApp = {
        id: crypto.randomUUID(),
        name: name || '新資源',
        description: '手動新增',
        modules: [{
            id: crypto.randomUUID(),
            name: moduleName || '通用單元',
            type: ResourceType.QUESTIONS,
            totalItems: parseInt(totalItems) || 100,
            completedItems: 0,
            color: '#a78bfa'
        }]
    };
    onAdd(newResource);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">新增學習資源</h3>
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button 
              onClick={() => setMode('ai')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'ai' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              AI 智能生成
            </button>
            <button 
               onClick={() => setMode('manual')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'manual' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              手動新增
            </button>
          </div>
        </div>

        <div className="p-6">
          {mode === 'ai' ? (
            <div className="space-y-4">
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 items-start">
                  <Sparkles className="text-indigo-500 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-indigo-800">
                    <p className="font-semibold mb-1">AI 結構生成器</p>
                    <p className="opacity-80">輸入您的考試主題（例如：「高中數學教資」）。我們將自動為您建立包含預估題數或課程時長的結構。</p>
                  </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">您想學習什麼？</label>
                 <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="例如：教資 - 綜合素質、雅思詞彙..."
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                 />
               </div>

               <button
                disabled={loading || !aiPrompt}
                onClick={handleAiGenerate}
                className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
               >
                 {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                 {loading ? '生成中...' : '生成結構'}
               </button>
            </div>
          ) : (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App / 書籍名稱</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg p-2.5" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        placeholder="我的題庫"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">首個單元名稱</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg p-2.5" 
                        value={moduleName} 
                        onChange={e => setModuleName(e.target.value)}
                        placeholder="第一章"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">總數量 (題/分鐘/頁)</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg p-2.5" 
                        type="number"
                        value={totalItems} 
                        onChange={e => setTotalItems(e.target.value)}
                    />
                </div>
                <button
                onClick={handleManualAdd}
                className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 flex justify-center items-center gap-2"
               >
                 <Plus size={18} /> 建立資源
               </button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 flex justify-center">
            <button onClick={onClose} className="text-gray-500 text-sm hover:text-gray-800">取消</button>
        </div>
      </div>
    </div>
  );
};
