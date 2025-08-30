"use client";
import Header from "@/app/Header";
import React, { useState, useEffect } from "react";
import HeaderFixed from "@/app/HeaderFixed";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/app/components/ui/tabs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { getTradeOverviewById } from "@/services/user";
import { checkApiSuccess, getResponseResult } from '@/lib/apiHelpers';
import ActivityTable from "./activity";
import DepositTable from "./deposit-history"
import WithdrawTable from "./withdraw-history"
import Positions from "../../portfolio/Positions";
import { Footer } from "../../components/customComponents/Footer";
import { firstLetter } from "@/lib/stringCase";
import { User } from "@/types";
import { NavigationBar } from "@/app/components/ui/navigation-menu";

const initialTradeOverview = {
  total_value: 0,
  total_profit_loss: 0,
  total_volume_traded: 0,
  total_events_traded: 0,
}

interface ProfilePageProps {
  user: User | null;
  categories: any;
}

export default function ProfilePage(props: ProfilePageProps) {
  const router = useRouter();

  const { signedIn } = useSelector((state: any) => state?.auth?.session);
  const user = useSelector((state: any) => state?.auth?.user);
  const { address } = useSelector((state: any) => state?.walletconnect?.walletconnect);
  const wallet: string = address ? address : "";

  const [currentTab, setCurrentTab] = useState("positions");
  const [amountFilter, setAmountFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("activity");
  const [tradeOverview, setTradeOverview] = useState<any>(initialTradeOverview);
  const [tradeOverviewLoading, setTradeOverviewLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [selectCategory, setSelectedCategory] = useState("all");

  const fetchTradeOverview = async (id: string) => {
    setTradeOverviewLoading(true);
    try {
      const response = await getTradeOverviewById(id);
      if (checkApiSuccess(response)) {
        const result = getResponseResult(response);
        setTradeOverview({
          total_value: (result as any).totalPositionValue?.toFixed(2) || "0",
          total_profit_loss: (result as any).totalTradeProfitLoss?.toFixed(2) || "0",
          total_volume_traded: (result as any).totalTradeVolume?.toFixed(2) || "0",
          total_events_traded: (result as any).totalTradeEventTraded || 0,
        });
        setTradeOverviewLoading(false);
      }
    } catch (error) {
      console.error("Error fetching trade overview:", error);
    } finally {
      setTradeOverviewLoading(false);
    }
  };

  useEffect(() => {
    if (props?.user?.uniqueId) {
      fetchTradeOverview(props?.user?.uniqueId);
    }
  }, [props?.user]);

  useEffect(() => {
    if (signedIn && user?.uniqueId && user?.uniqueId === props?.user?.uniqueId) {
      setIsOwnProfile(true);
    }
  }, [signedIn, user?.uniqueId, props?.user]);

  const NavigateSettings = () => {
    router.push(`/settings`);
  };

  return (
    <div className="px-0 pb-20 sm:px-0 text-white bg-black h-auto items-center justify-items-center p-0 m-0">
        <div className="fixed top-0 left-0 z-50 w-[100%] backdrop-blur-md bg-black/80 border-b border-[#222] lg:mb-4 mb-0" style={{ borderBottomWidth: '1px' }}>
        <Header />
        <NavigationBar
          menuItems={props.categories}
          showLiveTag={true}
          setSelectedCategory={setSelectedCategory}
          selectedCategory={selectCategory}
        />
      </div>
      {/* Spacer to prevent content from being hidden behind the fixed header/navbar */}
      <div
        className="lg:mb-4 mb-0"
        style={{
          height: typeof window !== 'undefined' && window.innerWidth < 1024 ? '95px' : '112px',
          minHeight: typeof window !== 'undefined' && window.innerWidth < 1024 ? '95px' : '112px',
          width: '100%'
        }}
      />
      
      <div className="px-1.5 sm:px-0 container mx-auto px-0 py-5 container-sm">
        {/* 1. User information area */}
        <div className="flex items-center justify-between space-x-4 mb-6 profile_top">
          <div className="flex items-center space-x-4">
            <Avatar className="sm:w-16 sm:h-16 w-14 h-14">
              {props?.user?.profileImg ? (
                <AvatarImage
                  src={props?.user?.profileImg}
                  alt="Profile Image"
                />
              ) : (
                <AvatarFallback className="text-xs">
                  {props?.user?.userName
                    ? firstLetter(props?.user?.userName)
                    : wallet
                      ? wallet ? wallet?.slice(2, 8).toUpperCase() : ""
                      : "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h2 className="sm:text-xl text-lgfont-bold">
                {props?.user?.userName ||
                  (wallet ? `${wallet?.slice(0, 6)}...${wallet?.slice(-4)}` : "")}
              </h2>
              <p className="text-sm text-gray-400 whitespace-normal break-all">{wallet}</p>
            </div>
          </div>
          {
            isOwnProfile && (
              <Button
                className="ml-auto min-w-[95px] text-[12px] sm:text-sm max-h-8 sm:max-h-12 px-4"
                variant="outline"
                onClick={NavigateSettings}
              >
                Edit Profile
              </Button>
            )
          }
        </div>

        {/* 2. Key metrics card area */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-[#131212] sm:p-4 p-2 rounded-lg flex flex-col items-center">
            <span className="text-2xl">
              <Image
                src="/images/icon_01.png"
                alt="Icon"
                width={42}
                height={42}
              />
            </span>
            {tradeOverviewLoading ? <span className="mt-2 text-sm text-gray-500">Loading...</span> : <span className="mt-2 text-lg font-semibold">${tradeOverview?.total_value}</span>}
            <span className="sm:text-sm text-xs text-gray-500 mt-1">Positions value</span>
          </div>
          <div className="bg-[#131212] sm:p-4 p-2 rounded-lg flex flex-col items-center">
            <span className="text-2xl">
              <Image
                src="/images/icon_02.png"
                alt="Icon"
                width={42}
                height={42}
              />
            </span>
            {tradeOverviewLoading ? <span className="mt-2 text-sm text-gray-500">Loading...</span> : <span className="mt-2 text-lg font-semibold">${tradeOverview?.total_profit_loss}</span>}
            <span className="sm:text-sm text-xs text-gray-500 mt-1">Profit / loss</span>
          </div>
          <div className="bg-[#131212] sm:p-4 p-2 rounded-lg flex flex-col items-center">
            <span className="text-2xl">
              <Image
                src="/images/icon_03.png"
                alt="Icon"
                width={42}
                height={42}
              />
            </span>
            {tradeOverviewLoading ? <span className="mt-2 text-sm text-gray-500">Loading...</span> : <span className="mt-2 text-lg font-semibold">${tradeOverview?.total_volume_traded}</span>}
            <span className="sm:text-sm text-xs text-gray-500 mt-1">Volume traded</span>
          </div>
          <div className="bg-[#131212] sm:p-4 p-2 rounded-lg flex flex-col items-center">
            <span className="text-2xl">
              <Image
                src="/images/icon_04.png"
                alt="Icon"
                width={42}
                height={42}
              />
            </span>
            {tradeOverviewLoading ? <span className="mt-2 text-sm text-gray-500">Loading...</span> : <span className="mt-2 text-lg font-semibold">{tradeOverview?.total_events_traded}</span>}
            <span className="sm:text-sm text-xs text-gray-500 mt-1">Event traded</span>
          </div>
        </div>

        {/* 3. Tab and filter area */}
        <Tabs
          defaultValue="positions"
          value={currentTab}
          onValueChange={setCurrentTab}
          className="mb-4"
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="flex w-full justify-start sm:space-x-2 space-x-0">
              <TabsTrigger className="sm:text-sm text-[13px]" value="positions">Positions</TabsTrigger>
              <TabsTrigger className="sm:text-sm text-[13px]" value="activity">Activity</TabsTrigger>
            </TabsList>
            {activeTab === "deposit" || activeTab === "withdraw" ?
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-700 bg-black rounded p-1 text-sm"
              >
                <option>All</option> 
                <option value="requested">Requested</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select> :
              <select
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
                className="border border-gray-700 bg-black rounded p-1 text-sm"
              >
                <option>All</option>
                <option>Above 1 USDC</option>
                <option>Below 1 USDC</option>
              </select>
            }
          </div>
          <TabsContent value="positions">
            <Positions uniqueId={props.user?.uniqueId} isPrivate={isOwnProfile} />
          </TabsContent>
          <TabsContent value="activity">
            {
              isOwnProfile && (
                <div className="sm:p-4 p-1">
                  <div className="flex gap-2 mb-4">
                    <Button
                      className="h-7 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                      variant={activeTab === "activity" ? "default" : "outline"}
                      onClick={() => setActiveTab("activity")}
                    >
                      Trade
                    </Button>
                    <Button
                      className="h-7 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                      variant={activeTab === "deposit" ? "default" : "outline"}
                      onClick={() => setActiveTab("deposit")}
                    >
                      Deposit
                    </Button>
                    <Button
                      className="h-7 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                      variant={activeTab === "withdraw" ? "default" : "outline"}
                      onClick={() => setActiveTab("withdraw")}
                    >
                      Withdraw
                    </Button>
                  </div>
                </div>
              )
            }
            {
              activeTab === "activity" &&
              <ActivityTable uniqueId={props.user?.uniqueId} />
            }
            {
              isOwnProfile && activeTab === "deposit" &&
              <DepositTable statusFilter = {statusFilter}/>
            }
            {
              isOwnProfile && activeTab === "withdraw" &&
              <WithdrawTable statusFilter = {statusFilter}/>
            }
          </TabsContent>
        </Tabs>


      </div>
            <HeaderFixed />

      
    </div>
  );
}
