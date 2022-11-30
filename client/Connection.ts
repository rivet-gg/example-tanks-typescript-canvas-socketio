import { io, Socket } from "socket.io-client";
import { Client } from "./Client";
import { GameState } from "../shared/Game";

export class Connection {
	public socket: Socket;

	public isDisconnected = false;
	public isConnected = false;

	public constructor(private _client: Client, public host: string, query: { [key: string]: string }) {
		this.socket = io(host, {
			transports: ["websocket"],
			reconnectionDelay: 250,
			reconnectionDelayMax: 1000,
			query,
		});
		this.socket.on("connect", this._onConnect.bind(this));
		this.socket.on("disconnect", this._onDisconnect.bind(this));
		this.socket.on("update", this._onUpdate.bind(this));
	}

	private _onConnect() {
		this.isDisconnected = false;

		console.log("Initiating...");
		this.socket.emit("init", this._onInit.bind(this));
	}

	private _onInit() {
		console.log("Initiated.");
		this.isConnected = true;
	}

	private _onUpdate(state: GameState) {
		this._client.game.state = state;
	}

	private _onDisconnect() {
		this.isDisconnected = true;
		this.isConnected = false;
	}
}
