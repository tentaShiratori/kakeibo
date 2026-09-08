export type Totals = {
  income: number;
  expense: number;
  balance: number;
};

export type WakuTotals = Totals & {
  id: string;
  name: string;
};

export type Furikaeri = Totals & {
  month: string;
  waku: WakuTotals[];
  none: Totals;
};

export function emptyFurikaeri(month: string): Furikaeri {
  return {
    month,
    income: 0,
    expense: 0,
    balance: 0,
    waku: [],
    none: { income: 0, expense: 0, balance: 0 },
  };
}
