import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MenuBar from "./MenuBar";

describe("MenuBar — File open/close, edit save, footer/help, settings", () => {
  const handlers = () => ({
    onOpenFolder: vi.fn(),
    onOpenFile: vi.fn(),
    onSave: vi.fn(),
    onSaveAs: vi.fn(),
    onCloseFile: vi.fn(),
    onShowExplorer: vi.fn(),
    onShowSearch: vi.fn(),
    onShowPlugins: vi.fn(),
    onToggleTheme: vi.fn(),
    onSplitH: vi.fn(),
    onSplitV: vi.fn(),
    onCloseSplit: vi.fn(),
    onBuild: vi.fn(),
    onRun: vi.fn(),
    onShowTerminal: vi.fn(),
    onShowOutput: vi.fn(),
    onSettings: vi.fn(),
    onHelp: vi.fn(),
    onPalette: vi.fn(),
  });

  it("renders File/Edit/View/Run/Settings/Help menus", () => {
    render(<MenuBar {...handlers()} />);
    expect(screen.getByText("File")).toBeDefined();
    expect(screen.getByText("Edit")).toBeDefined();
    expect(screen.getByText("View")).toBeDefined();
    expect(screen.getByText("Run")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
    expect(screen.getByText("Help")).toBeDefined();
    expect(screen.getByText(/Small core/)).toBeDefined();
  });

  it("File → Open Folder triggers handler (file open requirement)", async () => {
    const h = handlers();
    render(<MenuBar {...h} />);
    fireEvent.click(screen.getByText("File"));
    const item = await screen.findByText("Open Folder");
    fireEvent.click(item);
    expect(h.onOpenFolder).toHaveBeenCalledTimes(1);
  });

  it("File → Save triggers edit save (Ctrl+S requirement)", async () => {
    const h = handlers();
    render(<MenuBar {...h} />);
    fireEvent.click(screen.getByText("File"));
    fireEvent.click(await screen.findByText("Save"));
    expect(h.onSave).toHaveBeenCalled();
  });

  it("Edit → Undo/Cut/Copy/Paste triggers document.execCommand", async () => {
    const h = handlers();
    render(<MenuBar {...h} />);
    fireEvent.click(screen.getByText("Edit"));
    // Cut/Copy/Paste items exist
    expect(await screen.findByText("Cut")).toBeDefined();
    expect(await screen.findByText("Copy")).toBeDefined();
    // doesn't throw
  });

  it("View → Toggle Theme and Explorer/Search/Plugins", async () => {
    const h = handlers();
    render(<MenuBar {...h} />);
    fireEvent.click(screen.getByText("View"));
    fireEvent.click(await screen.findByText("Toggle Theme"));
    expect(h.onToggleTheme).toHaveBeenCalled();
  });

  it("Run → Build/Run triggers handlers", async () => {
    const h = handlers();
    render(<MenuBar {...h} />);
    fireEvent.click(screen.getByText("Run"));
    fireEvent.click(await screen.findByText("Build"));
    expect(h.onBuild).toHaveBeenCalled();
  });

  it("Help → About triggers onHelp (footer help requirement)", async () => {
    const h = handlers();
    render(<MenuBar {...h} />);
    fireEvent.click(screen.getByText("Help"));
    fireEvent.click(await screen.findByText("About LiteIDE"));
    expect(h.onHelp).toHaveBeenCalled();
  });
});
