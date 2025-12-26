export interface RawRow {
  [key: string]: any;
}

export interface AnalyzedKeyword {
  original: string;
  cluster: string;
  isEnglish: boolean;
  isBrand: boolean;
  intent: 'Navigational' | 'Informational' | 'Transactional' | 'Commercial' | 'Unknown';
}

export interface AnalysisStats {
  total: number;
  englishCount: number;
  brandCount: number;
  clusters: { name: string; count: number }[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
