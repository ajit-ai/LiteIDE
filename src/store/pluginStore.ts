import { create } from "zustand";

export interface PluginMeta {
  id: string;
  name: string;
  version: string;
  languages: string[];
  description?: string;
}

interface PluginState {
  plugins: PluginMeta[];
  setPlugins: (p: PluginMeta[]) => void;
}

export const usePluginStore = create<PluginState>((set) => ({
  plugins: [],
  setPlugins: (plugins) => set({ plugins }),
}));
