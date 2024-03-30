/// <reference types="../shared/types.d.ts" />
import express from "express";
import enableWs from "express-ws";
import * as path from "path";
import { Rooms } from "./logic";

const app = enableWs(express()).app;
const port = 8080;

// instância as salas
const rooms = new Rooms();

// cria a sala de teste
rooms.create_test_room("LOL");

// configura o websocket, manda as connecções para rooms
app.ws("/connect", (ws, req) => {
    rooms.connect_socket(ws, req.query);
});

// configura os arquivos estáticos
app.get(["", "/", "/index.html"], (_req, res) => {
    res.sendFile(path.join(__dirname, "/../frontend/index.html"));
});
app.get("/script.js", (_req, res) => {
    res.sendFile(path.join(__dirname, "/../frontend/script.js"));
});
app.get("/style.css", (_req, res) => {
    res.sendFile(path.join(__dirname, "/../frontend/style.css"));
});

// liga o servidor
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
