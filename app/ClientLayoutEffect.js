"use client";
import { useContext, useEffect, useCallback } from "react";
import store from "../store";
import { SocketContext, subscribe } from "@/config/socketConnectivity";
import { setWallet } from "@/store/slices/wallet/dataSlice";
import { useDispatch } from "react-redux";
import { useSelector } from "@/store";
import { getCurrentValue, getUserData } from "@/services/user";
import { signIn } from "@/store/slices/auth/sessionSlice";
import { removeAuthToken } from "@/lib/cookies";

export default function ClientLayoutEffect() {
  const socketContext = useContext(SocketContext);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const getWalletData = useCallback(async () => {
    try {
      const { success, result } = await getCurrentValue();
      if (success) {
        dispatch(setWallet({
          balance: result.balance,
          inOrder: result.inOrder,
          locked: result.locked,
          position: result.position/100,
          pnl1D: result.pnl1D
        }));
      }
    } catch (error) {
      console.log("error on getWalletData", error)
      console.log("error on getWalletData", error)

    }
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      try {
        const { success } = await getUserData(dispatch);
        if (success) {
          dispatch(signIn());
        } else {
          await removeAuthToken();
        }
      } catch (error) {
        await removeAuthToken();
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    const getWalletData = async () => {
      try {
        const { success, result } = await getCurrentValue();
        if (success) {
          dispatch(setWallet({
            balance: result.balance,
            inOrder: result.inOrder,
            locked: result.locked,
            position: result.position/100,
            pnl1D: result.pnl1D
          }));
        }
      } catch (error) {

      }
    };

    getWalletData();
    const socket = socketContext?.socket;
    if (!socket) return;

    const handleAsset = (result) => {
      const assetdata = JSON.parse(result);
      let prevPosition = store.getState().wallet.data.position;
      dispatch(setWallet({
        balance: assetdata.balance,
        inOrder: assetdata.inOrder,
        locked: assetdata.locked,
        position: prevPosition,
      }));
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