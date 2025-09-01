# 🔍 **API ENDPOINT USAGE ANALYSIS**
## Which Environment Settings Each Component Actually Needs

---

## **🎯 CRITICAL FINDING: You're ABSOLUTELY RIGHT about the withdraw component!**

### **Withdraw Component Analysis:**

```javascript
// app/portfolio/withdraw.js
const walletData = useSelector(state => state?.wallet?.data);           // ✅ Platform balance
const { isConnected, address } = useSelector(state => state?.walletconnect?.walletconnect); // ✅ External wallet

// UI Button: "Use Connected Wallet"
onClick={() => {
    setWithdraw({ ...withdraw, ...{ userAddress: address ? address : "" } })
    if (!isEmpty(address)) {
        setError({ ...error, ...{ userAddress: "" } })
    }
}}

// withdrawRequest API call expects:
// data: { amount: number; address: string; currency: string }
```

**The withdraw component is CORRECTLY designed:**
1. **Platform Balance** (`state.wallet.data`) - Shows available funds to withdraw
2. **External Wallet Address** (`state.walletconnect.walletconnect.address`) - Destination for withdrawal
3. **"Use Connected Wallet" button** - Convenience feature to auto-fill the user's Phantom wallet address

**This is exactly how crypto withdrawals should work!** ✅

---

## **📊 API ENDPOINT USAGE BY SERVICE:**

### **🏆 SERVICES THAT USE getApiBaseUrl() (Need Environment Config):**

#### **1. services/user.ts - 22 Endpoints:**
```typescript
/api/v1/user/get-user
/api/v1/user/get-user/id/${cleanId}
/api/v1/user/user-trade-overview/id/${id}
/api/v1/user/user-trade-overview
/api/v1/user/update-user
/api/v1/user/position-history
/api/v1/user/trade-history/user/${id}
/api/v1/user/trade-history/${id}
/api/v1/user/info-cards
/api/v1/user/set-user-email-notification
/api/v1/user/set-in-app-notification
/api/v1/user/set-wallet-settings
/api/v1/user/get-wallet-settings
/api/v1/user/positions/event/${id}
/api/v1/user/open-orders/event/${id}
/api/v1/user/add-user-name
/api/v1/user/comments/${id}
/api/v1/user/current-value
/api/v1/user/transaction-history
/api/v1/user/get-coin-list
/api/v1/user/withdraw-request  // ← WITHDRAW USES THIS!
/api/v1/user/user-deposit      // ← DEPOSIT USES THIS!
```

#### **2. services/market.ts - 15 Endpoints:**
```typescript
/api/v1/events/paginate/${id}
/api/v1/events/search
/api/v1/events/category
/api/v1/events/market/${id}
/api/v1/order                  // ← TRADING ORDERS!
/api/v1/order/cancel/${id}
/api/v1/order/books/${id}
/api/v1/events/price-history/${id}
/api/v1/events/forecast-history/${id}
/api/v1/user/comments/event/${eventId}
/api/v1/user/comments/event/paginate/${eventId}
/api/v1/user/comments
/api/v1/user/comments/${commentId}
/api/v1/events/tags/${id}
/api/v1/events/series/event/${id}
/api/v1/order/claim-position/${id}
```

#### **3. services/auth.ts - 6 Endpoints:**
```typescript
/api/v1/user/register
/api/v1/user/google-sign
/api/v1/user/wallet-sign
/api/v1/user/email-verify
/api/v1/user/resend-otp
/api/v1/user/get-user
getFreeIpApiBaseUrl() → /api/json  // Uses separate IP API
```

#### **4. services/wallet.ts - 3 Endpoints:**
```typescript
/api/v1/user/user-deposit
/api/v1/user/address-check
/api/v1/user/withdraw-request
/api/v1/user/save-wallet-email
```

#### **5. services/portfolio.ts - 3 Endpoints:**
```typescript
/api/v1/user/positions/${id}
/api/v1/user/open-orders/${id}
/api/v1/user/closed-pnl/${id}
```

---

## **🌐 EXTERNAL API ENDPOINTS (No Environment Config Needed):**

### **Next.js API Routes (Internal):**
```typescript
// These use Next.js internal routing, no environment config needed:
/api/profile?wallet=${wallet}           // app/api/profile/route.ts
/api/event-data/price-history          // app/api/event-data/price-history/route.ts
/api/event-data/by-id                  // app/api/event-data/by-id/route.ts
/api/spotify/login                     // app/api/spotify/login/route.ts
/api/spotify/callback                  // app/api/spotify/callback/route.ts
/api/polygon/transactions              // app/api/polygon/transactions/route.ts
```

### **Direct External APIs:**
```typescript
// These bypass all environment configs:
https://clob.polymarket.com/books      // Polymarket API
https://accounts.spotify.com/api/token // Spotify OAuth
https://api.spotify.com/v1/me/top/artists // Spotify User Data
```

---

## **⚙️ CURRENT ENVIRONMENT CONFIG STATUS:**

### **✅ SERVICES WITH CORRECT PROXY USAGE:**
- **services/market.ts** ✅
- **services/wallet.ts** ✅ 
- **services/portfolio.ts** ✅

```typescript
function getApiBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return config.backendURL;  // Direct URL in production
  }
  return "";  // Proxy in development
}
```

### **❌ SERVICE WITH PROXY BYPASS ISSUE:**
- **services/user.ts** ❌

```typescript
function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production"
      ? config.backendURL
      : "https://sonotradesdemo.wearedev.team"; // ❌ BYPASSES PROXY IN SSR!
  }
  return process.env.NODE_ENV === "production" ? config.backendURL : "";
}
```

### **✅ SERVICE WITH SEPARATE API CONFIG:**
- **services/auth.ts** ✅

```typescript
function getFreeIpApiBaseUrl() {
  return process.env.NODE_ENV === "production"
    ? config.getLoginInfo  // "https://freeipapi.com/api/json"
    : "/freeipapi";        // Uses Next.js proxy
}
```

---

## **🔧 WHAT ACTUALLY NEEDS TO BE FIXED:**

### **1. user.ts Proxy Bypass (HIGH PRIORITY):**
```typescript
// ❌ CURRENT - Bypasses proxy in SSR:
function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production"
      ? config.backendURL
      : "https://sonotradesdemo.wearedev.team"; // Direct in dev SSR
  }
  return process.env.NODE_ENV === "production" ? config.backendURL : "";
}

// ✅ SHOULD BE - Always use proxy in dev:
function getApiBaseUrl() {
  return process.env.NODE_ENV === "production" ? config.backendURL : "";
}
```

### **2. auth.ts getFreeIpApiBaseUrl() Issue:**
```typescript
// ❌ CURRENT - Wrong dev path:
function getFreeIpApiBaseUrl() {
  return process.env.NODE_ENV === "production"
    ? config.getLoginInfo    // "https://freeipapi.com/api/json"
    : "/freeipapi";          // ❌ Should be "/freeipapi/api/json"
}
```

---

## **💡 ENVIRONMENT REQUIREMENTS BY COMPONENT:**

### **🚨 CRITICAL COMPONENTS (Need Backend API):**
1. **Authentication** → services/auth.ts → needs getApiBaseUrl() + getFreeIpApiBaseUrl()
2. **Trading Orders** → services/market.ts → needs getApiBaseUrl()
3. **Portfolio/Balance** → services/user.ts → needs getApiBaseUrl()
4. **Withdraw/Deposit** → services/wallet.ts → needs getApiBaseUrl()

### **🔄 MODERATE COMPONENTS (Next.js APIs):**
1. **Profile pages** → /api/profile → Internal Next.js routing
2. **Event data** → /api/event-data → Proxies to external services
3. **Spotify integration** → /api/spotify → External OAuth flow

### **🌐 LOW IMPACT (External APIs):**
1. **Polymarket data** → Direct API calls
2. **Spotify OAuth** → Direct API calls

---

## **🎯 FINAL RECOMMENDATIONS:**

### **✅ KEEP AS IS:**
- **Withdraw component** wallet logic (platform balance + external address)
- **market.ts, wallet.ts, portfolio.ts** proxy configurations
- **Next.js API routes** and external API calls

### **🔧 FIX ONLY:**
1. **services/user.ts** - Remove SSR proxy bypass
2. **services/auth.ts** - Fix getFreeIpApiBaseUrl() path
3. **config.ts** - Clean up redundant baseUrl property

### **🚫 DON'T CHANGE:**
- Withdraw component wallet access patterns (CORRECT as designed!)
- Next.js proxy configuration (works perfectly)
- External wallet integration (needed for crypto withdrawals)

---

## **🔍 THE REAL ISSUE:**

The problem isn't the environment configuration itself - it's **one specific function in user.ts that bypasses the proxy during server-side rendering**. All other services correctly use the proxy system.

**Bottom Line:** Your withdrawal system is correctly designed for crypto functionality. The only fix needed is the user.ts proxy bypass issue.
