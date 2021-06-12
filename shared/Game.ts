import {Client} from "../client/Client";
import {Bullet} from "./Bullet";
import {Player} from "./Player";

export class Game {
    public static SCREEN_HEIGHT: number = 12;

    public lastUpdateTimestamp: number = Date.now();
    public players: Player[] = [];
    public bullets: Bullet[] = [];

    private _idCounter = 1;

    constructor() {
        
    }

    public generateId(): number {
        return this._idCounter++;
    }

    public update() {
        // Determine the time since the last frame
        let now = Date.now();
        let dt = (now - this.lastUpdateTimestamp) / 1000;  // Convert from milliseconds to seconds
        this.lastUpdateTimestamp = now;

        // Update all entities
        for (let player of this.players) {
            player.update(dt);
        }
        for (let bullet of this.bullets) {
            bullet.update(dt);
        }
    }

    public render(client: Client, ctx: CanvasRenderingContext2D) {
        for (let player of this.players) {
            player.render(client, ctx);
        }
        for (let bullet of this.bullets) {
            bullet.render(client, ctx);
        }
    }

    public createPlayer(): Player {
        let player = new Player(this, {
            id: this.generateId(),
            positionX: 0,
            positionY: 0,
            aimDir: 0,
            moveX: 0,
            moveY: 0,
        });
        this.players.push(player);
        return player;
    }

    public createBullet(): Bullet {
        let bullet = new Bullet(this, {
            id: this.generateId(),
            positionX: 0,
            positionY: 0,
            velocityX: 0,
            velocityY: 0,
        });
        this.bullets.push(bullet);
        return bullet;
    }

    public playerWithId(id: number): Player | undefined {
        return this.players.find(player => player.state.id == id);
    }
}
