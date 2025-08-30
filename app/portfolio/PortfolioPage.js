"use client";
import Header from "@/app/Header";
import HeaderFixed from "@/app/HeaderFixed";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import config from "../../config/config";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import ChartIntervals from "@/app/components/customComponents/ChartIntervals";
import "react-datepicker/dist/react-datepicker.css";
import Image from "next/image";
import { Dialog, Accordion, Checkbox, Separator } from "radix-ui";
import { shortText, numberFloatOnly } from "../helper/custommath";
import { toastAlert } from "../../lib/toast";
import isEmpty from "is-empty";
import {
  Cross2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  InfoCircledIcon,
  CheckIcon,
  CopyIcon,
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { Input } from "../components/ui/input";
import { useSelector } from "@/store";
import { useDispatch } from "react-redux";
import { userDeposit, addressCheck } from "@/services/wallet";
import { formatNumber } from "../helper/custommath";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Transaction,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { AnchorProvider, Program, web3, BN } from "@project-serum/anchor";
import {
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { reset } from "@/store/slices/auth/userSlice";
import { signOut } from "@/store/slices/auth/sessionSlice";
import OpenOrders from "./OpenOrders";
import Positions from "./Positions";
import History from "./History";
import { Footer } from "../components/customComponents/Footer";
import { setWalletConnect } from "@/store/slices/walletconnect/walletSlice";
import { PnLFormatted } from "@/utils/helpers";
import { getWalletSettings, getCoinList } from "@/services/user";
import depositIDL from "../../components/IDL/DEPOSITIDL.json";
import Withdraw from "./withdraw";
import { getUserPnL } from "@/services/portfolio";
import { NavigationBar } from "@/app/components/ui/navigation-menu";
import { getCategories } from "@/services/market";
import { trunc } from "@/lib/roundOf";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/app/components/ui/tooltip";

let initialValue = {
  currency: "",
  minDeposit: "",
  amount: "",
  walletAddress: "",
};

export default function PortfolioPage({ categories }) {
  const programID = new PublicKey(config?.programID);
  const connection = new Connection(config?.rpcUrl, "confirmed");
  const PYTH_PRICE_ACCOUNT = new PublicKey(config?.PYTH_PRICE_ACCOUNT);

  const { isConnected, address } = useSelector(
    (state) => state?.walletconnect?.walletconnect
  );
  const walletData = useSelector((state) => state?.wallet?.data);
  const data = useSelector((state) => state?.auth?.user);

  const [open, setOpen] = useState(false);
  const [check, setCheck] = useState(false);
  const [step, setStep] = useState("");
  const wallet = address;
  const [balance, setBalance] = useState(0);
  const [tokenbalance, setTokenBalance] = useState(0);
  const [currentTab, setCurrentTab] = useState("positions");
  const [depositData, setDepositData] = useState(initialValue);
  const [depsoitAmt, setDepositAmt] = useState(0);
  const [loader, setloader] = useState(false);
  const [txopen, setTxOpen] = useState(false);
  const [transactionHash, settransactionHash] = useState("");
  const [tokenValue, setTokenValue] = useState(0);
  const [profitAmount, setProfitAmount] = useState(0);
  const [coin, setCoin] = useState([]);
  const [walletsetting, setWalletsetting] = useState({});
  const [interval, setInterval] = useState("1m");
  const [copied, setCopied] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [selectCategory, setSelectedCategory] = useState("all");
  const [navigationItems, setNavigationItems] = useState([]);
  const [todayReal, setTodayReal] = useState(0);

  const PRIORITY_FEES = {
    low: 5000,
    medium: 30000,
    high: 75000,
  };

  const router = useRouter();
  const dispatch = useDispatch();
  const [profileData, setProfileData] = useState({
    username: "",
    avatar_url: "",
    bio: "",
  });
  const [gasAmt, setGasAmt] = useState({ gasCost: 0, marketGasCost: 0 });

  var { currency, amount, minDeposit } = depositData;

  const getPnl = useCallback(async () => {
    try {
      const { success, result } = await getUserPnL(interval);

      if (success) {
        setProfitAmount(result?.totalPnl / 100);
      console.log("success,result", success, result);
        setTodayReal(result?.totalPnl / 100);
      }
    } catch (err) {
      console.log(err, "errr")
      console.log(err, "errrr")
      console.log(err, "ererrrr")
      console.log(err, "errerr")
      console.log("error ", err)
      console.log(err, "err");

    }
  }, [interval]);

  useEffect(() => {
    getPnl();
  }, [walletData, interval, getPnl]);

  useEffect(() => {
    if (!wallet) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile?wallet=${wallet}`);
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error("Error fetching profile in portfolio:", err);
      }
    };
    fetchProfile();
  }, [wallet]);

  const balanceData = useCallback(async () => {
    try {
      if (address) {
        const publicKey = new PublicKey(address);
        const balanceLamports = await connection.getBalance(publicKey);
        console.log(balanceSOL, balanceLamports, "balanceSOLbalanceSOL");
        const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;
        const formattedBalance = formatNumber(balanceSOL, 4);
        setBalance(formattedBalance);

        const mint = new PublicKey(config?.tokenMint);
        const walletAddress = new PublicKey(address);
        const ata = await getAssociatedTokenAddress(mint, walletAddress);
        if (ata) {
          const tokenAccount = await getAccount(connection, ata);
          if (tokenAccount) {
            const rawBalance = parseFloat(tokenAccount?.amount) / 10 ** 6;

            const formattedBalance1 = formatNumber(rawBalance, 4);
            setTokenBalance(formattedBalance1);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching POL balance:", err);
    }
  }, [address, connection, config?.tokenMint]);

  async function disconnectWallet() {
    if (window.solana && window.solana.isPhantom) {
      window.solana.disconnect();
      dispatch(
        setWalletConnect({
          isConnected: false,
          address: "",
          network: "",
          type: "",
          rpc: "",
          balance: 0,
        })
      );
    }
  }

  async function ConnectPhantomWallet() {
    if (window.solana && window.solana.isPhantom) {
      try {
        if (window.solana.isConnected) {
          await window.solana.disconnect();
        }
        const response = await window.solana.connect({ onlyIfTrusted: false });

        const connection = new Connection(config?.rpcUrl);

        const publicKey = new PublicKey(response.publicKey.toString());
        const balanceLamports = await connection.getBalance(publicKey);
        const balanceSOL = balanceLamports / 1e9;

        const connectedAddress = response.publicKey.toString();

        const { result } = await addressCheck({ address: connectedAddress });

        if (isEmpty(data?.walletAddress) && result === true) {
          toastAlert(
            "error",
            `This address is already exists. Please connect another new address.`,
            "wallet"
          );
          setOpen(false);
          disconnectWallet();
          return;
        } else if (
          !isEmpty(data?.walletAddress) &&
          connectedAddress?.toLowerCase() !== data?.walletAddress?.toLowerCase()
        ) {
          toastAlert(
            "error",
            `Please connect your wallet address ${data?.walletAddress}`,
            "logout"
          );
          setOpen(false);
          disconnectWallet();
          return;
        }

        dispatch(
          setWalletConnect({
            isConnected: true,
            address: response.publicKey.toString(),
            network: config.network,
            type: config.networkType,
            rpc: config?.rpcUrl,
            balance: balanceSOL,
          })
        );
        setOpen(false);
        getAddress();
        toastAlert("success", "Wallet Connected successfully!!", "wallet");
        setCheck(true)
      } catch (err) {

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
            balance: 0,
          })
        );
        toastAlert("error", "Failed to connect wallet", "wallet");
      }
    } else {
      toastAlert("error", "Phantom wallet extension is not installed", "error");
    }
  }

  const getWalletSettingsData = async () => {
    try {
      let respData = await getWalletSettings();
      if (respData.success) {
        setWalletsetting(respData?.result);
      }
    } catch (error) {
      console.error("Error getting wallet settings:", error);
    }
  };

  const getCoinData = async () => {
    try {
      let respData = await getCoinList();
      if (respData.success) {
        setCoin(respData?.result);
        setDepositData((prev) => ({
          ...prev,
          currency: respData?.result?.[0]?.symbol,
          minDeposit: respData?.result?.[0]?.minDeposit,
        }));
        const solCoin = respData.result.find((c) => c.symbol === "SOL");
        if (solCoin && solCoin.cnvPrice) {
          setTokenValue(solCoin.cnvPrice);
        }
      }
    } catch (error) {
      console.error("Error getting coin list:", error);
    }
  };

  useEffect(() => {
    getWalletSettingsData();
    getCoinData();
  }, []);

  const getSolanaTxFee = async () => {
    const publicKey = new PublicKey(address);
    const messageV0 = new TransactionMessage({
      payerKey: publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      instructions: [], // no actual instructions
    }).compileToV0Message();

    const feeInLamports = await connection.getFeeForMessage(messageV0);
    let feeInSol = feeInLamports?.value / 1e9;
    if (!isEmpty(walletsetting?.priority)) {
      const microLamports = PRIORITY_FEES[walletsetting?.priority];
      const priorityFeeSol = microLamports / 1e9;
        console.log(walletsetting?.priority, "priority")
        console.log(priorityFeeSol, "priorityFeeSol")

      feeInSol = feeInSol + priorityFeeSol;
    }
    const feeInUSD = feeInSol * tokenValue;
    setGasAmt({ gasCost: feeInSol, marketGasCost: feeInUSD });
  };

  const getAddress = async (address) => {
    try {
      const { result } = await addressCheck({ address });
      if (isEmpty(data?.walletAddress) && result === true) {
        toastAlert(
          "error",
          `This address is already exists. Please connect another address.`,
          "wallet"
        );
        disconnect();
      } else if (
        (!isEmpty(data?.walletAddress) && result === true) ||
        (!isEmpty(data?.walletAddress) &&
          data?.walletAddress.toString() !== address?.toString() &&
          isConnected)
      ) {
        toastAlert(
          "error",
          `Please connect your wallet address ${data?.walletAddress}`,
          "wallet"
        );
        disconnect();
      } else if (
        (!isEmpty(data?.walletAddress) && result === false) ||
        (isEmpty(data?.walletAddress) && result === false)
      ) {
        return;
      }
    } catch (error) {
      console.error("Error in getAddress:", error);
    }
  };

  useEffect(() => {
    balanceData();
  }, [address, balanceData]);

  var step2Click = () => {
    if (!isEmpty(currency)) {
      setStep("2");
      setDepositAmt();
      getSolanaTxFee();
      if (currency === "USDC" && tokenbalance === 0) {
        setStep("1");
        toastAlert("error", "Insufficient Balance", "wallet");
      } else if (currency === "SOL" && balance === 0) {
        setStep("1");
        toastAlert("error", "Insufficient Balance", "wallet");
      } else if (balance <= 0) {
        setStep("1");
        toastAlert("error", "Insufficient SOL Balance", "wallet");
      }
    } else {
      toastAlert("error", "Please select a currency", "wallet");
    }
  };

  var step3Click = () => {
    try {
      var depositBalance = currency === "USDC" ? tokenbalance : balance;
      if (depositBalance > 0) {
        if (isEmpty(depsoitAmt)) {
          toastAlert("error", "Enter the amount", "deposit");
        } else if (depsoitAmt < minDeposit) {
          toastAlert(
            "error",
            `Enter an amount greater than or equal to the minimum deposit amount.`,
            "deposit"
          );
        } else if (depsoitAmt > depositBalance) {
          toastAlert("error", "Insufficient Balance", "deposit");
        } else if (balance <= 0.001) {
          toastAlert("error", "Your SOL balance is too low to pay the required transaction fee. Please add more SOL to proceed.", "wallet");
        } else if (depsoitAmt > 0) {
          setStep("3");
          getSolanaTxFee();
        }
      } else if (depositBalance <= 0) {
        toastAlert("error", "Insufficient Balance", "deposit");
      }
    } catch (err) {

    }
  };

  const balanceChange = (value) => {
    if (currency === "USDC") {
      setDepositAmt(formatNumber(tokenbalance * (value / 100), 4));
    } else if (currency === "SOL" && value === 100) {
      setDepositAmt(
        Math.max(
          formatNumber(balance * (value / 100), 4) - 0.001,
          0
        )
      );
      if (balance <= 0.001) {
        toastAlert("error", "Your SOL balance is too low to pay the required transaction fee. Please add more SOL to proceed.", "wallet");
      }
    } else {
      setDepositAmt(formatNumber(balance * (value / 100), 4));
    }
  };

  async function disconnect() {
    disconnectWallet();
  }

  const getAnchorProvider = async () => {
    const provider = window.solana;

    if (!provider || !provider.isPhantom) {
      throw new Error("Phantom wallet not found");
    }

    return new AnchorProvider(
      connection,
      {
        publicKey: new PublicKey(address),
        signTransaction: provider.signTransaction,
        signAllTransactions: provider.signAllTransactions,
      },
      { preflightCommitment: "processed" }
    );
  };

  async function buy() {
    try {
      setloader(true);
      if (currency === "USDC") {

        const provider = await getAnchorProvider();
        const program = new Program(depositIDL, programID, provider);
        const connection = provider.connection;
        console.log("USDCUSDC")

        const mint = new PublicKey(config?.tokenMint);
        const receiverPubKey = new PublicKey(config?.adminAdd);

        const fromTokenAccount = await getAssociatedTokenAddress(
          mint,
          provider.publicKey
        );
        const toTokenAccount = await getAssociatedTokenAddress(
          mint,
          receiverPubKey
        );

        try {
          await getAccount(connection, toTokenAccount);
        } catch (err) {

          const ataIx = createAssociatedTokenAccountInstruction(
            provider.publicKey, // payer
            toTokenAccount, // ATA to create
            receiverPubKey, // token account owner
            mint // mint address
          );

          const ataTx = new Transaction().add(ataIx);
          ataTx.feePayer = provider.publicKey;

          const blockhash = await connection.getLatestBlockhash();
          ataTx.recentBlockhash = blockhash.blockhash;

          const signedTx = await window.solana.signTransaction(ataTx);
          const ataTxSig = await connection.sendRawTransaction(
            signedTx.serialize()
          );

          await connection.confirmTransaction(
            { signature: ataTxSig, ...blockhash },
            "finalized"
          );
        }

        // Optional: small delay to avoid race condition
        await new Promise((res) => setTimeout(res, 500));

const amount = new BN(parseFloat(depsoitAmt) * 10 ** 6);

        const [tokenInfoPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("supported-token"), mint.toBuffer()],
          program.programId
        );

        const [statePDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("state")],
          program.programId
        );

        const [userDepositPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("user"), provider.publicKey.toBuffer()],
          program.programId
        );
        let tx = "";
        if (!isEmpty(walletsetting?.priority)) {
          const microLamports = PRIORITY_FEES[walletsetting?.priority];
          const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
            units: 400_000,
          });
          const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports,
          });

          tx = await program.methods
            .transferToken(amount)
            .accounts({
              from: fromTokenAccount,
              to: toTokenAccount,
              authority: provider.publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
              mint: mint,
              tokenInfo: tokenInfoPDA,
              state: statePDA,
              userDeposit: userDepositPDA,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([computeUnitLimitIx, priorityFeeIx]) // ✅ Add here
            .rpc({ skipPreflight: false });
        } else {
          tx = await program.methods
            .transferToken(amount)
            .accounts({
              from: fromTokenAccount,
              to: toTokenAccount,
              authority: provider.publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
              mint: mint,
              tokenInfo: tokenInfoPDA,
              state: statePDA,
              userDeposit: userDepositPDA,
              systemProgram: web3.SystemProgram.programId,
            })
            .rpc({ skipPreflight: false });

        }

        settransactionHash(tx);
        console.log(tx, "dataaaaatxxxx")
        setloader(true);

        const parsedTx = await connection.getParsedTransaction(tx, {
          commitment: "confirmed",
        });

        if (!parsedTx) {
          toastAlert("error", "Transaction not found", "deposit");
          return;
        }

        const { meta, transaction } = parsedTx;

        // Get all token balance changes
        const preTokenBalances = meta?.preTokenBalances || [];
        const postTokenBalances = meta?.postTokenBalances || [];
        let depositdata = {};

        // Loop through and compare
        for (let i = 0; i < preTokenBalances.length; i++) {
          const pre = preTokenBalances[0];
          const post = postTokenBalances[0];

          if (!pre || !post) continue;

          const change =
            Number(post.uiTokenAmount.amount) -
            Number(pre.uiTokenAmount.amount);
          if (change !== 0) {

            const tokenAmt =
              Math.abs(change) / 10 ** pre.uiTokenAmount.decimals;
            depositdata = {
              hash: tx,
              from: provider.publicKey.toBase58(),
              to: config?.adminAdd.toString(),
              amount: tokenAmt,
              usdAmt: tokenAmt,
              symbol: "USDC",
            };

          }
        }

        console.log(depositdata, "depositdata")
        var { message, status } = await userDeposit(depositdata, dispatch);
        if (status) {
          toastAlert("success", message, "deposit");
          console.log(depositdata, "depositdata")
          setDepositAmt(0);
          setStep("");
          setTxOpen(true);
          const button = document.querySelector(".modal_close_brn");
          if (button) {
            button.click();
          }
        } else {
          toastAlert("error", "failed", "deposit");
          const button = document.querySelector(".modal_close_brn");
          if (button) {
            button.click();
          }
        }
        setloader(false);
      } else if (currency === "SOL") {
        const provider = await getAnchorProvider();

        const program = new Program(depositIDL, programID, provider);
        const lamports = new BN(parseFloat(depsoitAmt) * web3.LAMPORTS_PER_SOL);
        const receiverPubKey = new PublicKey(config?.adminAdd);
        console.log(provider.publicKey.toBase58());

        // Derive PDAs
        const [statePDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("state")],
          program.programId
        );

        const [userDepositPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("user"), provider.publicKey.toBuffer()],
          program.programId
        );
        let tx = "";
        if (!isEmpty(walletsetting?.priority)) {
          const microLamports = PRIORITY_FEES[walletsetting?.priority]; // 0.00002 SOL tip
          const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
            units: 400_000,
          });
          const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports,
          });

          // ✅ Call the transferSol method
          tx = await program.methods
            .transferSol(lamports)
            .accounts({
              sender: provider.publicKey,
              receiver: receiverPubKey,
              systemProgram: web3.SystemProgram.programId,
              state: statePDA,
              userDeposit: userDepositPDA,
              pythPriceAccount: PYTH_PRICE_ACCOUNT,
            })
            .preInstructions([computeUnitLimitIx, priorityFeeIx]) // ✅ Add here
            .rpc({ skipPreflight: false });
        } else {

          tx = await program.methods
            .transferSol(lamports)
            .accounts({
              sender: provider.publicKey,
              receiver: receiverPubKey,
              systemProgram: web3.SystemProgram.programId,
              state: statePDA,
              userDeposit: userDepositPDA,
              pythPriceAccount: PYTH_PRICE_ACCOUNT,
            })
            .rpc({ skipPreflight: false });
        }

        settransactionHash(tx);
        setloader(true);

        const txDetails = await connection.getTransaction(tx, {
          commitment: "confirmed",
        });

        if (!txDetails) {
          console.error("❌ Transaction not found");
          return;
        }

        const { meta, transaction } = txDetails;
        const accountKeys = transaction.message.accountKeys;

        // 🔍 Find sender and receiver indices
        const senderIndex = accountKeys.findIndex((key) =>
          key.equals(provider.publicKey)
        );
        const receiverIndex = accountKeys.findIndex((key) =>
          key.equals(receiverPubKey)
        );

        if (senderIndex === -1 || receiverIndex === -1) {
          console.error("❌ Could not find sender or receiver in account keys");
          return;
        }

        // 🧮 Calculate lamports sent
        const lamportsSentTotal =
          meta.preBalances[senderIndex] - meta.postBalances[senderIndex];
        const feePaid = meta.fee;
        const lamportsSent = lamportsSentTotal - feePaid;

        const solAmt = lamports / LAMPORTS_PER_SOL;
        const usdValue = formatNumber(solAmt * tokenValue, 6);







        let depositdata = {
          hash: tx,
          from: provider.publicKey.toBase58(),
          to: receiverPubKey.toBase58(),
          amount: solAmt,
          usdAmt: usdValue,
          symbol: "SOL",
        };
        var { message, status } = await userDeposit(depositdata, dispatch);
        if (status) {
          toastAlert("success", message, "deposit");
          setDepositAmt(0);
          setStep("");
          setTxOpen(true);
          const button = document.querySelector(".modal_close_brn");
          if (button) {
            button.click();
          }
        } else {
          toastAlert("error", message, "deposit");
          const button = document.querySelector(".modal_close_brn");
          if (button) {
            button.click();
          }
        }
        setloader(false);
      }
    } catch (err) {

      setloader(false);
      const button = document.querySelector(".modal_close_brn");
      if (button) {
        button.click();
      }
    }
  }

  const handlechange = async (e) => {
    let value = e.target.value;
    setDepositAmt(parseFloat(e.target.value));
    //   }
    // }
  };

  const iniDepsotClick = () => {
    if (isConnected === true) {
      setStep("1");
      setDepositAmt(0);
      balanceData();
      getSolanaTxFee();
      setTxOpen(false);
      getCoinData();
      setCheck(false)
      setloader(false);
    } else if (
      !isEmpty(data?.walletAddress) &&
      data?.walletAddress.toString() !== address?.toString() &&
      isConnected
    ) {
      toastAlert(
        "error",
        `Please connect your wallet address ${data?.walletAddress}`,
        "wallet"
      );
    } else {
      setOpen(true)
    }
  };
  const leftPNLPercent = trunc((walletData.pnl1D / (walletData?.balance + walletData?.position)) * 100, 2)
  const todayRealPercent = trunc((todayReal / profitAmount) * 100, 2)
  return (
    <>
      <div className="px-0 pb-20 sm:px-0 text-white bg-black h-auto items-center justify-items-center p-0 m-0">
      <div className="fixed top-0 left-0 z-50 w-full backdrop-blur-md bg-black/80 border-b border-[#222]" style={{ borderBottomWidth: '1px' }}>
        <Header />
        <NavigationBar
          menuItems={categories}
          showLiveTag={true}
          setSelectedCategory={setSelectedCategory}
          selectedCategory={selectCategory}
        />
      </div>
      {/* Spacer to prevent content from being hidden behind the fixed header/navbar */}
      <div
        className="lg:mb-4 mb-0"
        style={{
          height: typeof window !== 'undefined' && window.innerWidth < 1024 ? '95px' : '112px',
          minHeight: typeof window !== 'undefined' && window.innerWidth < 1024 ? '95px' : '112px',
          width: '100%'
        }}
      />
        <div className="px-1.5 sm:px-0 container mx-auto pb-0 sm:pb-4 container-sm">
          <div className="flex justify-end sm:mb-2 mb-0 sm:mt-2 mt-4">
            {isConnected ? (
              <>
                <Button className="mr-2">{shortText(address)}</Button>
                <Button 
                variant="outline"
                className="ml-auto min-w-[95px] text-[12px] sm:text-sm max-h-8 sm:max-h-12 px-4"
                onClick={() => disconnect()}>Disconnect</Button>
                
              </>
            ) : (
              <Button 
              variant='default'
              className="ml-auto min-w-[95px] text-[12px] sm:text-sm max-h-8 sm:max-h-12 px-4"
              onClick={() => setOpen(true)}>Connect Wallet</Button>
            )}
          </div>
          {}
          <br></br>
          {/* 2. Key metrics card area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-4 gap-2 sm:mb-6 mb-4">
            <div
              className="flex-1 pl-3 pr-3 pt-3 pb-3 sm:pl-4 sm:pr-4 sm:pt-4 sm:pb-4 bg-black rounded-lg p-4 border relative"
              style={{ boxShadow: "0 2px 6px 0 rgba(220,220,255,0.13)" }}
            >
              <div className="absolute sm:top-4 sm:right-4 top-3 right-3 bg-[#051505] text-green-400 text-xs px-2 py-1 rounded-md border border-green-400 flex items-center">
                <Image
                  src="/images/cash.png"
                  alt="cash"
                  width={16}
                  height={16}
                  className="mr-1"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-pointer">
                        {walletData?.balance
                          ? PnLFormatted(
                            formatNumber(
                              walletData?.balance - walletData?.locked,
                              2
                            )
                          )
                          : 0}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="text-xs"
                    >
                      Available Balance
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex flex-col items-left">
                  <span className="text-sm text-gray-500 mt-0">PORTFOLIO</span>
                  <span className="sm:mt-2 mt-0 sm:text-3xl text-2xl font-semibold">
                    {walletData?.balance
?
                      PnLFormatted(
                        formatNumber(
                          walletData?.balance + walletData?.position,
                          2
                        )
                      )
                      : 0}
                  </span>
                  <span className="text-sm text-gray-500 mt-1">
                    <span className={walletData.pnl1D >= 0 ? "text-green-500" : "text-red-500"}>{walletData.pnl1D < 0 && "-"}${Math.abs(trunc(walletData.pnl1D, 2))}
                      {" "}
                      <span className={leftPNLPercent >= 0 ? "text-green-500" : "text-red-500"}>({trunc(leftPNLPercent, 2)}%)</span>
                    </span> Today
                  </span>
                </div>
              </div>
              <div
                className="pb-0 mt-3"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div
                  className="text-[12px]"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "48.5%",
                  }}
                >
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <Button
                        onClick={() => iniDepsotClick()}
                        className="w-full flex-1 max-h-9 sm:max-h-10 px-4 gap-0 pr-0 rounded-md border border-white bg-white text-black hover:bg-gray-300 hover:border-gray-300 transition-colors duration-300 sm:text-sm text-[13px] font-medium flex items-center justify-center"
                      >
                        <span className="mr-1 text-[13px] sm:text-lg">+</span>
                        Deposit
                      </Button>
                    </Dialog.Trigger>
                    {isConnected === true && txopen === false && check === false && (
                      <Dialog.Portal>
                        <Dialog.Overlay className="DialogOverlay" />
                        <Dialog.Content className="DialogContent">
                          {(step === "1" || step === "2" || step === "3") && (
                            <Dialog.Title className="DialogTitle">
                              Deposit
                            </Dialog.Title>
                          )}
                          {(step === "1" || step === "2" || step === "3") && (
                            <p className="text-center text-[12px] text-gray-400 mb-0">
                              Available Balance:{" "}
                              {currency === "USDC"
                                ? `${tokenbalance} ${currency}`
                                : `${balance} ${currency ? currency : "SOL"}`}
                              {}
                            </p>
                          )}
                          {step === "1" && (
                            <div className="deposit_step deposit_step1">
                              {/* Wallet Info Button */}
                              <Button className="mt-4 w-full google_btn flex-col items-start">
                                <p className="text-[12px] text-gray-400 mb-0">
                                  Deposit from
                                </p>
                                <div className="flex items-center gap-2">
                                  <Image
                                    src="/images/wallet_icon_02.png"
                                    alt="Profile Icon"
                                    width={16}
                                    height={16}
                                    className="rounded-full"
                                  />
                                  <span
                                    className="text-[14px] text-gray-200"
                                    onClick={async () => {
                                      await navigator.clipboard.writeText(
                                        address
                                      );
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 1000);
                                    }}
                                  >
                                    Wallet {shortText(address)}
                                    {copied && (
                                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-xs text-white bg-black px-2 py-0.5 rounded shadow">
                                        Copied!
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[13px] text-gray-400">
                                    {/* $10.20 */}
                                    {balance} SOL
                                  </span>
                                </div>
                              </Button>
                              {coin &&
                                coin.length > 0 &&
                                coin.map((value, i) => {
                                  const isSelected =
                                    depositData.currency === value?.symbol;
                                  const tokenIcon =
                                    value?.symbol === "USDC"
                                      ? "/images/usdc.svg"
                                      : "/images/solana.png";
                                  const tokenAmount =
                                    value?.symbol === "USDC"
                                      ? tokenbalance
                                      : balance;
                                  const tokenValueUSD =
                                    value?.symbol === "USDC"
                                      ? tokenbalance
                                      : formatNumber(balance * tokenValue, 4);

                                  return (
                                    <div key={i} className="wallet_coin_list">
                                      <div
                                        className={`flex items-center justify-between my-3 border px-3 py-1 rounded cursor-pointer transition ${isSelected
                                          ? "border-[#4f99ff] bg-[#1a1a1a]"
                                          : "border-[#3d3d3d] hover:bg-[#1e1e1e]"
                                          }`}
                                        onClick={() =>
                                          setDepositData((prev) => ({
                                            ...prev,
                                            currency: value?.symbol,
                                            minDeposit: value?.minDeposit,
                                          }))
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <Image
                                            src={
                                              isEmpty(value?.image)
                                                ? tokenIcon
                                                : value?.image
                                            }
                                            alt={`${value?.symbol} Icon`}
                                            width={24}
                                            height={24}
                                            className="rounded-full"
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-[14px]">
                                              {value?.symbol}
                                            </span>
                                            <span className="text-[12px] text-gray-400">
                                              {tokenAmount} {value?.symbol}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-[14px]">
                                          ${tokenValueUSD}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              <Button
                                className="mt-4 w-full"
                                onClick={() => step2Click()}
                              >
                                Continue
                              </Button>
                            </div>
                          )}
                          {step === "2" && (
                            <div className="deposit_step deposit_step1">
                              {/* Deposit Form Step 2 */}
                              <Button
                                className="rounded-full p-0 h-8 w-8 absolute -top-12"
                                onClick={() => setStep("1")}
                              >
                                <ChevronLeftIcon />
                              </Button>
                              <input
                                className="wallet_inp focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                type="number"
                                onChange={handlechange}
                                value={depsoitAmt}
                                placeholder="0"
                              />
                              <div className="flex gap-3 justify-between mt-4 sm:flex-nowrap flex-wrap">
                                <Button
                                  className="w-full h-13 bg-[#1e1e1e] border border-[#3d3d3d] hover:bg-[#333] text-[#efefef]"
                                  onClick={() => balanceChange(25)}
                                >
                                  25%
                                </Button>
                                <Button
                                  className="w-full h-13 bg-[#1e1e1e] border border-[#3d3d3d] hover:bg-[#333] text-[#efefef]"
                                  onClick={() => balanceChange(50)}
                                >
                                  50%
                                </Button>
                                <Button
                                  className="w-full h-13 bg-[#1e1e1e] border border-[#3d3d3d] hover:bg-[#333] text-[#efefef]"
                                  onClick={() => balanceChange(75)}
                                >
                                  75%
                                </Button>
                                <Button
                                  className="w-full h-13 bg-[#1e1e1e] border border-[#3d3d3d] hover:bg-[#333] text-[#efefef]"
                                  onClick={() => balanceChange(100)}
                                >
                                  Max
                                </Button>
                              </div>
                              <p className="text-[12px] text-gray-400 text-center mt-8">
                                {`${minDeposit} ${currency} minimum deposit`}
                                {}
                              </p>
                              <div
                                className="flex gap-3 items-center justify-between sm:flex-nowrap flex-wrap py-3 px-4 border border-[#3d3d3d] rounded-full sm:w-[60%] w-[100%] m-auto mt-3
                          "
                              >
                                <div className="flex items-center gap-2">
                                  <Image
                                    src={
                                      currency === "USDC"
                                        ? "/images/usdc.svg"
                                        : "/images/solana.png"
                                    }
                                    alt="Icon"
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-[12px] text-gray-400">
                                      You Sent
                                    </span>
                                    <span className="text-[14px]">
                                      {currency}
                                    </span>
                                  </div>
                                </div>
                                <Image
                                  src="/images/arrow_icon.png"
                                  alt="Icon"
                                  width={16}
                                  height={16}
                                />
                                <div className="flex items-center gap-2">
                                  <Image
                                    src="/images/usdc.svg"
                                    alt="Icon"
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-[12px] text-gray-400">
                                      You Receive
                                    </span>
                                    <span className="text-[14px]">USDC</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                className="mt-4 w-full"
                                onClick={() => step3Click()}
                              >
                                Continue
                              </Button>
                            </div>
                          )}
                          {step === "3" && (
                            <div className="deposit_step deposit_step1">
                              {/* Deposit Form Step 3 */}
                              <Button
                                className="rounded-full p-0 h-8 w-8 absolute -top-12"
                                onClick={() => setStep("2")}
                              >
                                <ChevronLeftIcon />
                              </Button>
                              <div className="wallet_countdown_panel">
                                <CountdownCircleTimer
                                  isPlaying
                                  duration={60}
                                  colors={[
                                    "#3b82f6",
                                    "#F7B801",
                                    "#A30000",
                                    "#A30000",
                                  ]}
                                  colorsTime={[30, 15, 10, 0]}
                                  size={30}
                                  strokeWidth={1.5}
                                  trailStrokeWidth={1.5}
                                  onComplete={() => {

                                    setStep("");
                                    console.log("Timer completed!");
                                    const button =
                                      document.querySelector(
                                        ".modal_close_brn"
                                      );
                                    if (button) {
                                      button.click();
                                    }
                                  }}
                                >
                                  {({ remainingTime }) => (
                                    <span className="text-[12px]">
                                      {remainingTime}
                                    </span>
                                  )}
                                </CountdownCircleTimer>
                              </div>
                              <p className="text-4xl text-[#efefef] text-center font-semibold pt-5 pb-2">
                                {depsoitAmt ? depsoitAmt : 0}{" "}
                                {currency ? currency : ""}
                              </p>
                              <div className="flex gap-2 items-center justify-between py-3 border-b border-[#302f2f] mt-4">
                                <span className="text-[14px] text-gray-400">
                                  Source
                                </span>
                                <div className="flex gap-2 items-center">
                                  <Image
                                    src="/images/wallet_icon_02.png"
                                    alt="Icon"
                                    width={18}
                                    height={18}
                                  />
                                  <span className="text-[14px] text-gray-200">
                                    Wallet {shortText(address)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 items-center justify-between py-3 border-b border-[#302f2f]">
                                <span className="text-[14px] text-gray-400">
                                  Destination
                                </span>
                                <span className="text-[14px] text-gray-200">
                                  Sonotrade Wallet
                                </span>
                              </div>
                              <div className="flex gap-2 items-center justify-between py-3 border-b border-[#302f2f]">
                                <span className="text-[14px] text-gray-400">
                                  Estimated time
                                </span>
                                <span className="text-[14px] text-gray-200">
                                  Less than 1 min
                                </span>
                              </div>
                              <div className="flex gap-2 items-center justify-between py-3 border-b border-[#302f2f]">
                                <span className="text-[14px] text-gray-400">
                                  You send
                                </span>
                                <div className="flex gap-2 items-center">
                                  <Image
                                    src={
                                      currency === "USDC"
                                        ? "/images/usdc.svg"
                                        : "/images/solana.png"
                                    }
                                    alt="Icon"
                                    width={18}
                                    height={18}
                                  />
                                  <span className="text-[14px] text-gray-200">
                                    {depsoitAmt ? depsoitAmt : 0}{" "}
                                    {currency ? currency : ""}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 items-center justify-between py-3 border-b border-[#302f2f]">
                                <span className="text-[14px] text-gray-400">
                                  You receive
                                </span>
                                <div className="flex gap-2 items-center">
                                  <Image
                                    src="/images/usdc.svg"
                                    alt="Icon"
                                    width={18}
                                    height={18}
                                  />
                                  <span className="text-[14px] text-gray-200">
                                    {currency === "USDC"
                                      ? `${depsoitAmt} USDC`
                                      : `${formatNumber(
                                        depsoitAmt * tokenValue,
                                        4
                                      )} USDC`}
                                    {/* tokenAmt */}
                                  </span>
                                </div>
                              </div>

                              <Accordion.Root type="multiple">
                                <Accordion.Item value="item-1">
                                  <Accordion.Header>
                                    <Accordion.Trigger className="flex gap-2 items-center justify-between py-3 border-b border-[#302f2f] w-full">
                                      <span className="text-[14px] text-gray-400">
                                        Transaction breakdown
                                      </span>
                                      <div className="flex gap-2 items-center">
                                        <Image
                                          src="/images/gas_icon.png"
                                          alt="Icon"
                                          width={18}
                                          height={18}
                                        />
                                        <span className="text-[14px] text-gray-200">
                                          {gasAmt?.gasCost
                                            ? formatNumber(gasAmt?.gasCost, 6)
                                            : 0}{" "}
                                          SOL
                                        </span>
                                        <ChevronDownIcon
                                          className="AccordionChevron"
                                          aria-hidden
                                        />
                                      </div>
                                    </Accordion.Trigger>
                                  </Accordion.Header>
                                  <Accordion.Content>
                                    <div className="flex gap-2 items-center justify-between py-1">
                                      <span className="text-[13px] text-gray-400">
                                        Your gas costs
                                      </span>
                                      <span className="text-[13px] text-gray-200">
                                        {gasAmt?.gasCost
                                          ? formatNumber(gasAmt?.gasCost, 6)
                                          : 0}{" "}
                                        SOL
                                      </span>
                                    </div>

                                    <div className="flex gap-2 items-center justify-between py-1">
                                      <span className="text-[13px] text-gray-400">
                                        Market gas price
                                      </span>
                                      <span className="text-[13px] text-gray-200">
                                        $ {""}
                                        {gasAmt?.marketGasCost
                                          ? formatNumber(
                                            gasAmt?.marketGasCost,
                                            6
                                          )
                                          : 0}{" "}
                                        {/* Gwei */}
                                      </span>
                                    </div>
                                  </Accordion.Content>
                                </Accordion.Item>
                              </Accordion.Root>

                              <Button
                                className="mt-4 w-full"
                                disabled={loader}
                                onClick={() => buy()}
                              >
                                Confirm Order{" "}
                                {loader && (
                                  <i
                                    className="fas fa-spinner fa-spin ml-2"
                                    style={{ color: "black" }}
                                  ></i>
                                )}
                              </Button>
                              {/* )} */}
                            </div>
                          )}
                          <Dialog.Close asChild>
                            <button
                              className="modal_close_brn"
                              aria-label="Close"
                            >
                              <Cross2Icon />
                            </button>
                          </Dialog.Close>
                        </Dialog.Content>
                      </Dialog.Portal>
                    )}
                  </Dialog.Root>
                </div>

                <Dialog.Root open={txopen} onOpenChange={setTxOpen}>
                  <Dialog.Portal>
                    <Dialog.Overlay className="DialogOverlay fixed inset-0 bg-black/50 z-40" />
                    <Dialog.Content className="DialogContent fixed z-50 top-1/2 left-1/2 w-[90vw] max-w-md transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white p-6 rounded-2xl shadow-lg">
                      <Dialog.Title className="DialogTitle text-xl font-semibold text-center mb-4">
                        Transaction Completed
                      </Dialog.Title>

                      <div className="flex flex-col items-center text-center">
                        <svg
                          className="success"
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 130.2 130.2"
                          width="80"
                          height="80"
                        >
                          <circle
                            className="path circle"
                            fill="none"
                            stroke="#73AF55"
                            strokeWidth="6"
                            strokeMiterlimit="10"
                            cx="65.1"
                            cy="65.1"
                            r="62.1"
                          />
                          <polyline
                            className="path check"
                            fill="none"
                            stroke="#73AF55"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeMiterlimit="10"
                            points="100.2,40.2 51.5,88.8 29.8,67.5"
                          />
                        </svg>

                        {}

                        {transactionHash && (
                          <a
                            className="text-blue-500 hover:underline mt-4 flex items-center gap-2"
                            href={`${config?.txUrl}${transactionHash}?cluster=${config?.networkType}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fa fa-eye" aria-hidden="true"></i>
                            View Transaction
                          </a>
                        )}
                      </div>

                      <Dialog.Close asChild>
                        <button
                          className="modal_close_btn absolute top-4 right-4 text-white hover:text-gray-400"
                          aria-label="Close"
                        >
                          <Cross2Icon />
                        </button>
                      </Dialog.Close>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>

                <Withdraw />
              </div>
            </div>
            <div
              className="pl-3 pr-3 pt-3 pb-3 sm:pl-4 sm:pr-4 sm:pt-4 sm:pb-4 flex-1 bg-black rounded-lg p-4 flex flex-col justify-between border relative"
              style={{ boxShadow: "0 2px 6px 0 rgba(220,220,255,0.13)" }}
            >
              <div className="flex items-start justify-between flex-wrap">
                <div className="flex flex-col items-left">
                  <span className="text-sm text-gray-500 mt-0">
                    PROFIT/LOSS
                  </span>
                  <span
                    className={`sm:mt-2 mt-0 sm:text-3xl text-2xl font-semibold ${
                      profitAmount >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {PnLFormatted(formatNumber(profitAmount, 2))}
                  </span>
                    <span className="text-sm text-gray-500 mt-1">
                    <span className={todayReal >= 0 ? "text-green-500" : "text-red-500"}>{todayReal < 0 && "-"}${Math.abs(trunc(todayReal, 2))}
                      {" "}
                      <span className={todayRealPercent >= 0 ? "text-green-500" : "text-red-500"}>({trunc(todayRealPercent, 2)}%)</span>
                    </span> Today
                  </span>
                </div>
                <div className="justify-center items-center p-0 m-0 scale-90 sm:scale-100 origin-top-left sm:origin-center" style={{ minHeight: 0, minWidth: 0 }}>
                  <ChartIntervals
                    interval={interval}
                    setInterval={setInterval}
                    isAllDisable={true}
                  />
                </div>
              </div>
            </div>
             </div>

          {/* 3. Tab 与筛选区 */}
          {/* 3. Tab and filter area */}
          <Tabs
            defaultValue="positions"
            value={currentTab}
            onValueChange={setCurrentTab}
            className="sm:mb-2 mb-0"
          >
            <div className="flex justify-between items-center">
              <TabsList className="flex sm:space-x-2 space-x-0 w-full justify-start">
                <TabsTrigger className="sm:text-sm text-[13px]" value="positions">Positions</TabsTrigger>
                <TabsTrigger className="sm:text-sm text-[13px]" value="openorders">Open Orders</TabsTrigger>
                <TabsTrigger className="sm:text-sm text-[13px]" value="history">History</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="positions">

              <Positions uniqueId={data?.uniqueId} isPrivate={true} />
            </TabsContent>
            <TabsContent value="openorders">

              <OpenOrders />
            </TabsContent>
            <TabsContent value="history">

              <History />
            </TabsContent>
          </Tabs>
        </div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="DialogOverlay" />
            <Dialog.Content className="DialogContent">
              <Dialog.Title className="DialogTitle mb-4">
                Welcome to Sonotrade
              </Dialog.Title>
              <div className="flex gap-3 justify-between mt-4 sm:flex-nowrap flex-wrap">
                <Button
                  onClick={() => ConnectPhantomWallet()}
                className="rounded-[6px] w-full sm:h-13 h-10 bg-[#1e1e1e] border border-[#3d3d3d] hover:bg-[#333]"
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
      </div>
            <div className="hidden sm:block">
              <Footer />
            </div>
      <HeaderFixed />
    </>
  );
}
