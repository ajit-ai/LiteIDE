import { create } from "zustand";

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileEntry[];
}

interface FileState {
  rootPath: string | null;
  tree: FileEntry | null;
  selectedPath: string | null;
  recentProjects: string[];
  searchResults: { file: string; line: number; content: string }[];
  setRoot: (p: string | null) => void;
  setTree: (t: FileEntry | null) => void;
  setSelected: (p: string | null) => void;
  setRecent: (r: string[]) => void;
  setSearchResults: (res: { file: string; line: number; content: string }[]) => void;
}

export const useFileStore = create<FileState>((set) => ({
  rootPath: null,
  tree: null,
  selectedPath: null,
  recentProjects: [],
  searchResults: [],
  setRoot: (rootPath) => set({ rootPath }),
  setTree: (tree) => set({ tree }),
  setSelected: (selectedPath) => set({ selectedPath }),
  setRecent: (recentProjects) => set({ recentProjects }),
  setSearchResults: (searchResults) => set({ searchResults }),
}));
