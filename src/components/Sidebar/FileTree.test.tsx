import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FileTree from "./FileTree";
import { useFileStore } from "../../store/fileStore";
import { useEditorStore } from "../../store/editorStore";

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(() => Promise.resolve(null)),
}));

describe("FileTree — file open if it works as per requirement", () => {
  beforeEach(() => {
    useFileStore.setState({ rootPath: "C:/proj", tree: null, selectedPath: null, recentProjects: [], searchResults: [] });
    useEditorStore.setState({ tabs: [], activePath: null, splitCount: 1, theme: "dark" });
    mockInvoke.mockReset();
    mockInvoke.mockImplementation((cmd: string, _args: unknown) => {
      if (cmd === "list_dir") return Promise.resolve([{ name: "main.py", path: "C:/proj/main.py", is_dir: false }]);
      if (cmd === "read_file") return Promise.resolve("print('hello')");
      if (cmd === "detect_language") return Promise.resolve("python");
      if (cmd === "open_in_system_editor") return Promise.resolve(null);
      return Promise.resolve(null);
    });
  });

  it("loads entries on mount when rootPath set", async () => {
    render(<FileTree />);
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("list_dir", expect.anything()));
    expect(await screen.findByText("main.py")).toBeDefined();
  });

  it("clicking file opens editor tab (file open requirement — must pass)", async () => {
    render(<FileTree />);
    await screen.findByText("main.py");
    fireEvent.click(screen.getByText("main.py"));
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("read_file", expect.anything()));
    await waitFor(() => expect(useEditorStore.getState().tabs.length).toBe(1));
    expect(useEditorStore.getState().activePath).toBe("C:/proj/main.py");
  });

  it("Notepad ↗ one-click opens system editor", async () => {
    render(<FileTree />);
    await screen.findByText("main.py");
    const notepad = await screen.findByText("Notepad ↗");
    fireEvent.click(notepad);
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("open_in_system_editor", { path: "C:/proj/main.py" }));
  });

  it("shows No folder opened when rootPath null", async () => {
    useFileStore.setState({ rootPath: null, tree: null, selectedPath: null, recentProjects: [], searchResults: [] });
    render(<FileTree />);
    expect(await screen.findByText("No folder opened")).toBeDefined();
  });
});
