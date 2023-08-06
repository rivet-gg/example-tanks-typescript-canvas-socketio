import { readFile } from "node:fs/promises";
import { Server as SocketServer, Socket } from "socket.io";
import { createGame, updateGame } from "../shared/Game";
import { Connection } from "./Connection";
import { Http3Server, WebTransport } from "@fails-components/webtransport";
import { io } from "socket.io-client";
import { generateWebTransportCertificate } from "./util-wt.mjs";

global.WebTransport = WebTransport;

// Create game
const game = createGame(true);

// Start server
const port = parseInt(process.env.PORT) || 3000;

// Start socket server
const socketServer = new SocketServer(port, {
	transports: ["webtransport" as any],
	cors: {
		// Once you deploy your own game, make sure the CORS is restricted to
		// your domain.
		origin: "*",
	},
});
socketServer.on("connection", setupConnection);

// const certificate = await generateWebTransportCertificate(
// 	[{ shortName: "CN", value: "localhost" }],
// 	{
// 		// the total length of the validity period MUST NOT exceed two weeks (https://w3c.github.io/webtransport/#custom-certificate-requirements)
// 		days: 14,
// 	}
// );
// console.log(certificate.fingerprint);
const certificate = {
	cert: (await readFile("cert.pem")).toString(),
	private: (await readFile("key.pem")).toString(),
};

// Start HTTP/3 server
const h3Server = new Http3Server({
	port,
	host: "0.0.0.0",
	secret: "changeit",
	cert: certificate.cert,
	privKey: certificate.private,
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
h3Server.onServerListening = () => {
	console.log("HTTP/3 server listening");

	// let client = createClient({ transports: ["webtransport"] });
	// client.on("connect", () => {
	// 	console.log("epic");
	// });
};

// function createClient(opts) {
// 	return io(
// 		`http://127.0.0.1:${port}`,
// 		Object.assign(
// 			{
// 				transportOptions: {
// 					webtransport: {
// 						serverCertificateHashes: [
// 							{
// 								algorithm: "sha-256",
// 								value: certificate.hash,
// 							},
// 						],
// 					},
// 				},
// 			},
// 			opts
// 		)
// 	);
// }

async function setupConnection(socket: Socket) {
	new Connection(game, socket);
}

// Update game & broadcast state
setInterval(() => {
	updateGame(game);
	socketServer.emit("update", game.state);
}, 50);

console.log(`Listening on port ${port}`);
