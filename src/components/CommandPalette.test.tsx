import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CommandPalette from "./CommandPalette";

describe("CommandPalette", () => {
  it("filters commands by query", () => {
    const cmds = [
      { id: "a.build", label: "Build Project", action: () => {} },
      { id: "a.run", label: "Run Project", action: () => {} },
    ];
    render(<CommandPalette commands={cmds} open={true} onClose={() => {}} />);
    const input = screen.getByPlaceholderText(/Type a command/i);
    fireEvent.change(input, { target: { value: "Build" } });
    expect(screen.getByText("Build Project")).toBeDefined();
    expect(screen.queryByText("Run Project")).toBeNull();
  });

  it("hidden when closed", () => {
    const { container } = render(<CommandPalette commands={[]} open={false} onClose={() => {}} />);
    expect(container.innerHTML).toBe("");
  });
});
