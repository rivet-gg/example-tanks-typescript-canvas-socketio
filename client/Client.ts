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
        this.input.onKeyDown(" ", this._shootBullet.bind(this));

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
        if (this.currentPlayerId === undefined) {
            let player = this.game.createPlayer();
            this.currentPlayerId = player.state.id;
        }
    }

    private _shootBullet() {
        let currentPlayer = this.currentPlayer;
        if (currentPlayer) {
            currentPlayer.shoot();
        }
    }

    private _update() {
        // Update the current player's state
        let currentPlayer = this.currentPlayer;
        if (currentPlayer) {
            // Determine move direction
            let moveX = 0;
            let moveY = 0;
            if (this.input.isKeyDown("a")) moveX -= 1;
            if (this.input.isKeyDown("d")) moveX += 1;
            if (this.input.isKeyDown("s")) moveY -= 1;
            if (this.input.isKeyDown("w")) moveY += 1;

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

            // Determine rotation
            currentPlayer.state.aimDir = Math.atan2(
                this.input.mousePosition.y - this.canvas.clientHeight / 2,
                this.input.mousePosition.x - this.canvas.clientWidth / 2,
            );
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

        ctx.save();

        // Clear any graphics left on the canvas from the last frame
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Center <0, 0> to the center of the screen and regulate the height
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        let scale = window.innerHeight / Game.SCREEN_HEIGHT;
        let screenWidth = window.innerWidth / scale;
        ctx.scale(scale, scale);

        // Center on the player (if needed)
        let cameraOffsetX = 0;
        let cameraOffsetY = 0;
        if (currentPlayer !== undefined) {
            cameraOffsetX = currentPlayer.state.positionX
            cameraOffsetY = -currentPlayer.state.positionY;
        }
        ctx.translate(-cameraOffsetX, -cameraOffsetY);

        // Draw a tiled background that fits the camera
        if (this.assets.tileSand.complete) {
            let tileSize = this.assets.tileSand.height * Assets.SCALE_FACTOR;
            let tileXMin = Math.floor((cameraOffsetX - screenWidth / 2) / tileSize);
            let tileXMax = Math.ceil((cameraOffsetX + screenWidth / 2) / tileSize);
            let tileYMin = Math.floor((cameraOffsetY - Game.SCREEN_HEIGHT / 2) / tileSize);
            let tileYMax = Math.ceil((cameraOffsetY + Game.SCREEN_HEIGHT / 2) / tileSize);
            for (let x = tileXMin; x <= tileXMax; x++) {
                for (let y = tileYMin; y <= tileYMax; y++) {
                    ctx.drawImage(this.assets.tileSand, x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }

        // Render the game
        this.game.render(this, ctx);

        ctx.restore();
    }
}
