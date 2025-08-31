export function decimalToPercentage(decimal: number): number {
  // Multiply by 100 to convert to a percentage
  const percentage = decimal * 100;
  // Round to the nearest whole number
  const roundedPercentage = Math.round(percentage);
  return roundedPercentage;
}

export function toTwoDecimal(decimal: number): number {
  const roundedPercentage = Math.round(decimal * 100) / 100;
  return roundedPercentage;
}

interface OrderData {
  price: string | number;
  size: string | number;
}

interface SellResult {
  totalValue: number;
  averagePrice: number;
}

export function sellFunction(data: OrderData[] | null | undefined, sharesToSell: number): SellResult {
  if (!data) return { totalValue: 0, averagePrice: 0 };
  if (data?.length === 0) return { totalValue: 0, averagePrice: 0 };
  // Sort data by price in descending order
  const sortedData = [...data].sort(
    (a, b) => parseFloat(b.price as string) - parseFloat(a.price as string)
  );

  let remainingShares = sharesToSell;
  let totalValue = 0;
  let totalSharesSold = 0;

  for (const order of sortedData) {
    const price = parseFloat(order.price as string);
    const size = parseFloat(order.size as string);

    if (remainingShares <= 0) {
      break;
    }

    // Calculate the maximum number of shares we can sell at this price
    const maxSharesForPrice = Math.min(size, remainingShares);

    if (maxSharesForPrice > 0) {
      // Sell the shares
      totalSharesSold += maxSharesForPrice;
      totalValue += maxSharesForPrice * price;
      remainingShares -= maxSharesForPrice;
    }
  }
  
  // Guard against division by zero when no shares are sold
  if (totalSharesSold === 0) {
    return { totalValue, averagePrice: 0 };
  }

  const averagePrice = totalValue / totalSharesSold;

  return {
    totalValue,
    averagePrice,
  };
}

interface BuyResult {
  totalShares: number;
  averagePrice: number;
}

export function buyFunction(data: OrderData[] | null | undefined, amountInUSD: number): BuyResult {
  if (!data) return { totalShares: 0, averagePrice: 0 };
  if (data?.length === 0) return { totalShares: 0, averagePrice: 0 };
  // Sort data by price in ascending order
  const sortedData = [...data]?.sort(
    (a, b) => parseFloat(a.price as string) - parseFloat(b.price as string)
  );

  let remainingAmount = amountInUSD;
  let totalShares = 0;
  let totalCost = 0;

  for (const order of sortedData) {
    const price = parseFloat(order.price as string);
    const size = parseFloat(order.size as string);

    if (remainingAmount <= 0) {
      break;
    }

    // Calculate the maximum number of shares we can buy with the remaining amount
    const maxSharesForPrice = Math.min(size, remainingAmount / price);

    if (maxSharesForPrice > 0) {
      // Buy the shares
      totalShares += maxSharesForPrice;
      totalCost += maxSharesForPrice * price;
      remainingAmount -= maxSharesForPrice * price;
    }
  }

  // Guard against division by zero when no shares are bought
  if (totalShares === 0) {
    return { totalShares, averagePrice: 0 };
  }

  const averagePrice = totalCost / totalShares;

  return {
    totalShares,
    averagePrice,
  };
}

export const getAccumulativeValue = (arr: any[] | null | undefined, length: number): number => {
  if (!Array.isArray(arr)) {
    return 0;
  }
  const arr2 = [...arr];
  let total = 0;
  const maxIterations = Math.min(length + 1, arr2.length);
  for (let i = 0; i < maxIterations; i++) {
    const current = arr2[i];
    if (current === undefined) continue;
    total += Number(current[0]) * Number(current[1]);
  }
  return Number.isFinite(total) ? total : 0;
};

export const getAccumulativeValueReverse = (arr: any[] | null | undefined, length: number): number => {
  if (!Array.isArray(arr)) {
    return 0;
  }
  const arr2 = [...arr].reverse();
  let total = 0;
  const maxIterations = Math.min(length + 1, arr2.length);
  for (let i = 0; i < maxIterations; i++) {
    const current = arr2[i];
    if (current === undefined) continue;
    total += Number(current[0]) * Number(current[1]);
  }
  return Number.isFinite(total) ? total : 0;
};

export const PnLFormatted = (pnl: number): string => {
  return pnl >= 0 ? `$${pnl}` : `-$${pnl * -1}`;
};

interface Interval {
  label: string;
  seconds: number;
}

export const getTimeAgo = (time: string | Date): string => {
  const now = new Date();
  const inputTime = new Date(time);
  const diffInSeconds = Math.floor((now.getTime() - inputTime.getTime()) / 1000);

  const intervals: Interval[] = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
};