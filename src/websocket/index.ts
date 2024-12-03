import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from 'http'

type Character = {
  clientId: string,
  status: boolean,
  x: string,
  y: string
}


const wss = new WebSocketServer({ noServer: true });
const clients: Map<string, WebSocket> = new Map();

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
      let hostData: Character = message;
      clients.forEach((clientSocket, client) => {
        if (clientSocket.readyState === WebSocket.OPEN) {
          if(hostData.clientId!==client){
            clientSocket.send(JSON.stringify(hostData));
          }
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

export {wss};