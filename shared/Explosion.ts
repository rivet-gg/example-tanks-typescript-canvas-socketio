import { Client } from "../client/Client";
import { createBarrel } from "./barrel";
import { EntityState } from "./Entity";
import { Game, generateId } from "./Game";
import { checkCircleCollision } from "./Physics";
import { PlayerState, PLAYER_RADIUS } from "./Player";
import { Utilities } from "./Utilities";

export const EXPLOSION_RADIUS: number = 42;

export interface ExplosionState extends EntityState {
    id: number;
    positionX: number;
    positionY: number;
    time: number;
}

export function createExplosion(
    game: Game,
    positionX: number,
    positionY: number,
    time: number
): ExplosionState {
    let state = {
        id: generateId(game),
        positionX: positionX,
        positionY: positionY,
        time: time,
    };

    game.state.explosion[state.id] = state;

    return state;
}

export function renderExplosion(
    client: Client,
    state: ExplosionState,
    ctx: CanvasRenderingContext2D
) {
    // Draw explosion
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

export function onPlayerCollide(
    game: Game,
    state: ExplosionState,
    player: PlayerState
) {
    if (game.isServer) {
        delete game.state.explosion[state.id];
        delete game.state.players[player.id];

        let positionX = Utilities.lerp(-1000, 1000, Math.random());
        let positionY = Utilities.lerp(-1000, 1000, Math.random());
        createBarrel(game, positionX, positionY);
    }
}

export function updateExplosion(game: Game, state: ExplosionState, dt: number) {
    let time = state.time - dt;
    if (time <= 0) {
        if (game.isServer) {
            delete game.state.explosion[state.id];
            let positionX = Utilities.lerp(-1000, 1000, Math.random());
            let positionY = Utilities.lerp(-1000, 1000, Math.random());
            createBarrel(game, positionX, positionY);
        }
    } else {
        state.time = time;
    }

    for (let playerId in game.state.players) {
        let player = game.state.players[playerId];
        if (
            checkCircleCollision(
                state.positionX,
                state.positionY,
                EXPLOSION_RADIUS,
                player.positionX,
                player.positionY,
                PLAYER_RADIUS
            )
        ) {
            onPlayerCollide(game, state, player);
        }
    }
}
