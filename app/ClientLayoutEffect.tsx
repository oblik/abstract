"use client";
import { useContext, useEffect, useCallback } from "react";
import store from "../store";
import { SocketContext, subscribe } from "@/config/socketConnectivity";
import { setWallet } from "@/store/slices/wallet/dataSlice";
import { useDispatch } from "react-redux";
import { useSelector } from "@/store";
import { getCurrentValue, getUserData } from "@/services/user";
import { signIn } from "@/store/slices/auth/sessionSlice";
import { removeAuthToken, getAuthToken } from "@/lib/cookies";

interface WalletData {
  balance: number;
  inOrder: number;
  locked: number;
  position: number;
  pnl1D: number;
}

export default function ClientLayoutEffect() {
  const socketContext = useContext(SocketContext);
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);

  const getWalletData = useCallback(async () => {
    try {
      const { success, result } = await getCurrentValue();
      if (success) {
        dispatch(setWallet({
          balance: result.balance,
          inOrder: result.inOrder,
          locked: result.locked,
          position: result.position / 100,
          pnl1D: result.pnl1D / 100
        } as WalletData));
      }
    } catch (error) {
      console.log("error on getWalletData", error);
    }
  }, [dispatch]);

  useEffect(() => {
    // Initialize authentication and wallet data
    (async () => {
      try {
        const { success } = await getUserData();
        if (success) {
          // Use centralized cookie function instead of dynamic import
          const token = getAuthToken();
          if (token) {
            dispatch(signIn(token));
          } else {
            dispatch(signIn(''));
          }

          // Fetch wallet data after successful authentication
          try {
            const { success: walletSuccess, result } = await getCurrentValue();
            if (walletSuccess) {
              dispatch(setWallet({
                balance: result.balance,
                inOrder: result.inOrder,
                locked: result.locked,
                position: result.position / 100,
                pnl1D: result.pnl1D / 100
              } as WalletData));
            }
          } catch (walletError) {
            console.log("error on getWalletData", walletError);
          }
        } else {
          await removeAuthToken();
        }
      } catch (error) {
        await removeAuthToken();
      }
    })();
  }, [dispatch]); // Only dispatch in dependencies

  useEffect(() => {
    const socket = socketContext?.socket;
    if (!socket) return;

    const handleAsset = (result: string) => {
      const assetdata = JSON.parse(result);
      let prevPosition = (store.getState() as any).wallet.data.position;
      dispatch(setWallet({
        balance: assetdata.balance,
        inOrder: assetdata.inOrder,
        locked: assetdata.locked,
        position: prevPosition,
      } as WalletData));
    };

    socket.on("asset", handleAsset);

    return () => {
      socket.off("asset");
    };
  }, [socketContext?.socket, dispatch]);

  useEffect(() => {
    if (user && user._id) subscribe(user._id);
  }, [user]);

  return null; // No UI, just side effect
}
