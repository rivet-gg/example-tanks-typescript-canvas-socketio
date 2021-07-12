import { Client } from "../client/Client";
import { BulletState, BULLET_RADIUS } from "./Bullet";
import { EntityState } from "./Entity";
import { Game, generateId } from "./Game";
import { checkCircleCollision } from "./Physics";
import { PlayerState, PLAYER_RADIUS } from "./Player";

export interface ExplosionState extends EntityState {
    id: number;
    positionX: number;
    positionY: number;
}

const EXPLOSION_RADIUS: number = 24;

export function createExplosion(
    game: Game,
    positionX: number,
    positionY: number
): ExplosionState {
    let state = {
        id: generateId(game),
        positionX: positionX,
        positionY: positionY,
    };
    game.state.explosions[state.id] = state;
    return state;
}

export function updateExplosion(
    game: Game,
    state: ExplosionState,
    dt: number
) {}

export function renderExplosion(
    client: Client,
    state: ExplosionState,
    ctx: CanvasRenderingContext2D
) {
    ctx.save();

    ctx.translate(state.positionX, -state.positionY);

    let explosionWidth =
        client.assets.explosion.width * client.assets.scaleFactor;
    let explosionHeight =
        client.assets.explosion.height * client.assets.scaleFactor;
    ctx.drawImage(
        client.assets.explosion,
        -explosionWidth / 2,
        -explosionHeight / 2,
        explosionWidth,
        explosionHeight
    );

    ctx.restore();
}
