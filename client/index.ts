import { Client, createClient } from "./Client";

let client: Client;
window.addEventListener("load", () => {
    client = createClient();
});
