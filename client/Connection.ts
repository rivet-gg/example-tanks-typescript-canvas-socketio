import { io, Socket } from "socket.io-client";
import * as RIVET from "@rivet-gg/api-game";
import {Client} from "./Client";

export class Connection {
    private _socket: Socket;

    public constructor(private _client: Client, public lobby: RIVET.MatchmakerLobby) {
        this._socket = io(`${lobby.ports[0].hostname}:${lobby.ports[0].source}`);
        this._socket.on("connect", this._onConnect.bind(this, lobby.player.token));
        this._socket.on("disconnect", this._onDisconnect.bind(this));
    }

    private _onConnect() {
        console.log("Initiating...");
        this._socket.emit("init", this.lobby.player.token, this._onInit.bind(this));
    }

    private _onInit() {
        console.log("Initiated.");
    }

    private _onDisconnect() {
    }
}
