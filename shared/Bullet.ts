import {Assets} from "../client/Assets";
import {Client} from "../client/Client";
import {Game} from "./Game";

export interface BulletState {
    id: number,
    positionX: number,
    positionY: number,
    velocityX: number,
    velocityY: number,
}

export class Bullet {
    public static BULLET_VELOCITY = 1500;

    public radius: number = 42;

    constructor(private game: Game, public state: BulletState) {

    }

    update(dt: number) {
        // Move bullet
        this.state.positionX += this.state.velocityX * dt;
        this.state.positionY += this.state.velocityY * dt;

        // Check if collided with border
        if (this.game.isServer) {
            if (Math.abs(this.state.positionX) > this.game.arenaSize / 2 || Math.abs(this.state.positionY) > this.game.arenaSize / 2) {
                this.game.removeBullet(this.state.id);
            }
        }
    }

    render(client: Client, ctx: CanvasRenderingContext2D) {
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
}
