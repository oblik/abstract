"use client";
import "@/app/globals.css";
import { useParams } from "next/navigation";
import React, { useState, useEffect, useContext, useCallback } from "react";
import { CheckCircle, ClockIcon, Loader, XCircle } from "lucide-react";
import Image from "next/image";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import Header from "@/app/Header";
import Chart from "@/app/components/customComponents/Chart";
import {
  OrderbookAccordion,
  OrderbookAccordionContent,
  OrderbookAccordionItem,
  OrderbookAccordionTrigger,
} from "@/app/components/ui/orderbookAccordion";
import ExpandableTextView from "@/app/components/customComponents/ExpandableTextView";
import ChartIntervals from "@/app/components/customComponents/ChartIntervals";
import { SelectSeparator } from "@/app/components/ui/select";
import Link from "next/link";
import { TradingCard } from "@/app/components/customComponents/TradingCard";
import { capitalize } from "@/lib/stringCase";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerHeader,
} from "@/app/components/ui/drawer";
import { CommentSection } from "@/app/components/ui/comment";
import {
  SocketContext,
  subscribe,
  unsubscribe,
} from "@/config/socketConnectivity";
import { getOrderBook, getEventById, getCategories } from "@/services/market";
import { isEmpty } from "@/lib/isEmpty";
import { getOpenOrdersByEvtId } from "@/services/user";
import { OpenOrderDialog } from "@/app/components/customComponents/OpenOrderDialog";
import { Footer } from "@/app/components/customComponents/Footer";
import { Button } from "@/app/components/ui/button";
import ResolutionCard from "@/app/components/customComponents/ResolutionCard";
import MonthlyListenersChart2 from "@/app/components/customComponents/MonthlyListenersChart2";
import Jackboys2 from "@/public/images/jackboys2.png";
import Astroworld from "@/public/images/astroworld.png";
import { NavigationBar } from "@/app/components/ui/navigation-menu";
import HeaderFixed from "@/app/HeaderFixed";
import { toFixedDown } from "@/lib/roundOf";

export default function EventPage({ categories }) {
  const param = useParams();
  const id = param.id;
  const socketContext = useContext(SocketContext);
  const [disContainer, setDisContainer] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [markets, setMarkets] = useState([]);
  const [books, setBooks] = useState([]);
  const [bookLabels, setBookLabels] = useState([]);
  const [activeView, setActiveView] = React.useState("Yes");
  const [forecastGraph, setForecastGraph] = React.useState(false);
  const [interval, setInterval] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedOrderBookData, setSelectedOrderBookData] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openItem, setOpenItem] = useState("orderbook");
  const [openOrders, setOpenOrders] = useState([]);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [selectCategory, setSelectedCategory] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState({});
  const [showMore, setShowMore] = useState(false);


  const descending = (a, b) => Number(b[0]) - Number(a[0]);
  const ascending = (a, b) => Number(a[0]) - Number(b[0]);

  const getLowestAskPrice = (marketId) => {
    const orderBook = books?.find(book => book.marketId === marketId);
    if (!orderBook) return null;
    
    const yesAsk = orderBook?.asks?.[0]?.sort(descending)?.[0];
    const yesPrice = yesAsk?.length > 0 ? toFixedDown(100 - yesAsk[0], 2) : null;
    
    return yesPrice;
  };

    const getHighestBidPrice = (marketId) => {
    const orderBook = books?.find(book => book.marketId === marketId);
    if (!orderBook) return null;

    const yesBid = orderBook?.bids?.[0]?.sort(descending)?.[0];
    const yesPrice = yesBid?.length > 0 ? toFixedDown(100 - yesBid[0], 2) : null;

    return yesPrice;
  };

  useEffect(() => {
    // Only run on client
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size only on client side
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener("resize", handleResize);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  useEffect(() => {
    const eventId = events?._id;
    if (!isEmpty(eventId)) {
      subscribe(events._id);
      return () => {
        unsubscribe(events?._id);
      };
    }
  }, [events?._id]);

  useEffect(() => {
    const socket = socketContext?.socket;
    const eventId = events?._id;

    if (!socket || !eventId) return;

    const handleDisconnect = () => {

      subscribe(eventId);
    };

    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("disconnect", handleDisconnect);
    };
  }, [socketContext?.socket, events?._id]);

  useEffect(() => {
    const socket = socketContext?.socket;
    if (!socket) return;

    const handleOrderbook = (result) => {
      const orderbook = JSON.parse(result);
      setBooks((prev) =>
        prev.map((item) =>
          item.marketId === orderbook.marketId
            ? { ...item, bids: orderbook.bids, asks: orderbook.asks }
            : item
        )
      );
    };

    const handleRecentTrade = (result) => {
      const recentTrade = JSON.parse(result);
      setMarkets((prev) =>
        prev.map((item) =>
          item._id === recentTrade.market
            ? {
                ...item,
                last:
                  recentTrade.side === "no"
                    ? 100 - recentTrade.p
                    : recentTrade.p,
              }
            : item
        )
      );
    };

    const chartUpdate = (result) => {
        if(!result) return
        const res = JSON.parse(result);
        const marketId = res.m;
        const price = res.pc.p;
        setMarkets(prev => prev.map(market => market._id === marketId ? {...market, odd: price} : market)) 
    };

    socket.on("orderbook", handleOrderbook);
    socket.on("recent-trade", handleRecentTrade);
    socket.on("chart-update", chartUpdate);

    return () => {
      socket.off("orderbook");
      socket.off("recent-trade");
      socket.off("chart-update");
    };
  }, [socketContext?.socket]);

  const handleOpenOrderDialog = (id) => {
    getOpenOrders(id);
    setOpenOrderDialog(true);
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchEvents = async () => {
      try {
        console.log('EventPage fetchEvents called with id:', id);
        setEventsLoading(true);
        let { success, result } = await getEventById({ id: id });
        if (success) {
          console.log('EventPage fetchEvents success:', result);
          setEvents(result);
          if (result?.marketId && result?.marketId.length > 0) {
            setMarkets(
              result.marketId.filter((market) =>
                ["active", "closed", "resolved"].includes(market.status)
              )
            );
          }
        }
        setEventsLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [id]);

  const fetchAllBooks = useCallback(async () => {
    try {
      const { success, orderbook } = await getOrderBook({ id: id });
      if (success) {
        setBooks(orderbook);
      }
    } catch (error) {
      console.error("Error fetching PriceHistory:", error);
    }
  }, [id]);

  const checkOverflow =(container)=> {
    if (container.scrollHeight > container.clientHeight) {
      setShowMore(true);
      setShowFullText(false);
    } else {
      setShowMore(false);
      setShowFullText(true);
    }
  }

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const container = document.getElementById("event-discription");
      setDisContainer(container);
    }
  }, []);

  useEffect(() => {
    if(!isEmpty(disContainer)) checkOverflow(disContainer);
  },[disContainer])

  // Get Books Data
  useEffect(() => {
    if (markets.length > 0) {
      const ids = [];
      const bookLabelsTemp = [];
      markets
        .filter((market) => market.status === "active")
        .forEach((market, index) => {
          if (market.clobTokenIds) {
            const yes = JSON.parse(market?.clobTokenIds)?.[0] || "";
            const no = JSON.parse(market?.clobTokenIds)?.[1] || "";
            ids.push({ yes, no });
            bookLabelsTemp.push(market.groupItemTitle);
          }
        });
      fetchAllBooks();
      setBookLabels(bookLabelsTemp);
    }
  }, [id, markets, interval, fetchAllBooks]);

  const getOpenOrders = async (id) => {
    try {
      const { success, result } = await getOpenOrdersByEvtId({ id: id });
      if (success) {
        setOpenOrders(result);
      } else {
        setOpenOrders([]);
      }
    } catch (error) {
      console.error("Error fetching open orders:", error);
    }
  };

  const getOutcomeTitle = (arr, id) => {
    try {
      const find = arr.find(item => item._id === id);
      return find?.title ? capitalize(find?.title) : 'Yes';
    } catch {
      return '';
    }
  }

  const isWinning = useCallback((eventsParam, marketParam) => {
    try {
      if (isEmpty(eventsParam)) return false;
      if (isEmpty(marketParam)) return false;
      
      const outcomeType = eventsParam?.outcomeType;
      if (outcomeType === 'single') {
        if (eventsParam?.marketId.length === 1) {
          return eventsParam?.marketId?.[0]?.outcome?.[0]._id === eventsParam?.outcomeId;
        } else {
          return eventsParam?.outcomeId === marketParam?._id;
        }
      } else if (outcomeType === 'multi') {
        return marketParam?.outcome?.[0]._id === marketParam?.outcomeId;
      }
    } catch {
      return false;
    }
  }, []);

  return (
    <>
      <div className="px-0 sm:px-0 text-white bg-black h-auto items-center justify-items-center p-0 m-0">
        <div className="fixed top-0 left-0 z-50 w-[100%] backdrop-blur-md bg-black/80 border-b border-[#222] lg:mb-4 mb-0" style={{ borderBottomWidth: '1px' }}>
          <Header />
          <div className="hidden lg:block">
            <NavigationBar
              menuItems={categories}
              showLiveTag={true}
              setSelectedCategory={setSelectedCategory}
              selectedCategory={selectCategory}
              redirect={true}              
            />
          </div>
        </div>
        {/* Remove spacer and use padding-top on main content to offset header */}
        <div
          className=" container mx-auto px-0 max-w-full overflow-hidden"
          style={{ paddingTop: typeof window !== 'undefined' && window.innerWidth < 640 ? '40px' : '112px', paddingLeft: window?.innerWidth < 640 ? 0 : undefined, paddingRight: window?.innerWidth < 640 ? 0 : undefined }}
        >
          {eventsLoading ? (
            <div className="flex justify-center items-center h-[80vh] w-full">
              <Loader className="w-26 h-26 animate-spin bg-blend-overlay" />
            </div>
          ) : (
            <div className="px-1.5 sm:px-0 sm:mx-auto mx-0 sm:pt-4 pt-0">
              {/* Preview Card Section */}
              <div className="flex justify-center items-center">
                <div className="flex justify-center sm:max-w-8xl mb-0 w-full gap-5">
                  {}
                  <div className="w-full lg:w-[70%]">
                    {events?.forecast ? (
                      <MonthlyListenersChart2
                        title={events?.title}
                      volume={
                        Number(
                          ((markets?.reduce((acc, market) => acc + (market.volume || 0), 0) || 0) / 100)
                        ).toFixed(2)
                      }
                        image={events?.image}
                        endDate={events.endDate}
                        eventId={events?._id}
                        eventSlug={events?.slug}
                        interval={interval}
                        unit={events?.fcUnit || ""}
                        series={events?.seriesId}
                      />
                    ) : (
                      <Chart
                        title1={events?.marketId?.[0]?.outcome?.[0]?.title || "Yes"}
                        title2={events?.marketId?.[0]?.outcome?.[1]?.title || "No"}
                        id={id}
                        title={events?.title}
                        volume={
                          Number(
                            ((markets?.reduce((acc, market) => acc + (market.volume || 0), 0) || 0) / 100)
                          ).toFixed(2)
                        }
                        image={events?.image || "/images/logo.png"}
                        endDate={events?.endDate}
                        market={markets}
                        interval={interval}
                        chance={markets[0]?.odd || 0}
                        series={events?.seriesId}
                      />
                    )}
                    <div className="flex justify-center items-center mt-2 sm:mt-0 mb-4 sm:mb-8 md:mb-8 text-xs sm:text-base" style={{ marginTop: '0.5rem', marginBottom: '1rem', transform: 'scale(0.85)', transformOrigin: 'center', maxWidth: '90vw' }}>
                      <ChartIntervals
                        interval={interval}
                        setInterval={setInterval}
                      />
                    </div>

                    <div className="">
                      {events?.status === "resolved" && <hr className="mt-4" />}
                      {markets?.length < 2 &&
                      books &&
                      events?.status !== "resolved" ? (
                        <OrderbookAccordion
                          type="single"
                          value={openItem}
                          onValueChange={setOpenItem}
                          defaultValue="orderbook"
                          collapsible
                        >
                          <OrderbookAccordionItem value="orderbook">
                            <OrderbookAccordionTrigger>
                              Orderbook

                            </OrderbookAccordionTrigger>
                            <OrderbookAccordionContent
                              orderBook={
                                books?.find(
                                  (book) =>
                                    book.marketId ===
                                    markets[0]?._id
                                ) || {}
                              }
                              isOpen={openItem === "orderbook"}
                              activeView={activeView}
                              setActiveView={setActiveView}
                              setSelectedOrderBookData={
                                setSelectedOrderBookData
                              }
                              setSelectedIndex={setSelectedIndex}
                              index={0}
                              selectedMarket={markets[0]}
                              setSelectedOrder={setSelectedOrder}
                              forecastGraph={forecastGraph}
                              setForecastGraph={setForecastGraph}
                              interval={interval}
                            />
                          </OrderbookAccordionItem>
                        </OrderbookAccordion>
                      ) : (
                        <>
                          <Accordion type="single" collapsible>
                            <div className="flex items-center w-full sm:py-2 py-0.5 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider border-t-2 border-b border-[#222] bg-black">
                              <div className="flex items-center pr-6" style={{ width: 320 }}>
                                Outcome
                              </div>
                              <div className="flex-1 flex justify-end md:justify-center md:justify-end md:pl-0">
                                Chance
                              </div>
                              <div className="hidden md:flex items-center gap-1" style={{minWidth: 300}}>
                                {}
                              </div>
                            </div>

                            {markets &&
                              markets?.length > 0 &&
                              markets
                                ?.map((market, index) => {
                                  if (market.status === "resolved") {
                                    return (
                                      <div key={index} className="flex justify-between items-center px-4 py-3 border-t border-[#2a2a2a] hover:bg-[#0a0a0a] duration-300 cursor-pointer">
                                        <div>
                                          <h3 className="text-[15px] sm:text-[16px] font-bold text-white flex items-center gap-2">
                                            {market.groupItemTitle}
                                          </h3>
                                          <p className="text-gray-400 text-sm">
                                            ${Number((market.volume || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Vol.
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <p
                                            
                                            className={`text-sm font-semibold ${
                                              isWinning(events, market)
                                                ? "text-green-500"
                                                : "text-red-500"
                                            }`}
                                          >
                                            {events?.outcomeType === "single" ? capitalize(events?.outcome || ""): getOutcomeTitle(market.outcome, market.outcomeId)}
                                          </p>
                                          {isWinning(events, market) ? (
                                            <CheckCircle
                                              className="w-5 h-5 text-green-500"
                                              strokeWidth={2.5}
                                            />
                                            ) : (
                                            <XCircle
                                              className="w-5 h-5 text-red-500"
                                              strokeWidth={2.5}
                                            />
                                            )
                                          }
                                        </div>
                                      </div>
                                    )
                                  }

                                  return (
                                    <AccordionItem
                                      value={`market-${index + 1}`}
                                      key={index}
                                    >
                                      <AccordionTrigger
                                        marketId="market-1"
                                        outcomePrice={market?.odd || 0}
                                        volume={market?.volume || 0}
                                        className="flex sm:text-[18px] text-[18px] items-center sm:gap-2 gap-0"
                                        setSelectedOrderBookData={
                                          setSelectedOrderBookData
                                        }
                                        orderBook={
                                          books?.find(
                                            (book) =>
                                              book.marketId ===
                                              market?._id
                                          ) || {}
                                        }
                                        setSelectedIndex={setSelectedIndex}
                                        index={index}
                                        isMultiMarket={markets?.length > 1}
                                        setIsDrawerOpen={setIsDrawerOpen}
                                        setActiveView={setActiveView}
                                      >
                                        <div className="pr-6">
                                          <Image
                                            src={events?.image}
                                            alt="Market 1"
                                            width={42}
                                            height={42}
                                            className="rounded-md object-cover"
                                            style={{
                                              width: "42px",
                                              height: "42px",
                                            }}
                                          />
                                        </div>
                                        <span className="pt-1">
                                          {market.groupItemTitle}
                                        </span>
                                      </AccordionTrigger>
                                      <OrderbookAccordionContent
                                        orderBook={
                                          books?.find(
                                            (book) =>
                                              book.marketId ===
                                              market?._id
                                          ) || {}
                                        }
                                        book={books}
                                        activeView={activeView}
                                        setActiveView={setActiveView}
                                        setSelectedOrderBookData={
                                          setSelectedOrderBookData
                                        }
                                        setSelectedIndex={setSelectedIndex}
                                        index={index}
                                        selectedMarket={market}
                                        setSelectedOrder={setSelectedOrder}
                                        forecast={events?.forecast}
                                        forecastGraph={forecastGraph}
                                        setForecastGraph={setForecastGraph}
                                      />
                                    </AccordionItem>
                                    )
                                })}
                          </Accordion>
                        </>
                      )}


                      <h3 className="sm:text-[22px] text-[15px] font-bold sm:mt-6 sm:mb-2 sm:mr-4 mt-4 mb-1">
                        Rules
                      </h3>
                      <SelectSeparator className="my-2" />
                        <div
                          className="sm:text-base pb-0 text-[12px] text-gray-400 w-full sm:w-full px-0 mx-0"
                          style={{
                            paddingLeft: 0,
                            paddingRight: 0,
                            marginLeft: 0,
                            marginRight: 0,
                          }}
                        >
                                {events?.description?.length > 250 ? (
                                  <div className="space-y-0 w-full">
                                    <div
                                      className={`block w-full sm:w-full transition-all duration-300 ${
                                        showFullText ? "" : "line-clamp-5"
                                      }`}
                                      style={{ whiteSpace: "pre-line" }}
                                    >
                                      {showFullText
                                        ? events?.description
                                        : events?.description?.slice(0, 250) + " ..."}
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <Button
                                        variant="link"
                                        onClick={() => setShowFullText(!showFullText)}
                                        className="text-[12px] sm:text-sm text-gray-400 font-bold px-0 mt-0.5 !no-underline"
                                      >
                                        {showFullText ? "Show Less" : "Show More"}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  events?.description
                                )}
                        </div>

                      {events?.status === "closed" && (
                        <div className="flex items-start gap-3 p-4 my-3 rounded-md border border-red-500 bg-[#2a1414] text-red-300">
                          <div>
                            <p className=" font-semibold">Market Closed</p>
                            <p className="text-sm text-red-400">
                              This market has ended and is awaiting resolution.
                              Final outcome will be announced soon.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 评论区 Comment Section */}
                    <div className="mt-4">
                      <CommentSection eventId={events?._id} />
                    </div>
                    {/* Discord Community Section - Web only, under comments */}
                    <div className="hidden sm:flex w-full max-w-7xl mx-auto mt-5 mb-5 justify-center">
                      <div
                        className="bg-black rounded-md px-4 py-5 sm:px-6 sm:py-8 flex flex-col items-center w-full max-w-xs sm:max-w-xl border border-[#222] shadow-sm gap-2"
                        style={{ boxShadow: '0 2px 6px 0 rgba(220,220,255,0.13)' }}
                      >
                        <h3 className="text-base sm:text-xl font-bold mb-1 text-white">Join our Discord community</h3>
                        <p className="text-xs sm:text-sm text-gray-300 mb-2 text-center">Connect with other traders, get support, and stay up to date with the latest news and features.</p>
                        <a
                          href="https://discord.com/invite/sonotrade"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold px-2 py-2 rounded-md transition-colors duration-200 text-xs sm:text-sm flex items-center gap-1"
                        >
                          <Image src="/images/discordnew.png" alt="Discord" width={16} height={16} className="mr-1" />
                          Join Discord
                        </a>
                      </div>
                    </div>
                  </div>

                  {}
                  {events?.status === "resolved" ? (
                    <div className="hidden lg:block lg:w-[15%] relative">
                      <div className="fixed top-[147px] z-60 w-[15%]">
                        <ResolutionCard
                          outcome={events?.outcome}
                          outcomeId={events?.outcomeId}
                          eventType={
                            markets?.length > 1 ? "Multiple Choice" : "Binary"
                          }
                          market={markets[selectedIndex]}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="hidden lg:block lg:w-[30%] relative">
                      <div className="fixed top-[147px] w-[300px] xl:w-[350px]">
                        <TradingCard
                          activeView={activeView}
                          setActiveView={setActiveView}
                          selectedOrderBookData={
                            books?.find(
                              (book) =>
                                book.marketId === markets[selectedIndex]?._id
                            ) || {}
                          }
                          market={markets[selectedIndex]}
                          status={events?.status}
                          image={events?.image}
                          selectedOrder={selectedOrder}
                          title={events?.title}
                        />

                      </div>
                    </div>
                  )}
                </div>
              </div>

              {}
              <div className="lg:hidden justify-center pt-5 pb-8 items-center mt-0 fixed bottom-[24px] left-0 w-full">
                {isDrawerOpen && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50"
                    onClick={() => setIsDrawerOpen(false)}
                  ></div>
                )}
                {events?.status === "resolved" ? (
                  <ResolutionCard />
                ) : (
                  <>
                    {}
                    {markets?.length <= 1 && (
                      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                        <DrawerTrigger className="w-full py-2 font-semibold bg-black border-t border-[#1E1E1E] text-black rounded-lg mt-10">
                          <div className="flex items-center justify-between gap-2.5 mb-2 w-full px-4 mt-0">
                            <div className="flex-1 !bg-[#0D1A26] rounded-lg h-10 text-[#7DFDFE] text-base font-medium leading-tight inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                              {capitalize(markets?.[0]?.outcome?.[0]?.title || "Yes")}
                              {markets?.length === 1 && (
                                <span className="ml-0 pl-0 text-xl text-[#7DFDFE] font-semibold">
                               {getLowestAskPrice(markets[0]?._id) !== null && getLowestAskPrice(markets[0]?._id) !== undefined ? `${getLowestAskPrice(markets[0]?._id)}¢` : '--'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 !bg-[#210D1A] rounded-lg h-10 text-[#EC4899] text-base font-medium leading-tight inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                              {capitalize(markets?.[0]?.outcome?.[1]?.title || "No")}
                              {markets?.length === 1 && (
                                <span className="ml-0 pl-0 text-xl text-[#EC4899] font-semibold">
                               {getHighestBidPrice(markets[0]?._id) !== null && getHighestBidPrice(markets[0]?._id) !== undefined ? `${getHighestBidPrice(markets[0]?._id)}¢` : '--'}
                                </span>
                              )}
                            </div>
                          </div>
                        </DrawerTrigger>
                        <DrawerContent className="pb-0 border border-grey-500 bg-black h-auto">
                          {/* Hidden DrawerTitle to satisfy component requirements */}
                          <div hidden>
                            <DrawerHeader>
                              <DrawerTitle>Hidden Title</DrawerTitle>
                            </DrawerHeader>
                          </div>

                          {/* Main Content */}
                          <div className="no-shadow p-0">
                            <TradingCard

                            className="border-none box-shadow-none no-shadow !shadow-none shadow-none"
                              activeView={activeView}
                              setActiveView={setActiveView}
                              selectedOrderBookData={
                                selectedOrderBookData ||
                                books?.find(
                                  (book) =>
                                    book.marketId ===
                                    markets[selectedIndex]?._id
                                ) ||
                                {}
                              }
                              market={markets[selectedIndex]}
                              status={events?.status}
                              image={events?.image}
                              title={events?.title}
                            />
                          </div>
                        </DrawerContent>
                      </Drawer>
                    )}
                    
                    {}
                    {markets?.length > 1 && (
                      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                        <DrawerContent className="pb-0 border border-grey-500 bg-black h-auto">
                          {/* Hidden DrawerTitle to satisfy component requirements */}
                          <div hidden>
                            <DrawerHeader>
                              <DrawerTitle>Hidden Title</DrawerTitle>
                            </DrawerHeader>
                          </div>

                          {/* Main Content */}
                          <div className="no-shadow p-0">
                            <TradingCard
                              activeView={activeView}
                              setActiveView={setActiveView}
                              selectedOrderBookData={
                                selectedOrderBookData ||
                                books?.find(
                                  (book) =>
                                    book.marketId ===
                                    markets[selectedIndex]?._id
                                ) ||
                                {}
                              }
                              market={markets[selectedIndex]}
                              status={events?.status}
                              image={events?.image}
                              title={events?.title}
                            />
                          </div>
                        </DrawerContent>
                      </Drawer>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          <div className="flex-1 pl-0 pr-0 sm:pl-[18%] sm:pr-[0%]">
            {" "}
            {/* This makes the left part wider */}
          </div>
          <OpenOrderDialog
            openOrderDialog={openOrderDialog}
            setOpenOrderDialog={setOpenOrderDialog}
            openOrderData={openOrders}
          />
        </div>
      </div>
      {/* Discord Community Section - Mobile only at bottom */}
      <div className="flex sm:hidden w-full max-w-7xl mx-auto mt-5 mb-5 justify-center">
        <div
          className="bg-black rounded-md px-4 py-5 flex flex-col items-center w-full max-w-xs border border-[#222] shadow-sm gap-2"
          style={{ boxShadow: '0 2px 6px 0 rgba(220,220,255,0.13)' }}
        >
          <h3 className="text-base font-bold mb-1 text-white">Join our Discord community</h3>
          <p className="text-xs text-gray-300 mb-2 text-center">Connect with other traders, get support, and stay up to date with the latest news and features.</p>
          <a
            href="https://discord.com/invite/sonotrade"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold px-2 py-2 rounded-md transition-colors duration-200 text-xs flex items-center gap-1"
          >
            <Image src="/images/discordnew.png" alt="Discord" width={16} height={16} className="mr-1" />
            Join Discord
          </a>
        </div>
      </div>
      <div className="hidden sm:block">
        <Footer />
      </div>
      {}
      <div className="block sm:hidden" style={{ height: '120px' }} />
      <HeaderFixed />
    </>
  );
}
