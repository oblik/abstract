"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselPagination } from "@/app/components/ui/carousel";
import ChartWidget from "@/app/components/customComponents/ChartWidget";
import MonthlyListenersChartWidget from "@/app/components/customComponents/MonthlyListenersChartWidget";
import Chart from "@/app/components/customComponents/Chart";
import MonthlyListenersChart2 from "@/app/components/customComponents/MonthlyListenersChart2";
import { Button } from "@/app/components/ui/button";
import { getEvents, getEventById } from "@/services/market";
import { SelectSeparator } from "@/app/components/ui/select";

interface Event {
  _id: string;
  slug: string;
  title: string;
  image?: string;
  endDate?: string;
  description?: string;
  forecast?: boolean;
  seriesId?: string;
  marketId?: Array<{
    _id?: string;
    odd?: number;
    volume?: number;
    groupItemTitle?: string;
    outcome?: Array<{
      title?: string;
    }>;
    clobTokenIds: string;
    [key: string]: any;
  }>;
}

export default function SlideshowListingCarousel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 640);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { success, result } = await getEvents({ id: "all", limit: 10, page: 1, banner: "active" });
        if (success && Array.isArray(result?.data)) {
          const detailedEvents = await Promise.all(
            result.data.map(async (ev) => {
              const { success: detailSuccess, result: detailResult } = await getEventById({ id: ev.slug });
              return detailSuccess ? detailResult : ev;
            })
          );
          setEvents(detailedEvents);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-3 pt-0 sm:pb-0 w-full max-w-screen overflow-hidden">
      <div className={`relative w-full ${isMobile ? "h-auto" : "h-[410px]"} lg:block`}>
        <Carousel autoPlayInterval={12000}>
          <CarouselContent>
            {events?.map((event) => (
              isMobile ? (
                <CarouselItem key={event._id}>
                  <div className="w-full h-full px-[1.5] pt-0">
                    {event.forecast ? (
                      <MonthlyListenersChart2
                        image={event.image || "/images/logo.png"}
                        endDate={event.endDate}
                        market={event.marketId || []}
                        eventSlug={event.slug}
                        interval={"all"}
                        title={event.title}
                        volume={event.marketId?.reduce((acc, mark) => acc + (mark.volume || 0), 0) || 0}
                        series={""}
                      />
                    ) : (
                      <Chart
                        title={event.title}
                        id={event.slug}
                        image={event.image || "/images/logo.png"}
                        endDate={event.endDate}
                        market={event.marketId || []}
                        interval={"all"}
                        chance={event.marketId?.[0]?.odd || 0}
                        volume={event.marketId?.reduce((acc, mark) => acc + (mark.volume || 0), 0) || 0}
                      />
                    )}
                  </div>
                </CarouselItem>
              ) : (
                <CarouselItem key={event._id}>
                  <div className="flex px-0 py-6 justify-center items-center w-full h-full">
                    {/* Left: Event Info + Options */}
                    <div className="flex flex-col justify-start w-full h-full min-w-[260px]">
                      {/* Top: Image and Title */}
                      <div className="flex flex-row pb-2 items-center gap-3">
                        <Link
                          href={`/event-page/${event.slug}`}
                          className="flex items-center gap-3 group"
                          style={{ textDecoration: 'none' }}
                        >
                          <div className="w-16 aspect-square overflow-hidden rounded-lg bg-[#181818] flex items-center justify-center">
                            <Image
                              src={event.image || "/images/logo.png"}
                              alt="Event"
                              width={70}
                              height={70}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          <div
                            className="text-xl font-bold text-white max-w-[400px] leading-tight line-clamp-2"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        </Link>
                      </div>

                      {/* Markets */}
                      {Array.isArray(event.marketId) && event.marketId.length > 0 && (
                        <div className="w-full flex flex-col gap-2 mt-2 relative">
                          {event.marketId
                            .slice()
                            .sort((a, b) => (b.odd ?? -Infinity) - (a.odd ?? -Infinity))
                            .slice(0, 3)
                            .map((market, idx) => (
                              <Link
                                key={market._id || idx}
                                href={`/event-page/${event.slug}`}
                                className="block"
                                style={{ textDecoration: 'none' }}
                              >
                                <div className="flex items-center justify-between w-full bg-black rounded-md px-2 pl-0 py-1 hover:bg-[#0f0f0f] transition-colors cursor-pointer">
                                  <span className="text-sm text-gray-300 max-w-[220px]">
                                    {event.marketId && event.marketId.length === 1
                                      ? "Outcomes"
                                      : (market.groupItemTitle || market.outcome?.[0]?.title || (idx === 0 ? "Yes" : "No"))
                                    }
                                  </span>
                                  <span className="flex items-center gap-2 ml-2">
                                    <span className="text-white text-sm font-bold">
                                      {market.odd !== undefined && market.odd !== null ? market.odd : "--"}%
                                    </span>

                                    <div className="ml-3 relative group" style={{ minWidth: 40 }}>
                                      <Button
                                        variant="ghost"
                                        className="h-[28px] px-6 text-[12px] font-semibold border border-transparent text-[#7dfdfe] hover:text-[#7dfdfe] bg-[#0d1a26] hover:bg-[#0d1a26] transition-colors duration-300 rounded-md capitalize relative z-10"
                                        title={market.outcome?.[0]?.title || "Yes"}
                                      >
                                        {market.outcome?.[0]?.title || "Yes"}
                                      </Button>
                                      <div className="absolute inset-0 rounded-md z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute inset-0 rounded-md border border-[#00d4ff] animate-border-glow"></div>
                                      </div>
                                    </div>

                                    <div className="relative group" style={{ minWidth: 40 }}>
                                      <Button
                                        variant="ghost"
                                        className="h-[28px] px-7 text-[12px] font-semibold border border-transparent text-[#ec4899] hover:text-[#ec4899] bg-[#210d1a] hover:bg-[#210d1a] transition-colors duration-300 rounded-md capitalize relative z-10"
                                        title={market.outcome?.[1]?.title || "No"}
                                      >
                                        {market.outcome?.[1]?.title || "No"}
                                      </Button>
                                      <div className="absolute inset-0 rounded-md z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute inset-0 rounded-md border border-[#ec4899] animate-border-glow"></div>
                                      </div>
                                    </div>
                                  </span>
                                </div>
                              </Link>
                            ))}
                          <SelectSeparator className="z-40 my-1" />
                        </div>
                      )}

                      {/* Event Description + Volume + End Date */}
                      <div className="flex w-max flex-col items-start gap-1 mb-1 mt-3">
                        {event.endDate && (
                          <div className="text-xs text-gray-400 flex mt-1 mb-1 items-center gap-1">
                            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="11" r="8" /><path d="M12 6v6l4 2" /></svg>
                            <span className="text-white">Market Closes </span>
                            {new Date(event.endDate).toLocaleString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                            })}
                          </div>
                        )}
                        <div className="text-xs mt-1 mb-1 text-gray-400 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          <span className="text-white">Volume </span>
                          <span>
                            ${((event.marketId?.reduce((acc, mark) => acc + (mark.volume || 0), 0) || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {event.description && (
                        <div className="w-full pb-6 mt-1 text-xs break-words leading-relaxed" style={{ lineHeight: '1.7' }}>
                          <p className="w-full text-gray-400 line-clamp-2">
                            <span className="text-white">Rules </span>
                            {event.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Chart */}
                    <div className="pl-6 flex-1 w-full h-full">
                      {event.forecast ? (
                        <MonthlyListenersChartWidget
                          image={event.image || "/images/logo.png"}
                          endDate={event.endDate}
                          market={event.marketId || []}
                          eventSlug={event.slug}
                          interval={"all"}
                        />
                      ) : (
                        <ChartWidget
                          title1={event.marketId?.[0]?.outcome?.[0]?.title || "Yes"}
                          title2={event.marketId?.[0]?.outcome?.[1]?.title || "No"}
                          id={event.slug}
                          image={event.image || "/images/logo.png"}
                          endDate={event.endDate}
                          market={event.marketId || []}
                          interval={"all"}
                          chance={event.marketId?.[0]?.odd || 0}
                          series={event.seriesId}
                        />
                      )}
                    </div>
                  </div>
                </CarouselItem>
              )
            ))}
          </CarouselContent>
          <CarouselPagination />
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
}
