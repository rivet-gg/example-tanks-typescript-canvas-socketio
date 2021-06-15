import {Assets} from "../client/Assets";
import {Client} from "../client/Client";
import {Game} from "./Game";
import { Physics } from "./Physics";
import { Player } from "./Player";

export interface BulletState {
    id: number,
    shooterId: number,
    positionX: number,
    positionY: number,
    velocityX: number,
    velocityY: number,
}

export class Bullet {
    public static BULLET_VELOCITY: number = 1500;

    public radius: number = 42;
    public damage: number = 0.22;

    public constructor(private game: Game, public state: BulletState) {

    }

    public update(dt: number) {
        // Move bullet
        this.state.positionX += this.state.velocityX * dt;
        this.state.positionY += this.state.velocityY * dt;

        if (this.game.isServer) {
            // Check if collided with border
            if (Math.abs(this.state.positionX) > this.game.arenaSize / 2 || Math.abs(this.state.positionY) > this.game.arenaSize / 2) {
                this.game.removeBullet(this.state.id);
            }

            // Check if collided with another player
            for (let player of this.game.players) {
                if (player.state.id != this.state.shooterId && Physics.checkCircleCollision(this.state.positionX, this.state.positionY, this.radius, player.state.positionX, player.state.positionY, player.radius)) {
                    this._onPlayerCollision(player);
                }
            }
        }
    }

    public render(client: Client, ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.translate(this.state.positionX, -this.state.positionY);

        // Draw bullet
        ctx.save();
        ctx.rotate(Math.atan2(-this.state.velocityY, this.state.velocityX) + Math.PI / 2);
        let bulletWidth = client.assets.bullet.width * client.assets.scaleFactor;
        let bulletHeight = client.assets.bullet.height * client.assets.scaleFactor;
        ctx.drawImage(client.assets.bullet, -bulletWidth / 2, -bulletHeight / 2, bulletWidth, bulletHeight);
        ctx.restore();

        ctx.restore();
    }

    private _onPlayerCollision(player: Player) {
        player.damage(this.damage, this.state.shooterId);
        this.game.removeBullet(this.state.id);
    }
}
