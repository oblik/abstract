// Core types
export interface ApiResponse<T = any> {
  success?: boolean;
  status?: boolean;
  message: string;
  data?: T;
  result?: T;
  errors?: Record<string, string[]>;
}

export const isApiSuccess = (response: ApiResponse): boolean => {
  return response.success === true || response.status === true;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// User types
export interface User {
  _id: string;
  name: string;
  userName: string;
  email: string;
  uniqueId: string;
  status: 'pending' | 'verified' | 'suspended';
  walletAddress: string;
  profileImg?: string;
  loginType: 'email' | 'google' | 'wallet';
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  userName?: string;
}

export interface GoogleLoginData {
  tokenId: string;
  email: string;
  name: string;
  profileImg?: string;
}

export interface WalletLoginData {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface EmailVerificationData {
  email: string;
  otp: string;
}

export interface ResendOTPData {
  email: string;
}

export interface UpdateUserData {
  name?: string;
  userName?: string;
  profileImg?: string;
  emailNotification?: boolean;
  inAppNotification?: boolean;
}

// Wallet types
export interface Wallet {
  _id: string;
  userId: string;
  balance: number;
  frozenBalance: number;
  currency: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletSettings {
  autoApprove: boolean;
  maxDailyLimit: number;
  require2FA: boolean;
  preferredCurrency: string;
}

// Market/Event types
export interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: 'active' | 'paused' | 'resolved' | 'cancelled';
  startDate: string;
  endDate: string;
  resolutionDate?: string;
  currentPrice: number;
  volume24h: number;
  marketCap: number;
  imageUrl?: string;
  banner?: string;
  image?: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
  slug?: string;
  outcome?: string;
  forecast?: boolean;
  marketId?: Array<{
    outcomePrices?: string;
    last?: number;
    volume?: number;
    outcome?: Array<{
      title?: string;
    }>;
  }>;
}

export interface EventsQueryParams {
  id?: string;
  page?: number;
  limit?: number;
  banner?: string;
  tag?: string;
  status?: string;
}

export interface EventSearchData {
  regex: string;
  page: number;
  limit: number;
}

export interface Order {
  _id: string;
  eventId: string;
  userId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface PlaceOrderData {
  eventId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
}

export interface OrderBook {
  buys: Order[];
  sells: Order[];
  spread: number;
}

export interface PriceHistoryPoint {
  timestamp: string;
  price: number;
  volume: number;
}

export interface PriceHistoryParams {
  from?: string;
  to?: string;
  interval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | 'all';
  market?: string;
  fidelity?: number;
}

// Trade types
export interface TradeOverview {
  totalTrades: number;
  winRate: number;
  profitLoss: number;
  volume24h: number;
  bestTrade?: {
    eventId: string;
    profit: number;
    date: string;
  };
  worstTrade?: {
    eventId: string;
    loss: number;
    date: string;
  };
}

export interface Position {
  _id: string;
  eventId: string;
  userId: string;
  type: 'long' | 'short';
  amount: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  status: 'open' | 'closed' | 'liquidated';
  createdAt: string;
  updatedAt: string;
}

export interface TradeHistory {
  _id: string;
  eventId: string;
  userId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  status: 'completed' | 'cancelled';
  createdAt: string;
}

export interface TradeHistoryParams {
  id: string;
  page: number;
  limit: number;
}

// Notification types
export interface Notification {
  _id: string;
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserNotificationSettings {
  email: boolean;
  inApp: boolean;
  tradeUpdates: boolean;
  priceAlerts: boolean;
  newsUpdates: boolean;
}

// Comment types
export interface Comment {
  _id: string;
  eventId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    _id: string;
    userName: string;
    profileImg?: string;
  };
}

export interface CommentParams {
  eventId: string;
  page: number;
  limit: number;
}

export interface PostCommentData {
  eventId: string;
  content: string;
}

// Transaction types
export interface Transaction {
  _id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'fee';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export interface TransactionHistoryParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  export?: boolean;
}

// Location/Security types
export interface LoginHistory {
  countryName: string;
  countryCode: string;
  ipAddress: string;
  region: string;
  country_code: string;
  timezone: string;
  country_capital: string;
  city: string;
  country: string;
  browsername: string;
  ismobile: boolean;
  os: string;
  loginTime: string;
}

// Error types
export interface ApiError {
  response?: {
    data: {
      message: string;
      errors?: Record<string, string[]>;
    };
  };
  message: string;
}

// Redux types
export interface AppDispatch {
  <T>(action: T): T;
}

export interface SessionSliceState {
  token?: string;
  signedIn: boolean;
}

export interface RootState {
  auth: {
    session: SessionSliceState;
    user: UserSliceState;
  };
  wallet: WalletSliceState;
  walletconnect: WalletConnectState;
[key: string]: any;
}

// Slice state types
export interface UserSliceState {
  name: string;
  userName: string;
  email: string;
  uniqueId: string;
  status: string;
  walletAddress: string;
  profileImg: string;
  loginType: string;
  userId: string;
}

export interface WalletSliceState {
  balance: number;
  frozenBalance: number;
  currency: string;
  address: string;
  transactions: Transaction[];
  settings: WalletSettings;
}

export interface WalletConnectState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: any;
}