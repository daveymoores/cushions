import type {Money as MoneyT} from '~/lib/mock-data';

const SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

export function formatMoney(money: MoneyT) {
  const symbol = SYMBOLS[money.currencyCode] ?? '';
  const amount = Number.parseFloat(money.amount);
  const hasFraction = amount % 1 !== 0;
  return `${symbol}${amount.toFixed(hasFraction ? 2 : 0)}`;
}

export function Money({money, className = ''}: {money: MoneyT; className?: string}) {
  return (
    <span className={`tabular-nums ${className}`}>{formatMoney(money)}</span>
  );
}
