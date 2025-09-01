# 🔍 **CRITICAL COMPONENT ENVIRONMENT ANALYSIS**
## Which Environment Configurations Each Key Page Actually Requires

---

## **🏠 HOME PAGE (app/Home.js)**

### **API Dependencies:**
```javascript
// HOME PAGE SERVICE IMPORTS:
import { getCategories, getTagsByCategory } from "@/services/market";
import { getInfoCards } from "@/services/user";

// ACTUAL API CALLS IN useEffect:
useEffect(() => {
  const fetchTags = async () => {
    const { success, result } = await getTagsByCategory(selectCategory);
    // Uses services/market.ts → getApiBaseUrl() → /api/v1/events/tags/${id}
  };
  fetchTags();
}, [selectCategory]);

// Initial data loading (likely in parent component)
await getCategories();    // /api/v1/events/category
await getInfoCards();     // /api/v1/user/info-cards
```

### **Environment Requirements:**
- ✅ **CRITICAL:** services/market.ts needs getApiBaseUrl() for categories and tags
- ✅ **CRITICAL:** services/user.ts needs getApiBaseUrl() for info cards
- ❌ **ISSUE:** user.ts has SSR proxy bypass problem

---

## **📊 EVENT PAGE (app/event-page/[id]/_components/EventPage.jsx)**

### **API Dependencies:**
```jsx
// EVENT PAGE SERVICE IMPORTS:
import { getOrderBook, getEventById, getCategories } from "@/services/market";
import { getOpenOrdersByEvtId } from "@/services/user";

// ACTUAL API CALLS IN useEffect:
useEffect(() => {
  const fetchEvents = async () => {
    let { success, result } = await getEventById({ id: id });
    // Uses services/market.ts → /api/v1/events/market/${id}
  };
  fetchEvents();
}, [id]);

const fetchAllBooks = useCallback(async () => {
  const { success, orderbook } = await getOrderBook({ id: id });
  // Uses services/market.ts → /api/v1/order/books/${id}
}, [id]);

const getOpenOrders = async (id) => {
  const { success, result } = await getOpenOrdersByEvtId({ id: id });
  // Uses services/user.ts → /api/v1/user/open-orders/event/${id}
};
```

### **Environment Requirements:**
- ✅ **CRITICAL:** services/market.ts for event data, orderbook, categories
- ✅ **CRITICAL:** services/user.ts for open orders
- ❌ **ISSUE:** user.ts SSR proxy bypass affects open orders

---

## **💼 PORTFOLIO PAGE (app/portfolio/PortfolioPage.js)**

### **API Dependencies:**
```javascript
// PORTFOLIO PAGE SERVICE IMPORTS:
import { userDeposit, addressCheck } from "@/services/wallet";
import { getWalletSettings, getCoinList } from "@/services/user";
import { getUserPnL } from "@/services/portfolio";
import { getCategories } from "@/services/market";

// ACTUAL API CALLS:
// 1. P&L Chart Data:
const { success, result } = await getUserPnL(chartInterval);
// Uses services/portfolio.ts → /api/v1/user/closed-pnl/${id}

// 2. Profile Data (Next.js API):
const res = await fetch(`/api/profile?wallet=${wallet}`);
// Uses internal Next.js route → app/api/profile/route.ts

// 3. Wallet Settings:
let respData = await getWalletSettings();
// Uses services/user.ts → /api/v1/user/get-wallet-settings

// 4. Coin List:
let respData = await getCoinList();
// Uses services/user.ts → /api/v1/user/get-coin-list

// 5. Categories:
const { success, result } = await getCategories();
// Uses services/market.ts → /api/v1/events/category
```

### **Environment Requirements:**
- ✅ **CRITICAL:** services/user.ts for wallet settings, coin list (AFFECTED BY SSR ISSUE)
- ✅ **CRITICAL:** services/portfolio.ts for P&L data
- ✅ **CRITICAL:** services/market.ts for categories
- ✅ **CRITICAL:** services/wallet.ts for deposits
- ✅ **OK:** /api/profile uses internal Next.js routing

---

## **👤 PROFILE PAGE (app/profile/[slug]/Profile.tsx)**

### **API Dependencies:**
```tsx
// PROFILE PAGE SERVICE IMPORTS:
import { getTradeOverviewById, getUserById } from "@/services/user";

// ACTUAL API CALLS IN useEffect:
useEffect(() => {
  const fetchTradeOverview = async (id: string) => {
    const response = await getTradeOverviewById(id);
    // Uses services/user.ts → /api/v1/user/user-trade-overview/id/${id}
  };
  
  if (currentUser?.uniqueId) {
    fetchTradeOverview(currentUser?.uniqueId);
  }
}, [currentUser?.uniqueId]);

// Note: getUserById likely called in page.tsx parent component
```

### **Environment Requirements:**
- ✅ **CRITICAL:** services/user.ts for trade overview
- ❌ **ISSUE:** user.ts SSR proxy bypass affects profile loading

---

## **📖 ORDERBOOK ACCORDION (app/components/ui/orderbookAccordion.tsx)**

### **API Dependencies:**
```tsx
// ORDERBOOK SERVICE IMPORTS:
import { getOpenOrdersByEvtId } from "@/services/user";
import { getEventById } from "@/services/market";

// ACTUAL API CALLS:
useEffect(() => {
  const getOpenOrders = async () => {
    const respData = await getOpenOrdersByEvtId({
      id: eventId
    });
    // Uses services/user.ts → /api/v1/user/open-orders/event/${id}
  };
}, []);

useEffect(() => {
  const fetchEvents = async () => {
    let { success, result } = await getEventById({ id: id });
    // Uses services/market.ts → /api/v1/events/market/${id}
  };
}, [id]);
```

### **Environment Requirements:**
- ✅ **CRITICAL:** services/user.ts for open orders
- ✅ **CRITICAL:** services/market.ts for event data
- ❌ **ISSUE:** user.ts SSR proxy bypass affects order loading

---

## **📈 CHART COMPONENT (app/components/customComponents/Chart.tsx)**

### **API Dependencies:**
```tsx
// CHART SERVICE IMPORTS:
import { getPriceHistory, getSeriesByEvent, getForecastHistory } from "@/services/market";

// ACTUAL API CALLS:
useEffect(() => {
  const fetchPriceHistory = async () => {
    const response = await getPriceHistory(id, data as any);
    // Uses services/market.ts → /api/v1/events/price-history/${id}
  };
}, [id, interval]);

useEffect(() => {
  const fetchSeriesData = async () => {
    const response = await getSeriesByEvent(id);
    // Uses services/market.ts → /api/v1/events/series/event/${id}
  };
}, [id]);

// getForecastHistory also available:
// Uses services/market.ts → /api/v1/events/forecast-history/${id}
```

### **Environment Requirements:**
- ✅ **CRITICAL:** services/market.ts for all chart data
- ✅ **OK:** market.ts proxy configuration works correctly

---

## **🚨 CRITICAL ENVIRONMENT IMPACT ANALYSIS:**

### **🔥 HIGH IMPACT COMPONENTS (Broken by user.ts SSR issue):**

#### **1. Portfolio Page:**
- **Wallet settings** → services/user.ts → getWalletSettings()
- **Coin list** → services/user.ts → getCoinList()
- **Impact:** Deposit/withdraw functionality may fail in development

#### **2. Event Page:**
- **Open orders** → services/user.ts → getOpenOrdersByEvtId()
- **Impact:** Users can't see their active orders on event pages

#### **3. Profile Page:**
- **Trade overview** → services/user.ts → getTradeOverviewById()
- **Impact:** Profile stats don't load (total value, P&L, volume)

#### **4. Orderbook Accordion:**
- **Open orders** → services/user.ts → getOpenOrdersByEvtId()
- **Impact:** Order management features broken

### **✅ LOW IMPACT COMPONENTS (Working correctly):**

#### **1. Chart Component:**
- **All chart data** → services/market.ts → Working ✅
- **Price history, series, forecasts** → No issues

#### **2. Home Page:**
- **Categories, tags** → services/market.ts → Working ✅
- **Info cards** → services/user.ts → Affected but not critical for basic browsing

---

## **💡 RECOMMENDED ENVIRONMENT FIX PRIORITY:**

### **🚨 URGENT FIX (HIGH IMPACT):**
```typescript
// services/user.ts - Line 6-16
// ❌ CURRENT (bypasses proxy in SSR):
function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production"
      ? config.backendURL
      : "https://sonotradesdemo.wearedev.team"; // ❌ Direct connection
  }
  return process.env.NODE_ENV === "production" ? config.backendURL : "";
}

// ✅ SHOULD BE (always use proxy in dev):
function getApiBaseUrl() {
  return process.env.NODE_ENV === "production" ? config.backendURL : "";
}
```

### **🔧 MEDIUM PRIORITY:**
```typescript
// services/auth.ts - getFreeIpApiBaseUrl()
// ❌ CURRENT:
return "/freeipapi";

// ✅ SHOULD BE:
return "/freeipapi/api/json";
```

### **🎯 IMPACT SUMMARY:**

**BEFORE FIX:**
- ❌ Portfolio wallet features broken in dev
- ❌ Event page order management broken
- ❌ Profile stats don't load
- ❌ Orderbook order display broken
- ✅ Charts work fine
- ✅ Basic browsing works

**AFTER FIX:**
- ✅ All portfolio features working
- ✅ Order management fully functional  
- ✅ Profile stats loading properly
- ✅ Complete orderbook functionality
- ✅ Charts continue working
- ✅ All features functional

The user.ts SSR proxy bypass is the single point of failure affecting **4 major components** and **8+ critical API endpoints**. Fixing this one function will restore full functionality to the entire application.
