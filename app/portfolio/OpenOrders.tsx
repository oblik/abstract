import React, { useContext, useEffect, useState } from 'react'
import Image from 'next/image'
import SearchBar from '../components/ui/SearchBar'
import { getOpenOrders } from '@/services/portfolio'
import { cancelOrder } from '@/services/market'
import { useRouter } from 'next/navigation'
import { Loader, X } from 'lucide-react'
import { toastAlert } from '@/lib/toast'
import { momentFormat } from '../helper/date'
import { SocketContext } from '@/config/socketConnectivity'
import store from "@/store/index";
import { toFixedDown } from '@/lib/roundOf'
import { isEmpty } from '@/lib/isEmpty'

interface Order {
  _id: string;
  marketGroupTitle: string;
  action: string;
  userSide: string;
  filledQuantity?: number;
  quantity: number;
  price: number;
  currentPrice?: number;
  createdAt: string;
  timeInForce: string;
  expiration?: string;
  outcomes?: any[];
}

interface EventData {
  _id: string;
  eventId: string;
  eventSlug: string;
  eventImage: string;
  eventTitle: string;
  orders: Order[];
}

interface SocketOrderData {
  _id: string;
  userId: string;
  status: string;
  execQty?: number;
  price: number;
  quantity: number;
  createdAt: string;
  userSide: string;
  action: string;
  timeInForce: string;
  expiration?: string;
  marketId: {
    eventId: {
      _id: string;
      slug: string;
      image: string;
      title: string;
    };
    odd?: number;
    outcome?: any[];
  };
}

const OpenOrders = () => {
    const [openOrders, setOpenOrders] = useState<EventData[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const route = useRouter()
    const socketContext = useContext(SocketContext)
    const { user } = (store.getState() as any).auth;

    const getUserOpenOrders = async () => {
        try {
            setLoading(true)
            const res = await getOpenOrders()
            if (res.success) {
                setOpenOrders(res.result)
            }
        } catch (error) {
            console.error("Error fetching Position History:", error);
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getUserOpenOrders()
    }, [])

    const handleCancelOrder = async (orderId: string) => {
        try {
            const { success, message } = await cancelOrder(orderId)
            if (success) {
                toastAlert("success", message, "order")
            } else {
                toastAlert("error", message, "orderCancel")
            }
        } catch {
        }
    }

    useEffect(() => {
        let socket = socketContext?.socket
        if (!socket) return
        const handleOrders = (result: string) => {
            const resData: SocketOrderData = JSON.parse(result)
            if (resData.userId !== user._id) return
            setOpenOrders(prev => {
                const prevArray = prev as any[];
                const findMarket = prevArray.find(market => market.eventId === resData.marketId.eventId._id)
                const marketIndex = prevArray.findIndex(market => market.eventId === resData.marketId.eventId._id);
                if (findMarket) {
                    const findOrder = findMarket.orders.find(order => order._id === resData._id)
                    if (findOrder) {
                        if (["open", "pending"].includes(resData.status)) {
                            findOrder.filledQuantity = resData.execQty
                            findOrder.price = resData.price
                            findOrder.quantity = resData.quantity
                            findOrder.createdAt = resData.createdAt
                            findOrder.userSide = resData.userSide
                            findOrder.status = resData.status
                            findOrder.currentPrice = resData.marketId.odd
                            findOrder.timeInForce = resData.timeInForce
                            findOrder.expiration = resData.expiration
                            findOrder.action = resData.action
                            return prev;
                        } else if (["completed", "cancelled", "expired"].includes(resData.status)) {
                            const updatedMarket = {
                                ...findMarket,
                                orders: findMarket.orders?.filter(order => order._id !== resData._id) || [],
                            };
                            if (updatedMarket.orders.length === 0) {
                                return prevArray.filter(market => market.eventId !== resData.marketId.eventId._id)
                            }
                            const updatedData = prevArray.map(market => market.eventId === resData.marketId.eventId._id ? updatedMarket : market)
                            return updatedData
                        }
                    } else {
                        const newOrder = {
                            ...resData,
                            currentPrice: resData.marketId.odd,
                            timeInForce: resData.timeInForce,
                            expiration: resData.expiration,
                            action: resData.action,
                            outcomes: resData.marketId.outcome
                        };

                        const updatedMarket = {
                            ...findMarket,
                            orders: [...findMarket.orders, newOrder],
                        };

                        const updatedMarkets = [...prevArray];
                        updatedMarkets[marketIndex] = updatedMarket;

                        return updatedMarkets as any;
                    }
                } else {
                    let orderData = {
                        ...resData,
                        currentPrice: resData.marketId.odd,
                        timeInForce: resData.timeInForce,
                        expiration: resData.expiration,
                        action: resData.action,
                        outcomes: resData.marketId.outcome
                    }
                    const newMarket = {
                        eventId: resData.marketId.eventId._id,
                        eventSlug: resData.marketId.eventId.slug,
                        eventImage: resData.marketId.eventId.image,
                        eventTitle: resData.marketId.eventId.title,
                        orders: [orderData]
                    }
                    return [newMarket, ...prevArray] as any
                }
            })

        }
        socket.on("order-update", handleOrders)
        return () => {
            socket.off("order-update", handleOrders)
        }
    }, [socketContext?.socket, user, setOpenOrders])
    return (
        <>
            {}
            <div className="overflow-x-auto">
                <table className="w-full text-left custom_table">
                    <thead>
                        <tr>
                            <th>Market</th>
                            {/* <th>Side</th> */}
                            {/* <th>Outcome</th> */}
                            <th>Filled</th>
                            <th>Contracts</th>
                            <th>Limit Price</th>
                            <th>Current Price</th>
                            <th>Cash</th>
                            <th>Placed</th>
                            <th>Expiration</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {openOrders?.length > 0 && !loading && openOrders.map((item) => (
                            <React.Fragment key={item._id}>
                                <React.Fragment>
                                    <tr>
                                        <td colSpan={8}>
                                            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => route.push(`/event-page/${item?.eventSlug}`)}>
                                                <span className="text-2xl">
                                                    <Image
                                                        src={item?.eventImage}
                                                        alt="Icon"
                                                        width={45}
                                                        height={45}
                                                        className='rounded-[6px] object-cover aspect-square'
                                                    />
                                                </span>
                                                <span className="text-sm font-normal">
                                                    {item?.eventTitle}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    {item?.orders
                                        ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                        .map((data, index) => (
                                            <tr key={index}>
                                                <td>{data.marketGroupTitle} <span style={{ color: data.userSide === 'yes' ? "rgba(125, 253, 254, 1)" : "rgba(236, 72, 153, 1)", textTransform: "capitalize" }}>{data.action} {data.userSide === "yes" ? (data?.outcomes?.[0]?.title || "yes") : (data?.outcomes?.[1]?.title || "no")}</span></td>
                                                {}
                                                {}
                                                <td>{data.filledQuantity ?? 0}</td>
                                                <td>{data.quantity}</td>
                                                <td>{data.action === "sell" ? (100 - data.price) : data.price}¢</td>
                                                <td>
                                                    {(isEmpty(data.currentPrice) || data.currentPrice === 0)
                                                        ? "--"
                                                        : data.userSide === "no"
                                                            ? `${100 - (data.currentPrice ?? 0)}¢`
                                                            : `${data.currentPrice ?? 0}¢`}
                                                </td>
                                                <td>${toFixedDown((data.price * data.quantity) / 100, 2)}</td>
                                                <td>{momentFormat(data.createdAt, "DD/MM/YYYY HH:mm")}</td>
                                                <td>{data.timeInForce === "GTC" ? "Good 'til canceled" : momentFormat(data.expiration || "", "MMM D, YYYY · hh:mm A")}</td>
                                                <td>
                                                    <button className="text-red-500" onClick={() => handleCancelOrder(data._id)}>
                                                        <X size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </React.Fragment>
                                <tr>
                                    <td colSpan={9} className='border-b border-[#262626]'></td>
                                </tr>
                            </React.Fragment>
                        )
                        )}

                    </tbody>
                </table>
                {openOrders.length === 0 && !loading && (
                    <div className="flex text-[13px] justify-center text my-5 text-gray-500">
                        No orders found
                    </div>
                )}
                {loading && (
                    <div className="flex justify-center items-center my-5 min-h-[100px]">
                        <Loader className="w-26 h-26 animate-spin" />
                    </div>
                )}
            </div>
        </>
    )
}

export default OpenOrders
