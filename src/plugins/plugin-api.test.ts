import { describe, it, expect } from "vitest";
import { EventBus } from "./plugin-api";

describe("EventBus", () => {
  it("emits to listeners and off removes", () => {
    const bus = new EventBus();
    let called = 0;
    const h = () => called++;
    bus.on("file:open", h);
    bus.emit("file:open", "a.py");
    expect(called).toBe(1);
    bus.off("file:open", h);
    bus.emit("file:open");
    expect(called).toBe(1);
  });
});
