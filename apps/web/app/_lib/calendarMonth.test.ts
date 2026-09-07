import { describe, expect, test } from "vitest";
import {
  calendarMonth,
  formatCalendarMonth,
  isCurrentOrPastMonth,
  nyushukkinInMonth,
  shiftCalendarMonth,
  todayJst,
} from "./nyushukkin";

const today = "2026-09-06";

describe("shiftCalendarMonth / formatCalendarMonth / isCurrentOrPastMonth", () => {
  test("暦月を前後にずらす", () => {
    expect(shiftCalendarMonth("2026-09", -1)).toBe("2026-08");
    expect(shiftCalendarMonth("2026-09", 0)).toBe("2026-09");
    expect(shiftCalendarMonth("2026-09", 1)).toBe("2026-10");
  });

  test("年の境をまたぐ", () => {
    expect(shiftCalendarMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftCalendarMonth("2026-12", 1)).toBe("2027-01");
  });

  test("表示は年と月にする", () => {
    expect(formatCalendarMonth("2026-09")).toBe("2026年9月");
    expect(formatCalendarMonth("2026-01")).toBe("2026年1月");
  });

  test("今日の月より先は振り返らない", () => {
    expect(isCurrentOrPastMonth("2026-09", today)).toBe(true);
    expect(isCurrentOrPastMonth("2026-08", today)).toBe(true);
    expect(isCurrentOrPastMonth("2026-10", today)).toBe(false);
  });
});

describe("nyushukkinInMonth", () => {
  const items = [
    { id: "a", kind: "収入" as const, amount: 200000, date: "2026-09-01", memo: "" },
    { id: "b", kind: "支出" as const, amount: 5000, date: "2026-09-06", memo: "" },
    { id: "c", kind: "支出" as const, amount: 1200, date: "2026-08-31", memo: "" },
  ];

  test("指定した暦月の入出金だけ残す", () => {
    expect(nyushukkinInMonth(items, "2026-09").map((item) => item.id)).toEqual(["a", "b"]);
  });

  test("入出金が無い月は空", () => {
    expect(nyushukkinInMonth(items, "2026-07")).toEqual([]);
  });
});

describe("todayJst / calendarMonth", () => {
  test("日本の暦日と月を切る", () => {
    expect(todayJst(new Date("2026-09-06T15:00:00+09:00"))).toBe("2026-09-06");
    expect(calendarMonth("2026-09-06")).toBe("2026-09");
  });
});
