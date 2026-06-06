/**
 * Widget データのテスト
 */
import { buildWidgetData } from "../lib/widget-data";

describe("buildWidgetData", () => {
  it("correctly counts completed tasks", () => {
    const stats = { level: 3, streakDays: 5, points: 120 };
    const tasks = [
      { isCompleted: true },
      { isCompleted: false },
      { isCompleted: true },
      { isCompleted: false },
    ];

    const result = buildWidgetData(stats, tasks);

    expect(result.level).toBe(3);
    expect(result.streakDays).toBe(5);
    expect(result.todayCompleted).toBe(2);
    expect(result.todayTotal).toBe(4);
    expect(result.points).toBe(120);
    expect(result.lastUpdated).toBeTruthy();
  });

  it("handles empty task list", () => {
    const stats = { level: 1, streakDays: 0, points: 0 };
    const result = buildWidgetData(stats, []);

    expect(result.todayCompleted).toBe(0);
    expect(result.todayTotal).toBe(0);
  });
});
