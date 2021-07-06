import { Client } from "../client/Client";
import { EntityState } from "./Entity";
import { Game, generateId } from "./Game";
import { checkCircleCollision } from "./Physics";
import { damagePlayer, PlayerState, PLAYER_RADIUS } from "./Player";

export interface BulletState extends EntityState {
    id: number;
    shooterId: number;
    positionX: number;
    positionY: number;
    velocityX: number;
    velocityY: number;
    bounces: number;
}

const BULLET_VELOCITY: number = 1500;
export const BULLET_RADIUS: number = 42;
const BULLET_DAMAGE: number = 0.22;

export function createBullet(
    game: Game,
    shooterId: number,
    positionX: number,
    positionY: number,
    dir: number
): BulletState {
    let velocityX = Math.cos(dir) * BULLET_VELOCITY;
    let velocityY = Math.sin(dir) * BULLET_VELOCITY;

    let state = {
        id: generateId(game),
        shooterId: shooterId,
        positionX: positionX,
        positionY: positionY,
        velocityX: velocityX,
        velocityY: velocityY,
        bounces: 0,
    };
    game.state.bullets[state.id] = state;
    return state;
}

export function updateBullet(game: Game, state: BulletState, dt: number) {
    // Move bullet
    state.positionX += state.velocityX * dt;
    state.positionY += state.velocityY * dt;

    if (state.positionX > game.arenaSize / 2) {
        state.velocityX = -Math.abs(state.velocityX);
        didBounce(game, state);
    }
    if (state.positionX < -game.arenaSize / 2) {
        state.velocityX = Math.abs(state.velocityX);
        didBounce(game, state);
    }
    if (state.positionY > game.arenaSize / 2) {
        state.velocityY = -Math.abs(state.velocityY);
        didBounce(game, state);
    }
    if (state.positionY < -game.arenaSize / 2) {
        state.velocityY = Math.abs(state.velocityY);
        didBounce(game, state);
    }

    if (game.isServer) {
        // Check if collided with another player
        for (let playerId in game.state.players) {
            let player = game.state.players[playerId];
            if (
                player.id != state.shooterId &&
                checkCircleCollision(
                    state.positionX,
                    state.positionY,
                    BULLET_RADIUS,
                    player.positionX,
                    player.positionY,
                    PLAYER_RADIUS
                )
            ) {
                onPlayerCollision(game, state, player);
                return;
            }
        }
    }
}

export function renderBullet(
    client: Client,
    state: BulletState,
    ctx: CanvasRenderingContext2D
) {
    ctx.save();

    ctx.translate(state.positionX, -state.positionY);

    // Draw bullet
    ctx.save();
    ctx.rotate(Math.atan2(-state.velocityY, state.velocityX) + Math.PI / 2);
    let bulletWidth = client.assets.bullet.width * client.assets.scaleFactor;
    let bulletHeight = client.assets.bullet.height * client.assets.scaleFactor;
    ctx.drawImage(
        client.assets.bullet,
        -bulletWidth / 2,
        -bulletHeight / 2,
        bulletWidth,
        bulletHeight
    );
    ctx.restore();

    ctx.restore();
}

function onPlayerCollision(
    game: Game,
    state: BulletState,
    player: PlayerState
) {
    damagePlayer(game, player, BULLET_DAMAGE, state.shooterId);
    delete game.state.bullets[state.id];
}

function didBounce(game: Game, state: BulletState) {
    state.bounces += 1;

    if (state.bounces > 1) {
        delete game.state.bullets[state.id];
    }
}
