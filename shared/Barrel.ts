import { EntityState } from "./Entity";
import { Game, generateId } from "./Game";

export interface BarrelState extends EntityState {
    id: number;
    positionX: number;
    positionY: number;
}

export function createBarrel(
    game: Game,
    positionX: number,
    positionY: number
): BarrelState {
    let state = {
        id: generateId(game),
        positionX: positionX,
        positionY: positionY,
    };
    game.state.barrels[state.id] = state;
    return state;
}
