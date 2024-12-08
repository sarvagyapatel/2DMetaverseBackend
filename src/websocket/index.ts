import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from 'http'

type Character = {
  username: string,
  status: boolean,
  x_axis: string,
  y_axis: string,
  roomId: number
}

const wss = new WebSocketServer({ noServer: true });
const clients: Map<string, WebSocket> = new Map();
const rooms: Map<number, WebSocket[]> = new Map();

wss.on("connection", (socket: WebSocket, request: IncomingMessage) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const username = url.searchParams.get("username");
  const roomIdString = url.searchParams.get("roomId");
  if (roomIdString === null) {
    throw new Error("roomId is missing from the query string");
  }
  const roomId = parseInt(roomIdString);

  if (!username || !roomId) {
    socket.close(1008, "Client ID is required");
    return;
  }

  clients.set(username, socket);

  if (!rooms.has(roomId)) {
    rooms.set(roomId, []);
  }
  rooms.get(roomId)?.push(socket);

  console.log(`Client connected with ID: ${username}`);

  socket.on('message', function message(data: any) {

    const message = JSON.parse(data);
    if (message.type === "liveChat") {
      const chat = message.message;
      let roomClients = rooms.get(chat.roomId);
      console.log(roomClients)
      roomClients?.forEach((s) => {
        if (s.readyState === WebSocket.OPEN) {
          s.send(JSON.stringify({type:"liveChat" ,message:chat}));
        }
      })
    } else if (message.owner !== "sender" && message.owner !== "receiver") {
      let hostData: Character = message;
      let roomClients = rooms.get(hostData.roomId);
      console.log(roomClients)
      roomClients?.forEach((s) => {
        if (s.readyState === WebSocket.OPEN) {
          if (clients.get(hostData.username) !== s) {
            s.send(JSON.stringify(hostData));
          }
        }
      })
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
    console.log(`Client with ID ${username} disconnected`);
    clients.delete(username);

    if (rooms.has(roomId)) {
      const updatedSockets = rooms.get(roomId)?.filter((s) => s != socket);

      if (updatedSockets && updatedSockets.length > 0) {
        rooms.set(roomId, updatedSockets);
      } else {
        rooms.delete(roomId);
      }
    }

  });
});

export { wss };