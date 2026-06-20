/** Month utility functions for current-month display and month navigation */

/** "YYYY-MM" key for today */
export function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "YYYY년 M월" label for today */
export function getCurrentMonthLabel(): string {
  return getMonthLabel(getCurrentMonthKey());
}

/** "YYYY-MM" key from any Date */
export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** "YYYY년 M월" from a "YYYY-MM" key */
export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${year}년 ${parseInt(month, 10)}월`;
}

/** "YYYY" from a "YYYY-MM" key */
export function getYearFromMonthKey(monthKey: string): string {
  return monthKey.split("-")[0];
}

/** Add delta months to a "YYYY-MM" key and return a new "YYYY-MM" key */
export function addMonthsToMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Previous month key */
export function getPreviousMonthKey(monthKey: string): string {
  return addMonthsToMonthKey(monthKey, -1);
}

/** Next month key */
export function getNextMonthKey(monthKey: string): string {
  return addMonthsToMonthKey(monthKey, 1);
}

/** Check if a monthKey is the current month */
export function isCurrentMonth(monthKey: string): boolean {
  return monthKey === getCurrentMonthKey();
}

/** Parse "YYYY-MM" into a Date (1st of that month) for anchorDate usage */
export function monthKeyToAnchorDate(monthKey: string): Date {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 15); // mid-month avoids timezone edge cases
}
