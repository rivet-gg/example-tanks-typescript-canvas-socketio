import { io, Socket } from "socket.io-client";
import * as RIVET from "@rivet-gg/api-game";
import { Client } from "./Client";
import { GameState } from "../shared/Game";

export class Connection {
    public socket: Socket;

    public isDisconnected: boolean = false;
    public isConnected: boolean = false;

    public constructor(
        private _client: Client,
        public lobby: RIVET.MatchmakerLobby
    ) {
        // Prefer TLS-enabled port but fall back to default port for development
        let port = lobby.ports.find(x => x.isTls) || lobby.ports[0];

        this.socket = io(`${port.hostname}:${port.source}`, {
            transports: ["websocket"],
            reconnectionDelay: 250,
            reconnectionDelayMax: 1000,
        });
        this.socket.on(
            "connect",
            this._onConnect.bind(this, lobby.player.token)
        );
        this.socket.on("disconnect", this._onDisconnect.bind(this));
        this.socket.on("update", this._onUpdate.bind(this));
    }

    private _onConnect() {
        this.isDisconnected = false;

        console.log("Initiating...");
        this.socket.emit(
            "init",
            this.lobby.player.token,
            this._onInit.bind(this)
        );
    }

    private _onInit() {
        console.log("Initiated.");
        this.isConnected = true;
    }

    private _onUpdate(state: GameState) {
        this._client.game.applyState(state);
    }

    private _onDisconnect() {
        this.isDisconnected = true;
        this.isConnected = false;
    }
}
