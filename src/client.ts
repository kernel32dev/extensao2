import { Derived, State } from "rubedo";

const cid = function () {
    if (location.hostname === "localhost" || location.hostname.startsWith("127.")) {
        return 0;
    }
    let cid = Number(localStorage.getItem("connection_id") || NaN);
    if (!Number.isNaN(cid)) {
        return cid;
    }
    cid = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER * 0.1) + (Date.now() & 0x3FFFFFFF);
    localStorage.setItem("connection_id", String(cid));
    return cid;
}();

let lastMs = 0;
function monotonic() {
    const now = Date.now();
    if (now === lastMs) return ++lastMs;
    lastMs = now;
    return now;
}

const isHost = cid == 0;
const points = State.track([0, 0] as [number, number]);
const players = State.track([] as {
    team: boolean,
    cid: number,
    x: number,
    y: number,
    name: string,
}[]);
const me = new Derived<{
    team: boolean,
    cid: number,
    x: number,
    y: number,
    name: string,
}>(() => (
    players.find(x => x.cid == cid) || ({
        team: false,
        cid: 0,
        x: 0,
        y: 0,
        name: "Jogador",
    })
));
const answers = State.track([] as {
    team: boolean,
    index: number,
}[]);
const room = new State<Shared.Room | "loading">("loading");

export const client = { cid, isHost, points, players, me, answers, room, send };

(window as any).client = client;

let received = false;
let ws: WebSocket | null = null;
let queue = [] as {
    time: number,
    msg: CliMsg,
}[];

function send(msg: CliMsg) {
    const obj = { msg, time: monotonic() };
    if (ws) ws.send(JSON.stringify(obj));
    queue.push(obj);
}

function connect() {
    if (ws) {
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
    }
    ws = new WebSocket(
        location.port == "3000"
            ? `ws://${location.hostname}/connect?cid=` + cid
            : "/connect?cid=" + cid
    );
    ws.onmessage = onmessage;
    ws.onclose = onclose;
    ws.onerror = onclose;
    received = false;
}

function onmessage(e: MessageEvent) {
    queueMicrotask(() => {
        if (!received || !ws) return;
        received = true;
        for (const obj of queue) {
            ws.send(JSON.stringify(obj));
        }
    });
    const msg = JSON.parse(e.data.toString()) as SvrMsg | { event: "Ack", time: number };
    switch (msg.event) {
        case "Ack": {
            while (queue.length && queue[0].time <= msg.time) {
                queue.shift();
            }
            return;
        }
        case "Points": {
            points[0] = msg.points[0];
            points[1] = msg.points[1];
            break;
        }
        case "Player": {
            const player = players.find(x => x.cid == msg.cid);
            if (player) {
                player.cid = msg.cid;
                player.team = msg.team;
                player.x = msg.x;
                player.y = msg.y;
                player.name = msg.name;
            } else {
                players.push({
                    cid: msg.cid,
                    team: msg.team,
                    x: msg.x,
                    y: msg.y,
                    name: msg.name,
                });
            }
            break;
        }
        case "Answer": {
            answers.push({
                index: msg.index,
                team: msg.team,
            });
            break;
        }
        case "Room": {
            answers.length = 0;
            room.set(msg.room);
            if (msg.room != "quiz") {
                localStorage.removeItem("misses");
            }
            break;
        }
    }
}

function onclose() {
    ws = null;
    setTimeout(connect, 1000);
}

connect();