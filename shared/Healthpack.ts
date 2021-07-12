import { EntityState } from "./Entity";
import { Game, generateId } from "./Game";
import { Utilities } from "./Utilities";

export interface HealthPackState extends EntityState {
    id: number;
    positionX: number;
    positionY: number;
    health: number;
}


export function createHealthPack(game: Game): HealthPackState {
    let state = {
        id: generateId(game),
        positionX: Utilities.lerp(
            -game.arenaSize / 2,
            game.arenaSize / 2,
            Math.random()
        ),
        positionY: Utilities.lerp(
            -game.arenaSize / 2,
            game.arenaSize / 2,
            Math.random()
        ),
        health: 1,
    };
    game.state.healthpack[state.id] = state;
    return state;
}
