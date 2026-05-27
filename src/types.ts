export interface AppWindow {
  id: string;
  title: string;
  icon: string; // Emoji or Lucide icon key
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  defaultWidth: number;
  defaultHeight: number;
  zIndex: number;
}

export interface DesktopIconType {
  id: string;
  title: string;
  icon: string; // Emoji / specific SVG / Lucide name
  type: 'app' | 'folder' | 'file';
  action: string; // Window ID or specific router/trigger
  x?: number; // Optional grid position fallback
  y?: number;
}

export interface FolderItem {
  name: string;
  type: 'file' | 'folder' | 'app';
  icon: string;
  size?: string;
  content?: string; // For text files
  action?: string; // Action on double click
  imageUrl?: string; // If image
}

export interface GuestbookEntry {
  name: string;
  message: string;
  date: string;
}
