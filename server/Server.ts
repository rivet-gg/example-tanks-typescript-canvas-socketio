import * as RIVET from "@rivet-gg/api-game";
import fetch from "node-fetch";
import { createGame, Game, updateGame } from "../shared/Game";
import { Server as SocketServer, Socket } from "socket.io";
import { Connection } from "./Connection";

export class Server {
    public static shared: Server;

    public game: Game;

    public rivet: RIVET.ServerApi;

    public constructor(public socketServer: SocketServer) {
        this.game = createGame(true);

        this.socketServer.on("connection", this._onConnection.bind(this));

        this.rivet = new RIVET.ServerApi(
            new RIVET.Configuration({
                fetchApi: fetch,
                accessToken: process.env.RIVET_LOBBY_TOKEN,
            })
        );
        this.rivet
            .lobbyReady({})
            .then(() => console.log("Lobby ready"))
            .catch((err) => {
                console.error("Failed to authenticate with Rivet", err);
                process.exit(1);
            });

        setInterval(this._update.bind(this), 50);
    }

    private async _onConnection(socket: Socket) {
        let connection = new Connection(this, socket);
    }

    private _update() {
        // Update the game
        updateGame(this.game);

        // Broadcast the state
        this.socketServer.emit("update", this.game.state);
    }
}
