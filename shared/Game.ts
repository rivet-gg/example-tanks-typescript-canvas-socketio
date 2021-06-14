import {Client} from "../client/Client";
import {Bullet, BulletState} from "./Bullet";
import {Player, PlayerState} from "./Player";

export interface GameState {
    players: PlayerState[],
    bullets: BulletState[],
}

export class Game {
    public lastUpdateTimestamp: number = Date.now();
    public players: Player[] = [];
    public bullets: Bullet[] = [];

    public arenaSize: number = 2000;

    public viewportHeight: number = 900;

    private _idCounter = 1;

    constructor() {
        
    }

    public createState(): GameState {
        return {
            players: this.players.map(p => p.state),
            bullets: this.bullets.map(p => p.state),
        };
    }

    public applyState(state: GameState) {
        for (let playerState of state.players) {
            let player = this.playerWithId(playerState.id);
            if (!player) {
                player = new Player(this, playerState);
                this.players.push(player);
            } else {
                player.state = playerState;
            }
        }

        for (let bulletState of state.bullets) {
            let bullet = this.bulletWithId(bulletState.id);
            if (!bullet) {
                bullet = new Bullet(this, bulletState);
                this.bullets.push(bullet);
            } else {
                bullet.state = bulletState;
            }
        }

        // TODO: Remove unknown players and bullets
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

    public bulletWithId(id: number): Bullet | undefined {
        return this.bullets.find(bullet => bullet.state.id == id);
    }
}
