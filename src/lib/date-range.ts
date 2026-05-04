export type TimeRange = 'semana' | 'mes' | '30dias' | 'anio';

interface DateRangeResult {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
}

function startOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function getDateRange(rango: TimeRange): DateRangeResult {
  const now = new Date();

  switch (rango) {
    case 'semana': {
      const start = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
      const end = endOfDay(now);
      const prevStart = startOfDay(new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000));
      const prevEnd = endOfDay(new Date(start.getTime() - 1));
      return { start, end, prevStart, prevEnd };
    }

    case 'mes': {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      const prevStart = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const prevEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { start, end, prevStart, prevEnd };
    }

    case '30dias': {
      const start = startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
      const end = endOfDay(now);
      const prevStart = startOfDay(new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000));
      const prevEnd = endOfDay(new Date(start.getTime() - 1));
      return { start, end, prevStart, prevEnd };
    }

    case 'anio': {
      const start = startOfDay(new Date(now.getFullYear(), 0, 1));
      const end = endOfDay(new Date(now.getFullYear(), 11, 31));
      const prevStart = startOfDay(new Date(now.getFullYear() - 1, 0, 1));
      const prevEnd = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
      return { start, end, prevStart, prevEnd };
    }

    default: {
      // Fallback to semana
      const start = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
      const end = endOfDay(now);
      const prevStart = startOfDay(new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000));
      const prevEnd = endOfDay(new Date(start.getTime() - 1));
      return { start, end, prevStart, prevEnd };
    }
  }
}
