import type * as WebSocket from "ws";

// o backend é estruturado da seguinte forma:
//
// há um objeto `Rooms` global
// que contém vários `Room`
// que contém vários `Member` (pode ser `Owner` ou `Player`)
// que contém vários `Socket`
//
// qualquer informação que você possa pensar do jogo vive em uma dessas classes
// por exemplo o nome do jogador está em `Member`, o número de jogadores está em `Room`
// cada classe tem referências para o objeto que a contém e cada uma tem uma coleção de objetos que ela contém
//
// as classes só se preocupam em guardar e manipular os seus dados, e em enviar as mensagems aos seus subordinados
//
// a lógica realmente acontece é em `handle_new_socket` e `handle_client_message`

/** tratar novas conecções */
function handle_new_socket(sck: Socket) {
    const member = sck.member;
    const room = member.room;
    // os clientes precisam receber a mensagem Connected que informa tudo sobre como o jogo está
    sck.send({
        event: "Connected",
        room_id: room.id,
        member_id: member.id,
        secret: member.secret_id,
        owner: room.owner.to_shared(),
        players: [...room.players.values()].map(x => x.to_shared()),
    });
    if (sck.member instanceof Player) {
        // caso a nova coneção seja um jogador, informa todo mundo que ele chegou,
        sck.member.room.send(
            { event: "PlayerUpdated", player: sck.member.to_shared() },
            // mas não precisa mandar para ele mesmo
            sck,
        );
    }
}

/** tratar uma mensagem do cliente vindo de um socket, o membro de onde a mensagem vêm e a sala onde a mensagem está, estão acessíveis pelo sck `sck.member` e `sck.member.room` */
function handle_client_message(sck: Socket, msg: CliMsg) {
    if (sck.member instanceof Player) {
        switch (msg.cmd) {
            case "SetName": {
                sck.member.name = msg.name;
                sck.member.room.send({
                    event: "PlayerUpdated",
                    player: sck.member.to_shared(),
                });
                break;
            }
            case "SetPos": {
                sck.member.pos = msg.pos;
                sck.member.room.send({
                    event: "PlayerUpdated",
                    player: sck.member.to_shared(),
                });
                break;
            }
            default:
                // a linha abaixo vai dar erro se tiver um event que ainda não foi tratado
                msg satisfies never;
        }
    }
}

/** um conjunto de salas, capaz de receber novas conecções pelo método `connect_socket` */
export class Rooms {
    readonly rooms = new Map<string, Room>();

    private new_room(): Room {
        const room = new Room(this);
        this.rooms.set(room.id, room);
        return room;
    }
    private try_get_room(room_id: unknown): Room | null {
        return this.rooms.get(Room.validate_id(room_id)) ?? null;
    }
    public create_test_room(room_key: string): Room {
        const room = new Room(this);
        (room as any)["id"] = Room.validate_id(room_key);
        this.rooms.set(room.id, room);
        console.log("=============================================\n"
        + "Sala de teste criada, (room_id = " + room_key + ")\n"
        + "Isso significa que o programa foi chamado com a flag --create-test-room ${room_key}\n"
        + "Você não quer ver isso em produção\n"
        + "\n"
        + "Caso queira executar em produção execute:\n"
        + "npm run build\n"
        + "npm run serve\n"
        + "=============================================\n");
        return room;
    }
    public connect_socket(ws: WebSocket, query: Record<string, unknown>) {
        const mode = query["mode"];
        if (mode === "open") {
            // nova sala, novo dono
            const room = this.new_room();
            room.owner.add_socket(ws);
        } else if (mode === "join") {
            // sala existente, novo jogador
            const room = this.try_get_room(query["room"]);
            if (!room) return Socket.send_bad_room_id(ws);
            const member = room.new_player();
            member.add_socket(ws);
        } else if (mode === "reconnect") {
            // sala existente, membro existente
            // valida se ele sabe o segredo
            const room = this.try_get_room(query["room"]);
            if (!room) return Socket.send_bad_room_id(ws);
            const member = room.get_member(query["member"]);
            const secret = Member.validate_id(query["secret"]);
            if (member.secret_id !== secret) {
                return Socket.send_error(ws, new Error(`Member does not exist (room_id = ${room.id}, member_id = ${member.id})`));
            }
            member.add_socket(ws);
        } else {
            return Socket.send_error(ws, new Error(`query parameter "mode" must be specified and must be either "open", "join" or "reconnect", found: ${mode}`));
        }
    }
}

/** uma sala onde um jogo está acontecendo */
class Room {
    /** o objeto rooms ao qual esta sala pertence */
    readonly rooms: Rooms;
    /** o id único desta sala, no formato `Room.id_regex` */
    readonly id: string;
    /** todos os jogadores desta sala */
    readonly players = new Map<string, Player>();
    /** o dono da sala */
    readonly owner = new Owner(this);

    constructor(rooms: Rooms) {
        this.rooms = rooms;
        do {
            this.id = Room.gen_id();
        } while (rooms.rooms.has(this.id));
    }

    new_player(): Player {
        const player = new Player(this);
        this.players.set(player.id, player);
        return player;
    }
    get_member(member_id: unknown): Member {
        return this.owner.id === member_id ? this.owner : this.get_player(member_id);
    }
    get_player(member_id: unknown): Player {
        const member = this.players.get(Member.validate_id(member_id));
        if (!member) throw new Error(`Member does not exist (room_id = ${this.id}, member_id = ${member_id})`);
        return member;
    }
    send(message: SvrMsg | string, exclude?: Socket | Member) {
        if (typeof message === "object") {
            message = JSON.stringify(message);
        }
        if (this.owner !== exclude) {
            this.owner.send(message);
        }
        if (exclude instanceof Socket) {
            for (let i of this.players.values()) {
                i.send(message, exclude);
            }
        } else {
            for (let i of this.players.values()) {
                if (i !== exclude) i.send(message);
            }
        }
    }

    static readonly id_length = 3;
    static readonly id_regex = /^[BCDFGHJKLMNPQRSTVWXYZ][AEIOU][BCDFGHJKLMNPQRSTVWXYZ]$/;

    /** retorna o valor se ele for uma chave de sala válido, ou seja uma string de `Room.id_length` caracteres, e no formato `Room.id_regex` */
    static validate_id(value: unknown): string {
        if (typeof value === "string" && value.length === Room.id_length && Room.id_regex.test(value)) {
            return value.toUpperCase();
        }
        throw new Error(`invalid room key: "${value}"`);
    }

    /** retorna uma nova chave da sala, aleatória, possívelmente duplicada */
    static gen_id(): string {
        const key = gen_consonant() + gen_vowel() + gen_consonant();
        // valida para dar erro se tiver um erro nas funções abaixo
        return Room.validate_id(key);

        function gen_consonant(): string {
            let letter;
            do {
                letter = String.fromCharCode(Math.floor(65 + Math.random() * 26));
            } while ("AEIOU".includes(letter));
            return letter;
        }
        function gen_vowel(): string {
            return "AEIOU"[Math.floor(Math.random() * 5)];
        }
    }
}

/** um membro de uma sala */
abstract class Member {
    /** a sala ao qual este membro pertence */
    readonly room: Room;
    /** o id único deste membro, no formato `Member.id_regex` */
    readonly id: string = Member.gen_id();
    /** um id secreto que só esse membro sabe, usado para reconectar, no formato `Member.id_regex` */
    readonly secret_id: string = Member.gen_id();
    /** todos as conecções que pertencem a este membro */
    readonly sockets = new Set<Socket>();

    constructor(room: Room) {
        this.room = room;
    }
    add_socket(ws: WebSocket): Socket {
        const sck = new Socket(
            this,
            ws
        );
        this.sockets.add(sck);
        return sck;
    }
    send(message: SvrMsg | string, exclude?: Socket) {
        if (typeof message === "object") {
            message = JSON.stringify(message);
        }
        for (let i of this.sockets) {
            if (i !== exclude) i.send(message);
        }
    }
    to_shared(): Shared.Member {
        return {
            owner: this instanceof Owner,
            member_id: this.id,
        }
    }


    static readonly id_length = 16;
    static readonly id_regex = /^[0-9A-Fa-f]*$/;
    /** retorna o valor se ele for um identificador válido, ou seja uma string de `Member.id_length` caracteres, e no formato `Member.id_regex` */
    static validate_id(value: unknown): string {
        if (typeof value === "string" && value.length === Member.id_length && Member.id_regex.test(value.toUpperCase())) {
            return value.toUpperCase();
        }
        throw new Error(`invalid room id: "${value}"`);
    }

    /** retorna um identificador válido aleatório */
    static gen_id(): string {
        let id = "";
        for (let i = 0; i < Member.id_length; i++) {
            id += Math.floor(Math.random() * 0x10).toString(0x10);
        }
        // valida para dar erro se tiver um erro na função acima
        return Member.validate_id(id);
    }
}

/** o dono da sala */
class Owner extends Member {
    // por enquanto nada exclusivo do dono da sala
}

/** um jogador dentro da sala */
class Player extends Member {
    name: string;
    pos: Shared.Point;
    constructor(room: Room) {
        super(room);
        this.name = "Aluno #" + room.players.size;
        this.pos = { x: Math.random(), y: Math.random() };
    }
    override to_shared(): Shared.Player {
        return {
            name: this.name,
            pos: this.pos,
            ...super.to_shared()
        }
    }
}

/** um socket de um membro, capaz de enviar `SvrMsg` */
class Socket {
    /** o membro ao qual este socket pertence */
    readonly member: Member;
    /** o objeto WebSocket que realmente manda e recebe as mensagem */
    private ws: WebSocket;
    constructor(
        member: Member,
        ws: WebSocket,
    ) {
        this.member = member;
        this.ws = ws;
        const close_handler = () => {
            this.ws.onmessage = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            try {
                this.ws.close();
            } catch (_e) {
                // ignora erros na hora de fechar
            }
            this.member.sockets.delete(this);
        };
        this.ws.onmessage = e => {
            // parsa os dados como um objeto, e assume que é um tipo válido de CliMsg
            const msg = JSON.parse(e.data.toString("utf-8")) as CliMsg;
            try {
                handle_client_message(this, msg);
            } catch (e) {
                this.send_error(e);
            }
        };
        this.ws.onclose = close_handler;
        this.ws.onerror = close_handler;
        try {
            handle_new_socket(this);
        } catch (e) {
            this.send_error(e);
        }
    }
    send(message: SvrMsg | string) {
        if (typeof message === "object") {
            message = JSON.stringify(message);
        }
        this.ws.send(message);
    }
    send_error(error: any) {
        this.send({ event: "Error", error: String(error) });
    }
    static send_error(ws: WebSocket, error: any) {
        ws.send(JSON.stringify({ event: "Error", error: String(error) } satisfies SvrMsg.Error));
        ws.close();
    }
    static send_bad_room_id(ws: WebSocket) {
        ws.send(JSON.stringify({ event: "BadRoomId" } satisfies SvrMsg.BadRoomId));
        ws.close();
    }
}
