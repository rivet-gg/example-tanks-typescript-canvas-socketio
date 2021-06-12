import {Assets} from "../client/Assets";
import {Client} from "../client/Client";
import {Game} from "./Game";
import {Bullet} from "../shared/Bullet";

export interface PlayerState {
    id: number,
    positionX: number,
    positionY: number,
    aimDir: number,
    moveX: number,
    moveY: number,
}

export class Player {
    public static PLAYER_MOVE_SPEED: number = 10;
    public static BARREL_LENGTH: number = 0.46;

    constructor(private game: Game, public state: PlayerState) {
    }
    
    public update(dt: number) {
        // Move the player based on the move input
        this.state.positionX += this.state.moveX * Player.PLAYER_MOVE_SPEED * dt;
        this.state.positionY += this.state.moveY * Player.PLAYER_MOVE_SPEED * dt;
    }

    public render(client: Client, ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.translate(this.state.positionX, -this.state.positionY);

        // Draw body
        ctx.save();
        ctx.rotate(Math.atan2(-this.state.moveY, this.state.moveX) + Math.PI / 2);
        let bodyWidth = client.assets.tankBody.width * client.assets.scaleFactor;
        let bodyHeight = client.assets.tankBody.height * client.assets.scaleFactor;
        ctx.drawImage(client.assets.tankBody, -bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);
        ctx.restore();

        // Draw barrel
        ctx.save();
        ctx.rotate(this.state.aimDir + Math.PI / 2);
        let barrelWidth = client.assets.tankBarrel.width * client.assets.scaleFactor;
        let barrelHeight = client.assets.tankBarrel.height * client.assets.scaleFactor;
        ctx.drawImage(client.assets.tankBarrel, -barrelWidth / 2, -barrelHeight * 0.75, barrelWidth, barrelHeight);
        ctx.restore();

        ctx.restore();
    }

    public shoot() {
        let dirX = Math.cos(this.state.aimDir);
        let dirY = -Math.sin(this.state.aimDir);

        let bullet = this.game.createBullet();

        // Position at the end of the barrel
        bullet.state.positionX = this.state.positionX + dirX * Player.BARREL_LENGTH;
        bullet.state.positionY = this.state.positionY + dirY * Player.BARREL_LENGTH;

        // Set the velocity to the direction of the barrel
        bullet.state.velocityX = dirX * Bullet.BULLET_VELOCITY;
        bullet.state.velocityY = dirY * Bullet.BULLET_VELOCITY;
    }
}
