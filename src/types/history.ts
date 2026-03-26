export interface HistoryEntry {
  id: string;
  a: number;
  b: number;
  c: number;
  x: number;
  solvedField: 'a' | 'b' | 'c' | 'x';
  createdAt: number;
}

export type PercentageMode = 'percentOf' | 'variation' | 'increase' | 'decrease' | 'whatPercent';

export interface PercentageHistoryEntry {
  id: string;
  mode: PercentageMode;
  field1: number;
  field2: number;
  result: string;
  createdAt: number;
}

export interface ConversionHistoryEntry {
  id: string;
  category: 'weight' | 'volume' | 'temperature';
  fromUnit: string;
  toUnit: string;
  value: number;
  result: string;
  createdAt: number;
}
