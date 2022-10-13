import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import type { localeTimeSenderParams } from "../common/types";
import {
  setupLocaleTimeSenderSSEMiddleware,
  attachLocaleTimeSenderInterval,
} from "./localeTimeSender";
import { setupAndHandleChatWebSocketServer } from "./chat";

// NOTE: Extending Response interface of Express to add custom properties
declare module "express-serve-static-core" {
  interface Response {
    sendLocaleTimeViaSSE: (params: localeTimeSenderParams) => void;
  }
}

// NOTE: Create ws WebSocket server
const websocketServer = new WebSocketServer({
  noServer: true,
});

// NOTE: WebSockets-based Chat server events handlers
setupAndHandleChatWebSocketServer(websocketServer);

// NOTE: Create Express server
const expressServer = express();

// NOTE: In production it's the server who exposes built front app
expressServer.use(express.static("dist"));

expressServer
  .use(cors({ origin: "*" }))
  // NOTE: Middleware and controller for sending time from server via Server-Sent Events (SSE)
  .get(
    "/get-current-time",
    setupLocaleTimeSenderSSEMiddleware,
    attachLocaleTimeSenderInterval
  )
  .listen(process.env.SERVER_PORT, () =>
    console.log(`Example app listening at 
      http://localhost:${process.env.SERVER_PORT}`)
  )
  // NOTE: Required for ws to work with Express
  .on("upgrade", (req, socket, head) => {
    websocketServer.handleUpgrade(req, socket, head, (socket) => {
      websocketServer.emit("connection", socket, req);
    });
  });
