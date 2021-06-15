import { Client } from "./Client";

window.addEventListener("load", () => {
    Client.shared = new Client();
});
