import { Client } from "../client/Client";
import { BulletState, BULLET_RADIUS } from "./Bullet";
import { EntityState } from "./Entity";
import { createExplosion } from "./Explosion";
import { Game, generateId } from "./Game";
import { checkCircleCollision } from "./Physics";
import { PlayerState, PLAYER_RADIUS } from "./Player";

export interface BarrelState extends EntityState {
    id: number;
    positionX: number;
    positionY: number;
    health: number;
}

const BARREL_RADIUS: number = 24;

export function createBarrel(
    game: Game,
    positionX: number,
    positionY: number
): BarrelState {
    let state = {
        id: generateId(game),
        positionX: positionX,
        positionY: positionY,
        health: 2,
    };
    game.state.barrels[state.id] = state;
    return state;
}

export function updateBarrel(game: Game, state: BarrelState, dt: number) {
    for (let playerId in game.state.players) {
        let player = game.state.players[playerId];
        if (
            checkCircleCollision(
                state.positionX,
                state.positionY,
                BARREL_RADIUS,
                player.positionX,
                player.positionY,
                PLAYER_RADIUS
            )
        ) {
            onPlayerCollide(game, state, player);
        }
    }

    for (let bulletId in game.state.bullets) {
        let bullet = game.state.bullets[bulletId];
        if (
            checkCircleCollision(
                state.positionX,
                state.positionY,
                BARREL_RADIUS,
                bullet.positionX,
                bullet.positionY,
                BULLET_RADIUS
            )
        ) {
            onBulletCollision(game, state, bullet);
        }
    }
}

export function renderBarrel(
    client: Client,
    state: BarrelState,
    ctx: CanvasRenderingContext2D
) {
    ctx.save();

    ctx.translate(state.positionX, -state.positionY);

    let barrelWidth = client.assets.barrel.width * client.assets.scaleFactor;
    let barrelHeight = client.assets.barrel.height * client.assets.scaleFactor;
    ctx.drawImage(
        client.assets.barrel,
        -barrelWidth / 2,
        -barrelHeight / 2,
        barrelWidth,
        barrelHeight
    );

    ctx.restore();
}

function onPlayerCollide(game: Game, state: BarrelState, player: PlayerState) {
    let dirX = player.positionX - state.positionX;
    let dirY = player.positionY - state.positionY;
    let mag = Math.sqrt(dirY * dirY + dirX * dirX);
    let offset = BARREL_RADIUS + PLAYER_RADIUS;
    player.positionX = state.positionX + (dirX / mag) * offset;
    player.positionY = state.positionY + (dirY / mag) * offset;
}

function onBulletCollision(
    game: Game,
    state: BarrelState,
    bullet: BulletState
) {
    delete game.state.bullets[bullet.id];

    if (game.isServer) {
        state.health -= 1;
        if (state.health <= 0) {
            delete game.state.barrels[state.id];
            createExplosion(game, state.positionX, state.positionY);
        }
    }
}
