"use client"; // Add this at the top of the file to enable client-side hooks
import Link from "next/link";
import Image from "next/image";

import { useSelector } from "@/store";
import SONOTRADE from "@/public/images/logo.png";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenu, Tooltip, Separator, Dialog } from "radix-ui";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/components/ui/avatar";
import {
  ChevronDownIcon,
  OpenInNewWindowIcon,
  Cross2Icon,
  BellIcon,
} from "@radix-ui/react-icons";
import config from "../config/config";
import { Button } from "./components/ui/button";
import { toastAlert } from "../lib/toast"
import {
  regInputValidate,
  regValidate,
  otpValidate,
  otpInputValidate,
} from "./validation/validation";
import {
  GoogleLogin,
  GoogleOAuthProvider,
  googleLogout,
} from "@react-oauth/google";
import isEmpty from "is-empty";
import { formatNumber, shortText } from "../app/helper/custommath";
import { getLocation, googleLogin, register, resendOTP, verifyEmail, walletLogin } from "@/services/auth";
import { saveWalletEmail } from "@/services/wallet"
import { useDispatch } from "react-redux";
import { reset } from "../store/slices/auth/userSlice"
import { signOut } from "@/store/slices/auth/sessionSlice";
import { setWalletConnect } from "@/store/slices/walletconnect/walletSlice";
import local from "next/font/local";
import { availableBalance } from "@/lib/utils";
import { Connection, PublicKey } from '@solana/web3.js';
import { Copy } from "lucide-react";
import Notifications from "./components/customComponents/Notifications";
import { removeAuthToken } from "@/lib/cookies";

interface UserData {
  email: string;
  address?: string;
}

interface OtpData {
  otp: string;
}

interface LoginHistory {
  [key: string]: any;
}

interface ValidationErrors {
  [key: string]: string;
}

interface WindowWithSolana extends Window {
  solana?: {
    isPhantom: boolean;
    isConnected: boolean;
    connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    signMessage: (message: Uint8Array, encoding: string) => Promise<Uint8Array>;
  };
}

declare global {
  interface Window {
    solana?: WindowWithSolana['solana'];
  }
}

const initialData: OtpData = {
  otp: "",
};
const initialValue: UserData = {
  email: "",
};

export default function Authentication() {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = document.createElement('style');
      // CSS is hardcoded and safe, no user input involved
      style.textContent = `@media (max-width: 640px) { .sono-auth-btn { font-size: 12px !important; padding: 0.25rem 0.75rem !important; height: 1.75rem !important; min-height: 1.75rem !important; border-radius: 0.375rem !important; } }`;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
    }
  }, []);
  const router = useRouter();
  const dispatch = useDispatch();
  const previousWalletRef = useRef<string | null>(null);
  const disconnectWalletRef = useRef<(() => void) | null>(null);

  const { signedIn } = useSelector((state: any) => state.auth?.session);
  const data = useSelector((state: any) => state?.auth?.user);
  const walletData = useSelector((state: any) => state?.wallet?.data);
  const { isConnected, address, balance } = useSelector((state: any) => state?.walletconnect?.walletconnect);

  const [open, setOpen] = useState<boolean>(false);
  const [loader, setloader] = useState<boolean>(false);
  const [otpopen, setOtpOpen] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData>(initialValue);
  const [otpData, setOtpData] = useState<OtpData>(initialData);
  const [LoginHistory, setLoginHistory] = useState<LoginHistory>({});
  const [error, setError] = useState<ValidationErrors>({});
  const [connect, setIsConnect] = useState<boolean>(false);
  const [verifystatus, setVerifyStatus] = useState<boolean>(false);
  const [walletEmail, setWalletEmail] = useState<boolean>(false);
  const [emailOpen, setEmailOpen] = useState<boolean>(false);

  const [expireTime, setExpireTime] = useState<number>(0);

  //get proileImg from redux
  const { profileImg } = useSelector((state: any) => state.auth.user);
  const { email } = userData;
  const { otp } = otpData;

  // Get current time for OTP expiration
  const getTime = useCallback(() => {
    return new Date().getTime();
  }, []);

  const registerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const resetData = { ...userData, [name]: value };
    delete error[name];
    setUserData(resetData);
  };

  // navigation handlers
  const navigateToProfilePage = () => {
    router.push("/profile");
  };
  const navigateToPortfolioPage = () => {
    window.location.href = "/portfolio";
  };

  async function ConnectPhantomWallet() {
    if (window.solana && window.solana.isPhantom) {
      try {
        if (window.solana.isConnected) {
          await window.solana.disconnect();
        }
        const response = await window.solana.connect();

        const message =
          `Welcome to SonoTrade! - Sign to connect 

        URI : ${window.location.origin} 
        Network : ${config.networkType}
        Solana Account: ${response.publicKey.toString()}`
        const encodedMessage = new TextEncoder().encode(message);


        const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
        console.log("Signature:", signedMessage);

        if (signedMessage) {
          const connection = new Connection(config?.rpcUrl || "");

          const publicKey = new PublicKey(response.publicKey.toString());
          const balanceLamports = await connection.getBalance(publicKey);
          const balanceSOL = balanceLamports / 1e9;

          dispatch(
            setWalletConnect({
              isConnected: true,
              address: response.publicKey.toString(),
              network: config.network,
              type: config.networkType,
              rpc: config?.rpcUrl,
              balance: balanceSOL
            })
          );
          setIsConnect(true);
          setOpen(false);
          walletAdd(response.publicKey.toString());
        }
      } catch (err: any) {
        console.log(err, "error")
        console.log(err, "err")
        console.log(err, "err")
        console.log(err, "error")

        if (err?.code === 4001) {
          toastAlert("error", "Connection request was rejected", "wallet");
        }
        dispatch(
          setWalletConnect({
            isConnected: false,
            address: "",
            network: "",
            type: "",
            rpc: "",
            balance: 0
          }));
        toastAlert("error", "Failed to connect wallet", "wallet");
        setIsConnect(true);
        setOpen(false);
      }
    } else {
      toastAlert("error", "Phantom wallet extension is not installed", "error");
    }
  }

  const disconnectWallet = useCallback(async () => {
    if (window.solana && window.solana.isPhantom) {
      window.solana.disconnect();
      dispatch(
        setWalletConnect({
          isConnected: false,
          address: "",
          network: "",
          type: "",
          rpc: "",
          balance: 0
        }));
    }
  }, [dispatch]);

  // Update ref when disconnectWallet changes
  useEffect(() => {
    disconnectWalletRef.current = disconnectWallet;
  }, [disconnectWallet, dispatch]);

  const getUserLogindetails = async () => {
    try {
      let result = await getLocation();
      setLoginHistory(result);
    } catch (err) {
      console.error("Failed to get user location", err);
    }
  };


  const walletAdd = useCallback(async (address?: string) => {
    if (isConnected && address) {
      const valuedata = {
        address: address,
        LoginHistory,
      };
      const { success, message, result } = await walletLogin(valuedata, dispatch);
      if (success) {
        if ((isEmpty(result?.user?.email) && address) || result?.user?.status === "unverified") {
          setWalletEmail(true)
          setEmailOpen(true)
          setUserData(initialValue)
          setExpireTime(0)
        } else {
          setOpen(false);
          toastAlert("success", message, "login");
        }
      } else {
        toastAlert("error", message, "login");
      }
    }
  }, [isConnected, LoginHistory, dispatch]);

  useEffect(() => {
    const handleWalletAdd = async () => {
      if (isConnected && connect) {

        // Inline the walletAdd logic to avoid dependency issues
        if (isConnected) {
          var valuedata = {
            address: address,
            LoginHistory,
          };
          let { success, message, result } = await walletLogin(valuedata, dispatch);
          if (success) {
            if ((isEmpty(result?.user?.email) && address) || result?.user?.status === "unverified") {
              setWalletEmail(true);
              setEmailOpen(true);
              setOpen(false);
            } else {
              setOpen(false);
              toastAlert("success", message, "login");
            }
          } else {
            toastAlert("error", message, "login");
          }
        }
      }
    };

    handleWalletAdd();
  }, [isConnected, address, connect, LoginHistory, dispatch]);

  useEffect(() => {
    if (expireTime > 0) {
      setTimeout(() => {
        setExpireTime(prev => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
  }, [expireTime]);

  useEffect(() => {
    getUserLogindetails();
  }, []);

  const handleGoogleLogin = async (credentialResponse: { credential?: string }) => {
    const token = credentialResponse.credential;

    try {
      const data = {
        token,
        LoginHistory: LoginHistory,
      };
      const { success, message } = await googleLogin(data, dispatch);

      if (success) {
        setOpen(false);
        toastAlert("success", message, "login");
        console.log(message, success, "message")
      } else {
        toastAlert("error", message, "login");
      }
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  const handleClick = async () => {
    try {
      const errMsg = await regValidate(userData);
      setError(errMsg);
      if (isEmpty(errMsg)) {
        const { success, message, errors } = await register(userData);
        if (success) {
          toastAlert("success", message, "login");
          setVerifyStatus(true);
          setExpireTime(180);
          setOtpOpen(true);
          setOpen(false);
          getTime();
          setOtpData(initialData)
        } else if (!isEmpty(errors)) {
          setError(errors);
          return;
        } else {
          toastAlert("error", message, "login");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const resetData = { ...otpData, [name]: value };
    delete error[name];
    setOtpData(resetData);
    const errMsg = otpInputValidate(resetData, name);
    setError({ ...error, ...errMsg });
  };

  const handleOtpClick = async () => {
    try {
      const errMsg = await otpValidate(otpData);
      setError(errMsg);
      if (isEmpty(errMsg)) {
        if (expireTime === 0) {
          toastAlert("error", "OTP expired,Please resend");
          setOtpData(initialData);
        } else {
          const data = { otp, email, LoginHistory: LoginHistory };
          const { message, success } = await verifyEmail(data, dispatch);
          if (success) {
            toastAlert("success", message, "login");
            setOtpOpen(false);
            setOtpData(initialData);
          } else {
            toastAlert("error", message, "login");
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resendCode = async () => {
    try {
      const data = {
        email,
      };
      const { message, success } = await resendOTP(data);
      if (success) {
        toastAlert("success", message, "login");
        setExpireTime(180);
        getTime();
      } else {
        toastAlert("error", message, "login");
      }
    } catch (err) {
      console.error(err);
    }
  };


  const walletEmailClick = async () => {
    try {
      const errMsg = await regValidate(userData);
      setError(errMsg);
      if (isEmpty(errMsg)) {
        const updatedUserData = { ...userData, address };
        const { success, message } = await saveWalletEmail(updatedUserData);
        if (success) {
          setVerifyStatus(true);
          setWalletEmail(false)
          setEmailOpen(false)
          setExpireTime(180);
          setOtpOpen(true);
          setOpen(false);
          getTime();
          setOtpData(initialData)
        } else {
          toastAlert("error", message, "login");
          setUserData({ email: "" })
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  async function logout() {
    disconnectWallet();
    removeAuthToken();
    localStorage.removeItem("eventData");
    dispatch(reset());
    dispatch(signOut());
    toastAlert("success", "Logged out successfully", "logout");
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (signedIn && window.solana) {
          const res = await window.solana.connect({ onlyIfTrusted: true });
          const newPublicKey = res?.publicKey?.toString()?.toLowerCase();
          const savedAddress = data?.walletAddress?.toLowerCase();

          if (!previousWalletRef.current) {
            console.log("🔁 Wallet switched from", previousWalletRef.current, "to", newPublicKey);
            previousWalletRef.current = newPublicKey;
          }

          if (
            newPublicKey &&
            savedAddress &&
            newPublicKey !== previousWalletRef.current &&
            newPublicKey !== savedAddress
          ) {
            console.log("🔁 Wallet switched from", previousWalletRef.current, "to", newPublicKey);

            if (isConnected) {
              disconnectWallet();
              document.cookie =
                "user-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
              dispatch(reset());
              dispatch(signOut());
              toastAlert(
                "error",
                `Logged out: please reconnect with your wallet address ${data?.walletAddress}`,
                "logout"
              );
              setTimeout(() => {
                window.location.href = "/";
              }, 1000);
            }
          }

          previousWalletRef.current = newPublicKey;
        }
      } catch (err) {
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.walletAddress, isConnected, signedIn, dispatch]);

  return (
    <>
      { }
      {signedIn && (
        <button
          className="px-3 py-2 rounded-md transition-colors hidden lg:block"
          onClick={() => navigateToPortfolioPage()}
        >
          <div className="text-l text-[#33ff4c]">${Number(walletData?.balance + walletData?.position).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-xs text-grey">Portfolio</div>
        </button>
      )}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        {!signedIn && (
          <>
            <Dialog.Trigger asChild>
              <Button variant="outline" size="sm" className="sono-auth-btn" onClick={() => {
                setOpen(true)
                setUserData({ email: "" })
                setExpireTime(0)
                setError({})
                disconnectWallet()
              }}>
                Log In
              </Button>
            </Dialog.Trigger>
            <Dialog.Trigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-[#eeeef0] text-[#131418] sono-auth-btn"
                onClick={() => {
                  setOpen(true)
                  setUserData({ email: "" })
                  setExpireTime(0)
                  setError({})
                  disconnectWallet()
                }
                }
              >
                Sign Up
              </Button>
            </Dialog.Trigger>
          </>
        )}

        <Dialog.Portal>
          <Dialog.Overlay className="DialogOverlay" />
          <Dialog.Content className="DialogContent">
            <Dialog.Title className="DialogTitle mb-4">
              Welcome to Sonotrade
            </Dialog.Title>
            <GoogleOAuthProvider clientId={config?.clientId}>
              <div className="google_login">
                <GoogleLogin
                  theme="filled_black"
                  onSuccess={handleGoogleLogin}
                  onError={() => console.log("Login Failed")}
                />
              </div>
            </GoogleOAuthProvider>
            <div className="custom_separator">
              <Separator.Root
                className="SeparatorRoot"
                style={{ margin: "15px 0" }}
              />
              or
              <Separator.Root
                className="SeparatorRoot"
                style={{ margin: "15px 0" }}
              />
            </div>
            <div className="custom_grpinp">
              <input
                className="Input focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                type="email"
                name="email"
                value={email}
                onChange={registerChange}
                placeholder="Enter Email"
                enterKeyHint="go"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleClick()
                  }
                }}
              />
              <Button onClick={handleClick} disabled={loader}>
                Continue{" "}
                {loader && (
                  <i
                    className="fas fa-spinner fa-spin ml-2"
                    style={{ color: "black" }}
                  ></i>
                )}
              </Button>
            </div>
            {error && error?.email && (
              <span style={{ color: "red" }}>{error?.email}</span>
            )}
            <div className="flex gap-3 justify-between mt-4 sm:flex-nowrap flex-wrap">
              <Button
                onClick={() => ConnectPhantomWallet()}
                className="rounded-[6px] w-full sm:h-13 h-11758 bg-[#1e1e1e] border border-[#3d3d3d] hover:bg-[#333]"
              >
                <Image
                  src={"/images/wallet_icon_02.png"}
                  alt="Icon"
                  width={30}
                  height={30}
                />
              </Button>
            </div>
            <Dialog.Close asChild>
              <button className="modal_close_brn" aria-label="Close">
                <Cross2Icon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {verifystatus === true && (
        <Dialog.Root open={otpopen} onOpenChange={setOtpOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="DialogOverlay" />
            <Dialog.Content className="DialogContent">
              <div className="text-center">
                <Image
                  src={SONOTRADE}
                  alt="Profile Icon"
                  width={200}
                  height={200}
                  className="mx-auto rounded-full"
                />
              </div><br />
              <Dialog.Title className="DialogTitle">
                Verify Your Email
              </Dialog.Title><br />
              <div className="custom_grpinp">
                <input
                  className="Input focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                  type="otp"
                  name="otp"
                  value={otp ? otp : ""}
                  onChange={handleOtpChange}
                  placeholder="Enter OTP"
                  enterKeyHint="done"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleOtpClick()
                    }
                  }}
                />
                {expireTime === 0 ? (
                  <Button onClick={resendCode}>Resend OTP</Button>
                ) : (
                  <Button>{`${expireTime}`}</Button>
                )}
                {/* <Button>Continue</Button> */}
              </div>
              {error && error?.otp && (
                <span style={{ color: "red" }}>{error?.otp}</span>
              )}
              <br></br>
              <div className="text-center">
                <Button onClick={() => handleOtpClick()} disabled={loader}>
                  Submit{" "}
                  {loader && (
                    <i
                      className="fas fa-spinner fa-spin ml-2"
                      style={{ color: "black" }}
                    ></i>
                  )}
                </Button>
              </div>
              <Dialog.Close asChild>
                <button className="modal_close_brn" aria-label="Close">
                  <Cross2Icon />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {walletEmail === true && (
        <Dialog.Root open={emailOpen} onOpenChange={setEmailOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="DialogOverlay" />
            <Dialog.Content
              className="DialogContent"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              <div className="text-center">
                <Image
                  src={SONOTRADE}
                  alt="Profile Icon"
                  width={200}
                  height={200}
                  className="mx-auto rounded-full"
                />
              </div>
              <br />
              <Dialog.Title className="DialogTitle">Welcome to Sonotrade</Dialog.Title>
              <br />
              <div className="custom_grpinp">
                <input
                  className="Input focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                  type="email"
                  name="email"
                  value={email ? email : ""}
                  onChange={registerChange}
                  placeholder="Enter Email"
                  enterKeyHint="go"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      walletEmailClick()
                    }
                  }}
                />
                <Button onClick={walletEmailClick} disabled={loader}>
                  Continue{" "}
                  {loader && (
                    <i
                      className="fas fa-spinner fa-spin ml-2"
                      style={{ color: "black" }}
                    ></i>
                  )}
                </Button>
              </div>
              {error?.email && (
                <span style={{ color: "red" }}>{error.email}</span>
              )}
              <br />
              <Dialog.Close asChild>
                <button className="modal_close_brn" aria-label="Close">
                  <Cross2Icon />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
      {signedIn ? (
        <>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="rounded p-2 hover:bg-[#202020] relative"
                aria-label="Customise options"
              >
                <BellIcon className="sm:w-6 sm:h-6 w-5 h-5" />
                { }
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <div className="notification_dropdown_portal">
                <DropdownMenu.Content
                  className="notification_menu"
                >
                  <DropdownMenu.Label className="text-[18px] font-medium text-gray-100 px-2 py-3 pt-2 border-b border-[#222]">
                    Notifications
                  </DropdownMenu.Label>
                  <Notifications />
                </DropdownMenu.Content>
              </div>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="pr-0 mr-0 profile_button" aria-label="Customise options">
                <Avatar className="w-6 pr-0 mr-0 h-6">
                  {data?.profileImg ? (
                    <AvatarImage
                      src={data?.profileImg}
                      alt={data?.userName || "User Avatar"}
                    />
                  ) : (
                    <AvatarFallback className="bg-blue-500 text-sm">
                      {data?.userName
                        ? data?.userName.charAt(0).toUpperCase()
                        : data?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <div className="custom_dropdown_portal">
                <DropdownMenu.Content className="profile_menu" sideOffset={5}>
                  <div className="flex items-center pl-2 space-x-3">

                    <Avatar className="w-10 h-10">
                      {data?.profileImg ? (
                        <AvatarImage
                          src={data?.profileImg}
                          alt={data?.userName || "User Avatar"}
                        />
                      ) : (
                        <AvatarFallback className="bg-blue-500 text-md">
                          {data?.userName
                            ? data?.userName.charAt(0).toUpperCase()
                            : data?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <span className="text-sm text-gray-100">
                        @{data?.userName ? data?.userName : "--"}
                      </span>
                      <div className="text-sm text-gray-100 flex items-center space-x-2">
                        <button className="IconButton bg-[#131212] px-2 py-1 rounded">
                          <span className="text-[12px]">
                            {address ? shortText(address) : data?.email}
                          </span>
                        </button>
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <button className="IconButton bg-[#131212] px-2 py-2 rounded" onClick={() => {
                                navigator.clipboard.writeText(address ? address : data?.email);
                                toastAlert("success", "Address copied to clipboard");
                              }}>
                                <Copy size={14} />
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <div className="custom_tooltip_content">
                                <Tooltip.Content
                                  className="TooltipContent"
                                  sideOffset={5}
                                >
                                  Copy Address
                                  <Tooltip.Arrow className="TooltipArrow" />
                                </Tooltip.Content>
                              </div>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu.Separator className="DropdownMenuSeparator" />
                  <DropdownMenu.Item className="DropdownMenuItem">
                    <Link href={"/profile/@" + data?.uniqueId}>Profile</Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="DropdownMenuItem">
                    <Link href="/settings">Settings</Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="DropdownMenuItem" disabled>
                    <Link href="/">Terms of Use</Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="DropdownMenuSeparator" />
                  <DropdownMenu.Item className="DropdownMenuItem">
                    <Link href="#" onClick={logout}>Logout</Link>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </div>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </>
      ) : (
        ""
      )}
    </>
  );
}
