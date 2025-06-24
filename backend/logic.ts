/// <reference types="../shared/types.d.ts" />
const allConns = new Set<WebSocket>();
const allConnsByCid = new Map<number, Set<WebSocket>>();

const points = [0, 0] as [number, number];

const players = [] as {
    team: boolean,
    cid: number,
    x: number,
    y: number,
    name: string,
}[];

const answers = [] as {
    team: boolean,
    index: number,
}[];

let room = "lobby" as "lobby" | "quiz" | "words" | "podium";

let userNameGen = 0;

export function handleNewSocket(ws: WebSocket, params: Record<string, unknown>) {
    const cid = Math.floor(Number(params.cid));
    if (Number.isNaN(cid)) {
        ws.close();
        return;
    }
    let conns = allConnsByCid.get(cid);
    if (!conns) {
        conns = new Set();
        allConnsByCid.set(cid, conns);
    }
    ws.onmessage = e => {
        const { time, msg } = JSON.parse(e.data.toString()) as { time: number, msg: CliMsg };
        ws.send(`{"event":"Ack","time":${time}}`);
        handleMessage(cid, msg, ws);
    };
    const onclose = () => {
        allConns.delete(ws);
        conns.delete(ws);
        if (!conns.size) allConnsByCid.delete(cid);
    };
    ws.onerror = onclose;
    ws.onclose = onclose;

    const teamTrue = players.filter(x => x.team).length;
    const teamFalse = players.filter(x => !x.team).length;

    const team = teamFalse == teamTrue
        ? Math.random() < 0.5
        : teamTrue < teamFalse;

    const name = "Jogador " + ++userNameGen;

    if (cid) {
        const player = players.find(x => x.cid == cid);

        if (!player) {
            const player = {
                cid,
                team,
                name,
                x: Math.random(),
                y: Math.random(),
            };
            players.push(player);
            const text = JSON.stringify({
                event: "Player",
                ...player,
            } satisfies SvrMsg);
            for (const conn of allConns) {
                conn.send(text);
            }
        }
    }

    allConns.add(ws);
    conns.add(ws);

    sendFirstMessages(ws);
}

function sendFirstMessages(ws: WebSocket) {
    ws.send(JSON.stringify({
        event: "Points",
        points,
    } satisfies SvrMsg));
    ws.send(JSON.stringify({
        event: "Room",
        room,
    } satisfies SvrMsg));
    for (const player of players) {
        ws.send(JSON.stringify({
            event: "Player",
            ...player,
        } satisfies SvrMsg));
    }
    for (const answer of answers) {
        ws.send(JSON.stringify({
            event: "Answer",
            ...answer,
        } satisfies SvrMsg));
    }
}

function handleMessage(cid: number, msg: CliMsg, ws: WebSocket) {
    switch (msg.cmd) {
        case "ResetPoints": {
            points[+false] = 0;
            points[+true] = 0;
            const text = JSON.stringify({
                event: "Points",
                points,
            } satisfies SvrMsg);
            for (const conn of allConns) {
                conn.send(text);
            }
            break;
        }
        case "Player": {
            let player = players.find(x => x.cid == msg.cid);
            if (!player) break;
            player.cid = msg.cid;
            player.team = msg.team ?? player.team;
            player.name = msg.name ?? player.name;
            player.x = msg.x ?? player.x;
            player.y = msg.y ?? player.y;
            const text = JSON.stringify({
                event: "Player",
                ...player,
            } satisfies SvrMsg);
            for (const conn of allConns) {
                conn.send(text);
            }
            break;
        }
        case "Answer":
            if (!answers.find(x => x.index == msg.index)) {
                answers.push({
                    team: msg.team,
                    index: msg.index,
                });
                points[+msg.team]++;
                const text1 = JSON.stringify({
                    event: "Answer",
                    team: msg.team,
                    index: msg.index,
                } satisfies SvrMsg);
                const text2 = JSON.stringify({
                    event: "Points",
                    points,
                } satisfies SvrMsg);
                for (const conn of allConns) {
                    conn.send(text1);
                    conn.send(text2);
                }
            }
            break;
        case "Room": {
            if (room == msg.room) break;
            room = msg.room;
            const text = JSON.stringify({
                event: "Room",
                room,
            } satisfies SvrMsg);
            for (const conn of allConns) {
                conn.send(text);
            }
            break;
        }
    }
}
