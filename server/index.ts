import { readFile } from "node:fs/promises";
import { createServer } from "node:https";
import { Server as SocketServer, Socket } from "socket.io";
import { createGame, updateGame } from "../shared/Game";
import { Connection } from "./Connection";
import { Http3Server } from "@fails-components/webtransport";

// HTTP/3 keys
const key = await readFile("./key.pem");
const cert = await readFile("./cert.pem");

// Create game
const game = createGame(true);

// Start server
const port = parseInt(process.env.PORT) || 3000;
const httpsServer = createServer(
	{
		key,
		cert,
	},
	async (req, res) => {
		res.writeHead(404).end();
	}
);
httpsServer.listen(port);

// Start socket server
const socketServer = new SocketServer(httpsServer, {
	transports: ["polling", "websocket", "webtransport" as any],
	cors: {
		// Once you deploy your own game, make sure the CORS is restricted to
		// your domain.
		origin: "*",
	},
});
socketServer.on("connection", setupConnection);

// Start HTTP/3 server
const h3Server = new Http3Server({
	port,
	host: "0.0.0.0",
	secret: "changeit",
	cert: cert.toString(),
	privKey: key.toString(),
});
(async () => {
	const stream = await h3Server.sessionStream("/socket.io/");
	const sessionReader = stream.getReader();

	while (true) {
		const { done, value } = await sessionReader.read();
		if (done) break;

		socketServer.engine.onWebTransportSession(value);
	}
})();

h3Server.startServer();

async function setupConnection(socket: Socket) {
	new Connection(game, socket);
}

// Update game & broadcast state
setInterval(() => {
	updateGame(game);
	socketServer.emit("update", game.state);
}, 50);

console.log(`Listening on port ${port}`);
