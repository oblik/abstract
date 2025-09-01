/* Core */
import { configureStore, type Action, type ThunkAction, type UnknownAction } from "@reduxjs/toolkit";
import { compose } from "redux";
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from "redux-persist";
import autoMergeLevel1 from "redux-persist/lib/stateReconciler/autoMergeLevel1";
import storage from "./storage";
import { useDispatch as useReduxDispatch, useSelector as useReduxSelector, type TypedUseSelectorHook } from "react-redux";

import rootReducer from "./rootReducer";
import { RootState } from "@/types";

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const isClient = typeof window !== "undefined";

const persistConfig = {
	key: "user",
	version: 1,
	storage,
	stateReconciler: autoMergeLevel1,
        whitelist: ["wallet", "walletconnect", "auth"],
	debug: false, // Set to false to reduce console noise
	// transforms: [
	// 	encryptTransform({
	// 		secretKey: "my-super-secret-key",
	// 			// Handle the error.
	// 		},
	// 	}),
	// ],
};

const mainReducer = persistReducer(persistConfig, rootReducer());

export const reduxStore = configureStore({
	reducer: mainReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			immutableCheck: false,
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
	devTools: true,
});

(reduxStore as any).asyncReducers = {};
export const persistor = isClient ? persistStore(reduxStore) : null;

export const injectReducer = (key: string, reducer: any) => {
	if (!isClient) {
		return false;
	}
	const store = reduxStore as any;
	if (store.asyncReducers[key]) {
		return false;
	}
	store.asyncReducers[key] = reducer;
	reduxStore.replaceReducer(persistReducer(persistConfig, rootReducer(store.asyncReducers)));
	(persistor as any)?.persist();
	return reduxStore;
};

export const useDispatch = () => useReduxDispatch<ReduxDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

export default reduxStore;

// types
export type ReduxStore = typeof reduxStore;
export type ReduxDispatch = typeof reduxStore.dispatch;
export type ReduxThunkAction<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>;