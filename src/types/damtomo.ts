export interface DamtomoRecord {
  scoringAiId: string;
  requestNo: string;
  contentsName: string;
  artistName: string;
  dContentsName: string;
  dArtistName: string;
  damserial: string;
  dataKind: string;
  clubDamCardNo: string;
  entryCount?: number;
  analysisReportCommentNo?: string;
  radarChartPitch?: number;
  radarChartStability?: number;
  radarChartExpressive?: number;
  radarChartVibratoLongtone?: number;
  radarChartRhythm?: number;
  singingRangeHighest?: string;
  singingRangeLowest?: string;
  vocalRangeHighest?: string;
  vocalRangeLowest?: string;
  score?: number;
  performedAt: Date;
}

export interface DamtomoPaginationMeta {
  dataCount: number;
  pageCount: number;
  hasNext: boolean;
}

export interface DamtomoPageResponse {
  records: DamtomoRecord[];
  meta: DamtomoPaginationMeta;
}

export interface SongSummary {
  requestNo: string;
  dContentsName: string;
  dArtistName: string;
  playCount: number;
  bestScore: number | null;
  avgScore: number | null;
  lastPlayed: string | null;
}

export interface GlobalStats {
  totalRecords: number;
  uniqueSongs: number;
  bestScore: number | null;
  avgScore: number | null;
  recentRecords: RecentRecord[];
}

export interface RecentRecord {
  scoringAiId: string;
  dContentsName: string;
  dArtistName: string;
  radarChartPitch: number | null;
  radarChartStability: number | null;
  radarChartExpressive: number | null;
  radarChartVibratoLongtone: number | null;
  radarChartRhythm: number | null;
  performedAt: string;
  requestNo: string;
}
