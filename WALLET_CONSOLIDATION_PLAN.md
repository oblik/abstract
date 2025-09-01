# Wallet System Consolidation Plan

## Current State (PROBLEMATIC)

- WalletContext (Phantom) ✅ KEEP
- Redux wallet slice (trading data) ✅ KEEP
- Redux walletconnect slice ❌ REMOVE

## Recommended Structure

### WalletContext (Phantom Integration)

```typescript
// app/walletconnect/walletContext.js - KEEP AS IS
const { address, isConnected } = useWallet();
// Purpose: Phantom wallet connection state
```

### Redux Wallet (Trading Data)

```typescript
// store/slices/wallet/dataSlice.ts - KEEP AS IS
const walletData = useSelector((state) => state.wallet.data);
// Purpose: USD trading balance, P&L, positions
```

### REMOVE: Redux WalletConnect

```typescript
// store/slices/walletconnect/ - DELETE ENTIRE FOLDER
// This duplicates WalletContext functionality
```

## Migration Steps

1. Remove walletconnect from rootReducer.ts
2. Update all components using state.walletconnect.walletconnect
3. Replace with useWallet() hook
4. Delete store/slices/walletconnect folder
5. Update type definitions
