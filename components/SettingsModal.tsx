
import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { Copy, Download, Upload, RefreshCcw, Check, AlertTriangle, Database, HardDrive, Clock, FileJson, Loader2, CheckCircle2, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullData: AppState;
  onImport: (data: AppState) => void;
  onReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, fullData, onImport, onReset }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [importError, setImportError] = useState('');
  
  // Import Process State
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  
  // Real-time stats
  const [dataSize, setDataSize] = useState<string>('0');
  const [snapshotTime, setSnapshotTime] = useState<string>('');

  // Update stats whenever fullData changes (Real-time proof)
  useEffect(() => {
    if (isOpen) {
        const jsonStr = JSON.stringify(fullData);
        // Calculate KB
        const bytes = new Blob([jsonStr]).size;
        setDataSize((bytes / 1024).toFixed(2));
        setSnapshotTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
        
        // Reset states when opening
        setImportStatus('idle');
        setImportText('');
        setImportError('');
        setProgress(0);
    }
  }, [isOpen, fullData]);

  if (!isOpen) return null;

  const handleCopy = () => {
    // Encapsulate with metadata
    const exportPayload = {
        meta: {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            platform: "StudySync Web"
        },
        data: fullData
    };

    const dataStr = JSON.stringify(exportPayload);
    
    navigator.clipboard.writeText(dataStr).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleImportSubmit = async () => {
    try {
      setImportError('');
      if (!importText.trim()) return;

      // 1. Pre-validation (Sync)
      let parsed;
      try {
          parsed = JSON.parse(importText);
      } catch (e) {
          throw new Error("格式錯誤：這不是有效的 JSON 存檔碼");
      }
      
      let cleanData: AppState;
      // Handle both raw data (old format) and encapsulated data (new format)
      if (parsed.meta && parsed.data) {
          cleanData = parsed.data;
      } else {
          cleanData = parsed;
      }
      
      // Validation
      if (!cleanData.resources || !cleanData.dailyPlan) {
        throw new Error("無效的存檔碼：缺少資源庫或任務記錄等核心數據");
      }

      const resourceCount = cleanData.resources.length;
      const taskCount = cleanData.dailyPlan.length;
      const totalProgress = cleanData.resources.reduce((acc: number, r: any) => 
        acc + r.modules.reduce((mAcc: number, m: any) => mAcc + m.completedItems, 0), 0);

      // 2. User Confirmation
      if (!window.confirm(`📦 檢測到有效存檔：\n\n• ${resourceCount} 個資源庫\n• ${taskCount} 條任務記錄\n• 累計已完成 ${totalProgress} 個進度項\n\n⚠️ 導入將完全覆蓋當前進度，確定繼續嗎？`)) {
         return;
      }

      // 3. Visual Progress (Async Simulation)
      setImportStatus('processing');
      
      // Simulate stages of import (Parsing -> Validating -> Restoring)
      const steps = [10, 30, 55, 80, 95];
      for (const p of steps) {
          setProgress(p);
          await new Promise(resolve => setTimeout(resolve, 150)); // Artificial delay for visual feedback
      }

      // 4. Success
      setProgress(100);
      setImportStatus('success');

      // Wait a moment for user to see 100% and success state
      setTimeout(() => {
        onImport(cleanData);
        // onClose handled by page reload in parent
      }, 800);

    } catch (e: any) {
      setImportStatus('idle');
      setProgress(0);
      setImportError(e.message || "無法識別的存檔碼，請檢查複製是否完整。");
    }
  };

  const handleResetConfirm = () => {
      if (window.confirm("⚠️ 高危操作：確定要清空所有數據重置為初始狀態嗎？此操作無法撤銷。")) {
          onReset();
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Database className="text-indigo-600" size={20} />
                數據管理
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <HardDrive size={12} />
                數據實時存儲於本地瀏覽器
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm hover:scale-105 transition-transform">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
            <button 
                onClick={() => setActiveTab('export')}
                disabled={importStatus !== 'idle'}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'export' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:bg-gray-50 disabled:opacity-50'}`}
            >
                <Download size={16} /> 備份/導出
            </button>
            <button 
                onClick={() => setActiveTab('import')}
                disabled={importStatus !== 'idle'}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'import' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:bg-gray-50 disabled:opacity-50'}`}
            >
                <Upload size={16} /> 恢復/導入
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
            {activeTab === 'export' ? (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                        <p className="font-bold mb-1">💡 這是您的「遊戲存檔」</p>
                        <p className="opacity-90">StudySync 不會上傳您的數據到服務器。請定期複製下方的「存檔碼」保存到微信、備忘錄或發送給其他設備。</p>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock size={14} />
                            <span>快照時間：{snapshotTime}</span>
                        </div>
                         <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FileJson size={14} />
                            <span>大小：{dataSize} KB</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCopy}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${copySuccess ? 'bg-green-500 scale-95' : 'bg-black hover:bg-gray-800 hover:scale-[1.02]'}`}
                    >
                        {copySuccess ? <Check size={20} /> : <Copy size={20} />}
                        {copySuccess ? '存檔碼已複製！' : '複製最新存檔碼'}
                    </button>
                    
                    <div className="border-t border-gray-100 pt-6 mt-6">
                        <button onClick={handleResetConfirm} className="w-full text-red-500 text-xs hover:text-red-700 flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                            <RefreshCcw size={12} />
                            重置所有數據（危險）
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {importStatus === 'idle' && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800 flex gap-2">
                            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold mb-1">注意：將覆蓋所有數據</p>
                                <p className="opacity-90">這包括您的資源庫進度條、今日計劃和錯題本。操作不可逆。</p>
                            </div>
                        </div>
                    )}

                    {importStatus === 'idle' ? (
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">請粘貼存檔碼</label>
                            <textarea 
                                value={importText}
                                onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
                                className="w-full h-40 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs font-mono text-gray-600 resize-none"
                                placeholder='{"meta": {...}, "data": {...}}'
                            />
                            {importError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={12}/> {importError}</p>}
                        </div>
                    ) : (
                        <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
                             {importStatus === 'processing' ? (
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <Loader2 className="w-16 h-16 text-indigo-200 animate-spin absolute" strokeWidth={1} />
                                    <span className="text-indigo-600 font-bold text-sm">{progress}%</span>
                                </div>
                             ) : (
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-in zoom-in duration-300">
                                    <CheckCircle2 size={32} />
                                </div>
                             )}
                             
                             <div>
                                 <h4 className="font-bold text-gray-800 text-lg">
                                     {importStatus === 'processing' ? '正在解析存檔...' : '恢復成功！'}
                                 </h4>
                                 <p className="text-sm text-gray-500 mt-1">
                                     {importStatus === 'processing' ? '正在重建資源庫與任務隊列' : '頁面即將刷新，歡迎回來。'}
                                 </p>
                             </div>

                             {/* Progress Bar Visual */}
                             <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden max-w-xs mt-2">
                                <div 
                                    className={`h-full transition-all duration-300 ease-out ${importStatus === 'success' ? 'bg-green-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${progress}%` }}
                                />
                             </div>
                        </div>
                    )}

                    {importStatus === 'idle' && (
                        <button 
                            onClick={handleImportSubmit}
                            disabled={!importText.trim()}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                            <Upload size={18} /> 讀取存檔
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
