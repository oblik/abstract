"use client";

import { Button } from "@/app/components/ui/button";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import "./globals.css";
import Header from "./Header";
import HeaderFixed from "./HeaderFixed";
import Image from "next/image";
import { NavigationBar } from "@/app/components/ui/navigation-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/app/components/ui/carousel";
import PaginationComp from "@/app/components/customComponents/PaginationComp";
import { Loader } from "lucide-react";
import EventCard from "@/app/components/ui/eventCard";
import { MultipleOptionCard } from "@/app/components/ui/multipleOptionCard";
import Link from "next/link";
import { getEvents } from "@/services/market";
import SlideshowLinting from "@/app/components/customComponents/SlideshowLinting";
// import { infoCards } from "@/app/components/constants";
import { getCategories, getTagsByCategory } from "@/services/market";
import { getInfoCards } from "@/services/user";
import { Footer } from "./components/customComponents/Footer";
import { ScrollArea } from "radix-ui";
import { useSearchParams } from "next/navigation";
import { isEmpty } from "@/lib/isEmpty";
import DiscordLogo from "@/public/images/discordnew.png";

const InfoCards = ({ infoCardCms }) => {

  const renderInfoCard = (emoji, title, footer) => {
    return (
      <div className="h-28 p-3 rounded-md" style={{ backgroundColor: '#00111a', height: '7rem' }}>
        <div className="flex items-center">
          <h3 className="text-xl font-semibold mb-1">{emoji}</h3>
          <p className="text-xs font-bold pl-2 leading-tight">{title}</p>
        </div>
        <div>
          <p
            className="text-xs pt-2 leading-snug"
            dangerouslySetInnerHTML={{ __html: footer }}
          ></p>
        </div>
      </div>
    );
  };

  return (
    <div className="-mt-4 lg:block hidden">
      <div className="justify-center mb-4 mt-2 pt-0 w-full flex">
        <div className="w-full flex flex-col items-center justify-center">
          {/* Desktop view */}
          <div className="hidden md:grid md:grid-cols-4 gap-4 justify-items-center items-center">
            {infoCardCms &&
              infoCardCms?.length > 0 &&
              infoCardCms?.map((card, index) => (
                <div key={index}>
                  {renderInfoCard(card.emoji, card.title, card?.content)}
                </div>
              ))}
          </div>

          {/* Mobile view with carousel */}
          <div className="md:hidden">
            <Carousel className="w-full">
              <CarouselContent>
                {infoCardCms &&
                  infoCardCms?.length > 0 &&
                  infoCardCms?.map((card, index) => (
                    <CarouselItem key={index} className="pl-4">
                      {renderInfoCard(card.emoji, card.title, card?.content)}
                    </CarouselItem>
                  ))}
              </CarouselContent>
              <CarouselPrevious className="text-white" />
              <CarouselNext className="text-white" />
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubcategoryBar = ({
  subcategories,
  selectedSubcategory,
  setSelectedSubcategory,
}) => (
  <div className="justify-center items-center py-1 lg:flex hidden">
    <div className="w-full max-w-7xl relative">
      <div className="flex justify-start gap-2 sm:gap-3 overflow-x-auto hide-scrollbar flex-nowrap pb-5">
        <Button
          className={cn(
            "px-3 py-1 h-[30px] rounded-md transition-colors text-sm font-medium whitespace-nowrap border-[1px] hover:bg-transparent",
            selectedSubcategory === "all"
              ? "text-[#7dfdfe] bg-[#0d1a26] border-[#7dfdfe]"
              : "text-muted-foreground border-[#222] bg-black hover:text-gray-300"
          )}
          onClick={() => setSelectedSubcategory("all")}
        >
          For You
        </Button>
        {subcategories?.map((subcategory) => (
          <Button
            key={subcategory.slug}
            className={cn("px-3 py-1 h-[30px] rounded-md transition-colors text-sm font-medium whitespace-nowrap border-[1px] hover:bg-transparent",
              selectedSubcategory === subcategory.slug
                ? "text-[#7dfdfe] bg-[#0d1a26] border-[#7dfdfe]"
                : "text-muted-foreground border-[#222] bg-black hover:text-gray-300"
            )}
            onClick={() => setSelectedSubcategory(subcategory.slug)}
          >
            {subcategory.title}
          </Button>
        ))}
      </div>
      {/* Right fade overlay positioned at the edge of the scroll area */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-black to-transparent">
      </div>
    </div>
  </div>
);

export default function Home({ infoCardCms, categories, tags }) {
  const [selectCategory, setSelectedCategory] = useState("all");
  const [showClosed, setShowClosed] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [subcategoryList, setSubcategoryList] = useState(tags);

  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const fetchTags = async () => {
    try {
      const { success, result } = await getTagsByCategory(selectCategory);
      if (success) {
        setSubcategoryList(result);
        setSelectedSubcategory("all");
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [selectCategory]);

  // EventLinting state and logic moved to top level
  const [events, setEvents] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 16, offset: 0 });
  const [selectedMarket, setSelectedMarket] = useState("open");
  // ...existing code...

  useEffect(() => {
    setPagination({ page: 1, limit: 16, offset: 0 });
  }, [selectCategory, showClosed, selectedSubcategory, selectedMarket]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const finCategory = categoryParam ? categoryParam : selectCategory;
        let { success, result } = await getEvents({
          id: finCategory,
          page: pagination.page,
          limit: pagination.limit,
          tag: selectedSubcategory,
          status: selectedMarket,
        });
        if (success) {
          setEvents(result?.data);
          setHasMore(result?.count > pagination.page * pagination.limit);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setLoading(false);
      }
    };
    fetchEvents();
  }, [pagination, selectCategory, showClosed, categoryParam, selectedMarket]);

  return (
    <>
      {/* Top header and nav bar - not fixed */}
      <NavigationBar
        menuItems={categories}
        showLiveTag={true}
        setSelectedCategory={setSelectedCategory}
        selectedCategory={selectCategory}
      />
      <SubcategoryBar
        subcategories={subcategoryList}
        selectedSubcategory={selectedSubcategory}
        setSelectedSubcategory={setSelectedSubcategory}
      />

      {isEmpty(categoryParam) && (
        <>
          <SlideshowLinting />
          {/* Info Cards Section */}
          <InfoCards infoCardCms={infoCardCms} />
        </>
      )}

      {/* Event cards grid as sibling to Discord section, Footer, nav bar */}
      {loading && (
        <Loader className="w-26 h-26 animate-spin" />
      )}
      {/* Render each event card as a direct sibling, not inside a grid container */}
      {events && events.length > 0 && events.map((event) => (
        event.marketId?.length < 2 ? (
          <Link href={`/event-page/${event.slug}`} className="w-full block" key={event._id}>
            <EventCard
              imageSrc={event?.image || "/images/logo.png"}
              question={event?.title}
              probability={event.marketId[0]?.last}
              totalPool={`$${event.marketId?.[0]?.volume ? (event.marketId[0].volume / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}`}
              yesButtonLabel={`Buy ${event.marketId[0]?.outcome?.[0]?.title || "Yes"}`}
              noButtonLabel={`Buy ${event.marketId[0]?.outcome?.[1]?.title || "No"}`}
              yesPotential={(event.marketId[0]?.outcomePrices && JSON.parse(event.marketId[0]?.outcomePrices)[0]) || 50}
              noPotential={(event.marketId[0]?.outcomePrices && JSON.parse(event.marketId[0]?.outcomePrices)[1]) || 50}
              id={event._id}
              status={event.status}
              outcome={event?.outcome}
            />
          </Link>
        ) : (
          <Link href={`/event-page/${event.slug}`} className="w-full block" key={event._id}>
            <MultipleOptionCard
              imageSrc={event?.image || "/images/logo.png"}
              question={event?.title}
              totalPool={event.marketId ? event.marketId?.reduce((acc, mark) => acc + (mark.volume || 0), 0) : 0}
              options={event?.marketId}
              forecast={event?.forecast}
              status={event.status}
            />
          </Link>
        )
      ))}
      {!loading && events && events.length === 0 && (
        <div className="text-center text-gray-500">No events found</div>
      )}
      {(!hasMore && pagination.page === 1) ? null : (
        <PaginationComp
          pagination={pagination}
          setPagination={setPagination}
          hasMore={hasMore}
        />
      )}
      {/* Discord Community Section */}
      <div className="w-full max-w-7xl mx-auto mt-5 mb-5 flex justify-center">
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
            <Image src={DiscordLogo} alt="Discord" width={16} height={16} className="mr-1" />
            Join Discord
          </a>
        </div>
      </div>
      <Footer />

      {/* Bottom nav bar - not fixed */}
      <HeaderFixed />
    </>
  );
}
