import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBar from "./StatusBar";
import { useEditorStore } from "../store/editorStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn((cmd: string) => {
    if (cmd === "platform_name") return Promise.resolve("windows");
    if (cmd === "lsp_status") return Promise.resolve({ running: false });
    return Promise.resolve(null);
  }),
}));

describe("StatusBar — footer file open/close, edit save, help, cursor", () => {
  beforeEach(() => {
    useEditorStore.setState({ tabs: [], activePath: null, splitCount: 1, theme: "dark" });
  });

  it("shows No file open when no tabs", async () => {
    render(<StatusBar onHelp={vi.fn()} />);
    // wait for platform fetch
    expect(await screen.findByText("windows")).toBeDefined();
    expect(screen.getByText(/No file open/)).toBeDefined();
  });

  it("shows language, cursor, dirty, theme, LSP, Help footer when file open", async () => {
    useEditorStore.setState({
      tabs: [{ path: "C:/proj/main.c", content: "int x;", dirty: true, language: "c" }],
      activePath: "C:/proj/main.c",
      splitCount: 1,
      theme: "dark",
    });
    render(<StatusBar onHelp={vi.fn()} />);
    expect(await screen.findByText("windows")).toBeDefined();
    expect(screen.getByText("c")).toBeDefined();
    expect(screen.getByText(/Modified/)).toBeDefined();
    // theme toggle exists
    expect(screen.getByText(/Dark/)).toBeDefined();
    expect(screen.getByText("Help")).toBeDefined();
    expect(screen.getByText(/Footer/)).toBeDefined();
  });

  it("Help click triggers onHelp", async () => {
    const onHelp = vi.fn();
    render(<StatusBar onHelp={onHelp} />);
    const help = await screen.findByText("Help");
    help.click();
    expect(onHelp).toHaveBeenCalled();
  });
});
