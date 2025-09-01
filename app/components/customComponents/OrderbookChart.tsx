"use client";
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import { Legend, Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowRightLeft } from "lucide-react";
import { ChartContainer, ChartConfig as UIChartConfig } from "@/app/components/ui/chart";
import ChartIntervals from "./ChartIntervals";
import { Card, CardContent, CardTitle, CardDescription } from "@/app/components/ui/card";
import Logo from "../../../public/images/logo.png";
import Image from "next/image";
import SONOTRADE from "/images/SONOTRADE.png";
import { processSingleChartData } from "@/utils/processChartData";
import { getPriceHistory } from "@/services/market";
import { checkApiSuccess, getResponseResult } from '@/lib/apiHelpers';
import { SocketContext } from "@/config/socketConnectivity";
import { isEmpty } from "@/lib/isEmpty";
import { toFixedDown } from "@/lib/roundOf";

interface Market {
  clobTokenIds: string;
}

interface ChartDataItem {
  timestamp: string;
  asset1: number | null;
  rawTimestamp?: number;
}

interface OrderbookChartProps {
  title: number;
  market: any;
  id: any;
  interval: string;
  setInterval: (interval: string) => void;
  customData?: ChartDataItem[];
  selectedMarket: any;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  let formattedLabel = label;
  if (label) {
    // label is the rawTimestamp value, format it directly
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
    console.log('OrderbookChart Tooltip payload:', payload); // Debug log
    const entry = payload[0]; // Only use the first entry
    return (
      <div className="bg-transparent p-2 border border-transparent rounded shadow text-white">
        <p className="text-sm font-semibold">{formattedLabel}</p>
        {entry.value !== null && (
          <p style={{ color: entry.color }} className="text-sm">
            {entry.name} {entry.value?.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

const OrderbookChart: React.FC<OrderbookChartProps> = ({
  title,
  id,
  market,
  interval,
  setInterval,
  selectedMarket,
}) => {
  const [chartDataYes, setChartDataYes] = useState<any[]>([]);
  const [chartDataNo, setChartDataNo] = useState<any[]>([]);
  const [allChartDataYes, setAllChartDataYes] = useState<any[]>([]);
  const [allChartDataNo, setAllChartDataNo] = useState<any[]>([]);
  const [selectedYes, setSelectedYes] = useState<boolean>(true);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [chartConfig, setChartConfig] = useState<UIChartConfig>({
    asset1: {
      label: "Yes",
      color: "#7DFDFE",
    },
  });
  const socketContext = useContext(SocketContext);
  const [hoveredChance, setHoveredChance] = useState<number | undefined>(
          undefined
      );
  const containerRef = useRef<HTMLDivElement>(null);

  // State to track screen width
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setScreenWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const fetchData = useCallback(async() => {
    try {
      console.log('OrderbookChart fetchData called with:', { selectedYes, interval, selectedMarket });
      const data = {
        market: selectedYes ? "yes" : "no",
interval: "all",
        fidelity: 30,
      };
      const response = await getPriceHistory(id, data as any);
      if (checkApiSuccess(response)) {
        console.log('OrderbookChart API response success');
        const result = getResponseResult(response) || [];
        // Find the specific market data that matches selectedMarket
        const filteredResult = result.find(
          (item: any) => item.groupItemTitle === selectedMarket.groupItemTitle
        );
        
        if (filteredResult) {
          let formattedData = (filteredResult as any).data?.map((item: any) => {
            let formattedTime: any = Math.floor(new Date(item.t).getTime() / 1000);
            return {
              t: formattedTime,
p: item.p / 100,
            };
          });
        
        
        if(selectedYes){
          setAllChartDataYes(formattedData || []);
        } else {
          setAllChartDataNo(formattedData || []);
        }
        
        let processedData = processSingleChartData(formattedData || [], interval);
        if(selectedYes){
          setChartDataYes(processedData);
        } else {
          setChartDataNo(processedData);
        }
        }
      }
    } catch (error) {
      console.log(error)
      console.log(error, "err");

    }
  }, [id, selectedYes, selectedMarket, interval]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Remove interval from dependencies like Chart.tsx

  useEffect(() => {



    if (selectedYes && allChartDataYes.length > 0) {

      let processedData = processSingleChartData(allChartDataYes, interval);

      setChartDataYes(processedData);
    } else if (!selectedYes && allChartDataNo.length > 0) {

      let processedData = processSingleChartData(allChartDataNo, interval);

      setChartDataNo(processedData);
    }
  }, [interval, allChartDataYes, allChartDataNo, selectedYes]);

  useEffect(() => {
      const socket = socketContext?.socket;
      if (!socket) return;
  
      const chartUpdate = () => {
          fetchData();
      };
      
      socket.on("chart-update", chartUpdate);
      // };
  }, [fetchData, socketContext]); // Remove interval from dependencies like Chart.tsx

  useEffect(() => {
    if (selectedYes) {
      setChartData(chartDataYes);
      setChartConfig({ asset1: { label: "Yes", color: "#7DFDFE" } });
    } else {
      setChartData(chartDataNo);
      setChartConfig({ asset1: { label: "No", color: "#EC4899" } });
    }
  }, [selectedYes, chartDataYes, chartDataNo]);

  // Calculate the current displayed chance value and color
  const displayChance =
        hoveredChance !== undefined
            ? hoveredChance
            : selectedYes
                ? title
                : title === 0
                    ? 0
                    : title !== undefined
                        ? 100 - title
                        : undefined;
  const chanceColor = selectedYes ? "#7DFDFE" : "#EC4899";

  // Custom dot component that only shows on the last data point
  const CustomDot = (props: any) => {
    const { cx, cy, index } = props;
    const isLastPoint = index === chartData.length - 1;
    if (!isLastPoint) return null;
    const dotColor = selectedYes ? "#7DFDFE" : "#EC4899";
    return (
      <g>
        {/* Animated pulsing ring */}
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="none"
          stroke={dotColor}
          strokeWidth={2}
          opacity={0.6}
        >
          <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={dotColor}
          stroke="#fff"
          strokeWidth={2}
        >
          <animate attributeName="r" values="4;5;4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>
    );
  };

  return (
    <Card className="h-auto" style={{ backgroundColor: "transparent", borderColor: "transparent" }}>
      <div className="relative">

        <div className="flex items-center justify-between mb-3 pb-2 mt-4 w-full relative">
          <div className="flex items-center">
            <CardTitle className="text-4xl text-left ml-0" style={{ color: chanceColor }}>
                        <div className="flex flex-wrap gap-3 items-center w-full">
                            <div className="flex items-center">
                                <span className="text-3xl lg:text-4xl font-semibold" style={{ color: chanceColor }}>
                                    {typeof displayChance === 'number' ? displayChance.toFixed(1) : '0.0'}%
                                </span>
                                <span className="text-lg font-light ml-2" style={{ color: chanceColor }}>
                                    chance
                                </span>
                            </div>
                        </div>
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0 mr-0" onClick={() => setSelectedYes(!selectedYes)}>
            <ArrowRightLeft size={16} />
          </Button>
        </div>
          <CardContent className="pt-0 pb-0 pl-0 pr-0">
            <div className="w-full p-0 m-0 pb-0" style={{ width: '100%', paddingBottom: 0 }}>
              <ChartContainer ref={containerRef} className="h-[300px] w-full p-0 m-0 flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none pb-0 mb-0" style={{ marginBottom: 0, paddingBottom: 0, overflow: 'visible' }} config={chartConfig}>
                <LineChart 
                  data={chartData} 
                  className="pl-0 w-full"
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  width={undefined}
                  syncId="chart"
                  syncMethod="value"
                  onMouseMove={(e) => {
                    if (e.activePayload && e.activePayload.length > 0) {
                      setHoveredChance(e.activePayload[0].value);
                    }
                    // no dynamic radius
                  }}
                  onMouseLeave={() => {
                    setHoveredChance(undefined);
                    // no dynamic radius
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1a1a1a" />
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
                      const minTime = Math.min(...chartData.map(d => d.rawTimestamp || 0));
                      const maxTime = Math.max(...chartData.map(d => d.rawTimestamp || 0));
                      const tickCount = screenWidth < 640 ? 4 : 6;
                      const step = (maxTime - minTime) / (tickCount - 1);
                      return Array.from({ length: tickCount }, (_, i) => minTime + (step * i));
                    })() : undefined}
                    allowDuplicatedCategory={false}
                    tickFormatter={(t) => {
                      const date = new Date(t * 1000);
                      if (interval === "all" || interval === "1m" || interval === "1w") {
                        return date.toLocaleString("en-US", {
                          day: "numeric",
                          month: "short",
                        });
                      } else {
                        return date.toLocaleString("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true
                        });
                      }
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(tick) => `${tick}%`}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    orientation="right"
                    width={46}
                    tick={{ fill: '#fff', fontSize: 12 }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    allowEscapeViewBox={{ x: true, y: false }}
                    isAnimationActive={false}
                    shared={true}
                    cursor={false}
                  />
                  <Legend height={36} iconType="rect" wrapperStyle={{ top: "-30px", paddingBottom: 32 }} iconSize={8} />
                  <Line
                    type="stepAfter"
                    dataKey="asset1"
                    name={chartConfig.asset1.label}
                    stroke={selectedYes ? "#7DFDFE" : "#EC4899"}
                    strokeWidth={1}
                    dot={<CustomDot />}
                    activeDot={{ r: 3, fill: selectedYes ? "#7DFDFE" : "#EC4899", stroke: "#fff", strokeWidth: 2 }}
                    label={false}
                    connectNulls={false}
                    isAnimationActive={false}
                    animationBegin={0}
                    animationDuration={0}
                  />
                </LineChart>
              </ChartContainer>
              <div className="flex justify-center items-center mt-2 sm:mt-0 mb-4 sm:mb-8 md:mb-8 text-xs sm:text-base" style={{ marginTop: '0.5rem', marginBottom: '1rem', transform: 'scale(0.85)', transformOrigin: 'center', maxWidth: '90vw' }}>
                <ChartIntervals interval={interval} setInterval={setInterval} />
              </div>
            </div>
          </CardContent>
        </div>
    </Card>
  );
};

export default OrderbookChart;