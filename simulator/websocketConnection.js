import { WebSocketServer } from "ws";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});
export {server, wss };
