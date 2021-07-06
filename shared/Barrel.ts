import { Client } from "../client/Client";
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
