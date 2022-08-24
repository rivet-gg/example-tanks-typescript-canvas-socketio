import fetch from "node-fetch";
import { createGame, Game, updateGame } from "../shared/Game";
import { Server as SocketServer, Socket } from "socket.io";
import { Connection } from "./Connection";

export class Server {
	public static shared: Server;

	public game: Game;

	public constructor(public socketServer: SocketServer) {
		this.game = createGame(true);

		this.socketServer.on("connection", this._onConnection.bind(this));

		setInterval(this._update.bind(this), 50);
	}

	private async _onConnection(socket: Socket) {
		const connection = new Connection(this, socket);
	}

	private _update() {
		// Update the game
		updateGame(this.game);

		// Broadcast the state
		this.socketServer.emit("update", this.game.state);
	}
}
