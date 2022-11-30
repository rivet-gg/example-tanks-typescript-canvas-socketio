# Rivet Example Project

**Language:** TypeScript
**Rendering:** HTML5 Canvas
**Networking:** Socket.io

This is the starter branch for walking through the integration of a game in to Rivet.

## Prerequisites

- [Rivet Developer Account](https://rivet.gg/developer)
- [Rivet CLI](https://github.com/rivet-gg/cli)
- GitHub repository
- Node.js 16+
- Optional: Yarn

## Guide

The following guide will walk you through integraing and deploying a game with Rivet.

## Step 1: Run local

```
yarn install
yarn start
```

or

```
npm install
npm start
```

This should open your browser to http://localhost:8080. Verify the game works correctly.

## Step 2: Initialize project

Create a cloud token from *API > Create Cloud Token* and copy this to your clipboard.

Then run the following command to setup your project:

```bash
rivet init \
    --recommended \
    --dockerfile-path ./Dockerfile \
    --cdn-build-command "yarn install && yarn run build:client" \
    --cdn-path ./dist/ \
    --dev-hostname 127.0.01 \
    --dev-port default:http:5000 \
    --dev-env
```

This does three main thing:
- Create `rivet.version.toml` to configure your deployed game
- Create `.github/workflows/rivet-publish.yaml` to enable Git integration with Rivet
- Create a dev token added to your `.env` to tell RIvet to mock API endpoints in development

If you're curious about more options, run `rivet init` without any flags to go
through the interactive setup process.


## Step 3: Install `@rivet-gg/matchmaker`

```bash
yarn add @rivet-gg/matchmaker
```

or

```bash
npm install --save @rivet-gg/matchmaker
```

## Step 4: Integrate Rivet Matchmaker to the client

Add the following to the top of `client/Client.ts`:

````typescript
import { MatchmakerService } from "@rivet-gg/matchmaker";
export const MATCHMAKER = new MatchmakerService({});
````

Find the `connect` function in `client/Client.ts` and replace it with the following:

```typescript
async function connect(client: Client) {
	let res = await MATCHMAKER.findLobby({ gameModes: ["default"] });
	let port = res.lobby!.ports!["default"];
	client.connection = new Connection(client, port.isTls!, port.host!, {
		token: res.lobby!.player!.token!,
	});
}
```

Run `yarn start` again and validate the game still connects. Open the network inspector and reload to see a `POST` request to `https://matchmaker.api.rivet.gg/v1/lobbies/find`.

## Step 5: Integrate Rivet Matchmaker in to your server

Add the following to the top of `server/index.ts`:

```typescript
import { MatchmakerService } from "@rivet-gg/matchmaker";
export const MATCHMAKER = new MatchmakerService({});

// Tell the matchmaker that this lobby is ready to start accepting players
MATCHMAKER.lobbyReady({});
```

Find the `setupConnection` function in `server/index.ts` and replace it with the following:

```typescript
async function setupConnection(socket: Socket) {
    // Read the token passed to the socket query
    let playerToken = socket.handshake.query.token as string;

    // Validate the player token with the matchmaker
    await MATCHMAKER.playerConnected({ playerToken });

    // Remove the player when disconnected
    socket.on("disconnect", () => MATCHMAKER.playerDisconnected({ playerToken }));

    new Connection(game, socket);
}
```

## Step 5: Configure GitHub Actions secret

Create another cloud token from *API > Create Cloud Token* and copy this to your clipboard.

Open your GitHub repository and navigate to *Settings > Secrets > Actions*. Click *New repository secret*. Name it `RIVET_CLOUD_TOKEN`. Paste your cloud token as the secret. Click *Add secret*.

## Step 6: Push to GitHub

Push your repository to GitHub.

You'll see your project build and deploy to Rivet under the *Actions* tab on GitHub.

Navigate to your game in the Rivet dashboard and validate that the new versino is live.

If your build succeeds, your game will be live on rivet.game for anyone to play. For example, if your game's name ID is `my-game` and your branch is `main`, then you can visit `my-game--main.rivet.game` to play your game. (Note the double `--`.)

