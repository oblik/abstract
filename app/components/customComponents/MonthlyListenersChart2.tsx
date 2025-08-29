"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { Legend, Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Clock } from "lucide-react";
import { ChartContainer, ChartConfig } from "@/app/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { processSingleChartData, ChartDataPoint } from "@/utils/processChartData";
import { toTwoDecimal } from "@/utils/helpers";
import ChartIntervals from "@/app/components/customComponents/ChartIntervals";
import { getForecastHistory, getSeriesByEvent } from "@/services/market";
import { checkApiSuccess, getResponseResult } from '@/lib/apiHelpers';
import { isEmpty } from "@/lib/isEmpty";
import { Popover } from "radix-ui";
import { CountdownTimerIcon } from "@radix-ui/react-icons";
import { momentFormat } from "@/app/helper/date";
import { useRouter } from "next/navigation";

const getIntervalDate = (interval: string) => {
  const now = new Date();
  switch (interval) {
    case "1h":
      return new Date(now.getTime() - 60 * 60 * 1000).getTime();
    case "6h":
      return new Date(now.getTime() - 6 * 60 * 60 * 1000).getTime();
    case "1d":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).getTime();
    case "1w":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    case "1m":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
    case "all":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).getTime();
    default:
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).getTime();
  }
}

interface MarketData {
  clobTokenIds: string;
  [key: string]: any;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    [key: string]: any;
  }>;
  label?: string;
}

interface MultiListenersChart2Props {
  title?: string;
  volume?: number;
  endDate?: string;
  image: any;
  market: MarketData[];
  eventSlug: string;
  customData?: ChartDataPoint[];
  interval: string;
  unit?: string;
  series: any;
}

function calculateYAxisDomain(data: any[], assetKey: string = 'asset1'): [number, number] {
  if (!data || data.length === 0) {

    return [0, 100];
  }
  
  // Find min and max values, filtering out null/undefined
  const values = data
    .map(d => d[assetKey])
    .filter(v => v !== null && v !== undefined && !isNaN(v));
  
  
  if (values.length === 0) {
    return [0, 100];
  }
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Round min down to first whole 10 below, max up to first whole 10 above
  const roundedMin = Math.floor(min / 10) * 10;
  const roundedMax = Math.ceil(max / 10) * 10;
  
  
  // Ensure we have at least some range
  const range = roundedMax - roundedMin;
  if (range < 10) {
    return [roundedMin - 10, roundedMax + 10];
  }
  
  return [roundedMin, roundedMax];
}

function numUnit(n: string) {
  if (isEmpty(n) || !["k", "t", "m", "b"].includes(n)) return 1; 
  if (n === "t") return 1e12;
  if (n === "b") return 1e9;
  if (n === "m") return 1e6;
  if (n === "k") return 1e3;
  return 1;
}

const MultiListenersChart2: React.FC<MultiListenersChart2Props> = ({
  title,
  volume,
  endDate,
  image,
  market,
  eventSlug,
  customData,
  interval,
  unit,
  series
}) => {
  const [chartDataYes, setChartDataYes] = useState<ChartDataPoint[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    asset1: {
      label: "Forecast",
      color: "#7DFDFE",
    },
  });
  const [hoveredChance, setHoveredChance] = useState<number | undefined>(undefined);
  const [seriesData, setSeriesData] = useState<any>([])
  const route = useRouter()

  // Create a custom tooltip component that can access the Chart component's state
  const CustomTooltipWithState: React.FC<CustomTooltipProps & { isCustomData?: boolean, unit: string }> = ({ 
    active, 
    payload, 
    label, 
    isCustomData = false,
    unit = ""
  }) => {
    let formattedLabel = label;
    if (label && typeof label === 'number') {
      const date = new Date(label * 1000);
      formattedLabel = date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
    
    if (active && payload && payload.length) {
      return (
        <div className="bg-transparent p-2 border border-transparent rounded shadow text-white">
          <p className="text-sm font-semibold">{formattedLabel}</p>
          {payload.map(
            (entry, index) =>
              entry.value !== null && (
                <p key={index} style={{ color: entry.color }} className="text-sm">
                  Forecast {isCustomData ? `${entry.value}` : `${entry.value?.toFixed(1)}`}
                </p>
              )
          )}
        </div>
      );
    }
    return null;
  };
  const [allChartData, setAllChartData] = useState<ChartDataPoint[]>([]);

  // State to track screen width
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Update screen width on resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setScreenWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    setChartData(chartDataYes);
  }, [chartDataYes]);

  const fetchAllPriceHistories = useCallback(async () => {
    try {
      const payload = {
        start_ts: getIntervalDate("all"),
        end_ts: new Date().getTime(),
      };
      const response = await getForecastHistory(eventSlug, payload as any);
      if (checkApiSuccess(response)) {
        const result = getResponseResult(response) || [];
        const formattedData = result.map((item: any) => ({
          t: Math.floor(new Date(item.createdAt).getTime() / 1000),
          p: item.forecast / 100,
        }));
        setAllChartData(formattedData);
        const processedData = processSingleChartData(formattedData, interval);
        setChartDataYes(processedData);
      } else {
        console.error("MonthlyListenersChart2: Failed to fetch data");
      }
    } catch (error) {
      console.log('error', error)
      console.error("Error fetching all market data:", error);
    }
  }, [eventSlug, interval]);

  useEffect(() => {
    fetchAllPriceHistories();
  }, [fetchAllPriceHistories]);

  useEffect(() => {
    if (allChartData.length > 0) {
      const dataPoints = allChartData.map(({ t, p }) => ({ t, p }));
      const processedData = processSingleChartData(dataPoints as any, interval);
      setChartDataYes(processedData);
    }
  }, [interval, allChartData]);

  useEffect(() => {
    if (chartDataYes && chartDataYes.length > 0 && hoveredChance === undefined) {
      const lastDataPoint: any = chartDataYes[chartDataYes.length - 1];
      if (lastDataPoint && lastDataPoint.asset1 !== null) {
      }
    }
  }, [chartDataYes, hoveredChance]);

  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const lastPoint: any = chartData[chartData.length - 1];
      if (lastPoint && lastPoint.asset1 !== null && lastPoint.asset1 !== undefined) {
      }
    }
  }, [chartData]);

  // Calculate the current displayed chance value
  const displayChance =
    hoveredChance !== undefined
      ? hoveredChance
      : chartData && chartData.length > 0
        ? chartData[chartData.length - 1]?.asset1
        : undefined;

  const chanceColor = '#ffffffff';

  const CustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    const isLastPoint = index === chartData.length - 1;
    
    if (!isLastPoint) return null;
    
    const dotColor = "#d0d0d0ff";
    
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="none"
          stroke={dotColor}
          strokeWidth={2}
          opacity={0.6}
        >
          <animate
            attributeName="r"
            values="4;12;4"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0;0.8"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={dotColor}
          stroke="#fff"
          strokeWidth={2}
        >
          <animate
            attributeName="r"
            values="4;5;4"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    );
  };

  //     <Card
  //     >
  //           Loading chart data...
  //         </div>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  const getSeriesData = async(id:any)=>{
          try{
              const response = await getSeriesByEvent(id)

              if(checkApiSuccess(response)){
                  setSeriesData(getResponseResult(response) || [])
              }
          }catch(err){

          }
      }
      useEffect(()=>{
          if(series?.slug){
              getSeriesData(series?.slug)
          }else{
              setSeriesData([])
          }
      },[series,eventSlug])
  return (
    <>

      <Card
        className="h-auto"
        style={{ backgroundColor: "transparent", borderColor: "transparent" }}
      >
        <div>
          <CardHeader className="space-y-0 p-0">
            <CardTitle style={{ lineHeight: "1.5" }} className="pt-3 sm:pb-1 pb-2 sm:pt-0">
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                   width: screenWidth < 640 ? "40px" : "65px",
                   height: screenWidth < 640 ? "40px" : "65px",
                   overflow: "hidden",
                   borderRadius: "10px",
                   flexShrink: 0,
                  }}
                >
              <Image
                 src={image}
                 alt="Event"
                 width={screenWidth < 640 ? 50 : 65}
                 height={screenWidth < 640 ? 50 : 65}
                 style={{ 
                 width: "100%", 
                 height: "100%", 
                 objectFit: "cover",
                 transition: "all 0.3s ease" 
                 }}
               />
                </div>
                <div
                  className="text-[19px] lg:text-[26px] sm:text-[20px]"
                  style={{ paddingLeft: "15px" }}
                >
                  {title || ""}
                </div>
              </div>
            </CardTitle>
            <CardDescription className="py-0 pt-0 sm:pt-2 flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
              <div className="flex flex-wrap gap-3 items-center">
                <p className="text-[12px] sm:text-[14px]">Vol ${toTwoDecimal(volume)?.toLocaleString() || ""}</p>
                {endDate && (
                  <p className="flex items-center gap-1 text-[12px] sm:text-[14px]">
                   <Clock size={12} className="sm:w-[14px] sm:h-[14px] w-[12px] h-[12px]" />{" "}
                    {new Date(endDate)?.toLocaleString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {seriesData?.length > 0 && (
                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <Button className="...">
                                <CountdownTimerIcon />
                            </Button>
                        </Popover.Trigger>
                        <Popover.Content className="history_card" sideOffset={5}>
                            <ul className="history_card_list">
                            {seriesData?.length > 0 && (
                                seriesData
                                    .filter((series) => series.status !== "active")
                                    ?.sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
                                    ?.map((event) => (
                                        <li key={event?.slug} 
                                        onClick={()=>route.push(`/event-page/${event.slug}`)}
                                        >
                                            {}
                                                {momentFormat(event.endDate,"D MMM YYYY, h:mm A")}
                                            {/* </Link> */}
                                        </li>
                                    ))
                                )}
                            </ul>
                            <Popover.Arrow className="HoverCardArrow" />
                        </Popover.Content>
                    </Popover.Root>
                )}
                {seriesData?.length > 0 && (
                    seriesData
                        .filter((series) => series.status === "active")
                        ?.sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                        ?.map((event) => (
                        <div
                            key={event.slug} 
                            onClick={()=>route.push(`/event-page/${event.slug}`)}
                            className="w-[90px] rounded-full bg-transparent border border-[#262626] text-white hover:bg-[#262626] hover:text-white active:bg-[#262626] active:text-white text-center px-2 py-1 block text-sm"
                        >
                            {momentFormat(event?.endDate,"D MMM")}
                        </div>
                    ))
                )}
                {}
              </div>
            </CardDescription>
            {displayChance !== undefined && (
              <div className="flex pt-2 sm:pt-3 pb-2 flex-wrap gap-3 items-center w-full">
                <div className="flex items-center">
                  <span className="text-3xl lg:text-4xl font-semibold" style={{ color: chanceColor }}>
                    {displayChance !== undefined && displayChance !== null ? Number(displayChance).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                  </span>
                  <span className="text-lg font-light ml-2" style={{ color: chanceColor }}>forecast</span>

                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="gap-0 sm:gap-2 p-0">
              <div className="w-full test">
                <CardHeader className="p-0 sm:pb-4">
                </CardHeader>
              <CardContent className="p-0">
                <ChartContainer
                  className="h-[300px] sm:h-[300px] lg:h-[300px] p-0 pr-0 w-full"
                  config={chartConfig}
                  onMouseLeave={() => {
                    setHoveredChance(undefined);
                  }}
                >
                  <LineChart
                    data={chartData}
                    syncId="chart"
                    syncMethod="value"
                    className="pl-0"
                    onMouseMove={(e) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        setHoveredChance(e.activePayload[0].value);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#262626" />
                    <XAxis
                      dataKey="rawTimestamp"
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={100}
                      ticks={chartData.length > 0 ? (() => {
                        const minTime = Math.min(...chartData.map(d => Number(d.rawTimestamp) || 0));
                        const maxTime = Math.max(...chartData.map(d => Number(d.rawTimestamp) || 0));
                        const tickCount = screenWidth < 640 ? 4 : 6;
                        const step = (maxTime - minTime) / (tickCount - 1);
                        return Array.from({ length: tickCount }, (_, i) => minTime + (step * i));
                      })() : undefined}
                      allowDuplicatedCategory={false}
                      tickFormatter={(t) => {
                        const date = new Date(t * 1000);
                        if (interval === '1h' || interval === '6h' || interval === '1d') {
                          return date.toLocaleString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                          });
                        } else {
                          return date.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric"
                          });
                        }
                      }}
                      tick={{ fontSize: screenWidth < 640 ? 9 : 12, fill: '#bdbdbd' }}

                    />
                    <YAxis
                      domain={[0, 'dataMax']}                    
                      tickFormatter={(tick) => customData ? `${tick}` : `${tick}`}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      orientation="right"
                      width={40}
                      tick={{ fontSize: screenWidth < 640 ? 9 : 12, fill: '#bdbdbd' }}
                    />
                    <Tooltip 
                      content={<CustomTooltipWithState isCustomData={!!customData} unit={unit ?? ""} />}
                      allowEscapeViewBox={{ x: true, y: false }}
                      isAnimationActive={false}
                      shared={true}
                      cursor={false}
                    />
                    {/* Legend and forecast label removed */}
                    <Line
                      type="stepAfter"
                      dataKey="asset1"
                      stroke="#ffffffff"
                      strokeWidth={1}
                      dot={<CustomDot />}
                      activeDot={{ r: 4, fill: "#d0d0d0ff", stroke: "#fff", strokeWidth: 2 }}
                      label={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
              </div>
          </CardContent>
        </div>
      </Card>
    </>
  );
};

export default MultiListenersChart2;
