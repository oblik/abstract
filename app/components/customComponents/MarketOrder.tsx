import React, { memo, useEffect, useState, useCallback } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useSelector } from "@/store";
import { placeOrder } from "@/services/market";
import { toastAlert } from "@/lib/toast";
import { isEmpty } from "@/lib/isEmpty";
import { toFixedDown } from "@/lib/roundOf";
import { firstLetterCase } from "@/lib/stringCase";

interface MarketOrderProps {
  activeView: string;
  marketId: string;
  buyorsell: "buy" | "sell";
  selectedOrder: any;
  outcomes: any;
  orderBook: {
    bids: [string, number][];
    asks: [string, number][];
  };
  takerFee?: number;
}

const initialFormValue = {
  price: "",
  ordVal: "",
  amount: "",
};

interface FormState {
  price: string | number;
  ordVal: string | number;
  amount: string | number;
}

interface ErrorState {
  ordVal?: string;
  amount?: string;
}

const MarketOrder: React.FC<MarketOrderProps> = (props) => {
  const { activeView, marketId, buyorsell, selectedOrder, outcomes, orderBook, takerFee } = props;
  const { signedIn } = useSelector((state) => state?.auth.session);
  const user = useSelector((state) => state?.auth.user);
  const asset = useSelector((state) => state?.walletconnect);
  const [orderBtn, setOrderBtn] = useState<boolean>(true);

  const [formValue, setFormValue] = useState<FormState>(initialFormValue);
  const { ordVal, amount } = formValue;
  const [errors, setErrors] = useState<ErrorState>({});

  // Adjust order value by taker fee
  const feeFactor = takerFee ? 1 - takerFee / 100 : 1;
  const feeAdjustedOrdVal = Number(ordVal) * feeFactor;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormValue((prev: any) => {
      if (name === "ordVal") {
        const numericValue = value.replace(/[^0-9.]/g, "");
        const parts = numericValue.split(".");
        if (parts.length > 2) return prev;
        if (parts[1] && parts[1].length > 2) return prev;

        const ordValNum = parseFloat(numericValue);
        if (numericValue === "" || numericValue === ".") return { ...prev, [name]: numericValue };
        if (ordValNum >= 0 && ordValNum <= 100000) return { ...prev, [name]: numericValue };
        return prev;
      } else if (name === "amount") {
        if (value === "") return { ...prev, [name]: "" };
        let numval = parseInt(value, 10);
        return { ...prev, [name]: numval || 0 };
      }
      return prev;
    });
  }, []);

  const marketOrderValidation = useCallback(() => {
    let errors: any = {};
    if (buyorsell === "buy") {
      if (!ordVal) errors.ordVal = "Amount field is required";
      if (Number(ordVal) <= 0) errors.ordVal = "Amount must be greater than 0";
    }
    if (buyorsell === "sell") {
      if (!amount) errors.amount = "Contracts field is required";
      if (Number(amount) <= 0) errors.amount = "Contracts must be greater than 0";
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  }, [buyorsell, ordVal, amount]);

  useEffect(() => {
    setFormValue(initialFormValue);
    setErrors({});
  }, [activeView, buyorsell, marketId]);

  // Auto-scroll when input values change to show updated stats
  useEffect(() => {
    if ((buyorsell === "buy" && ordVal) || (buyorsell === "sell" && amount)) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        const drawerContent = document.querySelector('.drawer-content, [data-vaul-drawer-wrapper]');
        const tradingCard = document.querySelector('.drawer-content .trading_card');

        if (drawerContent && tradingCard) {
          // Add auto-scroll class for CSS behavior
          tradingCard.classList.add('auto-scroll-bottom');

          // Programmatically scroll to bottom
          drawerContent.scrollTo({
            top: drawerContent.scrollHeight,
            behavior: 'smooth'
          });

          // Also scroll the trading card container itself
          tradingCard.scrollTo({
            top: tradingCard.scrollHeight,
            behavior: 'smooth'
          });

          // Remove class after animation
          setTimeout(() => {
            tradingCard.classList.remove('auto-scroll-bottom');
          }, 500);
        }
      }, 100);
    }
  }, [ordVal, amount, buyorsell]);

  const handlePlaceOrder = useCallback(async (action: any) => {
    if (!marketOrderValidation()) return;

    let activeTab = activeView?.toLowerCase();
    let data = {
      price: 0,
      userSide: activeTab,
      side: action === "buy" ? activeTab : activeTab === "yes" ? "no" : "yes",
      action: action,
      capped: action === "sell" ? true : false,
      marketId,
      userId: user?.userId,
      ordVal: action === "buy" ? Number(ordVal) * 100 : 0, // use original input
      quantity: action === "sell" ? Number(amount) : 0,
      type: "market",
    };

    const { success, message } = await placeOrder(data as any);
    if (success) {
      toastAlert("success", "Order placed successfully!", "order-success");
      setFormValue(initialFormValue);
    } else {
      toastAlert("error", message, "order-failed");
    }

  }, [marketOrderValidation, activeView, user?.userId, ordVal, amount, marketId]);

  useEffect(() => {
    if (isEmpty(selectedOrder)) return;

    if (buyorsell === "buy" && selectedOrder?.bidOrAsk === "ask") {
      setFormValue(f => ({ ...f, ordVal: selectedOrder?.ordCost || "" }));
    } else if (buyorsell === "sell" && selectedOrder?.bidOrAsk === "bid") {
      setFormValue(f => ({ ...f, amount: selectedOrder?.row[1] || "" }));
    } else {
      setFormValue(initialFormValue);
    }
  }, [selectedOrder, buyorsell]);

  // Market order summary calculations
  let priceLevels: [string, number][] = [];
  const isBuy = buyorsell === "buy";
  let contracts = 0;
  let totalCost = 0;
  let avgPrice = "-";
  let payout = "-";


  if (activeView === "Yes" && isBuy) {
    priceLevels = [...orderBook.asks].sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([price, qty]) => [(100 - Number(price)).toString(), qty]);
  } else if (activeView === "Yes" && !isBuy) {
    priceLevels = [...orderBook.bids].sort((a, b) => Number(b[0]) - Number(a[0]));
  } else if (activeView === "No" && isBuy) {
    priceLevels = [...orderBook.bids].sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([price, qty]) => [(100 - Number(price)).toString(), qty]);
  } else if (activeView === "No" && !isBuy) {
    priceLevels = [...orderBook.asks].sort((a, b) => Number(b[0]) - Number(a[0]));
  }

  if (isBuy) {
    let remaining = feeAdjustedOrdVal * 100;
    for (const [price, qty] of priceLevels) {
      let priceNum = Number(price);
      const maxContracts = Math.min(Math.floor(remaining / priceNum), qty);
      contracts += maxContracts;
      totalCost += maxContracts * priceNum;
      remaining -= maxContracts * priceNum;
      if (remaining < priceNum) break;
    }
    avgPrice = contracts > 0 ? toFixedDown(totalCost / contracts, 2) + "¢" : "-";
    payout = "$" + toFixedDown(contracts, 2);
  } else {
    let remaining = Number(amount);
    let contractsFilled = 0;
    let totalRevenue = 0;
    for (const [price, qty] of priceLevels) {
      let priceNum = Number(price);
      const maxContracts = Math.min(remaining, qty);
      contractsFilled += maxContracts;
      totalRevenue += maxContracts * priceNum;
      remaining -= maxContracts;
      if (remaining <= 0) break;
    }
    contracts = contractsFilled;
    payout = "$" + toFixedDown((totalRevenue / 100) * (1 - (takerFee || 0) / 100), 2);

  }

  return (
    <>
      <div className="mt-3">
        <div className="flex justify-between">
          <div className="w-full flex items-center border border-input rounded-md bg-background px-0 py-0 h-12 overflow-hidden">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={buyorsell === "buy" ? ordVal : amount}
              name={buyorsell === "buy" ? "ordVal" : "amount"}
              placeholder="Amount"
              onChange={handleChange}
              className="border-0 text-left bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
              style={{ fontSize: '16px' }}
            />
            <span className="cursor-default text-[16px] p-3">
              {buyorsell === "buy" ? "USD" : "Contracts"}
            </span>
          </div>
        </div>
        {errors.ordVal && <p className="text-red-500 text-sm">{errors.ordVal}</p>}
        {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
      </div>

      {/* Summary */}
      <div className="pt-2 space-y-2 pb-2">
        <div className="flex justify-between text-sm pt-2">
          <span className="text-muted-foreground">Contracts</span>
          <span className="text-foreground">{contracts}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Average price per contract</span>
          <span className="text-foreground">{avgPrice}</span>
        </div>
        <div className="flex justify-between text-sm">
          {isBuy ? (
            <div>
              <span className="text-muted-foreground">Total return if </span>
              <span className="text-white">
                {`${activeView === "Yes" ? firstLetterCase(outcomes?.[0]?.title || "yes") : firstLetterCase(outcomes?.[1]?.title || "no")}`}
              </span>
              <span className="text-muted-foreground"> wins</span>
            </div>
          ) : (
            <div>
              <span className="text-white">Total return</span>
              <span className="text-muted-foreground"> (incl. {Number(takerFee || 0)}% fee)</span>
            </div>
          )}
          <span className="text-green-500">{payout}</span>
        </div>
      </div>

      <div className="pt-4">
        <div className="trade-button-container">
          {signedIn ? (
            <Button
              className="w-full border border-white bg-transparent text-white hover:bg-white hover:text-black transition-colors duration-300"
              onClick={() => handlePlaceOrder(buyorsell)}
              disabled={orderBtn ? false : true}
            >
              {`${buyorsell === "buy" ? "Buy" : "Sell"} ${activeView === "Yes" ? firstLetterCase(outcomes?.[0]?.title || "yes") : firstLetterCase(outcomes?.[1]?.title || "no")
                }`}
            </Button>
          ) : (
            <Button className="w-full border border-white bg-transparent text-white hover:bg-white hover:text-black transition-colors duration-300">
              Login
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(MarketOrder);
