
export enum ResourceType {
  QUESTIONS = 'Questions', // 題目
  SECTIONS = 'Sections',   // 節/課 (原 Minutes)
  ARTICLES = 'Articles',   // 篇/章
  PAGES = 'Pages'          // 頁
}

export type StudyStage = 'Foundation' | 'Review' | 'Sprint';

export interface SubModule {
  id: string;
  name: string;
  type: ResourceType;
  totalItems: number;
  completedItems: number;
  color?: string;
}

export interface ResourceApp {
  id: string;
  name: string; 
  description?: string;
  isSystem?: boolean; // To identify Core/Aux/Side apps vs User added
  modules: SubModule[];
}

export interface DailyTask {
  id: string;
  moduleId: string;
  resourceId: string;
  resourceName: string;
  moduleName: string;
  targetAmount: number; 
  completedAmount: number;
  isCompleted: boolean;
  date: string; 
  tag?: '核心 A' | '輔助 B' | '副線 C' | '額外充電 E' | '回鍋 R' | '手動';
  notes?: string; // Used for specific knowledge point tracking
  aiTip?: string; // Store the AI generated advice locally
  isAiLoading?: boolean; // UI state for loading
}

export interface ReviewItem {
  id: string;
  resourceId: string;
  resourceName: string;
  moduleId: string;
  moduleName: string;
  wrongCount: number;
  knowledgePoint?: string; // The specific topic user struggled with
  createdAt: string;
}

export interface AppState {
  resources: ResourceApp[];
  dailyPlan: DailyTask[];
  reviewQueue: ReviewItem[];
  studyStage?: StudyStage;
}

export const MOCK_INITIAL_DATA: ResourceApp[] = [
  {
    id: 'app-yiqikao',
    name: '一起考教師',
    description: '核心題庫 (Slot A)',
    isSystem: true,
    modules: [
      { id: 'm-k1', name: '科目一：綜合素質', type: ResourceType.QUESTIONS, totalItems: 2360, completedItems: 0, color: '#fb7185' }, // Red/Pink
      { id: 'm-k2', name: '科目二：教育教學', type: ResourceType.QUESTIONS, totalItems: 3826, completedItems: 0, color: '#f472b6' },
    ]
  },
  {
    id: 'app-fenbi',
    name: '粉筆 App',
    description: '視頻與專項 (Slot B)',
    isSystem: true,
    modules: [
      { id: 'm-fb-video', name: '必背考點視頻課', type: ResourceType.SECTIONS, totalItems: 49, completedItems: 0, color: '#60a5fa' }, // Blue
      { id: 'm-fb-law', name: '法律法規專項', type: ResourceType.QUESTIONS, totalItems: 1368, completedItems: 0, color: '#818cf8' },
      { id: 'm-fb-read', name: '閱讀理解專項', type: ResourceType.ARTICLES, totalItems: 20, completedItems: 0, color: '#a78bfa' }
    ]
  },
  {
    id: 'app-changyan',
    name: '暢言普通話',
    description: '證書備考 (Slot C)',
    isSystem: true,
    modules: [
      { id: 'm-cy-read', name: '短文朗讀', type: ResourceType.ARTICLES, totalItems: 50, completedItems: 0, color: '#34d399' }, // Green
      { id: 'm-cy-speak', name: '命題說話', type: ResourceType.SECTIONS, totalItems: 50, completedItems: 0, color: '#2dd4bf' },
      { id: 'm-cy-base', name: '聲母韻母正音', type: ResourceType.SECTIONS, totalItems: 60, completedItems: 0, color: '#10b981' }
    ]
  }
];
