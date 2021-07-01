import { Client } from "../client/Client";
import { BulletState, updateBullet } from "./Bullet";
import { EntityState } from "./Entity";
import { PlayerState, updatePlayer } from "./Player";
import { Utilities } from "./Utilities";

export interface Game {
    isServer: boolean;
    lastUpdateTimestamp: number;
    idCounter: number;

    arenaSize: number;
    viewportHeight: number;

    state: GameState;
}

export interface GameState {
    players: { [id: number]: PlayerState };
    bullets: { [id: number]: BulletState };
}

export function createGame(isServer: boolean): Game {
    return {
        isServer: isServer,
        lastUpdateTimestamp: Date.now(),
        idCounter: 1,

        arenaSize: 2000,
        viewportHeight: 900,

        state: {
            players: {},
            bullets: {},
        },
    };
}

export function generateId(game: Game): number {
    return game.idCounter++;
}

export function updateGame(game: Game) {
    // Determine the time since the last frame
    let now = Date.now();
    let dt = (now - game.lastUpdateTimestamp) / 1000; // Convert from milliseconds to seconds
    game.lastUpdateTimestamp = now;

    // Update all entities
    for (let playerId in game.state.players) {
        updatePlayer(game, game.state.players[playerId], dt);
    }
    for (let bulletId in game.state.bullets) {
        updateBullet(game, game.state.bullets[bulletId], dt);
    }
}
