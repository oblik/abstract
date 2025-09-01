"use client";

import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import Ye from "/public/images/Ye.png";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { Legend, Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowRightLeft, Clock } from "lucide-react";
import { ChartContainer, ChartConfig } from "@/app/components/ui/chart";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card";
import { processSingleChartData, processMultiChartData } from "@/utils/processChartData";
import { toTwoDecimal } from "@/utils/helpers";
import { HoverCard } from "radix-ui";
import { CountdownTimerIcon } from "@radix-ui/react-icons";
import { getPriceHistory, getSeriesByEvent, getForecastHistory } from "@/services/market";
import { checkApiSuccess, getResponseResult } from '@/lib/apiHelpers';
import { capitalize } from "@/lib/stringCase";
import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { momentFormat } from "@/app/helper/date";
import { useRouter } from "next/navigation";
import { isEmpty } from "@/lib/isEmpty";
import { SocketContext } from "@/config/socketConnectivity";

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

interface ChartProps {
    id: string;
    title?: string;
    volume?: number;
    endDate?: string;
    image: any;
    market: MarketData[];
    interval: string;
    chance?: number;
    series?: any
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
}) => {
    let formattedLabel = label;
    if (label && typeof label === 'number') {
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
        return (
            <div className="bg-transparent p-2 border border-transparent rounded shadow text-white">
                <p className="text-sm font-semibold">{formattedLabel}</p>
                {payload.map(
                    (entry, index) =>
                        entry.value !== null && (
                            <p key={index} style={{ color: entry.color }} className="text-sm">
                                {entry.name} {entry.value?.toFixed(1)}%
                            </p>
                        )
                )}
            </div>
        );
    }
    return null;
};

const Chart: React.FC<ChartProps> = ({
    id,
    title,
    volume,
    endDate,
    image,
    market,
    interval,
    chance,
    series
}) => {
    const socketContext = useContext(SocketContext);
    const [chartDataYes, setChartDataYes] = useState<any[]>([]);
    const [chartDataNo, setChartDataNo] = useState<any[]>([]);
    const [selectedYes, setSelectedYes] = useState<boolean>(true);
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartConfig, setChartConfig] = useState<any>([]);
    const [assetKeys, setAssetKeys] = useState<any>([]);
    const [seriesData, setSeriesData] = useState<any>([])
    const [allChartData, setAllChartData] = useState<any>([]);
    const [allChartDataYes, setAllChartDataYes] = useState<any[]>([]);
    const [allChartDataNo, setAllChartDataNo] = useState<any[]>([]);
    const route = useRouter()

    const [hoveredChance, setHoveredChance] = useState<number | undefined>(
        undefined
    );
    const [multiHoveredChance, setMultiHoveredChance] = useState<any>([]);

    // Create a custom tooltip component that can access the Chart component's state
    const CustomTooltipWithState: React.FC<CustomTooltipProps> = ({
        active,
        payload,
        label,
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
                                    {entry.name} {entry.value?.toFixed(1)}%
                                </p>
                            )
                    )}
                </div>
            );
        }
        return null;
    };

    // State to track screen width
    const [screenWidth, setScreenWidth] = useState<number>(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );
    const ChartColors = useMemo(() => [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
    ], [])

    // Update screen width on resize
    useEffect(() => {
        if (typeof window !== "undefined") {
            const handleResize = () => setScreenWidth(window.innerWidth);
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);

    useEffect(() => {
        if (selectedYes) {
            setChartData(chartDataYes);
            // setChartConfig({
            // });
        } else {
            setChartData(chartDataNo);
        }
    }, [selectedYes, chartDataYes, chartDataNo]);

    const getIntervalDate = (interval: string) => {
        const now = new Date();
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        switch (interval) {
            case "1h":
                return new Date(now.getTime() - 60 * 60 * 1000).getTime();
            case "6h":
                return new Date(now.getTime() - 6 * 60 * 60 * 1000).getTime();
            case "1d":
                // Start from exactly 24 hours ago from now
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
    };

    const fetchData = useCallback(async () => {
        try {
            console.log('Chart fetchData called with:', { selectedYes, interval, id, market });
            // Request all available data by setting interval to "all"
            const payload = {
                start_ts: getIntervalDate("all"),
                end_ts: new Date().getTime(),
            };

            console.log('Chart: Making API call to getForecastHistory with payload:', payload);
            const response = await getForecastHistory(id, payload as any);
            console.log('Chart: Raw API response:', response);

            if (checkApiSuccess(response)) {
                console.log('Chart API response success');
                const result = getResponseResult(response) || [];
                console.log('Chart: Processed result:', result);

                if (!result || !Array.isArray(result)) {
                    console.error('Chart: Invalid API response structure:', result);
                    return;
                }

                // Process the forecast data similar to MonthlyListenersChart2
                const formattedData = result.map((item: any) => ({
                    t: Math.floor(new Date(item.createdAt).getTime() / 1000),
                    p: item.forecast / 100,
                }));

                console.log('Chart: Formatted forecast data:', formattedData);

                // Set chart config for single forecast line
                setChartConfig([
                    {
                        label: "Forecast",
                        color: selectedYes ? "#7dfdfe" : "#ec4899",
                        asset: "asset1",
                    },
                ]);

                // Store all data
                if (selectedYes) {
                    setAllChartDataYes(formattedData);
                } else {
                    setAllChartDataNo(formattedData);
                }

                // Process data with current interval
                let processedData = processSingleChartData(formattedData, interval);
                console.log('Chart: Processed chart data:', processedData);

                if (selectedYes) {
                    setChartDataYes(processedData);
                } else {
                    setChartDataNo(processedData);
                }
            } else {
                console.error('Chart: API call failed:', response.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Chart: Error in fetchData:', error);
        }
    }, [id, selectedYes, interval]); // Removed market and ChartColors dependencies

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Remove interval from dependencies

    useEffect(() => {
        if (selectedYes && allChartDataYes.length > 0) {
            // Single forecast data processing - allChartDataYes is a single array
            let processedData = processSingleChartData(allChartDataYes, interval);
            setChartDataYes(processedData);
        } else if (!selectedYes && allChartDataNo.length > 0) {
            // Single forecast data processing - allChartDataNo is a single array
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

    }, [socketContext, fetchData]); // Remove interval from dependencies here too

    const getSeriesData = async (id: any) => {
        try {

            const response = await getSeriesByEvent(id)
            if (checkApiSuccess(response)) {
                setSeriesData(getResponseResult(response))
            }
        } catch (err) {
            console.log(err, "err");

        }
    }
    useEffect(() => {
        if (series?.slug) {
            getSeriesData(series?.slug)
        } else {
            setSeriesData([])
        }
    }, [series, id])

    // Calculate the current displayed chance value and color
    const displayChance =
        hoveredChance !== undefined
            ? hoveredChance // Data is already in 0-100 range
            : selectedYes
                ? chance
                : chance === 0
                    ? 0
                    : chance !== undefined
                        ? 100 - chance
                        : undefined;

    const chanceColor = selectedYes ? "#7dfdfe" : "#ec4899";
    const [activeDate, setActiveDate] = useState("Jun 18");
    const [multiDisplayChance, setMultiDisplayChance] = useState<any>([]);
    useEffect(() => {
        // Since we're now using forecast data, we don't need multi-market display logic
        // This effect can be simplified or removed
        setMultiDisplayChance([]);
    }, [selectedYes]);


    const CustomDot = (props: any) => {
        const { cx, cy, payload, index, stroke } = props;
        const isLastPoint = index === chartData.length - 1;

        if (!isLastPoint) return null;

        return (
            <g>
                {/* Animated pulsing ring */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={8}
                    fill={stroke}
                    stroke="#7DFDFE"
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

                {/* Main dot */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={stroke}
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

    return (
        <Card
            className="h-auto" // Wider on mobile
            style={{ backgroundColor: "transparent", borderColor: "transparent" }}
        >
            <div>
                <CardHeader className="space-y-0 p-0">
                    {/* 先显示标题 */}
                    <CardTitle style={{ lineHeight: "1.5" }} className="pt-0 sm:pb-1 pb-2 sm:pt-0">
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <div
                                style={{
                                    width: screenWidth < 640 ? "45px" : "65px",
                                    height: screenWidth < 640 ? "45px" : "65px",
                                    overflow: "hidden",
                                    borderRadius: screenWidth < 640 ? "7px" : "8px",
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
                                className="text-[18px] lg:text-[26px] sm:text-[20px]"
                                style={{ paddingLeft: "15px" }}
                            >
                                {title || ""}
                            </div>
                        </div>
                    </CardTitle>

                    {/* 显示 Vol 和时间等信息 */}
                    <CardDescription className="py-0 sm:pb-0 pb-1 flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
                        {/* First line - Volume, Date, and Toggle */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <p className="text-[12px] sm:text-[14px]">Vol ${volume?.toLocaleString() || ""}</p>
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
                            {/* Forecast toggle button - simpler since we're using forecast data */}
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedYes(!selectedYes)}
                                size="sm"
                                className="h-1 px-0 sm:h-9 sm:px-3"
                            >
                                <ArrowRightLeft />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 pl-2 mt-0">
                            {seriesData?.length > 0 && (
                                <Popover.Root>
                                    <Popover.Trigger asChild>
                                        <Button className="px-4 sm:h-7 h-6 rounded-full">
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
                                                        <li key={event?.slug} onClick={() => route.push(`/event-page/${event.slug}`)}>
                                                            {momentFormat(event.endDate, "D MMM YYYY, h:mm A")}
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
                                    .map((event) => (
                                        <div
                                            key={event.slug}
                                            onClick={() => route.push(`/event-page/${event.slug}`)}
                                            className="w-[90px] rounded-full bg-transparent border border-[#262626] text-white hover:bg-[#262626] hover:text-white active:bg-[#262626] active:text-white text-center px-2 py-1 block text-sm"
                                        >
                                            {momentFormat(event?.endDate, "D MMM")}
                                        </div>
                                    ))
                            )}

                            { }
                        </div>

                    </CardDescription>
                    {/* Forecast chance display */}
                    {displayChance !== undefined && (
                        <div className="flex flex-wrap gap-3 items-center w-full">
                            <div className="flex items-center">
                                <span className="text-3xl lg:text-4xl font-semibold" style={{ color: chanceColor }}>
                                    {typeof displayChance === 'number' ? displayChance.toFixed(1) : '0.0'}%
                                </span>
                                <span className="text-lg font-light ml-2" style={{ color: chanceColor }}>
                                    forecast
                                </span>
                            </div>
                        </div>
                    )}
                </CardHeader>

                <CardContent className="gap-0 sm:gap-2 p-0">
                    <div className="w-full test">
                        <CardHeader className="p-0 sm:pb-4">
                            {displayChance !== undefined && isEmpty(displayChance) && (
                                <div className="flex justify-start mb-4">
                                    <CardTitle
                                        className="text-4xl"
                                        style={{ color: chanceColor }}
                                    >
                                        <span>{typeof displayChance === 'number' ? displayChance.toFixed(1) : ''}%</span>
                                        <span className="text-2xl font-light"> forecast</span>
                                    </CardTitle>
                                </div>
                            )}
                            { }
                        </CardHeader>
                        <CardContent className="p-0">
                            <ChartContainer
                                className="h-[300px] sm:h-[300px] lg:h-[300px] p-0 pr-0 w-full"
                                config={chartConfig}
                                onMouseLeave={() => {
                                    setHoveredChance(undefined);
                                    setMultiHoveredChance([]);
                                }}
                            >
                                <LineChart
                                    data={chartData}
                                    syncId="chart"
                                    syncMethod="value"
                                    onMouseMove={(e) => {
                                        if (e && e.activePayload && e.activePayload.length > 0) {
                                            // For forecast charts, always set single hovered value
                                            setHoveredChance(e.activePayload[0].value);
                                        }
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1f1f1f" />
                                    <XAxis
                                        dataKey="rawTimestamp"
                                        type="number"
                                        scale="time"
                                        domain={['dataMin', 'dataMax']}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={4}
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
                                        tick={{ fontSize: screenWidth < 640 ? 9 : 12, fill: '#bdbdbd' }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickFormatter={(tick) => `${tick}%`}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={4}
                                        orientation="right"
                                        width={32}
                                        tick={{ fontSize: screenWidth < 640 ? 9 : 12, fill: '#bdbdbd' }}
                                    />
                                    <Tooltip
                                        content={<CustomTooltipWithState />}
                                        allowEscapeViewBox={{ x: true, y: false }}
                                        isAnimationActive={false}
                                        shared={true}
                                        cursor={false}
                                    />
                                    {/* Legend removed to hide Yes/No labels */}
                                    {chartConfig.map((asset: any, idx: any) => (
                                        <Line
                                            key={asset.asset}
                                            type="stepAfter"
                                            dataKey={asset.asset}
                                            stroke={asset.color}
                                            strokeWidth={2}
                                            name={asset.fullLabel || asset.label}

                                            dot={<CustomDot color={asset.color} />}
                                            activeDot={{
                                                r: 3,
                                                fill: asset.color,
                                                stroke: "#fff",
                                                strokeWidth: 2,
                                                style: { filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }
                                            }}
                                            label={false}
                                            connectNulls
                                            isAnimationActive={false}
                                        />
                                    ))}
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};

export default Chart;
