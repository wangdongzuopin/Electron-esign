export interface SignStampVO {
  id: string;
  type: 'SIGNATURE' | 'SEAL';
  name: string;
  base64: string; // PNG data URL or base64 string
  width: number; // mm
  height: number; // mm
  cert?: any; // placeholder for Certificate structure
  createAt: number;
}

export interface SignPosition {
  stampId: string;
  x: number; // left-bottom in PDF points
  y: number;
  scale: number;
  rotation: number; // degrees
}

export interface SignTaskPage {
  pageIndex: number;
  signs: SignPosition[];
}

export interface SignTask {
  pdfPath?: string; // optional path for persisted tasks
  pdfBytes?: ArrayBuffer; // optional in-memory PDF
  pages: SignTaskPage[];
}