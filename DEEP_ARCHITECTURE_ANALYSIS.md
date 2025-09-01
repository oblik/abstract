# 🔍 **DEEP ARCHITECTURE ANALYSIS**

## Sonotrade Environment & Store Conflicts

---

## 📊 **REDUX STORE STRUCTURE**

### **Current Store Setup:**

```typescript
// store/index.ts - Redux Persist Configuration
const persistConfig = {
  key: "user",
  whitelist: ["wallet", "walletconnect", "auth"], // All three persisted
  storage: localStorage/noopStorage
};

// rootReducer.ts - Store Structure
{
  auth: {
    session: { signedIn: boolean, token?: string },
    user: { _id, name, email, walletAddress, ... }
  },
  wallet: {                          // 💰 PLATFORM WALLET (Trading)
    data: {
      balance: number,               // USD trading balance
      inOrder: number,               // Amount in active orders
      locked: number,                // Locked funds
      position: number,              // Current position value
      pnl1D: number                 // 24hr profit/loss
    }
  },
  walletconnect: {                   // 🔗 ❌ PROBLEMATIC: Duplicates WalletContext
    walletconnect: {                 // ⚠️ DOUBLE NESTING!
      isConnected: boolean,
      address: string,               // ❌ Should come from WalletContext instead
      network: string,               // "solana"
      type: string,                  // "devnet"
      rpc: string,                   // RPC endpoint
      balance: number                // SOL balance - should be in WalletContext
    }
  }
}
```

### **🚨 CRITICAL ISSUES IDENTIFIED:**

---

## **1. WALLET SYSTEM CONFLICTS**

### **Problem: Mixing External & Platform Wallets**

```typescript
// ❌ WRONG: Authentication.tsx mixes both systems
const walletData = useSelector((state) => state?.wallet?.data); // Platform wallet (✅ correct)
const { isConnected, address } = useSelector(
  (state) => state?.walletconnect?.walletconnect
); // ❌ Should use WalletContext instead!

// ❌ WRONG: Using Redux for external Phantom wallet instead of WalletContext
dispatch(
  setWalletConnect({
    isConnected: true,
    address: response.publicKey.toString(), // Should use WalletContext!
    balance: balanceSOL,
  })
);
```

### **✅ CORRECT PATTERNS:**

```typescript
// External wallet (Phantom): Use WalletContext ONLY
const { address, isConnected } = useWallet(); // From walletContext.js

// Platform wallet (Trading): Use Redux ONLY
const walletData = useSelector((state) => state?.wallet?.data);
```

---

## **2. DOUBLE NESTING ANTI-PATTERN**

### **Problem:**

```typescript
// Current structure creates confusing access patterns:
state.walletconnect.walletconnect.address; // ❌ Double nesting

// Should be:
state.externalWallet.address; // ✅ Clean structure
```

### **Type Mismatch:**

```typescript
// types/index.ts defines:
interface RootState {
  walletconnect: WalletConnectState; // But actual: walletconnect.walletconnect
}
```

---

## **3. ENVIRONMENT CONFIGURATION CHAOS**

### **Inconsistent URL Handling Across Services:**

#### **services/user.ts - Complex SSR Pattern:**

```typescript
function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production"
      ? config.backendURL
      : "https://sonotradesdemo.wearedev.team"; // ❌ HARDCODED!
  }
  return process.env.NODE_ENV === "production" ? config.backendURL : "";
}
```

#### **services/auth.ts & wallet.ts - Simple Pattern:**

```typescript
function getApiBaseUrl() {
  return process.env.NODE_ENV === "production" ? config.backendURL : "";
}
```

### **🚨 Issues:**

- **Hardcoded URLs** in user.ts break consistency
- **Different SSR handling** across services
- **No centralized environment manager**

---

## **4. CONFIG REDUNDANCY**

### **config.ts Issues:**

```typescript
const config = {
  backendURL: "https://sonotradesdemo.wearedev.team",
  baseUrl: "", // ❌ Empty in dev, same as backendURL in prod - REDUNDANT
  getLoginInfo: "", // ❌ Empty in dev but used for freeipapi

  // Development vs Production inconsistencies:
  getLoginInfo:
    process.env.NODE_ENV === "production"
      ? "https://freeipapi.com/api/json" // Full URL in prod
      : "", // Empty in dev (uses proxy)
};
```

---

## **5. AUTHENTICATION TOKEN FLOW CONFLICTS**

### **Multiple Token Sources Compete:**

#### **axios.ts Interceptor (Triple Fallback):**

```typescript
// 1. Primary: cookies-next
authorizationToken = getCookie("user-token");

// 2. Fallback: Direct DOM access
if (!authorizationToken) {
  const cookies = document.cookie.split(";");
  authorizationToken = cookies.find((c) => c.includes("user-token"));
}

// 3. Last resort: Redux store
if (!authorizationToken) {
  authorizationToken = store.getState().auth.session.token;
}
```

#### **Different Components Use Different Patterns:**

```typescript
// Some use lib/cookies.ts:
const token = getAuthToken();

// Others use Redux directly:
const { token } = useSelector((state) => state.auth.session);

// Creates race conditions during hydration!
```

---

## **6. PERSIST CONFIGURATION ISSUES**

### **Problem: Both Wallet Types Persisted**

```typescript
whitelist: ["wallet", "walletconnect", "auth"];
```

**Issues:**

- **External wallet state** shouldn't be persisted (should be fresh on each session)
- **Platform wallet** should be persisted (user's trading balance)
- **Auth tokens** persisted but cookies also used (redundancy)

---

## **7. CLIENT LAYOUT EFFECT MIXING CONCERNS**

### **ClientLayoutEffect.tsx Issues:**

```typescript
// Handles both auth restoration AND wallet data loading
useEffect(() => {
  const { success } = await getUserData(); // Auth validation
  if (success) {
    const token = getCookie("user-token"); // Token from cookies
    dispatch(signIn(token)); // But also stores in Redux
  }
});

useEffect(() => {
  const { success, result } = await getCurrentValue(); // Platform wallet data
  dispatch(
    setWallet({
      balance: result.balance, // Platform trading balance
      // ...
    })
  );
});
```

**Problems:**

- **Mixed responsibilities** (auth + wallet)
- **Token redundancy** (cookies + Redux)
- **No error boundaries** for failed wallet loads

---

## **8. USAGE PATTERNS ACROSS CODEBASE**

### **❌ INCONSISTENT USAGE:**

#### **Portfolio Page (Mostly Correct):**

```typescript
const walletContext = useWallet(); // ✅ External wallet from context
const { isConnected, address } = walletContext;
const walletData = useSelector((state) => state?.wallet?.data); // ✅ Platform from Redux
```

#### **Authentication Component (Mixed):**

```typescript
const walletData = useSelector((state) => state?.wallet?.data); // ✅ Platform
const { isConnected, address } = useSelector(
  (state) => state?.walletconnect?.walletconnect
); // ❌ External from Redux (wrong!)
```

#### **Withdraw Component (Mixed):**

```typescript
const walletData = useSelector((state) => state?.wallet?.data); // ✅ Platform
const { address } = useSelector((state) => state?.walletconnect?.walletconnect); // ❌ External from Redux (wrong!)
```

---

## **🔧 RECOMMENDED ARCHITECTURAL FIXES**

### **1. Clean Wallet Separation**

```typescript
// External wallet (Phantom): ONLY use WalletContext
const { address, isConnected } = useWallet(); // From walletContext.js

// Platform wallet (Trading): ONLY use Redux
const { balance, inOrder, position } = useSelector(
  (state) => state.wallet.data
);
```

### **2. Remove walletconnect Redux Slice**

- Delete `store/slices/walletconnect/` - this duplicates WalletContext functionality
- Remove from persist whitelist
- Update all components to use `useWallet()` hook for Phantom wallet

### **3. Centralize Environment Config**

```typescript
// config/environment.ts
export const getApiBaseUrl = () => {
  return process.env.NODE_ENV === "production" ? config.backendURL : "";
};

// Use everywhere instead of duplicated functions
```

### **4. Simplify Config Structure**

```typescript
const config = {
  api: {
    baseURL:
      process.env.NODE_ENV === "production"
        ? "https://sonotradesdemo.wearedev.team"
        : "",
    timeout: 10000,
  },
  blockchain: {
    network: "solana",
    rpcUrl: "https://api.devnet.solana.com",
    // ...
  },
};
```

### **5. Fix Redux Structure**

```typescript
// Clean store structure:
{
  auth: { session: {...}, user: {...} },
  platform: { balance, inOrder, locked, position, pnl1D },  // Renamed from 'wallet'
  // Remove walletconnect entirely
}
```

### **6. Single Token Source**

```typescript
// Use ONLY cookies for tokens, Redux for user data
const token = getAuthToken(); // From cookies only
const userData = useSelector((state) => state.auth.user);
```

---

## **🎯 IMMEDIATE ACTION ITEMS**

### **High Priority:**

1. **Remove walletconnect Redux slice** - causes confusion
2. **Update Authentication.tsx** to use WalletContext only
3. **Centralize getApiBaseUrl()** across all services
4. **Fix double nesting** in store structure

### **Medium Priority:**

1. **Simplify config.ts** structure
2. **Update component patterns** to be consistent
3. **Add error boundaries** for wallet operations

### **Low Priority:**

1. **Optimize persist configuration**
2. **Add TypeScript strict mode**
3. **Document wallet usage patterns**

---

## **🚨 CURRENT STATE SUMMARY**

**What Works:**

- WalletContext properly connects to Phantom
- Platform wallet data flows correctly
- Authentication mostly functional

**What's Broken:**

- Dual wallet systems create confusion
- External wallet state incorrectly persisted
- Environment configs inconsistent across services
- Components mix wallet sources unpredictably

**Risk Level: HIGH** - Current architecture creates unpredictable behavior and debugging difficulties.
