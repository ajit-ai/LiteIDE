import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HelpModal from "./HelpModal";

describe("HelpModal — footer Help must work", () => {
  it("renders About LiteIDE when open", async () => {
    render(<HelpModal open={true} onClose={vi.fn()} />);
    expect(await screen.findByText("About LiteIDE")).toBeDefined();
    expect(screen.getByText(/Small core/)).toBeDefined();
    expect(screen.getByText(/Shortcuts:/)).toBeDefined();
  });
  it("closes on Close button", async () => {
    const onClose = vi.fn();
    render(<HelpModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
  it("hidden when closed", () => {
    const { container } = render(<HelpModal open={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });
});
