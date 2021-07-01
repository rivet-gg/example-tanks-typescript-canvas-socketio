import { Server } from "./Server";
import { Socket } from "socket.io";
import { createPlayer, PlayerState, shoot } from "../shared/Player";

export class Connection {
    public currentPlayerId?: number;

    public get currentPlayer(): PlayerState | undefined {
        console.log(this.currentPlayerId);
        if (this.currentPlayerId) {
            return this._server.game.state.players[this.currentPlayerId];
        } else {
            return undefined;
        }
    }

    public constructor(private _server: Server, private _socket: Socket) {
        this._socket.once("init", this._onInit.bind(this));
    }

    private async _onInit(playerToken: string, cb: () => void) {
        console.log("Player connecting");

        this._socket.on("disconnect", () => {
            this._server.rivet.playerDisconnected({ playerToken });
        });

        try {
            await this._server.rivet.playerConnected({ playerToken });
        } catch (err) {
            console.error("failed to authenticate player", err);
            this._socket.disconnect();
        }

        console.log("Player registered");

        this._socket.on("disconnect", this._onDisconnect.bind(this));
        this._socket.on("join", this._onJoin.bind(this));
        this._socket.on("shoot", this._onShoot.bind(this));
        this._socket.on("input", this._onInput.bind(this));

        cb();
    }

    private _onDisconnect() {
        if (this.currentPlayerId)
            delete this._server.game.state.players[this.currentPlayerId];
    }

    private _onJoin(cb: (playerId: number) => void) {
        if (!this.currentPlayer) {
            let player = createPlayer(this._server.game);
            this.currentPlayerId = player.id;
            cb(player.id);
        }
    }

    private _onShoot() {
        let player = this.currentPlayer;
        if (player) shoot(this._server.game, player);
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
        currentPlayer.moveX = moveX;
        currentPlayer.moveY = moveY;
        currentPlayer.aimDir = aimDir;
    }
}
