import {Assets} from "../client/Assets";
import {Client} from "../client/Client";
import {Game} from "./Game";
import {Bullet} from "../shared/Bullet";
import { Utilities } from "./Utilities";

export interface PlayerState {
    id: number,
    positionX: number,
    positionY: number,
    aimDir: number,
    moveX: number,
    moveY: number,
    health: number,
    score: number,
}

export class Player {
    public moveSpeed: number = 500
    public radius: number = 76;
    public barrelLength: number = 45;

    public constructor(private game: Game, public state: PlayerState) {
    }
    
    public update(dt: number) {
        // Move the player based on the move input
        this.state.positionX += this.state.moveX * this.moveSpeed * dt;
        this.state.positionY += this.state.moveY * this.moveSpeed * dt;

        // Restrain to bounds
        this.state.positionX = Math.max(this.state.positionX, -this.game.arenaSize / 2 + this.radius)
        this.state.positionX = Math.min(this.state.positionX, this.game.arenaSize / 2 - this.radius)
        this.state.positionY = Math.max(this.state.positionY, -this.game.arenaSize / 2 + this.radius)
        this.state.positionY = Math.min(this.state.positionY, this.game.arenaSize / 2 - this.radius)
    }

    public render(client: Client, ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.translate(this.state.positionX, -this.state.positionY);

        // Draw body
        ctx.save();
        ctx.rotate(Math.atan2(-this.state.moveY, this.state.moveX) + Math.PI / 2);
        let bodyWidth = client.assets.tankBodyRed.width * client.assets.scaleFactor;
        let bodyHeight = client.assets.tankBodyRed.height * client.assets.scaleFactor;
        ctx.drawImage(client.assets.tankBodyRed, -bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);
        ctx.restore();

        // Draw barrel
        ctx.save();
        ctx.rotate(this.state.aimDir + Math.PI / 2);
        let barrelWidth = client.assets.tankBarrelRed.width * client.assets.scaleFactor;
        let barrelHeight = client.assets.tankBarrelRed.height * client.assets.scaleFactor;
        ctx.drawImage(client.assets.tankBarrelRed, -barrelWidth / 2, -barrelHeight * 0.75, barrelWidth, barrelHeight);
        ctx.restore();


        // Draw health
        let healthY = -this.radius - 5;
        let healthWidth = 80;
        let healthHeight = 10;
        let healthPadding = 4;
        ctx.save();
        ctx.fillStyle = "#333";
        ctx.fillRect(
            -healthWidth / 2 - healthPadding, healthY - healthHeight / 2 - healthPadding,
            healthWidth + healthPadding * 2, healthHeight + healthPadding * 2
        );
        ctx.fillStyle = "white";
        ctx.fillRect(
            -healthWidth / 2, healthY - healthHeight / 2,
            healthWidth * this.state.health, healthHeight
        );
        ctx.restore();

        // Draw score
        let scoreY = healthY - 25;
        ctx.save();
        ctx.fillStyle = "white";
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 6;
        ctx.font = Utilities.font(32, 700);
        ctx.strokeText(this.state.score.toString(), 0, scoreY);
        ctx.fillText(this.state.score.toString(), 0, scoreY);
        ctx.restore();

        ctx.restore();
    }

    public shoot() {
        let dirX = Math.cos(this.state.aimDir);
        let dirY = -Math.sin(this.state.aimDir);

        let bullet = this.game.createBullet(this.state.id);

        // Position at the end of the barrel
        bullet.state.positionX = this.state.positionX + dirX * this.barrelLength;
        bullet.state.positionY = this.state.positionY + dirY * this.barrelLength;

        // Set the velocity to the direction of the barrel
        bullet.state.velocityX = dirX * Bullet.BULLET_VELOCITY;
        bullet.state.velocityY = dirY * Bullet.BULLET_VELOCITY;
    }

    public damage(amount: number, damagerId?: number) {
        this.state.health -= amount;
        if (this.state.health <= 0) {
            this._onKill(damagerId);
        }
    }

    public score(points: number) {
        this.state.score += points;
    }

    private _onKill(killerId?: number) {
        // Give points to the killer
        if (killerId) {
            let killer = this.game.playerWithId(killerId);
            if (killer) {
                killer.score(1);
            }
        }

        // Remove this player
        this.game.removePlayer(this.state.id);
    }
}
