import {Server} from "./Server";
import {Socket} from "socket.io";

export class Connection {
    public constructor(private _server: Server, private _socket: Socket) {
        this._socket.once("init", this._onInit.bind(this));
    }

    private async _onInit(playerToken: string, cb: () => void) {
        console.log("player connecting");

        this._socket.on("disconnect", () => {
            this._server.rivet.playerDisconnected({ playerToken })
        });

        try {
            await this._server.rivet.playerConnected({ playerToken });
        } catch (err) {
            console.error("failed to authenticate player", err);
            this._socket.disconnect();
        }

        console.log("player registered");

        this._socket.on("disconnect", this._onDisconnect.bind(this));
        this._socket.on("join", this._onJoin.bind(this));

        cb();
    }

    private _onDisconnect() {
        // TODO: Remove the player
    }

    private _onJoin() {
        console.log("join");
    }
}
