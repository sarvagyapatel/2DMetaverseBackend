import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from 'http'
import { Duplex } from "stream"

type Character = {
  clientId: string,
  status: boolean,
  x: string,
  y: string
}

type Data = {
  owner: string,
  members: [Character]
}

const app = express();
const port = 8081;

const wss = new WebSocketServer({ noServer: true });
const clients: Map<string, WebSocket> = new Map();

app.get("/", (req: any, res: { send: (arg0: string) => void; }) => {
  res.send("Welcome to the WebSocket Server!");
})

wss.on("connection", (socket: WebSocket, request: IncomingMessage) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const clientId = url.searchParams.get("clientId");

  if (!clientId) {
    socket.close(1008, "Client ID is required");
    return;
  }

  clients.set(clientId, socket);
  console.log(`Client connected with ID: ${clientId}`);

  socket.on('message', function message(data: any) {
    // Parse the incoming data into an object
    let parsedMessage: Data;
    try {
      parsedMessage = JSON.parse(data);
    } catch (error) {
      console.error("Error parsing message data:", error);
      return;
    }

    // Send the message individually for each client with their specific owner
    clients.forEach((clientSocket, client) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        // Add the client-specific owner field
        let individualMessage = { ...parsedMessage, owner: client };
        console.log(individualMessage)
        // Send the modified message to this specific client
        clientSocket.send(JSON.stringify(individualMessage));
      }
    });
  });

  socket.on("close", () => {
    console.log(`Client with ID ${clientId} disconnected`);
    clients.delete(clientId);
  });
});


app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
}).on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  if (url.pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

console.log(`WebSocket server running on ws://localhost:${port}/ws`);