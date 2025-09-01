# 🔌 **SOCKET, COOKIES & STORE INTEGRATION ANALYSIS**
## Understanding the Complete Real-time Data Flow

---

## **🔌 SOCKET ARCHITECTURE:**

### **Socket Connection Setup:**
```javascript
// config/socketConnectivity.js

// Global socket connection to backend
const socket = config.backendURL ? io(config.backendURL, connectionOptions) : null;

// Connection options:
const connectionOptions = {
  transports: ["websocket"],
  cookie: false,              // ❌ Socket doesn't use cookies for auth
  forceNew: true,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 600,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
};

// Subscribe/Unsubscribe functions:
const subscribe = event => socket?.emit("subscribe", event);
const unsubscribe = event => socket?.emit("unsubscribe", event);
```

### **🚨 CRITICAL SOCKET-AUTH INTEGRATION:**
```javascript
// Auto-resubscribe on socket reconnection:
socket.on("disconnect", reason => {
  const { user } = store.getState().auth;  // 🔗 Direct store access!
  if (user) subscribe(user._id);            // Re-subscribe to user events
});
```

---

## **🍪 COOKIE SYSTEM:**

### **Enhanced Cookie Management:**
```typescript
// lib/cookies.ts

export const setAuthToken = async (token: any) => {
  // Dual cookie setting for reliability:
  setCookie("user-token", token, {         // ✅ SSR-compatible
    maxAge: 60 * 60 * 24 * 7,              // 7 days
    path: "/",
  });

  if (typeof document !== 'undefined') {
    // Direct document.cookie for immediate access
    document.cookie = `user-token=${token}; path=/; max-age=${maxAge}; expires=${expires}`;
  }
};

export const getAuthToken = () => {
  // Hierarchical token retrieval:
  
  // 1. Try document.cookie first (fastest)
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    const userTokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith('user-token=')
    );
    if (userTokenCookie) {
      const token = userTokenCookie.split('=')[1];
      if (token && token !== 'undefined' && token !== 'null') {
        return token;
      }
    }
  }

  // 2. Fallback to cookies-next (SSR-safe)
  const token = getCookie("user-token");
  if (token && token !== 'undefined' && token !== 'null') {
    return token;
  }

  return null;
};
```

### **🔗 Cookie-Middleware Integration:**
```typescript
// middleware.ts
const currentUser = request.cookies.get("user-token");

// Middleware only checks cookie existence, not socket connection
if (protectedPathnameRegex.test(pathname) && !currentUser?.value) {
  request.cookies.delete("user-token");
  return NextResponse.redirect(new URL("/", request.url));
}
```

---

## **🗃️ REDUX STORE ARCHITECTURE:**

### **Store Structure:**
```typescript
// store/rootReducer.ts
const combinedReducer = combineReducers({
  auth,         // User authentication & session
  wallet,       // Platform trading wallet
  walletconnect // External Phantom wallet (DUPLICATE!)
});

// store/index.ts - Persistence config:
const persistConfig = {
  key: "user",
  storage,
  whitelist: ["wallet", "walletconnect", "auth"], // ✅ All persisted
  stateReconciler: autoMergeLevel1,
};
```

### **🔐 Auth Store Slices:**

#### **1. Session Slice (auth/session):**
```typescript
// store/slices/auth/sessionSlice.ts
interface SessionSliceState {
  token?: string;          // JWT token
  signedIn: boolean;       // Authentication status
}

// Actions:
signIn(token)     // Sets signedIn=true + stores token
signOut()         // Resets to initial state  
setToken(token)   // Updates token only
```

#### **2. User Slice (auth/user):**
```typescript
// store/slices/auth/userSlice.ts
interface UserSliceState {
  _id: string,
  name: string,
  userName: string,
  email: string,
  uniqueId: string,       // 🔑 Used for socket subscriptions!
  status: string,
  walletAddress: string,  // Platform wallet address
  profileImg: string,
  loginType: string,
  userId?: string,
}

// Actions:
setUser(userData)         // Full user data replacement
updateSetting(changes)    // Partial updates
reset()                   // Clear user data
```

### **💰 Wallet Store Slices:**

#### **1. Platform Wallet (wallet/data):**
```typescript
// store/slices/wallet/dataSlice.ts
interface WalletData {
  balance: 0,     // Total USD balance
  inOrder: 0,     // Amount in active orders
  locked: 0,      // Temporarily locked funds
  position: 0,    // Current position value
  pnl1D: 0,       // 24hr profit/loss
}

// Actions:
setWallet(walletData)     // Complete wallet state update
```

#### **2. External Wallet (walletconnect/wallet) - DUPLICATE!:**
```typescript
// store/slices/walletconnect/walletSlice.ts
interface WalletConnectData {
  isConnected: false,
  address: "",      // Phantom wallet address
  network: "",      // Solana network
  type: "",         // Wallet type (Phantom)
  rpc: "",          // RPC endpoint
  balance: 0,       // Native SOL balance
}

// Actions:
setWalletConnect(walletData)  // External wallet state
```

---

## **🔄 REAL-TIME DATA FLOW:**

### **Socket Event Types & Handlers:**

#### **1. Platform Wallet Updates:**
```typescript
// ClientLayoutEffect.tsx
socket.on("asset", (result: string) => {
  const assetdata = JSON.parse(result);
  dispatch(setWallet({
    balance: assetdata.balance,
    inOrder: assetdata.inOrder,
    locked: assetdata.locked,
    position: prevPosition,  // Preserves existing position
  }));
});

// Subscribe to user-specific wallet updates:
if (user && user._id) subscribe(user._id);
```

#### **2. Order Management Updates:**
```typescript
// orderbookAccordion.tsx
socket.on("order-update", (result) => {
  const resData = JSON.parse(result);
  setOpenOrders((prev) => {
    if (resData.status === "filled" || resData.status === "cancelled") {
      return prev.filter(order => order._id !== resData._id);
    }
    // Handle other order status updates...
  });
});

// Portfolio OpenOrders.tsx
socket.on("order-update", handleOrders);
socket.on("trade-update", handleTradeUpdate);
socket.on("order-fill", handleOrders);
socket.on(`user-${user._id}`, handleOrders);  // 🔑 User-specific channel
```

#### **3. Trading & Position Updates:**
```typescript
// Positions.js
socket.on("pos-update", handlePositions);
socket.on("trade-update", handleTradeUpdate);
socket.on("order-fill", handlePositions);
socket.on(`user-${props.uniqueId}`, handlePositions);    // User channel
socket.on(`position-${props.uniqueId}`, handlePositions); // Position channel

// TradingCard.jsx
socket.on("pos-update", handlePositions);
```

#### **4. Market Data Updates:**
```typescript
// EventPage.jsx
socket.on("orderbook", handleOrderbook);      // Public orderbook data
socket.on("recent-trade", handleRecentTrade); // Public trade data
socket.on("chart-update", chartUpdate);       // Public chart data

// Chart.tsx
socket.on("chart-update", chartUpdate);

// Subscribe to event-specific updates:
subscribe(events._id);  // Event ID, not user ID
```

#### **5. Comment System Updates:**
```typescript
// comment.tsx
socket.on("comment", handleCommentAdded);
socket.on("reply", handleCommentAdded);
socket.on("comment-update", handleCommentAdded);
socket.on(`comment-${eventId}`, handleCommentAdded);
socket.on(`reply-${eventId}`, handleCommentAdded);
```

#### **6. Profile Updates:**
```typescript
// Profile.tsx
socket.on("profile-update", handleProfileUpdate);
socket.on("trade-update", handleTradeUpdate);
socket.on("pos-update", handleTradeUpdate);
socket.on("order-update", handleTradeUpdate);
socket.on(`user-${currentUser.uniqueId}`, handleProfileUpdate);
```

---

## **🔗 AUTHENTICATION INTEGRATION:**

### **Socket Authentication Pattern:**
```typescript
// The socket doesn't use cookies directly, but relies on server-side
// session management tied to user IDs

// 1. User logs in → JWT stored in cookies
// 2. Socket connects → subscribes to user._id
// 3. Server identifies user → sends user-specific events
// 4. Components update via Redux store

// Key connection points:
- user._id → Socket subscription channel
- user.uniqueId → Profile-specific updates  
- event._id → Event-specific updates
```

### **Store-Socket Synchronization:**
```typescript
// Direct store access from socket config:
socket.on("disconnect", reason => {
  const { user } = store.getState().auth;  // 🔗 Gets current user
  if (user) subscribe(user._id);            // Re-subscribes automatically
});

// Components access both store and socket:
const user = useSelector(state => state.auth.user);
const socketContext = useContext(SocketContext);
const socket = socketContext?.socket;
```

---

## **⚡ DATA FLOW SUMMARY:**

### **Authentication Flow:**
```
1. Login → JWT token → Cookies (both document + cookies-next)
2. Token → Redux auth/session (signIn action)
3. User data → Redux auth/user (setUser action)
4. user._id → Socket subscribe(user._id)
5. Server → Sends user-specific events to socket channel
```

### **Wallet Data Flow:**
```
1. Initial load → getCurrentValue() API → Redux wallet/data
2. Real-time → Socket "asset" event → Redux wallet/data update
3. Trading → Order placed → Socket order events → UI updates
4. Balance → Redux state.wallet.data.balance → UI display
```

### **Order Management Flow:**
```
1. Place order → placeOrder() API → Server processes
2. Server → Socket "order-update" → All subscribed components
3. OrderBook → Updates open orders display
4. Portfolio → Updates open orders list  
5. Positions → Updates when orders fill
```

---

## **🚨 CRITICAL INTEGRATION POINTS:**

### **✅ WORKING CORRECTLY:**
1. **Socket-Store Integration** - Direct store access for reconnection
2. **Cookie-Auth Integration** - Dual cookie system for reliability  
3. **Real-time Updates** - Socket events update Redux store
4. **User-specific Channels** - user._id based subscriptions

### **⚠️ POTENTIAL ISSUES:**
1. **Duplicate Wallet Systems** - walletconnect slice is redundant
2. **Socket Environment Dependency** - Uses config.backendURL directly
3. **No Socket Authentication** - Relies on server-side session management

### **🔧 ENVIRONMENT IMPACT:**
- Socket connects directly to config.backendURL (bypasses Next.js proxy)
- Authentication works via cookies (middleware handles this)
- Real-time updates work regardless of environment config issues
- User-specific socket subscriptions depend on correct user._id in store

The socket system is well-architected and independent of the API proxy issues affecting HTTP requests!
