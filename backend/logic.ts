
/** um wrapper que só envia `ServerMessage` e só recebe `ClientMessage` */
/*class Socket {
  private ws: WebSocket;
  constructor(ws: WebSocket, onmessage: (msg: ClientMessage) => void, onclose: (ws: Socket) => void) {
    this.ws = ws;
    const close_handler = () => {
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try {
        this.ws.close();
      } catch (_e) {
        // ignore closing errors
      }
      onclose(this);
    };
    this.ws.onmessage = x => onmessage(JSON.parse(x.data));
    this.ws.onclose = close_handler;
    this.ws.onerror = close_handler;
  }
  send(message: ServerMessage) {
    this.ws.send(JSON.stringify(message));
  }
}

class Room {
  static rooms = new Map<string, Room>();
  room_id: string = genRandomHex();
  members: Member[] = [];
}

class Member {
  sockets: Socket[] = [];
}

export async function connect(ctx: RouterContext<string>) {
  const search = ctx.request.url.searchParams;
  const mode = search.get("mode");

  if (mode === "open") {
    throw new Error("not implemented");
  } else if (mode === "join") {
    throw new Error("not implemented");
  } else if (mode === "reconnect") {
    throw new Error("not implemented");
  } else {
    emitError(
      ctx,
      'the "mode" search parameter must be "open", "join" or "reconnect"',
    );
    return;
  }
*/
  /*
  const new_socket = await ctx.upgrade();
  const username = ctx.request.url.searchParams.get("username") ?? "";
  if (connectedClients.has(username)) {
    new_socket.close(1008, `Username ${username} is already taken`);
    return;
  }
  const socket = Object.assign(new_socket, { username });
  connectedClients.set(username, socket);
  console.log(`New client connected: ${username}`);

  // broadcast the active users list when a new user logs in
  socket.onopen = () => {
    broadcast_usernames();
  };

  // when a client disconnects, remove them from the connected clients list
  // and broadcast the active users list
  socket.onclose = () => {
    console.log(`Client ${socket.username} disconnected`);
    connectedClients.delete(socket.username);
    broadcast_usernames();
  };

  // broadcast new message if someone sent one
  socket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    switch (data.event) {
      case "send-message":
        broadcast(
          JSON.stringify({
            event: "send-message",
            username: socket.username,
            message: data.message,
          }),
        );
        break;
    }
  };
  
}

function emitError(sink: RouterContext<string> | WebSocket, error: string) {
  if (!(sink instanceof WebSocket)) {
    sink = sink.upgrade();
  }
  sink.send(JSON.stringify({ error }));
  sink.close();
}

function genRandomHex(length: number = 16): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 0x10).toString(0x10);
  }
  return result;
}
*/