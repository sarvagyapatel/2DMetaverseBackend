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
  members: Character[]
}

const app = express();
const port = 8080;

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

    const message = JSON.parse(data);
    if (message.owner !== "sender" && message.owner !== "receiver") {
      let parsedData: Data = message;
      clients.forEach((clientSocket, client) => {
        if (clientSocket.readyState === WebSocket.OPEN) {

          parsedData.members.forEach(element => {
            if (element.clientId === client) {
              element.status = true;
            }
          });

          let individualMessage = { owner: client, members: parsedData.members };
          clientSocket.send(JSON.stringify(individualMessage));
        }
      });
    } else {
      const targetSocket = clients.get(message.target);
      if (message.owner === 'sender') {
        if (message.type === 'createOffer') {
          console.log(message.type)
          targetSocket?.send(JSON.stringify({ type: 'createOffer', sdp: message.sdp }));
        } else if (message.type === 'iceCandidate') {
          targetSocket?.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
        }
      } else if (message.owner === 'receiver') {
        if (message.type === 'createAnswer') {
          console.log(message.type)
          targetSocket?.send(JSON.stringify({ type: 'createAnswer', sdp: message.sdp }));
        } else if (message.type === 'iceCandidate') {
          targetSocket?.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
        }
      }
    }
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