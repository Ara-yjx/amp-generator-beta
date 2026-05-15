export type CsvRow = Record<string, string | number | undefined>;

export type DataFormat = 'Wide' | 'Long';

export type ActiveTab = 'data' | 'analysis' | 'plot';

export interface CleaningOptions {
  removeIncompleteResponses: boolean;
  removeLowQualResponses: boolean;
  participantIqr: boolean;
  participantCustom: boolean;
  thresholdLower: number;
  thresholdUpper: number;
}

export interface AnalysisParams {
  paradigm: string;
  type: string;
}

export interface PlotParams {
  title: string;
  color: string;
  xLabel: string;
  yLabel: string;
  customYRange: boolean;
  yMin: number;
  yMax: number;
}

export interface SummaryRow {
  ID: string | number;
  k_control: number;
  d_control: number;
  k_target: number;
  d_target: number;
  target_ratio: number;
  control_ratio: number;
}

export interface AnalysisStats {
  target: { mean: number; sd: number; n: number };
  control: { mean: number; sd: number; n: number };
}

export interface TTestResult {
  mean1: number;
  mean2: number;
  meanDifference: number;
  tStatistic: number;
  degreesOfFreedom: number;
  pValue: number;
  method: string;
}

export interface AnalysisResult {
  summary: SummaryRow[];
  stats: AnalysisStats | null;
  tTestResult?: TTestResult;
}

export interface PlotChartDatum {
  group: string;
  mean: number;
  se: number;
  n: number;
}
