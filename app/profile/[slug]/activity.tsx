"use client";
import { Fragment, useEffect, useState, useContext } from 'react';
import Image from "next/image";
import { formatNumber } from "@/app/helper/custommath";
import { useSelector } from 'react-redux';
import { getTradeHistory } from '@/services/user';
import { checkApiSuccess, getResponseResult } from '@/lib/apiHelpers';
import PaginationComp from '../../components/customComponents/PaginationComp';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { SocketContext, subscribe, unsubscribe } from '@/config/socketConnectivity';

interface Trade {
  time: string;
  execUserId: any;
  price: number;
  quantity: number;
  side: string;
  action: string;
  marketId: any;
  fee: any;
}

interface PaginationState {
  page: number;
  limit: number;
  offset: number;
}

interface ActivityTableProps {
  uniqueId: any;
}

const ActivityTable: React.FC<ActivityTableProps> = (props) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    offset: 0,
  });
  const route = useRouter();
  const socketContext = useContext(SocketContext);

  const fetchTradeHistory = async () => {
    try {
      setLoading(true)
      const response = await getTradeHistory({ id: props.uniqueId, ...pagination });
      if (checkApiSuccess(response)) {
        const result = getResponseResult(response);
        setTrades((result as any).data || []);
        setHasMore((result as any).count > pagination.page * pagination.limit);
      }
    } catch (error) {
      console.error('Error fetching trade history:');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.uniqueId)
      fetchTradeHistory();
  }, [props.uniqueId, pagination]);

  // Socket event listeners for real-time trade updates
  useEffect(() => {
    const socket = socketContext?.socket;
    if (!socket || !props.uniqueId) return;

    console.log("=== Setting up activity socket listeners ===");
    console.log("User ID:", props.uniqueId);

    // Subscribe to user-specific updates
    subscribe(props.uniqueId);

    const handleTradeUpdate = (data: any) => {
      console.log("=== Trade update received in activity ===", data);
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

        if (parsedData.userId === props.uniqueId || parsedData.execUserId === props.uniqueId) {
          console.log("Trade update for current user, refreshing activity");
          fetchTradeHistory();
        }
      } catch (error) {
        console.error("Error handling trade update:", error);
      }
    };

    const handleOrderFill = (data: any) => {
      console.log("=== Order fill received in activity ===", data);
      // Refresh activity when orders get filled
      fetchTradeHistory();
    };

    // Listen for various trade-related events
    socket.on("trade-update", handleTradeUpdate);
    socket.on("order-fill", handleOrderFill);
    socket.on("recent-trade", handleTradeUpdate);
    socket.on(`user-${props.uniqueId}`, handleTradeUpdate);

    return () => {
      console.log("=== Cleaning up activity socket listeners ===");
      socket.off("trade-update", handleTradeUpdate);
      socket.off("order-fill", handleOrderFill);
      socket.off("recent-trade", handleTradeUpdate);
      socket.off(`user-${props.uniqueId}`, handleTradeUpdate);
      unsubscribe(props.uniqueId);
    };
  }, [socketContext?.socket, props.uniqueId]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left custom_table">
        <thead>
          <tr>
            <th className="px-6 py-3">Time</th>
            <th className="px-6 py-3">Price</th>
            <th className="px-6 py-3">Quantity</th>
            <th className="px-6 py-3">Fees</th>
            <th className="px-6 py-3">Action</th>
            <th className="px-6 py-3">Direction</th>
          </tr>
        </thead>
        <tbody>
          {!loading && trades.length > 0 && trades.map((trade, index) => (
            <Fragment key={index}>
              <tr>
                <td colSpan={5} className='sm:py-3 py-2 px-6'>
                  <div className="flex items-center gap-4">
                    <Image
                      src={trade.marketId?.eventId?.image}
                      alt="Icon"
                      width={45}
                      height={45}
                      className="rounded-[6px] object-cover aspect-square cursor-pointer"
                      onClick={() => route.push(`/event-page/${trade.marketId?.eventId?.slug}`)}
                    />
                    <Link href={`/event-page/${trade.marketId?.eventId?.slug}`} className="cursor-pointer">
                      {trade.marketId?.question}
                    </Link>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[#333333]">
                <td className="px-6 sm:py-4 py-2">
                  <span className='font-bold'>Trade Completed</span>
                  <br />
                  <span className='text-xs'>{new Date(trade.time).toLocaleString()}</span>
                </td>
                <td className="px-6 sm:py-4 py-2">
                  {formatNumber(trade.price)}¢
                </td>
                <td className="px-6 sm:py-4 py-2">
                  {formatNumber(trade.quantity)}
                </td>
                <td className="px-6  sm:py-4 py-2">
                  ${formatNumber((trade.fee / 100), 5)}
                </td>
                <td className={`px-6 sm:py-4 sm:py-2 ${trade.action === 'buy' ? 'text-green-500' : 'text-red-500'} capitalize`}>
                  {trade.action}
                </td>
                <td className={`px-6 sm:py-4 sm:py-2 ${trade.side === 'yes' ? 'text-green-500' : 'text-red-500'} capitalize`}>
                  {trade.side == "yes" ? (trade?.marketId?.outcome?.[0]?.title || "yes") : (trade?.marketId?.outcome?.[1]?.title || "no")}
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
      {!loading && trades.length === 0 && (
        <div className="flex justify-center text-[13px] my-5 text-gray-500">
          No Activity found
        </div>
      )}
      {!loading && trades.length > 0 && (
        <PaginationComp
          pagination={pagination}
          setPagination={setPagination}
          hasMore={hasMore}
        />
      )}
      {loading && (
        <div className="flex justify-center items-center my-5 min-h-[100px]">
          <Loader className="w-26 h-26 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default ActivityTable;