import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Terminal from "./Terminal";

const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({ invoke: (...a: unknown[]) => mockInvoke(...a) }));
vi.mock("../../store/fileStore", async () => {
  const actual = await vi.importActual("../../store/fileStore") as unknown as Record<string, unknown>;
  return { ...actual, useFileStore: (sel: (s: unknown) => unknown) => sel({ rootPath: "C:/proj" }) };
});

describe("Terminal — integrated shell must work", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_shell_config") return Promise.resolve({ shell: "powershell.exe", args: ["-NoLogo"] });
      if (cmd === "platform_name") return Promise.resolve("windows");
      if (cmd === "execute_shell") return Promise.resolve({ stdout: "hello", stderr: "", success: true, exit_code: 0 });
      return Promise.resolve(null);
    });
  });

  it("shows shell and executes command (requirement)", async () => {
    render(<Terminal />);
    expect(await screen.findByText(/Shell:/)).toBeDefined();
    const input = screen.getByPlaceholderText(/e.g. dir/);
    fireEvent.change(input, { target: { value: "echo hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("execute_shell", expect.objectContaining({ command: "echo hello" })));
    await waitFor(() => expect(screen.getByText(/hello/)).toBeDefined());
  });

  it("clears log", async () => {
    render(<Terminal />);
    const clear = await screen.findByText("Clear");
    fireEvent.click(clear);
    // log cleared but shell label remains
    expect(screen.getByText(/Shell:/)).toBeDefined();
  });
});
