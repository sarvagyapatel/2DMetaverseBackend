import { Duplex } from "stream"
import { IncomingMessage } from 'http'
import { wss } from "./websocket";
import { app } from "./app";
import dotenv from 'dotenv'

dotenv.config({
    path: '../.env'
})

app.listen(process.env.PORT, () => {
  console.log(`Express server listening on http://localhost:${process.env.PORT}`);
})
.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);

  if (url.pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});
console.log(`WebSocket server running on ws://localhost:${process.env.PORT}/ws`);
