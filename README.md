# Rivet Example Project

**This is the starter branch for walking through the integration of a game in to Rivet.** To see the completed demo, go [here](https://github.com/rivet-gg/example-tanks-typescript-canvas-socketio/tree/checkpoint/03-integrate-server).

| Language   | Rendering      | Networking |
| ---------- | -------------- | ---------- |
| TypeScript | HTML5 Canvas | Socket.io  |


## Prerequisites

- [Rivet Developer Account](https://rivet.gg/developer)
    - Ensure you've already created a Rivet game for this tutorial
- [Rivet CLI](https://github.com/rivet-gg/cli)
- Node.js 16+

## Guide

The following guide will walk you through integraing and deploying a game with Rivet.

<details>
<summary>
Step 1: Run locally without Rivet
</summary>

Run the following commands in your terminal to run the project locally:

```
npm install
npm start
```

This will open your browser to http://localhost:8080. Verify the game works.
</details>

<details>
<summary>
Step 2: Initialize project
</summary>

Run the following command to setup your project:

```bash
rivet init \
    --recommend \
    --matchmaker \
    --matchmaker-port 3000 \
    --matchmaker-dockerfile Dockerfile \
    --cdn \
    --cdn-build-command "npm install && npm run build:client:prod" \
    --cdn-build-output ./dist/
```

> **What did this do?**
>
> - Linked your project to Rivet
> - Created `rivet.version.toml` file that configures how to run your game.
> - Added a development token to your `.env` that lets you develop with Rivet on your local machine

You can also run `rivet init` wihtout any flags to go through the interactive setup process.

[🛟 *Checkpoint* 🛟](https://github.com/rivet-gg/example-tanks-typescript-canvas-socketio/tree/checkpoint/01-init)
</details>

<details>
<summary>
Step 3: Install `@rivet-gg/api`
</summary>

Run the following to install the library to interact with Rivet:

```
npm install --save @rivet-gg/api
```

[🛟 *Checkpoint* 🛟](https://github.com/rivet-gg/example-tanks-typescript-canvas-socketio/tree/checkpoint/01-init)
</details>

<details>
<summary>
Step 4: Integrate Rivet Matchmaker in to the client
</summary>

Add the following to the top of `client/Client.ts`:

**client/Client.ts**

````typescript
import { RivetClient } from "@rivet-gg/api";
export const RIVET = new RivetClient({ token: process.env.RIVET_TOKEN });
````

Find the `connect` function in `client/Client.ts` and replace it with the following:

**client/Client.ts**

```typescript
async function connect(client: Client) {
	let res = await RIVET.matchmaker.lobbies.find({ gameModes: ["default"] });
	let port = res.ports["default"];
	client.connection = new Connection(client, port.isTls, port.host, {
		token: res.player.token,
	});
}
```

Run `npm start` again and validate the game still connects.

Open the network inspector and reload to see a `POST` request to `https://matchmaker.api.rivet.gg/v1/lobbies/find`.

[🛟 *Checkpoint* 🛟](https://github.com/rivet-gg/example-tanks-typescript-canvas-socketio/tree/checkpoint/02-integrate-client)
</details>

<details>
<summary>
Step 5: Integrate Rivet Matchmaker in to the server
</summary>

Add the following to the top of `server/index.ts`:

**server/index.ts**

```typescript
import { RivetClient } from "@rivet-gg/api";
export const RIVET = new RivetClient({ token: process.env.RIVET_TOKEN });

// Notify Rivet that this lobby is ready to accept players
RIVET.matchmaker.lobbies.ready();
```

Find the `setupConnection` function in `server/index.ts` and replace it with the following:

**server/index.ts**

```typescript
async function setupConnection(socket: Socket) {
    // Read the token passed to the socket query
    let playerToken = socket.handshake.query.token as string;

    // Validate the player token with the matchmaker
    await RIVET.matchmaker.players.connected({ playerToken });

    // Remove the player when disconnected
    socket.on("disconnect", () => RIVET.matchmaker.players.disconnected({ playerToken }));

    new Connection(game, socket);
}
```

[🛟 *Checkpoint* 🛟](https://github.com/rivet-gg/example-tanks-typescript-canvas-socketio/tree/checkpoint/03-integrate-server)
</details>

<details>
<summary>
Step 6: Deploy to Rivet
</summary>

Deploy your game to Rivet with:

```bash
rivet deploy --namespace prod
```

The CLI will print a link ending in *rivet.game*. Share the link with a friend to play your game on Rivet!

> **What did this do?**
>
> - Build & upload your Docker image for [Rivet Serverless Lobbies](https://docs.rivet.gg/serverless-lobbies/introduction)
> - Build & upload your site for [Rivet CDN](https://docs.rivet.gg/cdn/introduction)
> - Create a version on Rivet
> - Deploy the version to the *Production* namespace
</details>
