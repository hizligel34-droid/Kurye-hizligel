export type CourierProfileRow = {
  status: string;
  courierEarning: string | number;
  routeDurationMinutes?: string | number | null;
  createdAt: Date | string | number;
};

export function summarizeCourierRows(rows: CourierProfileRow[]) {
  const completedRows = rows.filter((row) => row.status === "delivered");
  const cancelled = rows.filter((row) => row.status === "cancelled").length;
  const active = rows.filter((row) => row.status === "received" || row.status === "on_the_way").length;
  const durationRows = completedRows.filter((row) => row.routeDurationMinutes != null && Number.isFinite(Number(row.routeDurationMinutes)));
  const earnings = rows.reduce((sum, row) => sum + Number(row.courierEarning || 0), 0);
  const averageDuration = durationRows.length ? durationRows.reduce((sum, row) => sum + Number(row.routeDurationMinutes), 0) / durationRows.length : 0;
  return {
    totalOrders: rows.length,
    completed: completedRows.length,
    active,
    cancelled,
    earnings,
    successRate: rows.length ? (completedRows.length / rows.length) * 100 : 0,
    averageEarning: completedRows.length ? earnings / completedRows.length : 0,
    averageDuration,
  };
}

export function buildCourierChartData(rows: CourierProfileRow[], days = 14) {
  const grouped = new Map<string, { date: string; deliveries: number; earnings: number }>();
  rows.forEach((row) => {
    const parsed = new Date(row.createdAt);
    if (Number.isNaN(parsed.getTime())) return;
    const key = parsed.toISOString().slice(0, 10);
    const item = grouped.get(key) ?? { date: key, deliveries: 0, earnings: 0 };
    item.deliveries += row.status === "delivered" ? 1 : 0;
    item.earnings += Number(row.courierEarning || 0);
    grouped.set(key, item);
  });
  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-days);
}
