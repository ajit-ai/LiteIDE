import { create } from "zustand";

export interface Tab {
  path: string;
  content: string;
  dirty: boolean;
  language: string;
  cursorLine?: number;
  cursorCol?: number;
}

interface EditorState {
  tabs: Tab[];
  activePath: string | null;
  splitCount: number;
  theme: "light" | "dark";
  // actions
  openTab: (tab: Tab) => void;
  closeTab: (path: string) => void;
  updateContent: (path: string, content: string) => void;
  setActive: (path: string | null) => void;
  markSaved: (path: string) => void;
  setTheme: (t: "light" | "dark") => void;
  setSplitCount: (n: number) => void;
}

const persistedTheme = (typeof localStorage !== "undefined" && (localStorage.getItem("liteide-theme") as "light" | "dark")) || "dark";

export const useEditorStore = create<EditorState>((set) => ({
  tabs: [],
  activePath: null,
  splitCount: 1,
  theme: persistedTheme,
  openTab: (tab) =>
    set((s) => {
      const exists = s.tabs.find((t) => t.path === tab.path);
      if (exists) return { activePath: tab.path };
      return { tabs: [...s.tabs, tab], activePath: tab.path };
    }),
  closeTab: (path) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t.path !== path);
      let active = s.activePath;
      if (active === path) active = tabs.length ? tabs[tabs.length - 1].path : null;
      return { tabs, activePath: active };
    }),
  updateContent: (path, content) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.path === path ? { ...t, content, dirty: true } : t)),
    })),
  setActive: (path) => set({ activePath: path }),
  markSaved: (path) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.path === path ? { ...t, dirty: false } : t)),
    })),
  setTheme: (theme) => {
    if (typeof localStorage !== "undefined") localStorage.setItem("liteide-theme", theme);
    // also persist via Tauri global config if available
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (w.__TAURI__) {
        import("@tauri-apps/api/core").then(({ invoke }) =>
          invoke("get_global_config").then((cfg: unknown) => {
            const c = cfg as { theme: string };
            c.theme = theme;
            invoke("save_global_config", { config: c }).catch(() => {});
          }),
        );
      }
    } catch {}
    return set({ theme });
  },
  setSplitCount: (n) => set({ splitCount: n }),
}));
