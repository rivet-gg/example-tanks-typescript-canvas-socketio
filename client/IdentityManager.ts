import {
    IdentityService,
	IdentityProfile,
	GlobalEventNotification,
	ChatThread,
	PartySummary,
	MatchmakerLobbyJoinInfo,
	GetIdentitySelfProfileCommandOutput,
	WatchEventsCommandOutput,
} from "@rivet-gg/identity";
import { RepeatingRequest } from "@rivet-gg/common";

export class IdentityManager {
	private service: IdentityService;

	private identityUpdateHandler?: (identity: IdentityProfile) => void;
	private chatMessageHandler?: (
		thread: ChatThread,
		notification?: GlobalEventNotification
	) => void;
	private partyUpdateHandler?: (
		party: PartySummary,
		notification?: GlobalEventNotification
	) => void;
	private matchmakerLobbyJoinHandler?: (
		lobby: MatchmakerLobbyJoinInfo,
		notification?: GlobalEventNotification
	) => void;
	private errorHandler?: (err: any) => void;

	private identityStream?: RepeatingRequest<GetIdentitySelfProfileCommandOutput>;
	private eventStream?: RepeatingRequest<WatchEventsCommandOutput>;

	constructor() {
		this.service = new IdentityService({
            endpoint: "https://identity.api.rivet.gg/v1",
        });
	}

	withService(service: IdentityService) {
		this.service = service;
	}

	async build(token?: string): Promise<void> {
		let { identityToken } = await this.service.setupIdentity({
			existingIdentityToken: token ?? this.fetchToken(),
		});

		this.service.config.token = identityToken!;
		this.saveToken(identityToken!);

		this.startStreams();
	}

	onIdentityUpdate(handler: IdentityManager["identityUpdateHandler"]) {
		this.identityUpdateHandler = handler;
	}

	onChatMessage(handler: IdentityManager["chatMessageHandler"]) {
		this.chatMessageHandler = handler;
	}

	onPartyUpdate(handler: IdentityManager["partyUpdateHandler"]) {
		this.partyUpdateHandler = handler;
	}

	onMatchmakerLobbyJoin(
		handler: IdentityManager["matchmakerLobbyJoinHandler"]
	) {
		this.matchmakerLobbyJoinHandler = handler;
	}

	onError(handler: IdentityManager["errorHandler"]) {
		this.errorHandler = handler;
	}

	private startStreams() {
		this.identityStream = new RepeatingRequest(
			async (abortSignal, watchIndex) => {
				return await this.service.getIdentitySelfProfile(
					{ watchIndex },
					{ abortSignal }
				);
			}
		);

		this.identityStream.onMessage((res) => {
			if (this.identityUpdateHandler !== undefined)
				this.identityUpdateHandler(res.identity!);
		});
		this.identityStream.onError(this.handleError);

		this.eventStream = new RepeatingRequest(
			async (abortSignal, watchIndex) => {
				return await this.service.watchEvents(
					{ watchIndex },
					{ abortSignal }
				);
			}
		);

		this.eventStream.onMessage((res) => {
			for (let event of res.events!) {
				if (event.kind!.chatMessage) {
					if (this.chatMessageHandler !== undefined) {
						this.chatMessageHandler(
							event.kind!.chatMessage.thread!,
							event.notification
						);
					}
				} else if (event.kind!.matchmakerLobbyJoin) {
					if (this.matchmakerLobbyJoinHandler !== undefined) {
						this.matchmakerLobbyJoinHandler(
							event.kind!.matchmakerLobbyJoin.lobby!,
							event.notification
						);
					}
				} else if (event.kind!.partyUpdate) {
					if (this.partyUpdateHandler !== undefined) {
						this.partyUpdateHandler(
							event.kind!.partyUpdate.party!,
							event.notification
						);
					}
				}
			}
		});
		this.eventStream.onError(this.handleError);
	}

	private fetchToken() {
		if (typeof window === "undefined") return undefined;

		return window.localStorage.getItem("rivet:token") ?? undefined;
	}

	private saveToken(token: string) {
		if (typeof window === "undefined") return;

		window.localStorage.setItem("rivet:token", token);
	}

	private handleError(err: any) {
		if (this.errorHandler !== undefined) this.errorHandler(err);
		else console.error(err);
	}
}

export interface SetupIdentityConfig {
	token?: string;
	service?: IdentityService;

	onIdentityUpdate?: IdentityManager["identityUpdateHandler"];
	onChatMessage?: IdentityManager["chatMessageHandler"];
	onPartyUpdate?: IdentityManager["partyUpdateHandler"];
	onMatchmakerLobbyJoin?: IdentityManager["matchmakerLobbyJoinHandler"];
	onError?: IdentityManager["errorHandler"];
}

export async function setupIdentity(opts: SetupIdentityConfig) {
	let manager = new IdentityManager();

	if (opts.service !== undefined) manager.withService(opts.service);

	if (opts.onIdentityUpdate !== undefined)
		manager.onIdentityUpdate(opts.onIdentityUpdate);
	if (opts.onChatMessage !== undefined)
		manager.onChatMessage(opts.onChatMessage);
	if (opts.onPartyUpdate !== undefined)
		manager.onPartyUpdate(opts.onPartyUpdate);
	if (opts.onMatchmakerLobbyJoin !== undefined)
		manager.onMatchmakerLobbyJoin(opts.onMatchmakerLobbyJoin);
	if (opts.onError !== undefined) manager.onError(opts.onError);

	await manager.build(opts.token);

	return manager;
}