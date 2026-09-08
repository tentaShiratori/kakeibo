export function todayJst(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function calendarMonth(date: string): string {
  return date.slice(0, 7);
}

export function shiftCalendarMonth(month: string, delta: number): string {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1 + delta;
  const shifted = new Date(Date.UTC(year, monthIndex, 1));
  const nextYear = shifted.getUTCFullYear();
  const nextMonth = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
}

export function isCurrentOrPastMonth(month: string, today: string): boolean {
  return month <= calendarMonth(today);
}

export function formatCalendarMonth(month: string): string {
  return `${month.slice(0, 4)}年${Number(month.slice(5, 7))}月`;
}
