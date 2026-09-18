import { describe, it, expect } from "vitest";
import { parts, edges, systems, scenarios } from "../src/data";
import { evaluate, sailing, explodedPosition } from "../src/domain";
describe("auditable domain model", () => {
  it("has complete bilingual physical and scenario coverage", () => {
    expect(parts.length).toBeGreaterThan(85);
    expect(systems).toHaveLength(13);
    expect(scenarios).toHaveLength(11);
    for (const p of parts) {
      expect(p.name.en).toBeTruthy();
      expect(p.name.zh).toMatch(/[\u3400-\u9fff]/);
      expect(p.description.zh).toBeTruthy();
    }
    expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length);
  });
  it("uses valid relationships with evidence", () => {
    for (const e of edges) {
      expect(parts.some((p) => p.id === e.from)).toBe(true);
      expect(parts.some((p) => p.id === e.to)).toBe(true);
      expect(e.source).toBeTruthy();
    }
  });
  it("propagates house bank loss, preserving independent handheld alternatives", () => {
    const r = evaluate("battery", true);
    expect(r.autopilot.state).toBe("failed");
    expect(r.ais.state).toBe("failed");
    expect(r.vhf.state).toBe("failed");
    expect(r.handheld.state).toBe("operating");
    expect(r.navigation.state).toBe("degraded");
    expect(r.navigation.path).toContain("battery");
  });
  it("keeps branch faults local and reports uncertainty", () => {
    expect(evaluate("autopilot", false).ais.state).toBe("operating");
    expect(evaluate("battery", false).navigation.state).toBe("failed");
    expect(evaluate("low-charge", false).autopilot.state).toBe("conditional");
  });
  it("resets failures deterministically", () => {
    expect(evaluate("", false).autopilot.state).toBe("operating");
  });
  it("reassembles exactly with no drift", () => {
    expect(explodedPosition([1, 2, 3], [10, 20, 30], 0)).toEqual([1, 2, 3]);
    expect(explodedPosition([1, 2, 3], [10, 20, 30], 1)).toEqual([10, 20, 30]);
  });
  it("handles zero wind and mirrors tack forces", () => {
    expect(sailing(0, 60, 30, 30, 0, 0).speed).toBe(0);
    const a = sailing(16, 60, 30, 30, 0, 10),
      b = sailing(16, -60, 30, 30, 0, -10);
    expect(a.heel).toBeCloseTo(-b.heel);
    expect(a.speed).toBeCloseTo(b.speed);
    expect(sailing(16, 60, 30, 30, 2, 0).area).toBeLessThan(a.area);
    expect(sailing(16, 0, 0, 0, 0, 0).speed).toBe(0);
  });
});
it("gives every component a meaningful typed connection", () => {
  for (const p of parts)
    expect(
      edges.some((e) => e.from === p.id || e.to === p.id),
      p.id,
    ).toBe(true);
});
