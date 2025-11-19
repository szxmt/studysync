
import React, { useState, useEffect } from 'react';
import { ResourceApp, DailyTask, MOCK_INITIAL_DATA, SubModule, ResourceType, ReviewItem, AppState, StudyStage } from './types';
import { ResourceCard } from './components/ResourceCard';
import { DailyPlanner } from './components/DailyPlanner';
import { AddPlanModal } from './components/AddPlanModal';
import { AddResourceModal } from './components/AddResourceModal';
import { GlobalProgress } from './components/GlobalProgress';
import { TaskSettlementModal } from './components/TaskSettlementModal';
import { SettingsModal } from './components/SettingsModal';
import { generateKnowledgeTip } from './services/geminiService';
import { LayoutDashboard, Plus, BookOpen, Settings, Rocket, Database, Calendar, Home, Zap, Target, Layers } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [resources, setResources] = useState<ResourceApp[]>(() => {
    const saved = localStorage.getItem('studySync_resources');
    return saved ? JSON.parse(saved) : MOCK_INITIAL_DATA;
  });

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
    const saved = localStorage.getItem('studySync_daily');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem('studySync_reviewQueue');
    return saved ? JSON.parse(saved) : [];
  });

  const [studyStage, setStudyStage] = useState<StudyStage>(() => {
    const saved = localStorage.getItem('studySync_stage');
    return (saved as StudyStage) || 'Foundation';
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Mobile Tab State
  const [activeMobileTab, setActiveMobileTab] = useState<'resources' | 'planner'>('resources');

  // Modals
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [selectedResourceForPlan, setSelectedResourceForPlan] = useState<{id: string, name: string} | null>(null);
  const [selectedModuleForPlan, setSelectedModuleForPlan] = useState<SubModule | null>(null);
  
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Settlement Modal
  const [settlementTask, setSettlementTask] = useState<DailyTask | null>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('studySync_resources', JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('studySync_daily', JSON.stringify(dailyTasks));
  }, [dailyTasks]);

  useEffect(() => {
    localStorage.setItem('studySync_reviewQueue', JSON.stringify(reviewQueue));
  }, [reviewQueue]);

  useEffect(() => {
    localStorage.setItem('studySync_stage', studyStage);
  }, [studyStage]);

  // --- Toast Helper ---
  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 3000);
  };

  // --- Logic: Piggy Run (Automatic Plan) ---
  const generatePiggyRunPlan = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
    const dateNum = now.getDate();  // 1 - 31
    const isOddDate = dateNum % 2 !== 0;
    
    const newTasks: DailyTask[] = [];
    const usedReviewIds: string[] = [];

    // Helper to find resource/module
    const findRes = (namePart: string) => resources.find(r => r.name.includes(namePart));
    const findMod = (res: ResourceApp, namePart: string) => res.modules.find(m => m.name.includes(namePart));
    // Helper to get uncompleted module
    const getUncompleted = (res: ResourceApp) => res.modules.filter(m => m.completedItems < m.totalItems);
    
    // --- Strategy Switch ---
    // 1. 🌱 Foundation (基礎夯實): Focus on NEW progress, low review.
    if (studyStage === 'Foundation') {
        // A. Review (Max 2)
        if (reviewQueue.length > 0) {
            const itemsToReview = reviewQueue.slice(0, 2);
            itemsToReview.forEach(item => {
                 const res = resources.find(r => r.id === item.resourceId);
                 const mod = res?.modules.find(m => m.id === item.moduleId);
                 if (res && mod) {
                     newTasks.push({
                        id: crypto.randomUUID(),
                        resourceId: res.id, resourceName: res.name, moduleId: mod.id,
                        moduleName: `🎯 弱項：${item.knowledgePoint || mod.name}`,
                        targetAmount: item.wrongCount > 0 ? item.wrongCount : 5,
                        completedAmount: 0, isCompleted: false, date: new Date().toISOString(),
                        tag: '回鍋 R', notes: '基礎期錯題回顧'
                     });
                     usedReviewIds.push(item.id);
                 }
            });
        }

        // B. Core (New Only)
        const yiQiKao = findRes('一起考');
        if (yiQiKao) {
            const targetMod = isOddDate 
                ? yiQiKao.modules.find(m => m.name.includes('科目一') || m.name.includes('綜合')) 
                : yiQiKao.modules.find(m => m.name.includes('科目二') || m.name.includes('教育'));
            // If target completed, try find any uncompleted
            const finalMod = (targetMod && targetMod.completedItems < targetMod.totalItems) ? targetMod : (getUncompleted(yiQiKao)[0]);
            
            if (finalMod) newTasks.push(createTask(yiQiKao, finalMod, 30, '核心 A')); 
        }

        // C. Aux & Side
        const fenBi = findRes('粉筆');
        if (fenBi) {
             const mods = getUncompleted(fenBi);
             if (mods.length > 0) newTasks.push(createTask(fenBi, mods[0], 1, '輔助 B'));
        }
        const changYan = findRes('暢言');
        if (changYan) {
             const mods = getUncompleted(changYan);
             if (mods.length > 0) newTasks.push(createTask(changYan, mods[0], 1, '副線 C'));
        }

        showToast("🌱 已生成「基礎夯實」計劃：推進度為主！");
    }

    // 2. 🔥 Review (強化突破): High Review, Mix Old/New.
    else if (studyStage === 'Review') {
        // A. Review (Max 5 - High Priority)
        if (reviewQueue.length > 0) {
            const itemsToReview = reviewQueue.slice(0, 5);
            itemsToReview.forEach(item => {
                 const res = resources.find(r => r.id === item.resourceId);
                 const mod = res?.modules.find(m => m.id === item.moduleId);
                 if (res && mod) {
                     newTasks.push({
                        id: crypto.randomUUID(),
                        resourceId: res.id, resourceName: res.name, moduleId: mod.id,
                        moduleName: `🔥 強突：${item.knowledgePoint || mod.name}`,
                        targetAmount: Math.max(5, item.wrongCount * 2), // Double effort
                        completedAmount: 0, isCompleted: false, date: new Date().toISOString(),
                        tag: '回鍋 R', notes: '強化期重點攻堅'
                     });
                     usedReviewIds.push(item.id);
                 }
            });
        }

        // B. Core (Mix 50/50)
        const yiQiKao = findRes('一起考');
        if (yiQiKao) {
            const coinFlip = Math.random() > 0.5;
            // If heads, pick a COMPLETED module to review. If tails, pick NEW.
            let targetMod;
            if (coinFlip) {
                const completedMods = yiQiKao.modules.filter(m => m.completedItems >= m.totalItems);
                if (completedMods.length > 0) {
                     targetMod = completedMods[Math.floor(Math.random() * completedMods.length)];
                     // Review completed module
                     if(targetMod) newTasks.push(createTask(yiQiKao, targetMod, 20, '核心 A')); 
                }
            } 
            
            if (!targetMod) {
                 // Fallback to new
                 const uncompleted = getUncompleted(yiQiKao);
                 if(uncompleted.length > 0) newTasks.push(createTask(yiQiKao, uncompleted[0], 40, '核心 A'));
            }
        }
        
        // C. Aux (Standard)
        const fenBi = findRes('粉筆');
        if (fenBi) {
            const isVideoDay = [1, 3, 5].includes(dayOfWeek);
            const key = isVideoDay ? '視頻' : '專項';
            const mod = fenBi.modules.find(m => m.name.includes(key)) || fenBi.modules[0];
            if (mod) newTasks.push(createTask(fenBi, mod, 1, '輔助 B'));
        }

        showToast("🔥 已生成「強化突破」計劃：新舊交替，查漏補缺！");
    }

    // 3. ⚡️ Sprint (考前衝刺): Simulation Mode, High Volume.
    else if (studyStage === 'Sprint') {
        // A. Review (Clear Queue)
        if (reviewQueue.length > 0) {
            reviewQueue.slice(0, 10).forEach(item => {
                 const res = resources.find(r => r.id === item.resourceId);
                 const mod = res?.modules.find(m => m.id === item.moduleId);
                 if (res && mod) {
                     newTasks.push({
                        id: crypto.randomUUID(),
                        resourceId: res.id, resourceName: res.name, moduleId: mod.id,
                        moduleName: `⚡️ 掃雷：${item.knowledgePoint || mod.name}`,
                        targetAmount: 1, // Just clear it
                        completedAmount: 0, isCompleted: false, date: new Date().toISOString(),
                        tag: '回鍋 R', notes: '衝刺期快速掃雷'
                     });
                     usedReviewIds.push(item.id);
                 }
            });
        }

        // B. Core (Simulation Volume)
        const yiQiKao = findRes('一起考');
        if (yiQiKao) {
            // Ignore modules, just pick one and assign HUGE amount
            const randomMod = yiQiKao.modules[Math.floor(Math.random() * yiQiKao.modules.length)];
            if (randomMod) {
                 newTasks.push({
                    id: crypto.randomUUID(),
                    resourceId: yiQiKao.id, resourceName: yiQiKao.name, moduleId: randomMod.id,
                    moduleName: `${randomMod.name} (全真模擬)`,
                    targetAmount: 100, // Huge amount
                    completedAmount: 0, isCompleted: false, date: new Date().toISOString(),
                    tag: '核心 A', notes: '衝刺期題海戰術'
                 });
            }
        }
        
        showToast("⚡️ 已生成「考前衝刺」計劃：全真模擬，火力全開！");
    }

    setReviewQueue(prev => prev.filter(item => !usedReviewIds.includes(item.id)));
    setDailyTasks(prev => [...prev, ...newTasks]); 
    if (window.innerWidth < 768) setActiveMobileTab('planner');
  };

  const createTask = (res: ResourceApp, mod: SubModule, amount: number, tag: any): DailyTask => ({
    id: crypto.randomUUID(),
    resourceId: res.id,
    resourceName: res.name,
    moduleId: mod.id,
    moduleName: mod.name,
    targetAmount: amount,
    completedAmount: 0,
    isCompleted: false,
    date: new Date().toISOString(),
    tag
  });

  // --- Handlers ---
  const handleDeleteResource = (id: string) => {
    if (window.confirm("確定要刪除此資源及其相關記錄嗎？")) {
      setResources(prev => prev.filter(r => r.id !== id));
      setDailyTasks(prev => prev.filter(t => t.resourceId !== id));
    }
  };

  const handleEditResourceName = (id: string, newName: string) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r));
  };

  const handleAddResource = (newResource: ResourceApp) => {
    setResources(prev => [...prev, newResource]);
  };

  const handleAddModuleToResource = (resourceId: string, name: string, totalItems: number, type: ResourceType) => {
    const newModule: SubModule = {
      id: crypto.randomUUID(),
      name,
      type,
      totalItems,
      completedItems: 0,
      color: getRandomPastelColor()
    };
    setResources(prev => prev.map(r => r.id === resourceId ? { ...r, modules: [...r.modules, newModule] } : r));
  };

  const handleDeleteModule = (resourceId: string, moduleId: string) => {
    if(!window.confirm("確定刪除此單元？")) return;
    setResources(prev => prev.map(r => r.id === resourceId ? { ...r, modules: r.modules.filter(m => m.id !== moduleId) } : r));
    setDailyTasks(prev => prev.filter(t => t.moduleId !== moduleId));
  };

  const openPlanModal = (resourceId: string, module: SubModule) => {
    const res = resources.find(r => r.id === resourceId);
    if (res) {
        setSelectedResourceForPlan({ id: res.id, name: res.name });
        setSelectedModuleForPlan(module);
        setIsAddPlanOpen(true);
    }
  };

  const confirmAddToPlan = (amount: number) => {
    if (!selectedModuleForPlan || !selectedResourceForPlan) return;
    const newTask = createTask(
        resources.find(r => r.id === selectedResourceForPlan.id)!, 
        selectedModuleForPlan, 
        amount, 
        '手動'
    );
    setDailyTasks(prev => [...prev, newTask]);
    if (window.innerWidth < 768) setActiveMobileTab('planner');
  };

  const updateResourceProgress = (resId: string, modId: string, delta: number) => {
    if (delta === 0) return;
    setResources(prev => prev.map(res => {
      if (res.id !== resId) return res;
      return {
          ...res,
          modules: res.modules.map(mod => {
              if (mod.id !== modId) return mod;
              const newCompleted = Math.min(mod.totalItems, Math.max(0, mod.completedItems + delta));
              return { ...mod, completedItems: newCompleted };
          })
      };
    }));
  };

  // 1. Toggle Checkbox logic
  const toggleTaskCompletion = (taskId: string, _ignoredAmount?: number) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    const isNowComplete = !task.isCompleted;
    const newCompleted = isNowComplete ? task.targetAmount : 0;
    const delta = newCompleted - task.completedAmount;

    setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: isNowComplete, completedAmount: newCompleted } : t));
    updateResourceProgress(task.resourceId, task.moduleId, delta);
  };

  // 2. Manual Update Logic
  const handleUpdateTask = (taskId: string, newTarget: number, newCompleted: number) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const delta = newCompleted - task.completedAmount;
    const isNowComplete = newCompleted >= newTarget;

    setDailyTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        targetAmount: newTarget,
        completedAmount: newCompleted,
        isCompleted: isNowComplete
    } : t));

    updateResourceProgress(task.resourceId, task.moduleId, delta);
  };

  // 3. Settlement (when clicking an unchecked circle)
  const handleTaskClick = (taskId: string) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.isCompleted) {
        toggleTaskCompletion(taskId); 
    } else {
        setSettlementTask(task);
    }
  };

  const handleSettlementConfirm = (wrongCount: number, knowledgePoint: string) => {
    if (!settlementTask) return;
    toggleTaskCompletion(settlementTask.id);
    setSettlementTask(null);

    if (wrongCount > 0) {
        const newItem: ReviewItem = {
            id: crypto.randomUUID(),
            resourceId: settlementTask.resourceId,
            resourceName: settlementTask.resourceName,
            moduleId: settlementTask.moduleId,
            moduleName: settlementTask.moduleName,
            wrongCount: wrongCount,
            knowledgePoint: knowledgePoint,
            createdAt: new Date().toISOString()
        };
        setReviewQueue(prev => [...prev, newItem]);
    }
  };

  const deleteTask = (taskId: string) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (task && task.completedAmount > 0) {
        updateResourceProgress(task.resourceId, task.moduleId, -task.completedAmount);
    }
    setDailyTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleFetchAiTip = async (taskId: string) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    let topic = task.notes || '';
    if (task.moduleName.includes('🎯') && (!topic || topic.includes('來源'))) {
         const parts = task.moduleName.split('：');
         if (parts.length > 1) topic = parts[1];
    }
    if (!topic) topic = task.moduleName;
    setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, isAiLoading: true } : t));
    const tip = await generateKnowledgeTip(task.resourceName, task.moduleName, topic);
    setDailyTasks(prev => prev.map(t => t.id === taskId ? { 
      ...t, isAiLoading: false, aiTip: tip || '無法生成建議，請稍後再試。'
    } : t));
  };

  const handleImportData = (newData: AppState) => {
      setResources(newData.resources);
      setDailyTasks(newData.dailyPlan);
      setReviewQueue(newData.reviewQueue || []);
      setStudyStage(newData.studyStage || 'Foundation');
      window.location.reload();
  };

  const handleResetData = () => {
      localStorage.clear();
      window.location.reload();
  };

  function getRandomPastelColor() {
    const colors = ['#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#67e8f9', '#93c5fd', '#c4b5fd', '#f9a8d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const getResourceType = (resId: string, modId: string): ResourceType => {
      const res = resources.find(r => r.id === resId);
      const mod = res?.modules.find(m => m.id === modId);
      return mod ? mod.type : ResourceType.QUESTIONS;
  };

  const incompleteTasksCount = dailyTasks.filter(t => !t.isCompleted).length;

  // Helper for stage config
  const stages: {id: StudyStage, label: string, icon: any, color: string}[] = [
    { id: 'Foundation', label: '基礎', icon: '🌱', color: 'bg-green-50 text-green-700' },
    { id: 'Review', label: '強化', icon: '🔥', color: 'bg-orange-50 text-orange-700' },
    { id: 'Sprint', label: '衝刺', icon: '⚡️', color: 'bg-red-50 text-red-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row overflow-hidden relative">
      
      {/* Toast */}
      {toastMsg && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-5 fade-in">
              <div className="bg-gray-900/90 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
                  <Zap size={16} className="text-yellow-400" />
                  {toastMsg}
              </div>
          </div>
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0 flex md:flex-col justify-between z-20">
        <div className="px-4 py-3 md:p-6 flex flex-row md:flex-col justify-between items-center md:items-start w-full h-full">
          <div className="w-full flex justify-between md:block items-center">
            <div className="flex items-center gap-3 md:mb-8">
                <div className="bg-black text-white p-2 rounded-lg">
                    <BookOpen size={20} />
                </div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight">StudySync</h1>
            </div>
            
            {/* Mobile Stage Selector + Settings */}
            <div className="md:hidden flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-0.5 mr-2">
                   {stages.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setStudyStage(s.id)}
                            className={`p-1.5 rounded-md ${studyStage === s.id ? 'bg-white shadow text-black' : 'text-gray-400'}`}
                        >
                            <span className="text-xs">{s.icon}</span>
                        </button>
                    ))}
                </div>
                {activeMobileTab === 'resources' && (
                    <button onClick={() => setIsAddResourceOpen(true)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-700 transition-colors"><Plus size={20} /></button>
                )}
                <button onClick={() => setIsSettingsOpen(true)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-700 transition-colors"><Settings size={20} /></button>
            </div>

            <nav className="hidden md:flex flex-col gap-2 w-full mt-6">
                {/* Desktop Stage Selector */}
                <div className="mb-6">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 px-2 flex items-center gap-1"><Layers size={10}/> 當前戰略</h3>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {stages.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setStudyStage(s.id)}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex justify-center items-center gap-1 ${studyStage === s.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                title={s.label}
                            >
                                <span>{s.icon}</span>
                                <span>{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button className="flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium transition-colors w-full text-left">
                <LayoutDashboard size={18} /> 儀表板
                </button>
                <button 
                    onClick={generatePiggyRunPlan}
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all w-full text-left mt-2"
                >
                <Rocket size={18} /> 🐷 小豬快跑
                </button>
            </nav>
          </div>

          <div className="hidden md:block w-full">
            <div className="p-6 border-t border-gray-100 mb-4">
                <div className="bg-gray-50 rounded-xl p-4 text-gray-600">
                    <p className="text-xs font-medium mb-1 text-gray-400">備考小貼士</p>
                    <p className="text-sm">「不做選擇題，直接按小豬快跑。」</p>
                </div>
            </div>
            
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl w-full transition-colors group">
               <div className="relative">
                  <Settings size={18} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
               </div>
               <div className="text-left">
                 <span className="text-sm font-medium block group-hover:text-gray-800">數據管理</span>
                 <span className="text-[10px] text-gray-400 block">本地已保存</span>
               </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden relative">
        <GlobalProgress resources={resources} />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 ${activeMobileTab === 'resources' ? 'block' : 'hidden md:block'}`}>
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            學習資源庫
                            <span className={`text-xs px-2 py-1 rounded-full border ${stages.find(s=>s.id===studyStage)?.color}`}>
                                {stages.find(s=>s.id===studyStage)?.label}模式
                            </span>
                        </h2>
                        <p className="text-gray-500 mt-1 text-xs md:text-sm">管理題庫與課程。新增的教材會被「小豬快跑」自動捕獲。</p>
                    </div>
                    <button onClick={() => setIsAddResourceOpen(true)} className="hidden md:flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all shadow-sm hover:shadow-md active:scale-95">
                        <Plus size={18} /> 新增資源
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {resources.map(res => (
                        <ResourceCard 
                            key={res.id} 
                            resource={res} 
                            onAddToPlan={openPlanModal}
                            onDeleteResource={handleDeleteResource}
                            onEditName={handleEditResourceName}
                            onAddModule={handleAddModuleToResource}
                            onDeleteModule={handleDeleteModule}
                        />
                    ))}
                    {resources.length === 0 && (
                         <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                             <BookOpen className="text-gray-300 mb-3" size={48} />
                             <h3 className="text-gray-600 font-medium">暫無學習資源</h3>
                             <button onClick={() => setIsAddResourceOpen(true)} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">+ 立即新增</button>
                         </div>
                    )}
                </div>
            </div>

            <div className={`w-full md:w-96 border-l border-gray-200 bg-white flex-shrink-0 z-10 ${activeMobileTab === 'planner' ? 'block' : 'hidden md:block'}`}>
                <DailyPlanner 
                    tasks={dailyTasks}
                    onToggleComplete={handleTaskClick} 
                    onDeleteTask={deleteTask}
                    onAskAI={handleFetchAiTip}
                    onUpdateTask={handleUpdateTask}
                />
            </div>
        </div>
        
        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 pb-6 pt-3 flex justify-between items-center z-50 shadow-2xl shadow-black/10">
            <button onClick={() => setActiveMobileTab('resources')} className={`flex flex-col items-center gap-1 transition-colors ${activeMobileTab === 'resources' ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>
                <Home size={24} strokeWidth={activeMobileTab === 'resources' ? 2.5 : 2} />
                <span className="text-[10px]">資源庫</span>
            </button>
            <button onClick={generatePiggyRunPlan} className="relative -top-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-full shadow-lg shadow-rose-200 border-4 border-gray-50 hover:scale-105 active:scale-95 transition-transform">
                <Rocket size={28} fill="white" />
            </button>
            <button onClick={() => setActiveMobileTab('planner')} className={`flex flex-col items-center gap-1 transition-colors relative ${activeMobileTab === 'planner' ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>
                <div className="relative">
                    <Calendar size={24} strokeWidth={activeMobileTab === 'planner' ? 2.5 : 2} />
                    {incompleteTasksCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-white">{incompleteTasksCount > 9 ? '9+' : incompleteTasksCount}</span>}
                </div>
                <span className="text-[10px]">今日計劃</span>
            </button>
        </div>
      </main>

      <AddPlanModal isOpen={isAddPlanOpen} onClose={() => setIsAddPlanOpen(false)} onConfirm={confirmAddToPlan} module={selectedModuleForPlan} resourceName={selectedResourceForPlan?.name || ''} />
      <AddResourceModal isOpen={isAddResourceOpen} onClose={() => setIsAddResourceOpen(false)} onAdd={handleAddResource} />
      <TaskSettlementModal isOpen={!!settlementTask} onClose={() => setSettlementTask(null)} onConfirm={handleSettlementConfirm} task={settlementTask} resourceType={settlementTask ? getResourceType(settlementTask.resourceId, settlementTask.moduleId) : ResourceType.QUESTIONS} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} fullData={{ resources, dailyPlan: dailyTasks, reviewQueue, studyStage }} onImport={handleImportData} onReset={handleResetData} />
    </div>
  );
};

export default App;
