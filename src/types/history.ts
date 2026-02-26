export interface HistoryEntry {
  id: string;
  a: number;
  b: number;
  c: number;
  x: number;
  solvedField: 'a' | 'b' | 'c' | 'x';
  createdAt: number;
}
