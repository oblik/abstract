"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

const WalletContext = createContext({
  address: null,
  isConnected: false,
  connectors: [],
  connectWallet: () => { },
  disconnectWallet: () => { },
});

export const WalletProvider = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if there's an existing Phantom wallet connection
    if (typeof window !== 'undefined') {
      console.log("=== CHECKING FOR EXISTING PHANTOM CONNECTION ===");

      // Only check for Phantom wallet (Solana)
      if (window.solana && window.solana.isPhantom) {
        if (window.solana.isConnected) {
          const publicKey = window.solana.publicKey?.toString();
          if (publicKey) {
            console.log("Found existing Phantom connection:", publicKey);
            console.log("Setting wallet context state...");
            setAddress(publicKey);
            setIsConnected(true);
            console.log("✅ Wallet context updated - address:", publicKey);
          } else {
            console.log("❌ Phantom connected but no public key");
          }
        } else {
          console.log("ℹ️  Phantom wallet not connected");
        }
      } else {
        console.log("❌ Phantom wallet not available");
      }
    }
  }, []);

  const connectWallet = async (connectorType) => {
    console.log("=== CONNECTING WALLET ===", connectorType);

    if (typeof window !== 'undefined') {
      try {
        // Only try Phantom wallet for Sonotrade
        if (window.solana && window.solana.isPhantom) {
          const response = await window.solana.connect();
          if (response.publicKey) {
            const publicKey = response.publicKey.toString();
            setAddress(publicKey);
            setIsConnected(true);
            console.log("Phantom connected:", publicKey);
            return;
          }
        }

        throw new Error("Phantom wallet not found");
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    }
  };

  const disconnectWallet = async () => {
    console.log("=== DISCONNECTING WALLET ===");

    // Disconnect Phantom
    if (window.solana && window.solana.isPhantom) {
      try {
        await window.solana.disconnect();
        console.log("Phantom disconnected");
      } catch (error) {
        console.error("Error disconnecting Phantom:", error);
      }
    }

    setAddress(null);
    setIsConnected(false);
    console.log("Wallet disconnection complete");
  };

  const value = {
    address,
    isConnected,
    connectors: [], // Empty for now, could add connector info later
    connectWallet,
    disconnectWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {isMounted ? children : null}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  // console.log(context,"contextcontextcontextcontext")
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }

  return context;
};