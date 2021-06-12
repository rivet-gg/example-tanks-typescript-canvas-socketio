import { Server, Socket } from "socket.io";
import * as RIVET from "@rivet-gg/api-game";
import fetch from "node-fetch";

require("dotenv").config();

let rivetServer = new RIVET.ServerApi(new RIVET.Configuration({
    basePath: process.env.RIVET_GAME_API_URL,
    fetchApi: fetch,
    accessToken: process.env.RIVET_LOBBY_TOKEN,
}));

rivetServer.lobbyReady({}).then(() => console.log("lobby ready")).catch(console.error);

class Game {
    public static shared: Game;

    public players: Player[] = [];

    public constructor(public server: Server) {
        this.server.on("connection", async (socket) => {
            socket.once("join", async (playerToken: string, name: string, cb: () => void) => {
                console.log("player connecting");

                if (this.players.find(p => p.name == name)) {
                    console.warn("player already exists with name");
                    socket.disconnect();
                    return;
                }

                socket.on("disconnect", () => rivetServer.playerDisconnected({ playerToken }));
                try {
                    await rivetServer.playerConnected({ playerToken });
                } catch (err) {
                    console.error("failed to authenticate player", err);
                    socket.disconnect();
                }

                console.log("player registered");

                let player = new Player(this, socket, name);
                this.players.push(player);
                this.broadcastScores();

                socket.on("disconnect", () => {
                    console.log("player disconnect");

                    this.players.splice(this.players.indexOf(player), 1);
                    this.broadcastScores();
                });

                cb();
            });
        });
    }

    public broadcastScores() {
        let scores = this
            .players
            .map(p => {
                return { name: p.name, score: p.score };
            })
            .sort((a, b) => b.score - a.score);
        this.server.emit("scores", scores);
    }
}

class Player {
    public score: number = 0;

    public constructor(private game: Game, public socket: Socket, public name: string) {
        socket.on("score", this.onScore.bind(this));
    }

    private onScore() {
        this.score += 1;
        this.game.broadcastScores();
    }
}

function main() {
    let port = parseInt(process.env.PORT) || 7902;
    let server = new Server(port, {
        cors: {
            // origin: `http://127.0.0.1:7900`,  // TODO:
            origin: "*",
        },
    });

    Game.shared = new Game(server);
    console.log(`Listening on port ${port}`);
}

main();

