import { createRoot } from "react-dom/client";
import { PersistGate } from 'redux-persist/integration/react';

import { Provider } from "react-redux";
import { store, persistor } from "./redux/store-persist.js"; 
import TypeRouter from "./TypeRouter.jsx";

createRoot(document.getElementById("root")).render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <TypeRouter/>
      </PersistGate>
    </Provider>
);
