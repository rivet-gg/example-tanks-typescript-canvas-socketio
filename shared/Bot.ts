import { Client } from "../client/Client";
import { BulletState, createBullet } from "./Bullet";
import { EntityState } from "./Entity";
import { Game, generateId } from "./Game";
import { checkCircleCollision, checkPlayerDistance } from "./Physics";
import { PlayerState, PLAYER_RADIUS } from "./Player";
import { Utilities } from "./Utilities";

export const BOT_MOVE_SPEED: number = 150;
export const BOT_RADIUS: number = 38;
export const BOT_LENGTH: number = 45;

export interface BotState extends EntityState {
    id: number;
    positionX: number;
    positionY: number;
    aimDir: number;
    moveX: number;
    moveY: number;
    health: number;
    score: number;
    fireCountDown: number;
}

export function createBot(game: Game): BotState {
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
        aimDir: 0,
        moveX: 0,
        moveY: 0,
        health: 1,
        score: 0,
        fireCountDown: 1,
    };
    game.state.bot[state.id] = state;
    return state;
}

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

export function shootDelay(game: Game, state: BotState, dt: number) {
    let fireCountDown = state.fireCountDown - dt;
    if (fireCountDown <= 0) {
        //console.log(fire)
        if (game.isServer) {
            shoot(game, state);
            state.fireCountDown = 1;
        }
    } else {
        state.fireCountDown = fireCountDown;
    }
}

export function updateBot(game: Game, state: BotState, dt: number) {
    for (let playerId in game.state.players) {
        let target = playerId[0];

        let targetXPos = game.state.players[playerId].positionX;
        let targetYPos = game.state.players[playerId].positionY;

        state.aimDir = Math.atan2(
            -(targetYPos - state.positionY),
            targetXPos - state.positionX
        );

        // Calc
        let distance = checkPlayerDistance(
            state.positionX,
            state.positionY,
            BOT_RADIUS,
            targetXPos,
            targetYPos,
            PLAYER_RADIUS
        );
        if (distance > 200) {
            //step 1 add emotions
            // let dirX = state.positionX - targetXPos
            // let dirY = state.positionY - targetYPos
            let dirX = targetXPos - state.positionX;
            let dirY = targetYPos - state.positionY;

            state.moveX = dirX / distance;

            state.moveY = dirY / distance;

            if (
                checkCircleCollision(
                    state.positionX,
                    state.positionY,
                    BOT_RADIUS,
                    targetXPos,
                    targetYPos,
                    PLAYER_RADIUS
                )
            ) {
                console.log("Coll true");
                let dirX = targetXPos - state.positionX;
                let dirY = targetYPos - state.positionY;
                let mag = Math.sqrt(dirY * dirY + dirX * dirX);
                let offset = BOT_RADIUS + PLAYER_RADIUS;
                state.positionX = state.positionX + (dirX / mag) * offset;
                state.positionY = state.positionY + (dirY / mag) * offset;
            }
            shootDelay(game, state, dt);
            state.positionX += state.moveX * BOT_MOVE_SPEED * dt;
            state.positionY += state.moveY * BOT_MOVE_SPEED * dt;
        }
        break;
    }

    // Move the player based on the move input

    // Restrain to bounds
    state.positionX = Math.max(
        state.positionX,
        -game.arenaSize / 2 + BOT_RADIUS
    );
    state.positionX = Math.min(
        state.positionX,
        game.arenaSize / 2 - BOT_RADIUS
    );
    state.positionY = Math.max(
        state.positionY,
        -game.arenaSize / 2 + BOT_RADIUS
    );
    state.positionY = Math.min(
        state.positionY,
        game.arenaSize / 2 - BOT_RADIUS
    );
}

export function renderBot(
    client: Client,
    state: BotState,
    ctx: CanvasRenderingContext2D
) {
    ctx.save();

    ctx.translate(state.positionX, -state.positionY);

    // Draw body
    ctx.save();
    ctx.rotate(Math.atan2(-state.moveY, state.moveX) + Math.PI / 2);
    let bodyWidth = client.assets.tankBodyRed.width * client.assets.scaleFactor;
    let bodyHeight =
        client.assets.tankBodyRed.height * client.assets.scaleFactor;
    ctx.drawImage(
        client.assets.tankBodyRed,
        -bodyWidth / 2,
        -bodyHeight / 2,
        bodyWidth,
        bodyHeight
    );
    ctx.restore();

    // Draw barrel
    ctx.save();
    ctx.rotate(state.aimDir + Math.PI / 2);
    let barrelWidth =
        client.assets.tankBarrelRed.width * client.assets.scaleFactor;
    let barrelHeight =
        client.assets.tankBarrelRed.height * client.assets.scaleFactor;
    ctx.drawImage(
        client.assets.tankBarrelRed,
        -barrelWidth / 2,
        -barrelHeight * 0.75,
        barrelWidth,
        barrelHeight
    );
    ctx.restore();

    // Draw health
    let healthY = -BOT_RADIUS - 5;
    let healthWidth = 80;
    let healthHeight = 10;
    let healthPadding = 4;
    ctx.save();
    ctx.fillStyle = "#333";
    ctx.fillRect(
        -healthWidth / 2 - healthPadding,
        healthY - healthHeight / 2 - healthPadding,
        healthWidth + healthPadding * 2,
        healthHeight + healthPadding * 2
    );
    ctx.fillStyle = "white";
    ctx.fillRect(
        -healthWidth / 2,
        healthY - healthHeight / 2,
        healthWidth * state.health,
        healthHeight
    );
    ctx.restore();

    // Draw score
    let scoreY = healthY - 25;
    ctx.save();
    ctx.fillStyle = "white";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 6;
    ctx.font = Utilities.font(32, 700);
    ctx.strokeText(state.score.toString(), 0, scoreY);
    ctx.fillText(state.score.toString(), 0, scoreY);
    ctx.restore();

    ctx.restore();
}

export function shoot(game: Game, state: BotState): BulletState {
    let dirX = Math.cos(state.aimDir);
    let dirY = -Math.sin(state.aimDir);

    let bulletX = state.positionX + dirX * BOT_LENGTH;
    let bulletY = state.positionY + dirY * BOT_LENGTH;
    return createBullet(
        game,
        state.id,
        bulletX,
        bulletY,
        Math.atan2(dirY, dirX)
    );
}

export function damageBot(
    game: Game,
    state: BotState,
    amount: number,
    damagerId?: number
) {
    state.health -= amount;
    if (state.health <= 0) {
        onBotKill(game, state, damagerId);
        createBot(game);
    }
}

function onBotKill(game: Game, state: BotState, killerId?: number) {
    // Give points to the killer
    if (killerId) {
        let killer = game.state.bot[killerId];
        if (killer) {
            killer.score += 1;
        }
    }

    // Remove this player
    delete game.state.bot[state.id];
}
