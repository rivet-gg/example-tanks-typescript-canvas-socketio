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
    public static BULLET_VELOCITY = 20;

    constructor(private game: Game, public state: BulletState) {

    }

    update(dt: number) {
        this.state.positionX += this.state.velocityX * dt;
        this.state.positionY += this.state.velocityY * dt;
    }

    render(client: Client, ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.translate(this.state.positionX, -this.state.positionY);

        // Draw bullet
        ctx.save();
        ctx.rotate(Math.atan2(-this.state.velocityY, this.state.velocityX) + Math.PI / 2);
        let bulletWidth = client.assets.bullet.width * Assets.SCALE_FACTOR;
        let bulletHeight = client.assets.bullet.height * Assets.SCALE_FACTOR;
        ctx.drawImage(client.assets.bullet, -bulletWidth / 2, -bulletHeight / 2, bulletWidth, bulletHeight);
        ctx.restore();

        ctx.restore();
    }
}
