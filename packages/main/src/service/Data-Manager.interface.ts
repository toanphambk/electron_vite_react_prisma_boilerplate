export interface ExcelReadParam {
  dir: string;
  sheetName: string;
  startCell: string;
  numCols: number;
  emptyRowsToCheck: number;
}

export interface FileInfo {
  model: string;
  partId: string;
}

export interface FileInfo {
  model: string;
  partId: string;
}

export interface PointRate {
  id: string;
  robotName: string;
  position: string;
  weldingPoint: string;
  overallFailRate: number;
  visionproFailRate: number;
  deeplearningFailRate: number;
}

export interface getPointRateParam {
  start: string;
  end: string;
  model: string;
}
