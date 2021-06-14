import { Input } from "./Input";
import { Game } from "../shared/Game";
import {Assets} from "./Assets";
import {Player} from "../shared/Player";
import * as RIVET from "@rivet-gg/api-game";
import {Connection} from "./Connection";

export class Client {
    public static shared: Client;

    public canvas: HTMLCanvasElement;

    public input: Input;
    public assets: Assets;

    public game: Game;
    public currentPlayerId?: number;

    public rivet: RIVET.ClientApi;
    public connection?: Connection;

    public screenWidth: number = 0;
    public screenHeight: number = 0;
    public cameraOffsetX: number = 0;
    public cameraOffsetY: number = 0;

    public get currentPlayer(): Player | undefined {
        if (this.currentPlayerId) {
            return this.game.playerWithId(this.currentPlayerId)
        } else {
            return undefined;
        }
    }

    constructor() {
        this.canvas = document.getElementById("game") as any;

        this.input = new Input();
        this.input.onKeyDown("enter", this._joinGame.bind(this));
        this.input.onKeyDown(" ", this._shoot.bind(this));

        this.game = new Game();
        this.assets = new Assets();

        window.addEventListener("resize", this._resize.bind(this));
        this._resize();
        this._update();

        this.rivet = new RIVET.ClientApi(new RIVET.Configuration({
            accessToken: process.env.RIVET_CLIENT_TOKEN,
        }));
        this._connect();
    }

    private async _connect() {
        try {
            console.log("Finding lobby...");
            let findRes = await this.rivet.findLobby({
                gameModes: ["default"],
            });
            if (!findRes.lobby) throw new Error("lobby not found");

            console.log("Connecting...");
            this.connection = new Connection(this, findRes.lobby);
        } catch (err) {
            console.error("Failed to connect:", err);
            return;
        }
    }

    private _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    private _joinGame() {
        this.connection?.socket.emit("join", (playerId: number) => {
            this.currentPlayerId = playerId;
        });
    }

    private _shoot() {
        this.connection?.socket.emit("shoot");
    }

    private _update() {
        // Update the current player's state
        let currentPlayer = this.currentPlayer;
        if (currentPlayer) {
            // TODO: Throttle this

            // Determine move direction
            let moveX = 0;
            let moveY = 0;
            if (this.input.isKeyDown("a")) moveX -= 1;
            if (this.input.isKeyDown("d")) moveX += 1;
            if (this.input.isKeyDown("s")) moveY -= 1;
            if (this.input.isKeyDown("w")) moveY += 1;

            // Determine rotation
            let aimDir = Math.atan2(
                this.input.mousePosition.y - this.canvas.clientHeight / 2,
                this.input.mousePosition.x - this.canvas.clientWidth / 2,
            );

            this.connection?.socket.emit("input", moveX, moveY, aimDir);
        }

        // Update the game
        this.game.update();

        // Render the game
        let ctx = this.canvas.getContext("2d")!;
        this._render(ctx);

        // Ask the browser to call this update function again on the next frame.
        requestAnimationFrame(this._update.bind(this));
    }

    private _render(ctx: CanvasRenderingContext2D) {
        let currentPlayer = this.currentPlayer;

        // Update world screen width and height
        let scale = window.innerHeight / this.game.viewportHeight;
        this.screenWidth = window.innerWidth / scale;
        this.screenHeight = window.innerHeight / scale;

        ctx.save();

        // Clear any graphics left on the canvas from the last frame
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Center <0, 0> to the center of the screen and scale to have an equal height on all devices
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.scale(scale, scale);

        // Center on the player (if needed)
        if (currentPlayer !== undefined) {
            this.cameraOffsetX = currentPlayer.state.positionX
            this.cameraOffsetY = -currentPlayer.state.positionY;
        } else {
            this.cameraOffsetX = 0;
            this.cameraOffsetY = 0;
        }

        // Render the world
        ctx.save();
        ctx.translate(-this.cameraOffsetX, -this.cameraOffsetY);
        this._renderBackground(ctx);
        this._renderWall(ctx);
        this.game.render(this, ctx);
        ctx.restore();

        // Render menu in front of game
        this._renderMenu(ctx);

        ctx.restore();
    }

    private _renderBackground(ctx: CanvasRenderingContext2D) {
        if (this.assets.tileSand.complete) {
            let tileSize = this.assets.tileSand.height * this.assets.scaleFactor;
            let tileXMin = Math.floor((this.cameraOffsetX - this.screenWidth / 2) / tileSize);
            let tileXMax = Math.ceil((this.cameraOffsetX + this.screenWidth / 2) / tileSize);
            let tileYMin = Math.floor((this.cameraOffsetY - this.game.viewportHeight / 2) / tileSize);
            let tileYMax = Math.ceil((this.cameraOffsetY + this.game.viewportHeight / 2) / tileSize);
            for (let x = tileXMin; x <= tileXMax; x++) {
                for (let y = tileYMin; y <= tileYMax; y++) {
                    ctx.drawImage(this.assets.tileSand, x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }
    }

    private _renderWall(ctx: CanvasRenderingContext2D) {
        if (this.assets.wall.complete) {
            let idealSpacing = 60;
            let wallSpacing = this.game.arenaSize / Math.ceil(this.game.arenaSize / idealSpacing);  // Space evenly
            let wallSize = this.assets.wall.width * this.assets.scaleFactor;
            let tileXYMin = Math.floor(-this.game.arenaSize / 2 / wallSpacing);
            let tileXYMax = Math.ceil(this.game.arenaSize / 2 / wallSpacing);
            for (let x = tileXYMin; x <= tileXYMax; x++) {
                for (let y = tileXYMin; y <= tileXYMax; y++) {
                    if (x == tileXYMin || x == tileXYMax || y == tileXYMin || y == tileXYMax) {
                        ctx.drawImage(this.assets.wall, x * wallSpacing - wallSize / 2, y * wallSpacing - wallSize / 2, wallSize, wallSize);
                    }
                }
            }
        }
    }

    private _renderMenu(ctx: CanvasRenderingContext2D) {

        if (!this.connection?.isConnected) {
            this._renderFullscreenMessage(ctx, "Connecting...");
        } else if (!this.currentPlayerId) {
            this._renderFullscreenMessage(ctx, "Press Enter to join");
        }
    }

    private _renderFullscreenMessage(ctx: CanvasRenderingContext2D, message: string) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(-this.screenWidth / 2, -this.screenHeight / 2, this.screenWidth, this.screenHeight);
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "32px Helvetica";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Press Enter to join", 0, 0);
        ctx.restore();
    }
}
