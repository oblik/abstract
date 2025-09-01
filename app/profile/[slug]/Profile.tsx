"use client";
import Header from "@/app/Header";
import React, { useState, useEffect, useContext } from "react";
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
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { getTradeOverviewById, getUserById } from "@/services/user";
import { checkApiSuccess, getResponseResult } from '@/lib/apiHelpers';
import ActivityTable from "./activity";
import DepositTable from "./deposit-history"
import WithdrawTable from "./withdraw-history"
import Positions from "../../portfolio/Positions";
import { Footer } from "../../components/customComponents/Footer";
import { firstLetter } from "@/lib/stringCase";
import { User } from "@/types";
import { NavigationBar } from "@/app/components/ui/navigation-menu";
import { SocketContext, subscribe, unsubscribe } from "@/config/socketConnectivity";

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
  const params = useParams();

  console.log("=== ProfilePage Debug ===");
  console.log("Props received:", props);
  console.log("User prop:", props.user);
  console.log("Categories prop:", props.categories);
  console.log("URL params:", params);

  const { signedIn } = useSelector((state: any) => state?.auth?.session);
  const user = useSelector((state: any) => state?.auth?.user);
  const { address } = useSelector((state: any) => state?.walletconnect?.walletconnect);
  const wallet: string = address ? address : "";
  const socketContext = useContext(SocketContext);

  console.log("Redux state:", { signedIn, user, address, wallet });

  const [currentTab, setCurrentTab] = useState("positions");
  const [amountFilter, setAmountFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("activity");
  const [tradeOverview, setTradeOverview] = useState<any>(initialTradeOverview);
  const [tradeOverviewLoading, setTradeOverviewLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [selectCategory, setSelectedCategory] = useState("all");
  const [profileUser, setProfileUser] = useState<User | null>(props.user);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!props.user);

  // Client-side fallback when server-side fetch failed
  useEffect(() => {
    const fetchProfileClientSide = async () => {
      if (props.user || !params.slug) return;

      console.log("=== Client-side profile fetch fallback ===");
      console.log("Slug from params:", params.slug);

      setIsLoadingProfile(true);
      try {
        const slug = decodeURIComponent(params.slug as string);
        console.log("Decoded slug:", slug);

        const response = await getUserById(slug);
        console.log("Client-side getUserById response:", response);

        if (checkApiSuccess(response)) {
          const userData = getResponseResult(response);
          console.log("Client-side user data:", userData);
          setProfileUser(userData as User);
        } else {
          console.log("Client-side fetch failed:", response);
          setProfileUser(null);
        }
      } catch (error) {
        console.error("Client-side profile fetch error:", error);
        setProfileUser(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfileClientSide();
  }, [props.user, params.slug]);

  const currentUser = profileUser || props.user;

  const fetchTradeOverview = async (id: string) => {
    console.log("=== fetchTradeOverview called ===");
    console.log("ID parameter:", id);

    setTradeOverviewLoading(true);
    try {
      console.log("Making API call to getTradeOverviewById...");
      const response = await getTradeOverviewById(id);
      console.log("API response:", response);

      if (checkApiSuccess(response)) {
        const result = getResponseResult(response);
        console.log("API result:", result);

        const overview = {
          total_value: (result as any).totalPositionValue?.toFixed(2) || "0",
          total_profit_loss: (result as any).totalTradeProfitLoss?.toFixed(2) || "0",
          total_volume_traded: (result as any).totalTradeVolume?.toFixed(2) || "0",
          total_events_traded: (result as any).totalTradeEventTraded || 0,
        };

        console.log("Setting trade overview:", overview);
        setTradeOverview(overview);
        setTradeOverviewLoading(false);
      } else {
        console.error("API call failed:", response);
        setTradeOverviewLoading(false);
      }
    } catch (error) {
      console.error("Error fetching trade overview:", error);
      setTradeOverviewLoading(false);
    }
  };

  useEffect(() => {
    console.log("=== fetchTradeOverview useEffect ===");
    console.log("currentUser:", currentUser);
    console.log("currentUser.uniqueId:", currentUser?.uniqueId);

    if (currentUser?.uniqueId) {
      console.log("Calling fetchTradeOverview with uniqueId:", currentUser?.uniqueId);
      fetchTradeOverview(currentUser?.uniqueId);
    } else {
      console.log("No uniqueId found, not calling fetchTradeOverview");
    }
  }, [currentUser]);

  useEffect(() => {
    console.log("=== isOwnProfile useEffect ===");
    console.log("signedIn:", signedIn);
    console.log("user uniqueId:", user?.uniqueId);
    console.log("currentUser uniqueId:", currentUser?.uniqueId);

    if (signedIn && user?.uniqueId && user?.uniqueId === currentUser?.uniqueId) {
      console.log("Setting isOwnProfile to true");
      setIsOwnProfile(true);
    } else {
      console.log("Not own profile or not signed in");
      setIsOwnProfile(false);
    }
  }, [signedIn, user?.uniqueId, currentUser]);

  // Socket event listeners for real-time profile updates
  useEffect(() => {
    const socket = socketContext?.socket;
    if (!socket || !currentUser?.uniqueId) return;

    console.log("=== Setting up profile socket listeners ===");
    console.log("User ID:", currentUser.uniqueId);

    // Subscribe to user-specific updates
    subscribe(currentUser.uniqueId);

    const handleProfileUpdate = (data: any) => {
      console.log("=== Profile update received ===", data);
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

        if (parsedData.userId === currentUser.uniqueId) {
          console.log("Profile update for current user, refreshing data");

          // Refresh trade overview
          if (currentUser.uniqueId) {
            fetchTradeOverview(currentUser.uniqueId);
          }

          // Optionally refresh user profile data
          if (params.slug) {
            const slug = decodeURIComponent(params.slug as string);
            getUserById(slug).then(response => {
              if (checkApiSuccess(response)) {
                const userData = getResponseResult(response);
                setProfileUser(userData as User);
              }
            });
          }
        }
      } catch (error) {
        console.error("Error handling profile update:", error);
      }
    };

    const handleTradeUpdate = (data: any) => {
      console.log("=== Trade update received ===", data);
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

        if (parsedData.userId === currentUser.uniqueId) {
          console.log("Trade update for current user, refreshing trade overview");

          if (currentUser.uniqueId) {
            fetchTradeOverview(currentUser.uniqueId);
          }
        }
      } catch (error) {
        console.error("Error handling trade update:", error);
      }
    };

    // Listen for various update events
    socket.on("profile-update", handleProfileUpdate);
    socket.on("trade-update", handleTradeUpdate);
    socket.on("pos-update", handleTradeUpdate); // Position updates affect trade overview
    socket.on("order-update", handleTradeUpdate); // Order updates affect trade overview
    socket.on(`user-${currentUser.uniqueId}`, handleProfileUpdate); // User-specific events

    return () => {
      console.log("=== Cleaning up profile socket listeners ===");
      socket.off("profile-update", handleProfileUpdate);
      socket.off("trade-update", handleTradeUpdate);
      socket.off("pos-update", handleTradeUpdate);
      socket.off("order-update", handleTradeUpdate);
      socket.off(`user-${currentUser.uniqueId}`, handleProfileUpdate);
      unsubscribe(currentUser.uniqueId);
    };
  }, [socketContext?.socket, currentUser?.uniqueId, params.slug]);

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
      <div className="lg:mb-4 mb-0 h-[95px] lg:h-[112px] w-full" />

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
              <DepositTable statusFilter={statusFilter} />
            }
            {
              isOwnProfile && activeTab === "withdraw" &&
              <WithdrawTable statusFilter={statusFilter} />
            }
          </TabsContent>
        </Tabs>


      </div>
      <div className="hidden sm:block">
        <Footer />
      </div>
      <HeaderFixed />


    </div>
  );
}
