"use client";
import { useEffect, useState } from "react";
import { Divide, Loader } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselPagination } from "@/app/components/ui/carousel";
import ChartWidget from "@/app/components/customComponents/ChartWidget";
import MonthlyListenersChartWidget from "@/app/components/customComponents/MonthlyListenersChartWidget";
import { Button } from "@/app/components/ui/button";
import { getEvents, getEventById } from "@/services/market";
import { SelectSeparator } from "@/app/components/ui/select";


export default function SlideshowLintingCarousel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { success, result } = await getEvents({id:"all",limit:10,page:1,banner:"active"});
        if(success && Array.isArray(result?.data)){
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
    <div className="w-full max-w-screen overflow-hidden lg:block hidden">
      <Carousel autoPlayInterval={8000}>
        <CarouselContent>
          {events?.map((event, index) => {
            if (isMobile && index % 3 === 2) return null;
            return (
              <CarouselItem key={event?._id}>
                <div className="flex px-6 py-6 justify-center items-center w-full h-[410px] bg-black border border-[#222] rounded-lg shadow-sm" style={{ boxShadow: '0 2px 6px 0 rgba(220,220,255,0.13)' }}>
                  {/* Left: Event Info + Options */}
                  <div className="flex flex-col justify-start ww-full h-full min-w-[260px]]">
                    {/* Top: Image and Title */}
                    <div className="flex flex-row pb-2 items-center gap-3">
                      <div
                        style={{
                          width: "70px",
                          height: "70px",
                          overflow: "hidden",
                          borderRadius: "8px",
                          background: "#181818",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <img
                          src={event.image || "/images/logo.png"}
                          alt="Event"
                          width={64}
                          height={64}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div
                        className="text-xl font-bold text-white max-w-[400px] leading-tight line-clamp-2 flex items-center"
                        style={{display: "flex", alignItems: "center" }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    </div>
                  {Array.isArray(event.marketId) && event.marketId.length > 0 && (
                    <div className="w-full flex flex-col gap-2 mt-2 relative">
                      {event.marketId
                        .slice()
                        .sort((a, b) => (b.odd ?? -Infinity) - (a.odd ?? -Infinity))
                        .slice(0, 3)
                        .map((market, idx) => (
                          <div
                            key={market._id || idx}
                            className="flex items-center justify-between w-full bg-black rounded-md px-2 pl-0 py-1 mb-0"
                          >
                            <span className="text-s text-gray-300 max-w-[220px]">
                              {market.groupItemTitle || market.outcome?.[0]?.title || (idx === 0 ? "Yes" : "No")}
                            </span>
                            <span className="flex items-center gap-2 ml-2">
                              <span className="text-white font-bold">
                                {market.odd !== undefined && market.odd !== null ? market.odd : "--"}%
                              </span>
                              {/* Yes/No buttons */}
                              <div className="ml-3 relative group" style={{ minWidth: 36 }}>
                                <Button
                                  variant="ghost"
                                  className="h-[28px] px-4 text-[12px] font-semibold border border-transparent text-[#7dfdfe] bg-[#0d1a26] hover:bg-[#0d1a26] transition-colors duration-300 rounded-md capitalize relative z-10"
                                  title="Yes"
                                >
                                  Yes
                                </Button>
                                {/* Tron blue border animation - hover only */}
                                <div className="absolute inset-0 rounded-md z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="absolute inset-0 rounded-md border border-[#00d4ff] animate-border-glow"></div>
                                  <div className="absolute inset-0 rounded-md">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent animate-line-flow" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-transparent via-[#00d4ff] to-transparent animate-line-flow-vertical" style={{ animationDelay: '0.7s' }}></div>
                                    <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent animate-line-flow" style={{ animationDelay: '1.2s' }}></div>
                                    <div className="absolute bottom-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-[#00d4ff] to-transparent animate-line-flow-vertical" style={{ animationDelay: '1.7s' }}></div>
                                  </div>
                                </div>
                              </div>
                              <div className="relative group" style={{ minWidth: 36 }}>
                                <Button
                                  variant="ghost"
                                  className="h-[28px] px-4 text-[12px] font-semibold border border-transparent text-[#ec4899] bg-[#210d1a] hover:bg-[#210d1a] transition-colors duration-300 rounded-md capitalize relative z-10"
                                  title="No"
                                >
                                  No
                                </Button>
                                {/* Pink border animation - hover only */}
                                <div className="absolute inset-0 rounded-md z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="absolute inset-0 rounded-md border border-[#ec4899] animate-border-glow"></div>
                                  <div className="absolute inset-0 rounded-md">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#ec4899] to-transparent animate-line-flow" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-transparent via-[#ec4899] to-transparent animate-line-flow-vertical" style={{ animationDelay: '0.7s' }}></div>
                                    <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#ec4899] to-transparent animate-line-flow" style={{ animationDelay: '1.2s' }}></div>
                                    <div className="absolute bottom-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-[#ec4899] to-transparent animate-line-flow-vertical" style={{ animationDelay: '1.7s' }}></div>
                                  </div>
                                </div>
                              </div>
                            </span>
                          </div>
                        ))}
                      {/* Black fadeout at the bottom (lower opacity, more distance) */}
                      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent rounded-b-md z-30" />
                      <SelectSeparator className="z-35 my-2" />            
                    </div>
                    
                  )}
                    {/* Event Description at the bottom */}
                  <div className="flex flex-col items-start gap-1 mb-1 mt-3">
                      {event.endDate && (
                      <div className="text-xs text-gray-400 flex mt-1 mb-1 items-center gap-1">
                        <svg  width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="11" r="8"/><path d="M12 6v6l4 2"/></svg>

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
                      {/* Volume icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M4 20h2v-6H4zM8 20h2v-10H8zM12 20h2v-14h-2zM16 20h2v-8h-2z"/></svg>
                      <span className="text-white">Volume </span>
                      <span> ${((event.marketId?.reduce((acc, mark) => acc + (mark.volume || 0), 0) || 0)/100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                    {event.description && (
                        <div className="w-full pb-6 mt-1 text-xs break-words leading-relaxed" style={{ lineHeight: '1.7' }}>
                          <div className="w-full block" style={{ wordBreak: 'break-word' }}>
                            <span className="w-full text-white">Rules </span>
                            <p1 className="w-full text-gray-400 line-clamp-2">{event.description}</p1>
                          </div>
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
            );
          })}
        </CarouselContent>
        <CarouselPagination />
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
