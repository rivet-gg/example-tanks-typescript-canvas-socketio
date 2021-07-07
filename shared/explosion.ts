import { Client } from "../client/Client";
import { BARREL_RADIUS } from "./barrel";
import { EntityState } from "./Entity";
import { Game, generateId } from "./Game";
import { checkCircleCollision } from "./Physics";
import { PlayerState, PLAYER_RADIUS } from "./Player";




export const EXPLOSION_RADIUS: number = 42




export interface ExplosionState extends EntityState {
    id: number;
    positionX: number;
    positionY: number;
}




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
        game.state.explosion[state.id] = state;
        return state;
}



export function renderExplosion(
    client: Client,
    state: ExplosionState,
    ctx: CanvasRenderingContext2D
) {


    // Draw bullet
    ctx.save();
    ctx.translate(state.positionX, -state.positionY);
    let explosionWidth = client.assets.explosion.width * client.assets.scaleFactor;
    let explosionHeight = client.assets.explosion.height * client.assets.scaleFactor;
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

){
    let dirX = player.positionX - state.positionX;
    let dirY = player.positionY - state.positionY;
    let mag = Math.sqrt(dirY * dirY + dirX * dirX);
    let offset = EXPLOSION_RADIUS + PLAYER_RADIUS;
    player.positionX = state.positionX + (dirX / mag) * offset;
    player.positionY = state.positionY + (dirY / mag) * offset;
    delete game.state.players[player.id]
    delete game.state.explosion[state.id]
}




export function updateExplosion(
    game: Game,
    state: ExplosionState,
    dt: number

){
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


