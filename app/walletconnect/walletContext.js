"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from '@/store';
import { setWalletConnect } from '@/store/slices/walletconnect/walletSlice';

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
  
  // Get Redux wallet state - debug the entire state first
  const entireState = useSelector((state) => state);
  const reduxWalletState = useSelector((state) => state?.walletconnect);
  const dispatch = useDispatch();
  
  console.log("=== ENTIRE REDUX STATE ===");
  console.log("Entire state keys:", Object.keys(entireState || {}));
  console.log("Entire state:", entireState);

  // Sync wallet context with Redux state
  useEffect(() => {
    console.log("=== WALLET CONTEXT REDUX SYNC ===");
    console.log("reduxWalletState:", reduxWalletState);
    console.log("reduxWalletState keys:", reduxWalletState ? Object.keys(reduxWalletState) : 'null');
    
    // Fix: Access the actual wallet data - looks like it's nested under walletconnect
    const actualWalletData = reduxWalletState?.walletconnect || reduxWalletState;
    console.log("actualWalletData:", actualWalletData);
    console.log("actualWalletData.address:", actualWalletData?.address);
    console.log("actualWalletData.isConnected:", actualWalletData?.isConnected);
    
    if (actualWalletData) {
      console.log("=== SYNCING WALLET CONTEXT WITH REDUX ===");
      
      const newAddress = actualWalletData.address || null;
      const newIsConnected = actualWalletData.isConnected || false;
      
      console.log("Setting address to:", newAddress);
      console.log("Setting isConnected to:", newIsConnected);
      
      setAddress(newAddress);
      setIsConnected(newIsConnected);
      
      console.log("✅ Wallet context synced with Redux");
    } else {
      console.log("❌ No Redux wallet state to sync");
    }
  }, [reduxWalletState]);

  useEffect(() => {
    setIsMounted(true);

    // Check if there's an existing Phantom wallet connection
    if (typeof window !== 'undefined') {
      console.log("=== CHECKING FOR EXISTING PHANTOM CONNECTION ===");

      // Check if user manually disconnected (respect their choice)
      const manuallyDisconnected = localStorage.getItem('wallet_manually_disconnected') === 'true';
      console.log("Manually disconnected flag:", manuallyDisconnected);

      if (manuallyDisconnected) {
        console.log("🚫 User manually disconnected - skipping auto-connection");
        
        // If Phantom is still connected at the extension level, disconnect it
        if (window.solana && window.solana.isPhantom && window.solana.isConnected) {
          console.log("🔧 Phantom still connected at extension level - forcing disconnect");
          window.solana.disconnect().catch(err => {
            console.log("Note: Error forcing disconnect, but manual flag respected");
          });
        }
        
        return;
      }

      // Only check for Phantom wallet (Solana)
      if (window.solana && window.solana.isPhantom) {
        if (window.solana.isConnected) {
          const publicKey = window.solana.publicKey?.toString();
          if (publicKey) {
            console.log("Found existing Phantom connection:", publicKey);
            console.log("Setting wallet context state...");
            setAddress(publicKey);
            setIsConnected(true);
            
            // Also update Redux store if not already updated
            if (!reduxWalletState?.isConnected || reduxWalletState?.address !== publicKey) {
              dispatch(setWalletConnect({
                isConnected: true,
                address: publicKey,
                network: "solana-devnet",
                type: "phantom",
                rpc: "https://api.devnet.solana.com",
                balance: 0
              }));
            }
            
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
            
            // Update local state
            setAddress(publicKey);
            setIsConnected(true);
            
            // Update Redux store
            dispatch(setWalletConnect({
              isConnected: true,
              address: publicKey,
              network: "solana-devnet",
              type: "phantom",
              rpc: "https://api.devnet.solana.com",
              balance: 0
            }));
            
            console.log("Phantom connected:", publicKey);
            return publicKey;
          }
        }

        throw new Error("Phantom wallet not found");
      } catch (error) {
        console.error('Error connecting wallet:', error);
        throw error;
      }
    }
  };

  const disconnectWallet = async () => {
    console.log("=== DISCONNECTING WALLET ===");

    // Set manual disconnect flag
    if (typeof window !== 'undefined') {
      localStorage.setItem('wallet_manually_disconnected', 'true');
    }

    // Disconnect Phantom
    if (window.solana && window.solana.isPhantom) {
      try {
        await window.solana.disconnect();
        console.log("Phantom disconnected");
        
        // Additional cleanup for Phantom's internal state
        try {
          // Force disconnect again to ensure it's clean
          await window.solana.disconnect();
        } catch (extraDisconnectError) {
          // This is expected, just ensuring thorough cleanup
        }
      } catch (error) {
        console.error("Error disconnecting Phantom:", error);
      }
    }

    // Update local state
    setAddress(null);
    setIsConnected(false);
    
    // Update Redux store
    dispatch(setWalletConnect({
      isConnected: false,
      address: "",
      network: "",
      type: "",
      rpc: "",
      balance: 0
    }));
    
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