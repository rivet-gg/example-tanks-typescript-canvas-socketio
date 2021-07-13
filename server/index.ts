import { Server } from "./Server";
import { Server as SocketServer } from "socket.io";

let port = parseInt(process.env.PORT) || 5000;
let socketServer = new SocketServer(port, {
    cors: {
        origin: "*",
    },
});
Server.shared = new Server(socketServer);
console.log(`Listening on port ${port}`);
