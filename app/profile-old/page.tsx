"use client";
import Header from "@/app/Header";
import React, { useState, useEffect, useCallback } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/types";
import { getPositions, getTradeOverview, getUserData } from "@/services/user";
import { checkApiSuccess, getResponseResult } from '@/lib/apiHelpers';
import ActivityTable from "./activity";
import DepositTable from "./deposit-history"
import WithdrawTable from "./withdraw-history"
import Positions from "../portfolio/Positions";
import { Footer } from "../components/customComponents/Footer";

interface PolygonTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}
const initialTradeOverview = {
  total_value: 0,
  total_profit_loss: 0,
  total_volume_traded: 0,
  total_events_traded: 0,
}

export default function PortfolioPage() {

  //get profile data from redux
  const dispatch = useDispatch<AppDispatch>();
  const { profileImg , uniqueId} = useSelector((state: any) => state?.auth?.user);
  const { address } = useSelector((state: any) => state?.walletconnect?.walletconnect);
  const [account, setaccount] = useState(address);
  const wallet: string = address ? address : "";
  const [transactions, setTransactions] = useState<PolygonTx[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [currentTab, setCurrentTab] = useState("positions");
  const [amountFilter, setAmountFilter] = useState("All");
  const [positions, setPositions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("activity");
  const [tradeOverview, setTradeOverview] = useState<any>(initialTradeOverview);
  const [tradeOverviewLoading, setTradeOverviewLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    username: string;
    avatar_url: string;
    bio: string;
  } | any>(null);

  //   };

  const fetchProfile = async () => {
    try {
      const response = await getUserData(dispatch);
      if (checkApiSuccess(response)) {
        setProfileData(getResponseResult(response));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  //get positions
  const fetchPositions = async () => {
    const response = await getPositions();
    if (checkApiSuccess(response)) {
      setPositions(getResponseResult(response) || []);
    }
  };

  const fetchTradeOverview = async () => {
    setTradeOverviewLoading(true);
    try {
      const response = await getTradeOverview();
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
    fetchProfile();
    fetchPositions()
    fetchTradeOverview()
  }, [fetchProfile, fetchPositions, fetchTradeOverview]);

  const router = useRouter();

  // Navigate to Settings page
  const NavigateSettings = () => {
    router.push(`/settings`);
  };

  return (
    <div className="text-white bg-black h-auto items-center justify-items-center p-0 m-0">
      <div className="sticky top-0 z-50 w-[100%] bg-black lg:bg-transparent backdrop-blur-0 lg:backdrop-blur-md border-b border-[#222] lg:mb-4 mb-0 pb-2" style={{ borderBottomWidth: '1px' }}>
        <Header />
        {}
      </div>
      <div className="container mx-auto py-10 px-4 container-sm">
        {/* 1. 用户信息区 */}
        {/* 1. User information area */}
        <div className="flex items-center justify-between space-x-4 mb-6 profile_top">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              {profileData?.profileImg ? (
                <AvatarImage
                  src={profileData.profileImg || profileImg}
                  alt={profileData.username || wallet}
                />
              ) : (
                <AvatarFallback className="text-xs">
                  {profileData?.username
                    ? profileData.username.charAt(0).toUpperCase()
                    : wallet
                      ? wallet ? wallet?.slice(2, 8).toUpperCase() : ""
                      : "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">
                {profileData?.username ||
                  (wallet ? `${wallet?.slice(0, 6)}...${wallet?.slice(-4)}` : "")}
              </h2>
              <p className="text-sm text-gray-400 whitespace-normal break-all">{wallet}</p>
            </div>
          </div>
          <Button
            className="ml-auto"
            variant="outline"
            onClick={NavigateSettings}
          >
            Edit Profile
          </Button>
        </div>

        {/* 2. 关键指标卡片区 */}
        {/* 2. Key metrics card area */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#131212] p-4 rounded-lg flex flex-col items-center">
            <span className="text-2xl">
              <Image
                src="/images/icon_01.png"
                alt="Icon"
                width={42}
                height={42}
              />
            </span>
            {tradeOverviewLoading ? <span className="mt-2 text-sm text-gray-500">Loading...</span> : <span className="mt-2 text-lg font-semibold">${tradeOverview?.total_value}</span>}
            <span className="text-sm text-gray-500 mt-1">Positions value</span>
          </div>
          <div className="bg-[#131212] p-4 rounded-lg flex flex-col items-center">
            <span className="text-2xl">
              <Image
                src="/images/icon_02.png"
                alt="Icon"
                width={42}
                height={42}
              />
            </span>
            {tradeOverviewLoading ? <span className="mt-2 text-sm text-gray-500">Loading...</span> : <span className="mt-2 text-lg font-semibold">${tradeOverview?.total_profit_loss}</span>}
            <span className="text-sm text-gray-500 mt-1">Profit / loss</span>
          </div>
          <div className="bg-[#131212] p-4 rounded-lg flex flex-col items-center">
            <span className="text-2xl">
              <Image
                src="/images/icon_03.png"
                alt="Icon"
                width={42}
                height={42}
              />
            </span>
            {tradeOverviewLoading ? <span className="mt-2 text-sm text-gray-500">Loading...</span> : <span className="mt-2 text-lg font-semibold">${tradeOverview?.total_volume_traded}</span>}
            <span className="text-sm text-gray-500 mt-1">Volume traded</span>
          </div>
          <div className="bg-[#131212] p-4 rounded-lg flex flex-col items-center">
            <span className="text-2xl">
              <Image
                src="/images/icon_04.png"
                alt="Icon"
                width={42}
                height={42}
              />
            </span>
            {tradeOverviewLoading ? <span className="mt-2 text-sm text-gray-500">Loading...</span> : <span className="mt-2 text-lg font-semibold">{tradeOverview?.total_events_traded}</span>}
            <span className="text-sm text-gray-500 mt-1">Event traded</span>
          </div>
        </div>

        {/* 3. Tab 与筛选区 */}
        {/* 3. Tab and filter area */}
        <Tabs
          defaultValue="positions"
          value={currentTab}
          onValueChange={setCurrentTab}
          className="mb-4"
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="flex space-x-4">
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className="border border-gray-700 bg-black rounded p-1 text-sm"
            >
              <option>All</option>
              <option>Above 1 USDC</option>
              <option>Below 1 USDC</option>
            </select>
          </div>
          <TabsContent value="positions">
            <Positions uniqueId={uniqueId} isPrivate={true} />
          </TabsContent>
          <TabsContent value="activity">
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <Button
                    variant={activeTab === "activity" ? "default" : "outline"}
                  onClick={() => setActiveTab("activity")}
                >
                  Trade
                </Button>
                <Button
                   variant={activeTab === "deposit" ? "default" : "outline"}
                  onClick={() => setActiveTab("deposit")}
                >
                  Deposit
                </Button>
                <Button
                 variant={activeTab === "withdraw" ? "default" : "outline"}
                  onClick={() => setActiveTab("withdraw")}
                >
                  Withdraw
                </Button>
              </div>
            </div>
            {activeTab === "activity" &&
            <ActivityTable />
                }
                  {activeTab === "deposit" &&
             <DepositTable />
                }
                  {activeTab === "withdraw" &&
             <WithdrawTable />
                }

          </TabsContent>

        </Tabs>
        <Footer />
        <HeaderFixed />
      </div>
    </div>
  );
}
