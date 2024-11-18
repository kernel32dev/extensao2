import * as storage from "./storage";

/** todos os diferentes modos que é possível conectar ao servidor */
export type ConnectionMode = {
    mode: "open";
} | {
    mode: "join";
    room: string;
} | {
    mode: "reconnect";
    room: string;
    member: string;
    secret: string;
};

export class GameSocket {
    private ws: WebSocket | null = null;
    private queue: CliMsg[] = [];
    private mode: ConnectionMode | null = null;
    constructor(
        public handler?: (msg: SvrMsg) => void,
    ) {
        try {
            this.mode = JSON.parse(storage.load());
        } catch (_e) {
            // ignora erros
        }
    }
    public hasSession(): boolean {
        return !!this.mode;
    }
    public connect(mode?: ConnectionMode): this {
        this.disconnect();

        this.mode = mode ?? this.mode;
        if (!this.mode) return this;

        const url = new URL("/connect", window.location.href);
        url.port = "8080";
        url.protocol = window.location.protocol === "https:" ? "wss" : "ws";
        url.searchParams.set("mode", this.mode.mode);

        if (this.mode.mode === "join") {
            url.searchParams.set("room", this.mode.room);
        } else if (this.mode.mode === "reconnect") {
            url.searchParams.set("room", this.mode.room);
            url.searchParams.set("member", this.mode.member);
            url.searchParams.set("secret", this.mode.secret);
        }

        this.ws = new WebSocket(url);
        this.ws.onmessage = this.onmessage;
        this.ws.onerror = this.onclose;
        this.ws.onclose = this.onclose;
        return this;
    }
    public disconnect() {
        if (this.ws) {
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
    }
    public send(...msg: CliMsg[]) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            for (let i = 0; i < msg.length; i++) {
                this.ws.send(JSON.stringify(msg[i]));
                if (msg[i].cmd === "Quit") {
                    this.quit();
                    return;
                }
            }
        } else {
            this.queue.push(...msg);
        }
    }
    private quit() {
        if (this.handler) this.handler({ event: "Disconnected" });
        storage.save("");
        this.mode = null;
        this.disconnect();
    }
    private onmessage = (msg: MessageEvent) => {
        if (this.handler && this.ws && typeof msg.data === "string") {
            const parsed = JSON.parse(msg.data) as SvrMsg;
            if (parsed.event === "Connected") {
                console.log(parsed);
                const url = new URL(window.location.href);
                url.search = "";
                window.history.replaceState(null, "", url);
                const new_mode: ConnectionMode = {
                    mode: "reconnect",
                    member: parsed.member_id,
                    room: parsed.room_id,
                    secret: parsed.secret,
                };
                this.mode = new_mode;
                storage.save(JSON.stringify(new_mode));
                const queue = this.queue.splice(0, this.queue.length);
                for (let i = 0; i < queue.length; i++) {
                    this.ws.send(JSON.stringify(queue[i]));
                    if (queue[i].cmd === "Quit") {
                        this.quit();
                        return;
                    }
                }
            } else if (parsed.event === "BadRoomId") {
                this.quit();
            }
            this.handler(parsed);
        }
    }
    private onclose = () => {
        if (this.handler) {
            this.handler({
                event: "Disconnected"
            });
        }
        this.connect();
    }
}
