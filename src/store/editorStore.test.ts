import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editorStore";

describe("editorStore", () => {
  beforeEach(() => {
    useEditorStore.setState({ tabs: [], activePath: null, splitCount: 1, theme: "dark" });
  });

  it("opens and activates tab", () => {
    useEditorStore.getState().openTab({ path: "a.py", content: "print(1)", dirty: false, language: "python" });
    const s = useEditorStore.getState();
    expect(s.tabs.length).toBe(1);
    expect(s.activePath).toBe("a.py");
  });

  it("marks dirty on content update", () => {
    useEditorStore.getState().openTab({ path: "b.c", content: "int x;", dirty: false, language: "c" });
    useEditorStore.getState().updateContent("b.c", "int y;");
    expect(useEditorStore.getState().tabs[0].dirty).toBe(true);
  });

  it("closes tab and switches active", () => {
    useEditorStore.getState().openTab({ path: "a.py", content: "1", dirty: false, language: "python" });
    useEditorStore.getState().openTab({ path: "b.py", content: "2", dirty: false, language: "python" });
    useEditorStore.getState().closeTab("b.py");
    expect(useEditorStore.getState().activePath).toBe("a.py");
  });

  it("toggles theme and persists", () => {
    useEditorStore.getState().setTheme("light");
    expect(useEditorStore.getState().theme).toBe("light");
    expect(localStorage.getItem("liteide-theme")).toBe("light");
  });

  it("handles split count", () => {
    useEditorStore.getState().setSplitCount(2);
    expect(useEditorStore.getState().splitCount).toBe(2);
  });
});
