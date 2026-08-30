import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Settings from "./Settings";
import { useFileStore } from "../store/fileStore";

const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({ invoke: (...a: unknown[]) => mockInvoke(...a) }));

describe("Settings — global TOML + per-project .liteidrc must work", () => {
  beforeEach(() => {
    useFileStore.setState({ rootPath: "C:/proj", tree: null, selectedPath: null, recentProjects: [], searchResults: [] });
    mockInvoke.mockReset();
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_global_config") return Promise.resolve({ theme: "dark", font_family: "Consolas", font_size: 14, auto_save_interval: 1000, keybindings: { save: "Ctrl+S" }, recent_projects: [] });
      if (cmd === "get_project_config") return Promise.resolve({ language: "python", build_command: "python -m py_compile {file}", run_command: "python {file}" });
      if (cmd === "save_global_config") return Promise.resolve(null);
      if (cmd === "save_project_config") return Promise.resolve(null);
      return Promise.resolve(null);
    });
  });

  it("loads and shows Appearance/Font/Keybindings", async () => {
    render(<Settings open={true} onClose={vi.fn()} />);
    expect(await screen.findByText("Settings")).toBeDefined();
    expect(await screen.findByText("Appearance")).toBeDefined();
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("get_global_config"));
  });

  it("Save Global invokes save_global_config", async () => {
    render(<Settings open={true} onClose={vi.fn()} />);
    await screen.findByText("Appearance");
    fireEvent.click(await screen.findByText("Save Global (TOML)"));
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("save_global_config", expect.anything()));
  });

  it("Save .liteidrc invokes save_project_config", async () => {
    render(<Settings open={true} onClose={vi.fn()} />);
    await screen.findByText(/Per-project/);
    fireEvent.click(await screen.findByText("Save .liteidrc"));
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("save_project_config", expect.anything()));
  });

  it("hidden when closed", () => {
    const { container } = render(<Settings open={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });
});
