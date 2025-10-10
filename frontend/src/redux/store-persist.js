import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage"; // to localStorage
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { combineReducers } from "redux";

// import City from "../features/City"
import Name from "../features/Name";
import Email from "../features/Email";
// import Image from "../features/Image";
// import Wallet from "../features/Wallet";
import isLoggedIn from "../features/isLoggedIn";
// import vendorId from "../features/vendorId";
import Type from "../features/Type.js";

const rootReducer = combineReducers({
    Type,
    Name,
    Email,
    isLoggedIn
});

const persistConfig = {
  key: "root",
  storage,
//   blacklist:['Wallet']
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
