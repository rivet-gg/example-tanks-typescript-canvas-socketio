import { Server } from "./Server";
import { Server as SocketServer } from "socket.io";
import * as killOthers from "kill-port";

async function main() {
    let port = parseInt(process.env.PORT) || 5000;
    await killOthers(port, "tcp"); // Kill any orphan processes using port 5000
    let socketServer = new SocketServer(port, {
        cors: {
            origin: "*",
        },
    });
    Server.shared = new Server(socketServer);
    console.log(`Listening on port ${port}`);
}

main();
