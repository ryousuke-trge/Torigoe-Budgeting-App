// YYYY-MM-DD 形式の日付文字列を生成する
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthNames(): string[] {
  return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
}

export function getCalendarGrid(year: number, month: number): Date[] {
  const grid: Date[] = [];
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const startDay = startOfMonth.getDay(); // 0: Sun, 1: Mon...

  // 前月の日付を追加
  for (let i = startDay - 1; i >= 0; i--) {
    grid.push(new Date(year, month, -i));
  }

  // 当月の日付を追加
  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    grid.push(new Date(year, month, i));
  }

  // 翌月の日付を追加して、グリッドの最後を埋める (基本的には6週=42日か、足りる分まで)
  const remainingCells = 42 - grid.length;
  for (let i = 1; i <= remainingCells; i++) {
    grid.push(new Date(year, month + 1, i));
  }

  return grid;
}
