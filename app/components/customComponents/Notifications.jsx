import { memo, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getNotifications } from "../../../services/user";
import { useSelector } from "@/store";
import { formatDistanceToNow } from 'date-fns';

const Notification = () => {
    const { signedIn } = useSelector((state) => state.auth?.session);

    // state
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!signedIn) {
            return;
        }
        setLoading(true);
        const fetchData = async () => {
            try {
                const { success, result } = await getNotifications();
                setLoading(false);

                if (success) {
                  console.log(success, result, "success, result")
                    setData(result);
                }
            } catch (err) {
                setLoading(false);
            }
        }
        setLoading(false);
        fetchData();
    }, [signedIn]);
    

    if (loading)
        return (
            <div className="text-center text-gray-100 text-sm min-h-[200px] flex items-center justify-center">
                Loading...
            </div>
        )

    if (data?.length === 0)
        return (
            <div className="text-center text-gray-100 text-sm min-h-[200px] flex items-center justify-center">
                No notifications yet
            </div>
        )

    return (
        <div className="flex flex-col gap-0 pt-2 min-h-[200px]">
            {data?.length > 0 &&
                data.map((item, index) => (
                <div
                    className="grid grid-cols-[1fr_auto] gap-2 p-4 pl-2 pr-2 pt-2 hover:bg-[#111111] rounded min-h-[64px]"
                    style={{ minHeight: 95 }}
                    key={index}
                >
                    {/* Left column */}
                    <div className="flex items-start gap-4">
                    <Image
                        src={
                        item.type === "trade"
                            ? "/images/checktrade.png"
                            : item.type === "reply"
                            ? "/images/notreply.png"
                            : item.type === "deposit" || item.type === "withdraw"
                            ? "/images/walletwithdraw.png"
                            : "/images/tradecheck.png"
                        }
                        alt="Profile Icon"
                        width={48}
                        height={48}
                        className="rounded"
                    />
                    <div className="flex flex-col items-start justify-start p-0 m-0 h-full">
                        <h5 className="sm:text-[15px] text-[14px] font-semibold text-white leading-none">
                        <Link href={`/event-page/${item.content?.slug}`}>
                            {item.type == "trade" && "Trade confirmed"}
                        </Link>
                        {item.type == "reply" && "Trader replied"}
                        {item.type == "deposit" && "Deposit confirmed"}
                        {item.type == "withdraw" && "Withdraw approved"}
                        </h5>
                        <p className="sm:text-s pt-1 text-[12px] text-gray-400">
                        <Link href={`/event-page/${item.content?.slug}`}>
                            {item.type == "trade" && item?.content?.marketTitle}
                        </Link>
                        {item.type == "reply" && (item?.content?.content ?? "--")}
                        {item.type == "deposit" && (item?.content?.message ?? "--")}
                        {item.type == "withdraw" && (item?.content?.message ?? "--")}
                        </p>
                        <p className="sm:text-[11px] text-[10px] text-gray-500 mb-0">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    </div>

                    {/* Right column */}
                        <div className="flex flex-col items-center justify-center text-center w-20">
                        <h5 className="sm:text-[16px] text-[14px] font-semibold text-white leading-none">
                            {item.type == "trade" && (item?.content?.orderAction ?? "").toUpperCase()}
                        </h5>
                        <p className="sm:text-sm text-[12px] text-gray-400">
                            {item.type == "trade" && (item?.content?.price ? `${item?.content?.tradeCnt}/${item?.content?.price}¢` : "")}
                        </p>
                        </div>
                </div>
                ))}
            </div>

   

    )
}

export default memo(Notification);