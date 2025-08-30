"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getClosedPnL } from "@/services/portfolio";
import { toFixedDown } from "../helper/roundOf";
import { useRouter } from "next/navigation";
import { isEmpty } from "@/lib/isEmpty";
import { capitalize } from "@/lib/stringCase";
import { HistoryIcon, Loader } from "lucide-react";
import { getUserTradeHistory } from "@/services/user";
import { Dialog } from "radix-ui";
import Link from "next/link";
import {
  Cross2Icon,
  CopyIcon,
} from "@radix-ui/react-icons";
import { momentFormat } from "../helper/date";
import { getTimeframeDate } from "../../lib/dateTimeHelper";
import { useSelector } from 'react-redux'
import { getCookie } from 'cookies-next'

const History = (props) => {
  const fromDate = getTimeframeDate("1d");

  const [ClosedPnL, setClosedPnL] = useState({});
  const [tradeHistory, setTradeHistory] = useState([])
  const [tradeOpen, setTradeOpen] = useState(false)
  const [selectedMarketOutcome, setSelectedMarketOutcome] = useState([])
  const [loading, setLoading] = useState(false)

  // Get auth state from Redux
  const data = useSelector((state) => state?.auth?.user);
  const { signedIn } = useSelector((state) => state?.auth?.session);

  // Helper function to check if user is properly authenticated
  const isAuthenticated = () => {
    console.log("=== HISTORY AUTHENTICATION CHECK ===");
    console.log("signedIn:", signedIn);
    console.log("data exists:", !!data);
    console.log("data.id:", data?.id);
    console.log("data._id:", data?._id);

    const token = getCookie("user-token");
    console.log("token exists (getCookie):", !!token);
    console.log("token value:", token);

    // Standard authentication check
    const standardAuth = signedIn && data && (data.id || data._id) && token;

    // Hydration workaround: if user appears authenticated via Redux but no cookie, allow it
    const isHydrationWorkaround = signedIn && data && data._id && !token;
    console.log("isHydrationWorkaround:", isHydrationWorkaround ? data._id : false);

    const result = standardAuth || isHydrationWorkaround;
    console.log("isAuthenticated result:", result ? (data._id || data.id) : false);

    return result;
  };


  const formatClosedPnL = (data) => {
    const groupedByEvent = {};

    for (const item of data) {
      const event = item.marketId.eventId;
      const eventId = event._id;
      const marketId = item.marketId._id;
      const groupItemTitle = item.marketId.groupItemTitle;
      const outcome = item.marketId.outcome

      if (!groupedByEvent[eventId]) {
        groupedByEvent[eventId] = {
          eventInfo: event,
          markets: {},
        };
      }

      const marketGroup = groupedByEvent[eventId].markets;

      if (!marketGroup[marketId]) {
        marketGroup[marketId] = {
          entry: 0,
          exit: 0,
          pnl: 0,
          groupItemTitle: groupItemTitle,
          outcome: outcome,
          qty: 0
        };
        if (event.status === "resolved") {
          const isBinaryMarket = event?.marketId?.length >= 2;
          if (isBinaryMarket) {
            marketGroup[marketId].resolution =
              event?.outcomeId == marketId ? "yes" : "no";
          } else {
            const matchingOutcome = item?.marketId?.outcome?.findIndex(
              (o) => o._id == event?.outcomeId
            );
            marketGroup[marketId].resolution = matchingOutcome == 0 ? "yes" : "no";
          }
        }
      }
      marketGroup[marketId].entry += (item.entryPrice * item.qty) / 100;
      marketGroup[marketId].exit += (item.exitPrice * item.qty) / 100;
      if (new Date(item.createdAt).getTime() > fromDate.getTime()) {
        marketGroup[marketId].pnl += item.pnl / 100;
      }
      marketGroup[marketId].qty += item.qty

      if (item.exitType == "resolution") {
        marketGroup[marketId].shares = item.qty
        marketGroup[marketId].closedSide = item.direction == "closed_yes" ? "yes" : "no"
        marketGroup[marketId].isResolved = marketGroup[marketId].resolution == marketGroup[marketId].closedSide;
        // if(marketGroup[marketId].isResolved){
        //   marketGroup[marketId].exit += (item.exitPrice * item.qty) / 100;
        // }
        // marketGroup[marketId].entry += (item.entryPrice * item.qty) / 100;
        // marketGroup[marketId].pnl += item.pnl / 100;
      } else {
        // marketGroup[marketId].entry += (item.entryPrice * item.qty) / 100;
        // marketGroup[marketId].exit += (item.exitPrice * item.qty) / 100;
        // marketGroup[marketId].pnl += item.pnl / 100;
      }
    }

    return groupedByEvent;
  };

  const getUserClosedPnL = async () => {
    try {
      // Only make API call if user is authenticated
      if (!isAuthenticated()) {
        console.log("User not authenticated, skipping getClosedPnL call");
        return;
      }

      setLoading(true)
      const res = await getClosedPnL({});
      if (res.success) {
        if (res && res.result && res.result.length > 0) {
          const fClosedPnl = formatClosedPnL(res.result);
          setClosedPnL(fClosedPnl);
        }
      }
    } catch (error) {
      console.error("Error fetching Position History:", error);
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    // Only call API if user is authenticated and authLoaded is true
    if (isAuthenticated() && props.authLoaded) {
      getUserClosedPnL();
    }
  }, [data, signedIn, props.authLoaded || false]);

  const getTradeHistory = async (id) => {
    try {
      const res = await getUserTradeHistory({ id })
      if (res.success) {
        setTradeHistory(res.result)
      } else {
        setTradeHistory([])
      }
    } catch (error) {
      console.error("Error fetching Trade History:", error);
    }
  }

  const handleTradeOpen = async (id, outcomes) => {
    setSelectedMarketOutcome(outcomes)
    await getTradeHistory(id)
    setTradeOpen(true)
  }
  return (
    <>

      <div className="overflow-x-auto">
        <table className="w-full text-left custom_table table table-responsive">
          <thead>
            <tr>
              <th>Market</th>
              <th>Final Position</th>
              <th>Settlement Payout</th>
              <th>Total Spent</th>
              <th>Total Payout</th>
              <th>Total Return</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <>
              {!isEmpty(ClosedPnL) && !loading && Object.entries(ClosedPnL).map(
                ([eventId, event]) => {
                  const markets = event?.markets;
                  const marketIds = Object.keys(markets);
                  const isMultiMarket = marketIds.length > 1;

                  let total = { entry: 0, exit: 0, pnl: 0 };

                  return (
                    <React.Fragment key={eventId}>
                      <React.Fragment>
                        <tr>
                          <td className="pt-1" colSpan={8}>
                            <Link href={`/event-page/${event?.eventInfo?.slug}`}>

                              <div className="flex items-center gap-3 ">

                                <span>


                                  <Image
                                    src={event?.eventInfo?.image}
                                    alt="Icon"
                                    width={45}
                                    height={45}
                                    className="cursor-pointer rounded-[6px] object-cover aspect-square"
                                  />
                                </span>

                                <span className="text-base font-semibold leading-tight cursor-pointe">
                                  {event?.eventInfo?.title}
                                </span>

                              </div>
                            </Link>

                          </td>
                        </tr>
                        <tr>
                        </tr>

                        {marketIds.map((marketId, idx) => {
                          const m = markets[marketId];

                          total.entry += m.entry;
                          total.exit += m.exit;
                          total.pnl += m.pnl;

                          return (
                            <tr key={marketId}>
                              <td>{m.groupItemTitle || ""}</td>
                              <td className={`${m.shares > 0 ? "" : "text-gray-500"}`}>{m.shares > 0 ? `${m.shares} ${capitalize(m.closedSide == "yes" ? (m.outcome?.[0]?.title || "yes") : (m.outcome?.[1]?.title || "no"))}` : "--"}</td>
                              <td className={`${m.shares > 0 ? "" : "text-gray-500"}`}>{m.shares > 0 ? `$${Number(m.shares).toFixed(2)}` : "--"}</td>
                              <td>${Number(m.entry).toFixed(2)}</td>
                              <td>${Number(m.exit).toFixed(2)}</td>
                              <td
                                className={
                                  (m.exit - m.entry) >= 0 ? "text-green-500" : "text-red-500"
                                }
                              >
                                {`${(m.exit - m.entry) < 0 ? '-' : ''}$${Number(Math.abs(m.exit - m.entry)).toFixed(2)}`} ({toFixedDown(((m.exit - m.entry) / m.entry) * 100, 1)}%)
                              </td>
                              <td>
                                <button className="text-gray-500 w-5 h-5" onClick={() => handleTradeOpen(marketId, m.outcome)}>
                                  <HistoryIcon />
                                </button>
                              </td>


                            </tr>

                          );
                        })}

                        {isMultiMarket && (
                          <tr >
                            <td>Total</td>
                            <td></td>
                            <td></td>
                            <td>${toFixedDown(total.entry, 2)}</td>
                            <td>${toFixedDown(total.exit, 2)}</td>
                            <td
                              className={
                                total.pnl >= 0 ? "text-green-500" : "text-red-700"
                              }
                            >
                              {(total.exit - total.entry) < 0 ? '-' : ''}${Number(Math.abs(total.exit - total.entry)).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </React.Fragment>
                      <tr>
                        <td colSpan={9} className="border-b border-[#262626]"></td>
                      </tr>


                    </React.Fragment>



                  );

                }

              )}


            </>

          </tbody>
        </table>
        {Object.entries(ClosedPnL)?.length === 0 && !loading && (
          <div className="flex text-[13px] justify-center text my-5 text-gray-500">
            No history found
          </div>
        )}
        {loading && (
          <div className="flex justify-center items-center my-5 min-h-[100px]">
            <Loader className="w-26 h-26 animate-spin" />
          </div>
        )}
      </div>
      <Dialog.Root open={tradeOpen} onOpenChange={setTradeOpen}>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent w-100" style={{ maxWidth: '900px' }}>
          <Dialog.Title className="DialogTitle">Trade History</Dialog.Title>
          <div >
            <table className="w-full text-left custom_table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Price</th>
                  <th>Filled Contracts</th>
                  <th>Cost</th>
                  <th>Fees</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory?.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textTransform: "capitalize" }} className={`${item.side === 'yes' ? 'text-green-500' : 'text-red-500'} text-capitalize`}>{capitalize(item.action)} {item.side == "yes" ? (selectedMarketOutcome?.[0]?.title || "yes") : (selectedMarketOutcome?.[1]?.title || "no")} ({item.type} at {item.price}¢)</td>
                    <td>{item.price}¢</td>
                    <td>{toFixedDown(item.quantity, 2)}</td>
                    <td>${toFixedDown((item.price * item.quantity) / 100, 2)}</td>
                    <td>${toFixedDown((item?.fee / 100 ?? 0), 5)}</td>
                    <td>{momentFormat(item.createdAt, "DD/MM/YYYY HH:mm")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Dialog.Close asChild>
            <button className="modal_close_brn" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default History;
