/// <reference types="../shared/types.d.ts" />
import express from "express";
import enableWs from "express-ws";
import * as path from "path";
import { Rooms } from "./logic";

const app = enableWs(express()).app;
const port = 8080;

// instancia as salas
const rooms = new Rooms();

const frontend = path.join(__dirname, "/../frontend/");

// cria a sala de teste
rooms.create_test_room("LOL");

// configura o websocket, manda as connecções para rooms
app.ws("/connect", (ws, req) => {
    rooms.connect_socket(ws, req.query);
});

// configura os arquivos estáticos
app.get(["", "/", "/index.html"], (_req, res) => {
    res.sendFile(path.join(frontend, "index.html"));
});
app.get("/script.js", (_req, res) => {
    res.sendFile(path.join(frontend, "script.js"));
});
app.get("/style.css", (_req, res) => {
    res.sendFile(path.join(frontend, "style.css"));
});

// serve os arquivos na pasta static
app.use("/static", express.static(path.join(frontend, "static")));

// liga o servidor
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
