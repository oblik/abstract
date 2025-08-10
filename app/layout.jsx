import localFont from "next/font/local";
import "./globals.css";
import { WalletProvider } from "@/app/walletconnect/walletContext";
import SnackbarClient from "@/app/helper/SnackbarClient";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ToastContainer } from "react-toastify";
import { StoreProvider } from "@/providers/store-provider";
import ClientLayoutEffect from "./ClientLayoutEffect";

export const metadata = {
  title: "SONOTRADE",
  description: "The Music Stock Market",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Sonotrade</title>
        <meta name="description" content="The Music Stock Market" />
        <meta itemProp="name" content="Sonotrade" />
        <meta itemProp="description" content="The Music Stock Market" />
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <meta
          itemProp="image"
          content="https://www.sonotrade.co/images/SONOTRADE.png"
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>

      <body className={`antialiased`}>
        {/* Mobile: fixed header and nav as siblings, main content scrolls on body */}
        {typeof window !== 'undefined' && window.innerWidth <= 640 ? (
          <>
            {/* Top header - fixed at top */}
            {/* @ts-ignore */}
            {require('./Header').default()}
            {require('./NavigationBar').default()}
            {/* Main content - normal children, scrolls on body */}
            <div style={{ paddingTop: '3rem', paddingBottom: '4rem', minHeight: '100vh', boxSizing: 'border-box' }}>
              <StoreProvider>
                <SnackbarClient>
                 <ClientLayoutEffect />
                 {children}
                </SnackbarClient>
              </StoreProvider>
              <ToastContainer />
            </div>
            {/* Bottom nav - fixed at bottom */}
            {/* @ts-ignore */}

          </>
        ) : (
          <>
            <StoreProvider>
              <SnackbarClient>
               <ClientLayoutEffect />
               {children}
              </SnackbarClient>
            </StoreProvider>
            <ToastContainer />
          </>
        )}
      </body>
    </html>
  );
}
