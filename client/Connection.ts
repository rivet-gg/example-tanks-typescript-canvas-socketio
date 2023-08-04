import { io, Socket } from "socket.io-client";
import { Client } from "./Client";
import { GameState } from "../shared/Game";

export class Connection {
	public socket: Socket;

	public isDisconnected = false;
	public isConnected = false;
	public isInitiated = false;

	public constructor(
		private _client: Client,
		public secure: boolean,
		public host: string,
		query: { [key: string]: string }
	) {
		this.socket = io(host, {
			transports: ["polling", "websocket", "webtransport"],
			reconnection: false,
			secure,
			query,
		});
		this.socket.once("init", this._onInit.bind(this));
		this.socket.on("connect", this._onConnect.bind(this));
		this.socket.on("connect_error", this._onConnectError.bind(this));
		this.socket.on("disconnect", this._onDisconnect.bind(this));
		this.socket.on("update", this._onUpdate.bind(this));
	}

	private _onConnect() {
		console.log(
			`connected with transport ${this.socket.io.engine.transport.name}`
		);

		this.isDisconnected = false;
		this.isConnected = true;

		this.socket.io.engine.on("upgrade", (transport) => {
			console.log(`transport upgraded to ${transport.name}`);
		});
	}

	private _onConnectError(err: Error) {
		console.log(`connect_error due to ${err.message}`);
	}

	private _onInit() {
		this.isInitiated = true;
	}

	private _onUpdate(state: GameState) {
		this._client.game.state = state;
	}

	private _onDisconnect() {
		this.isDisconnected = true;
		this.isConnected = false;
		this.isInitiated = false;
	}
}
