# 💰 **AVAILABLE BALANCE FLOW ANALYSIS**

## How Trading Components Access Balance Data

---

## **🔍 BALANCE ACCESS PATTERNS:**

### **1. TradingCard.jsx (Balance Display):**

```jsx
// Gets platform wallet data from Redux:
const asset = useSelector((state) => state?.wallet?.data);

// Displays available balance using utility function:
<span className="text-xs text-gray-500">
  Balance {signedIn ? `$${availableBalance(asset)}` : "$0.00"}
</span>;

// availableBalance(asset) calculates:
// asset.balance - asset.locked = available trading funds
```

### **2. PortfolioPage.js (Balance Calculations):**

```javascript
// Gets platform wallet data from Redux:
const walletData = useSelector((state) => state?.wallet?.data);

// Available Balance Calculation:
Number(walletData?.balance - walletData?.locked);

// Total Portfolio Value:
Number(walletData?.balance + walletData?.position)(
  // P&L Percentage:
  (walletData?.position + walletData?.locked) /
    (walletData?.balance + walletData?.position)
) * 100;
```

### **3. Withdraw.js (Withdrawal Available):**

```javascript
// Gets platform wallet data from Redux:
const walletData = useSelector((state) => state?.wallet?.data);

// ❌ ALSO gets external wallet (conflicting pattern):
const { address } = useSelector((state) => state?.walletconnect?.walletconnect);

// Available Balance for Withdrawal:
const availableBalance = walletData?.balance
  ? formatNumber(walletData?.balance - walletData?.locked, 2)
  : 0;
```

---

## **🧮 AVAILABLE BALANCE CALCULATION:**

### **lib/utils.ts - availableBalance() Function:**

```typescript
interface Asset {
  balance: string | number; // Total platform balance ($1,250.50)
  locked: string | number; // Funds tied up in orders ($100.00)
}

export function availableBalance(asset: Asset): string | number {
  const available = Number(asset?.balance || 0) - Number(asset?.locked || 0);
  return toFixedDown(available, 2); // $1,150.50 (available for trading)
}

// Example:
// balance: $1,250.50 (total platform funds)
// locked:  $100.00   (money in active orders)
// result:  $1,150.50 (available for new trades)
```

---

## **📊 REDUX WALLET DATA STRUCTURE:**

### **state.wallet.data Contains:**

```typescript
{
  balance: 1250.50,    // Total USD in platform account
  inOrder: 500.00,     // Amount tied up in active orders
  locked: 100.00,      // Temporarily locked funds
  position: 750.25,    // Current position value
  pnl1D: -25.50       // 24hr profit/loss
}

// Available Balance = balance - locked
// 1250.50 - 100.00 = $1,150.50 available for trading
```

### **How This Data Gets Updated:**

```typescript
// 1. ClientLayoutEffect.tsx loads initial data:
const { result } = await getCurrentValue();
dispatch(
  setWallet({
    balance: result.balance,
    inOrder: result.inOrder,
    locked: result.locked,
    position: result.position / 100,
    pnl1D: result.pnl1D / 100,
  })
);

// 2. Socket updates in real-time:
socket.on("asset", (data) => {
  const assetdata = JSON.parse(data);
  dispatch(
    setWallet({
      balance: assetdata.balance,
      inOrder: assetdata.inOrder,
      locked: assetdata.locked,
      // ... updated from server
    })
  );
});
```

---

## **🚨 BALANCE FLOW CONFLICTS:**

### **❌ INCONSISTENT PATTERNS:**

#### **TradingCard.jsx (Correct):**

```jsx
const asset = useSelector((state) => state?.wallet?.data);  // ✅ Platform wallet only
Balance: ${availableBalance(asset)}
```

#### **PortfolioPage.js (Correct):**

```javascript
const walletData = useSelector((state) => state?.wallet?.data);  // ✅ Platform wallet only
Available: ${walletData?.balance - walletData?.locked}
```

#### **Withdraw.js (Mixed/Conflicting):**

```javascript
const walletData = useSelector((state) => state?.wallet?.data); // ✅ Platform wallet
const { address } = useSelector((state) => state?.walletconnect?.walletconnect); // ❌ External wallet

// Uses platform balance but external address - WHY BOTH?
```

---

## **🔧 NEXT.CONFIG.MJS ENVIRONMENT INTERACTION:**

### **Current Proxy Configuration:**

```javascript
// next.config.mjs
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'https://sonotradesdemo.wearedev.team/api/:path*',
    },
    {
      source: '/freeipapi/:path*',
      destination: 'https://freeipapi.com/:path*',
    },
  ];
}
```

### **How Services Use This:**

#### **✅ CORRECT Services (auth.ts, wallet.ts, market.ts):**

```typescript
function getApiBaseUrl() {
  return process.env.NODE_ENV === "production" ? config.backendURL : "";
}

// Development: "" → Uses Next.js proxy /api/* → sonotradesdemo.wearedev.team
// Production: config.backendURL → Direct to sonotradesdemo.wearedev.team
```

#### **❌ BROKEN Service (user.ts):**

```typescript
function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production"
      ? config.backendURL
      : "https://sonotradesdemo.wearedev.team"; // ❌ BYPASSES PROXY!
  }
  return process.env.NODE_ENV === "production" ? config.backendURL : "";
}

// Problem: Server-side rendering bypasses proxy, hits server directly
```

---

## **📊 CONFIG.TS VS NEXT.CONFIG.MJS CONFLICTS:**

### **The Redundancy Problem:**

#### **config.ts Configuration:**

```typescript
development: {
  backendURL: "https://sonotradesdemo.wearedev.team", // Direct URL
  baseUrl: "",                                        // Empty for proxy
  getLoginInfo: "",                                   // Empty for proxy
}

production: {
  backendURL: "https://sonotradesdemo.wearedev.team", // Direct URL
  baseUrl: "https://sonotradesdemo.wearedev.team",    // ❌ Same as backendURL
  getLoginInfo: "https://freeipapi.com/api/json",     // Direct URL
}
```

#### **next.config.mjs Proxy Setup:**

```javascript
// Development proxies:
'/api/*' → 'https://sonotradesdemo.wearedev.team/api/*'
'/freeipapi/*' → 'https://freeipapi.com/*'

// But config.ts sometimes bypasses these proxies!
```

---

## **🚨 ENVIRONMENT INTERACTION PROBLEMS:**

### **1. Proxy Bypass Issue:**

```typescript
// user.ts bypasses proxy in SSR:
if (typeof window === "undefined") {
  return "https://sonotradesdemo.wearedev.team"; // Direct connection
}
return ""; // Proxy only for client
```

### **2. Config Redundancy:**

```typescript
// TWO properties for same purpose:
config.backendURL = "https://sonotradesdemo.wearedev.team";
config.baseUrl = ""; // Development
config.baseUrl = "https://sonotradesdemo.wearedev.team"; // Production (same!)
```

### **3. Empty String Issues:**

```typescript
// Development breaks:
config.getLoginInfo = ""; // Should be "/freeipapi/api/json"
config.baseUrl = ""; // Works for axios but confusing
```

---

## **🔧 RECOMMENDED FIXES:**

### **1. Standardize Balance Access:**

```typescript
// ALL components should use:
const platformWallet = useSelector((state) => state?.wallet?.data);
const availableBalance = platformWallet?.balance - platformWallet?.locked;

// NEVER mix with external wallet data
```

### **2. Fix Withdraw Component:**

```javascript
// ❌ CURRENT (mixed):
const walletData = useSelector((state) => state?.wallet?.data); // Platform
const { address } = useSelector((state) => state?.walletconnect?.walletconnect); // External

// ✅ SHOULD BE:
const platformWallet = useSelector((state) => state?.wallet?.data); // Platform balance
const { address } = useWallet(); // External address
```

### **3. Centralize Environment Config:**

```typescript
// config/environment.ts
export const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return "https://sonotradesdemo.wearedev.team";
  }

  // Always use proxy in development (both client & server)
  return "";
};
```

### **4. Clean Up config.ts:**

```typescript
const config = {
  api: {
    baseURL: getApiBaseUrl(), // Single source of truth
    timeout: 10000,
  },
  external: {
    freeipapi:
      process.env.NODE_ENV === "production"
        ? "https://freeipapi.com/api/json"
        : "/freeipapi/api/json", // Use proxy
  },
};
```

---

## **🎯 SUMMARY:**

### **✅ WHAT WORKS:**

- **Balance calculation** is consistent (`balance - locked`)
- **Platform wallet data** flows correctly through Redux
- **Most services** use proxy correctly

### **❌ WHAT'S BROKEN:**

- **Mixed wallet patterns** in withdraw component
- **user.ts bypasses proxy** in development
- **Config redundancy** creates confusion
- **Empty strings** break development APIs

### **💡 KEY INSIGHT:**

The balance system works correctly, but **environment configuration is fragmented**. The Next.js proxy is set up correctly, but some services bypass it, creating inconsistent behavior between development and production.

**Fix Priority:**

1. **Remove Redux walletconnect** from withdraw component
2. **Centralize getApiBaseUrl()** to respect proxy
3. **Clean up config.ts** redundancy
