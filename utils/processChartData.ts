import { decimalToPercentage } from "@/utils/helpers";
interface DataPoint {
  t: number;
  p: number;
}

// 添加 ChartDataItem 接口定义
export interface ChartDataItem {
  timestamp: string;
  asset1: number | null;
  asset2: number | null;
  asset3: number | null;
  asset4: number | null;
  rawTimestamp?: number;
  formattingInterval?: string;
}

// 添加 ChartDataPoint 接口定义
export interface ChartDataPoint {
  timestamp: string;
  asset1: number | null;
  [key: string]: number | null | string | undefined;
}

export function processMultiChartData(
  data1: DataPoint[] = [],
  data2: DataPoint[] = [],
  data3: DataPoint[] = [],
  data4: DataPoint[] = [],
  interval = "all"
): (ChartDataItem & { rawTimestamp: number; formattingInterval?: string })[] {
  if (data1.length === 0 && data2.length === 0 && data3.length === 0 && data4.length === 0) return [];
  const now = Math.floor(Date.now() / 1000);
  
  // Calculate actual data range
  const allDataTimestamps = [
    ...data1.map(d => d.t),
    ...data2.map(d => d.t),
    ...data3.map(d => d.t),
    ...data4.map(d => d.t)
  ].filter(t => t !== undefined);
  
  const firstDataPoint = Math.min(...allDataTimestamps);
  const actualRangeSec = now - firstDataPoint;
  
  const adjustedInterval = getAdjustedInterval(interval, actualRangeSec);
  const intervalSec = getIntervalSeconds(adjustedInterval);
  
  // For "all" or when selected interval is greater than actual data range, use actual range
  let startTime = adjustedInterval === "all" ? firstDataPoint : now - intervalSec;
  if (adjustedInterval !== "all" && intervalSec > actualRangeSec) {
    startTime = firstDataPoint;
  }
  
  const rangeSec = now - startTime;
  const step = getFixedStep(adjustedInterval, rangeSec);
  const formattingInterval = getFormattingInterval(rangeSec);

  // Sort all data by timestamp
  const sorted1 = [...data1].sort((a, b) => a.t - b.t);
  const sorted2 = [...data2].sort((a, b) => a.t - b.t);
  const sorted3 = [...data3].sort((a, b) => a.t - b.t);
  const sorted4 = [...data4].sort((a, b) => a.t - b.t);

  let last1 = sorted1[0]?.p * 100 || 0;
  let last2 = sorted2[0]?.p * 100 || 0;
  let last3 = sorted3[0]?.p * 100 || 0;
  let last4 = sorted4[0]?.p * 100 || 0;
  let idx1 = 0, idx2 = 0, idx3 = 0, idx4 = 0;

  if (adjustedInterval === "all" || intervalSec > actualRangeSec) {
    // Start from the very first data points
    idx1 = 0; idx2 = 0; idx3 = 0; idx4 = 0;
    last1 = sorted1[0]?.p * 100 || 0;
    last2 = sorted2[0]?.p * 100 || 0;
    last3 = sorted3[0]?.p * 100 || 0;
    last4 = sorted4[0]?.p * 100 || 0;
    // Use the earliest data point as start time
    const allFirstPoints = [
      sorted1[0]?.t,
      sorted2[0]?.t,
      sorted3[0]?.t,
      sorted4[0]?.t
    ].filter(t => t !== undefined);
    if (allFirstPoints.length > 0) {
      startTime = Math.min(...allFirstPoints);
    }
  } else {
    // For specific intervals, find the last value before our start time
    for (let i = 0; i < sorted1.length; i++) {
      if (sorted1[i].t < startTime) {
        last1 = sorted1[i].p * 100;
        idx1 = i + 1;
      } else break;
    }
    for (let i = 0; i < sorted2.length; i++) {
      if (sorted2[i].t < startTime) {
        last2 = sorted2[i].p * 100;
        idx2 = i + 1;
      } else break;
    }
    for (let i = 0; i < sorted3.length; i++) {
      if (sorted3[i].t < startTime) {
        last3 = sorted3[i].p * 100;
        idx3 = i + 1;
      } else break;
    }
    for (let i = 0; i < sorted4.length; i++) {
      if (sorted4[i].t < startTime) {
        last4 = sorted4[i].p * 100;
        idx4 = i + 1;
      } else break;
    }
  }

  let result: (ChartDataItem & { rawTimestamp: number; formattingInterval?: string })[] = [];

  // Collect all unique timestamps from all datasets
  const allTimestamps = new Set<number>();
  
  // Add starting point timestamp
  allTimestamps.add(startTime);
  
  if (adjustedInterval === "all" || intervalSec > actualRangeSec) {
    // For "all" or when timeframe is smaller than interval, include ALL data points
    for (let i = 0; i < sorted1.length && sorted1[i].t <= now; i++) {
      allTimestamps.add(sorted1[i].t);
    }
    for (let i = 0; i < sorted2.length && sorted2[i].t <= now; i++) {
      allTimestamps.add(sorted2[i].t);
    }
    for (let i = 0; i < sorted3.length && sorted3[i].t <= now; i++) {
      allTimestamps.add(sorted3[i].t);
    }
    for (let i = 0; i < sorted4.length && sorted4[i].t <= now; i++) {
      allTimestamps.add(sorted4[i].t);
    }
  } else {
    // For specific intervals, include data points from idx onwards
    for (let i = idx1; i < sorted1.length && sorted1[i].t <= now; i++) {
      allTimestamps.add(sorted1[i].t);
    }
    for (let i = idx2; i < sorted2.length && sorted2[i].t <= now; i++) {
      allTimestamps.add(sorted2[i].t);
    }
    for (let i = idx3; i < sorted3.length && sorted3[i].t <= now; i++) {
      allTimestamps.add(sorted3[i].t);
    }
    for (let i = idx4; i < sorted4.length && sorted4[i].t <= now; i++) {
      allTimestamps.add(sorted4[i].t);
    }
  }
  
  // Add current time
  allTimestamps.add(now);

  // Sort all unique timestamps
  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  // Process each timestamp and forward-fill values
  let currentIdx1 = idx1, currentIdx2 = idx2, currentIdx3 = idx3, currentIdx4 = idx4;
  let currentVal1 = last1, currentVal2 = last2, currentVal3 = last3, currentVal4 = last4;

  for (let i = 0; i < sortedTimestamps.length; i++) {
    const timestamp = sortedTimestamps[i];
    // Update values based on any new data points up to this timestamp
    while (currentIdx1 < sorted1.length && sorted1[currentIdx1].t <= timestamp) {
      currentVal1 = sorted1[currentIdx1].p * 100;
      currentIdx1++;
    }
    while (currentIdx2 < sorted2.length && sorted2[currentIdx2].t <= timestamp) {
      currentVal2 = sorted2[currentIdx2].p * 100;
      currentIdx2++;
    }
    while (currentIdx3 < sorted3.length && sorted3[currentIdx3].t <= timestamp) {
      currentVal3 = sorted3[currentIdx3].p * 100;
      currentIdx3++;
    }
    while (currentIdx4 < sorted4.length && sorted4[currentIdx4].t <= timestamp) {
      currentVal4 = sorted4[currentIdx4].p * 100;
      currentIdx4++;
    }

    const pushPoint = (ts: number) => {
      const date = new Date(ts * 1000);
      let timestampString = "";
      if (formattingInterval === "all" || formattingInterval === "1m" || formattingInterval === "1w") {
        timestampString = date.toLocaleString("en-US", {
          day: "numeric",
          month: "short",
        });
      } else {
        timestampString = date.toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        });
      }
      result.push({
        rawTimestamp: ts,
        timestamp: timestampString,
        asset1: currentVal1,
        asset2: currentVal2,
        asset3: currentVal3,
        asset4: currentVal4,
        formattingInterval,
      });
    };

    // Push the real data timestamp
    pushPoint(timestamp);

    // If there's a large gap to the next real timestamp, insert forward-filled points
    const nextReal = sortedTimestamps[i + 1];
    if (nextReal) {
      const gap = nextReal - timestamp;
if (gap > step * 1.5) {
        let inserted = 0;
        for (let filler = timestamp + step; filler < nextReal; filler += step) {
          pushPoint(filler);
          inserted++;
          if (inserted > 1500) break; // safety cap
        }
      }
    }
  }

  // Remove duplicates and sort
  const seen = new Set();
  result = result.filter(pt => {
    if (seen.has(pt.rawTimestamp)) return false;
    seen.add(pt.rawTimestamp);
    return true;
  });
  result.sort((a, b) => a.rawTimestamp - b.rawTimestamp);
  return result;
}

function getIntervalSeconds(interval: string): number {
  switch (interval) {
    case "1h": return 60 * 60;
    case "6h": return 6 * 60 * 60;
    case "1d": return 24 * 60 * 60;
    case "1w": return 7 * 24 * 60 * 60;
    case "1m": return 30 * 24 * 60 * 60;
    case "all": return Number.MAX_SAFE_INTEGER;
    default: return 24 * 60 * 60;
  }
}



function getAdjustedInterval(selectedInterval: string, dataRangeSec: number): string {
  const intervalSec = getIntervalSeconds(selectedInterval);
  if (intervalSec > dataRangeSec) {
    return "all";
  }
  return selectedInterval;
}

function getFormattingInterval(rangeSec: number): string {
  if (rangeSec <= 60 * 60) return "1h"; // 0-1h: format like 1h
  if (rangeSec <= 6 * 60 * 60) return "6h"; // 1h-6h: format like 6h
  if (rangeSec <= 24 * 60 * 60) return "1d"; // 6h-1d: format like 1d
  if (rangeSec <= 7 * 24 * 60 * 60) return "1w"; // 1d-1w: format like 1w
  if (rangeSec <= 30 * 24 * 60 * 60) return "1m"; // 1w-1m: format like 1m
  return "all"; // >1m: format like all
}

function getFixedStep(interval: string, rangeSec: number): number {
  switch (interval) {
case "1h": return 2 * 60;
case "6h": return 10 * 60;
case "1d": return 30 * 60;
case "1w": return 2 * 60 * 60;
case "1m": return 6 * 60 * 60;
    case "all":
      if (rangeSec <= 60 * 60) return 2 * 60; // 0-1h: 2 minutes
      if (rangeSec <= 6 * 60 * 60) return 10 * 60; // 1h-6h: 10 minutes
      if (rangeSec <= 24 * 60 * 60) return 30 * 60; // 6h-1d: 30 minutes
      if (rangeSec <= 7 * 24 * 60 * 60) return 2 * 60 * 60; // 1d-1w: 2 hours
      if (rangeSec <= 30 * 24 * 60 * 60) return 6 * 60 * 60; // 1w-1m: 6 hours
      if (rangeSec <= 3 * 30 * 24 * 60 * 60) return 12 * 60 * 60; // 1m-3m: 12 hours
      return 24 * 60 * 60; // >3m: 24 hours
    default: return 60 * 60; // fallback 1 hour
  }
}

export function processSingleChartData(
  data1: DataPoint[] = [],
  interval: string
): (ChartDataPoint & { rawTimestamp: number; formattingInterval?: string })[] {
  if (!data1.length) return [];
  const now = Math.floor(Date.now() / 1000);
  const firstDataPoint = Math.min(...data1.map(d => d.t));
  const actualRangeSec = now - firstDataPoint;

  const adjustedInterval = getAdjustedInterval(interval, actualRangeSec);
  const intervalSec = getIntervalSeconds(adjustedInterval);

  let startTime = adjustedInterval === "all" ? firstDataPoint : now - intervalSec;
  if (adjustedInterval !== "all" && intervalSec > actualRangeSec) {
    startTime = firstDataPoint;
  }

  const rangeSec = now - startTime;
  const formattingInterval = getFormattingInterval(rangeSec);
  const step = getFixedStep(adjustedInterval, rangeSec); // reuse same step logic as multi-chart

  const sorted = [...data1].sort((a, b) => a.t - b.t);

  // For "all" or when interval is larger than data range, start from first data point
  let lastValue = sorted[0]?.p * 100 || 0;
  let dataIdx = 0;
  
  if (adjustedInterval === "all" || intervalSec > actualRangeSec) {
    // Start from the very first data point
    dataIdx = 0;
    lastValue = sorted[0]?.p * 100 || 0;
    startTime = sorted[0]?.t || startTime;
  } else {
    // For specific intervals, find the last value before our start time
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].t < startTime) {
        lastValue = sorted[i].p * 100;
        dataIdx = i + 1;
      } else {
        break;
      }
    }
  }

  let result: (ChartDataPoint & { rawTimestamp: number; formattingInterval?: string })[] = [];

  const realDataPoints: { timestamp: number; value: number }[] = [];
  
  if (adjustedInterval !== "all" && intervalSec <= actualRangeSec) {
    realDataPoints.push({ timestamp: startTime, value: lastValue });
  }
  
  // Add all real data points within range
  if (adjustedInterval === "all" || intervalSec > actualRangeSec) {
    // For "all" or when timeframe is smaller than interval, include ALL data points
    for (let i = 0; i < sorted.length && sorted[i].t <= now; i++) {
      realDataPoints.push({ timestamp: sorted[i].t, value: sorted[i].p * 100 });
    }
  } else {
    // For specific intervals, include data points from dataIdx onwards
    for (let i = dataIdx; i < sorted.length && sorted[i].t <= now; i++) {
      realDataPoints.push({ timestamp: sorted[i].t, value: sorted[i].p * 100 });
    }
  }
  
  // Add current time point with final value
  const finalValue = sorted.length > 0 ? sorted[sorted.length - 1].p * 100 : lastValue;
  if (realDataPoints.length === 0 || realDataPoints[realDataPoints.length - 1].timestamp !== now) {
    realDataPoints.push({ timestamp: now, value: finalValue });
  }

  for (let i = 0; i < realDataPoints.length; i++) {
    const point = realDataPoints[i];
    const nextPoint = realDataPoints[i + 1];

    const pushPoint = (ts: number, value: number) => {
      const date = new Date(ts * 1000);
      let timestampString = "";
      if (formattingInterval === "all" || formattingInterval === "1m" || formattingInterval === "1w") {
        timestampString = date.toLocaleString("en-US", {
          day: "numeric",
          month: "short",
        });
      } else {
        timestampString = date.toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        });
      }
      result.push({
        rawTimestamp: ts,
        timestamp: timestampString,
        asset1: value,
        formattingInterval,
      });
    };

    // Push original point
    pushPoint(point.timestamp, point.value);

    if (nextPoint) {
      const gap = nextPoint.timestamp - point.timestamp;
      if (gap > step * 1.5) {
        let inserted = 0;
        for (let filler = point.timestamp + step; filler < nextPoint.timestamp; filler += step) {
pushPoint(filler, point.value);
          inserted++;
          if (inserted > 1500) break; // safety cap
        }
      }
    }
  }

  // Remove duplicates and sort
  const seen = new Set();
  result = result.filter(pt => {
    if (seen.has(pt.rawTimestamp)) return false;
    seen.add(pt.rawTimestamp);
    return true;
  });
  result.sort((a, b) => a.rawTimestamp - b.rawTimestamp);
  return result;
}
