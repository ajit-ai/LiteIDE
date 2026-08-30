import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OutputPanel from "./OutputPanel";
import { useEditorStore } from "../../store/editorStore";
import { useFileStore } from "../../store/fileStore";

const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({ invoke: (...a: unknown[]) => mockInvoke(...a) }));

describe("OutputPanel — Build/Run per language must work", () => {
  beforeEach(() => {
    useEditorStore.setState({ tabs: [{ path: "C:/proj/main.py", content: "print(1)", dirty: false, language: "python" }], activePath: "C:/proj/main.py", splitCount: 1, theme: "dark" });
    useFileStore.setState({ rootPath: "C:/proj", tree: null, selectedPath: null, recentProjects: [], searchResults: [] });
    mockInvoke.mockReset();
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "detect_language") return Promise.resolve("python");
      if (cmd === "build_project") return Promise.resolve({ stdout: "build ok", stderr: "", success: true, exit_code: 0 });
      if (cmd === "run_project") return Promise.resolve({ stdout: "hello", stderr: "", success: true, exit_code: 0 });
      return Promise.resolve(null);
    });
  });

  it("Build button invokes build_project (C/C++/Java/Python)", async () => {
    render(<OutputPanel />);
    fireEvent.click(screen.getByText("Build"));
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("build_project", expect.objectContaining({ req: expect.objectContaining({ language: "python" }) })));
    expect(await screen.findByText(/build ok/)).toBeDefined();
  });

  it("Run button invokes run_project", async () => {
    render(<OutputPanel />);
    fireEvent.click(screen.getByText("Run"));
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("run_project", expect.anything()));
    expect(await screen.findByText(/hello/)).toBeDefined();
  });

  it("shows No active file when no tabs", async () => {
    useEditorStore.setState({ tabs: [], activePath: null, splitCount: 1, theme: "dark" });
    render(<OutputPanel />);
    fireEvent.click(screen.getByText("Build"));
    expect(await screen.findByText(/No active file/)).toBeDefined();
  });
});
