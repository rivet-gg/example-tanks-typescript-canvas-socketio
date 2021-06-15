import {Server} from "./Server";
import {Socket} from "socket.io";
import {Player} from "../shared/Player";

export class Connection {
    public currentPlayerId?: number;

    public get currentPlayer(): Player | undefined {
        if (this.currentPlayerId) {
            return this._server.game.playerWithId(this.currentPlayerId)
        } else {
            return undefined;
        }
    }

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
        this._socket.on("shoot", this._onShoot.bind(this));
        this._socket.on("input", this._onInput.bind(this));

        cb();
    }

    private _onDisconnect() {
        if (this.currentPlayerId) this._server.game.removePlayer(this.currentPlayerId);
    }

    private _onJoin(cb: (playerId: number) => void) {
        if (!this.currentPlayer) {
            let player = this._server.game.createPlayer();
            this.currentPlayerId = player.state.id;
            cb(player.state.id);
        }
    }

    private _onShoot() {
        this.currentPlayer?.shoot();
    }

    private _onInput(moveX: number, moveY: number, aimDir: number) {
        let currentPlayer = this.currentPlayer;
        if (!currentPlayer) return;

        // Normalize move direction in order to ensure players move at a consistent speed
        // in every direction
        if (moveX != 0 || moveY != 0) {
            let moveMagnitude = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= moveMagnitude;
            moveY /= moveMagnitude;
        }

        // Update the player's state
        currentPlayer.state.moveX = moveX;
        currentPlayer.state.moveY = moveY;
        currentPlayer.state.aimDir = aimDir;
    }
}
