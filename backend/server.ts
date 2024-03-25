import { RouterContext } from "https://deno.land/x/oak@14.2.0/mod.ts";
import { Application, Router } from "./deps.ts";

const connectedClients = new Map<string, WebSocket>();

const app = new Application();
const port = 8080;
const router = new Router();

// send a message to all connected clients
function broadcast(message: string) {
  for (const client of connectedClients.values()) {
    client.send(message);
  }
}

// send updated users list to all connected clients
function broadcast_usernames() {
  const usernames = [...connectedClients.keys()];
  console.log(
    "Sending updated username list to all clients: " +
      JSON.stringify(usernames),
  );
  broadcast(
    JSON.stringify({
      event: "update-users",
      usernames: usernames,
    }),
  );
}

router.get("/start_web_socket", async (ctx) => {
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
});

const serve_static = async (context: RouterContext<string>) => {
  await context.send({ root: Deno.cwd() + "/../frontend/src/", index: "index.html" });
}

router.get("", serve_static);
router.get("/", serve_static);
router.get("/index.html", serve_static);
router.get("/script.js", serve_static);
router.get("/style.css", serve_static);

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Listening at http://localhost:" + port);
await app.listen({ port });
