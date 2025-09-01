import { createContext } from "react";
import io from "socket.io-client";
import config from "./config";
import store from "../store/index";
let connectionOptions = {
  transports: ["websocket"],
  cookie: false,
  forceNew: true,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 600,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
};

// Only initialize socket if we have a valid backend URL
const socket = config.backendURL ? io(config.backendURL, connectionOptions) : null;

const subscribe = event => {
  if (socket) {
    socket.emit("subscribe", event);
  }
};

const unsubscribe = event => {
  if (socket) {
    socket.emit("unsubscribe", event);
  }
};

if (socket) {
  socket.on("disconnect", reason => {
    const { user } = store.getState().auth;
    if (user) subscribe(user._id);
  });
}

const SocketContext = createContext({
  socket: socket,
});

export {
  socket,
  subscribe,
  unsubscribe,
  SocketContext,
};
