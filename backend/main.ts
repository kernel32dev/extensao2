/// <reference types="../shared/types.d.ts" />
import express from "express";
import * as path from "path";

const app = express();
const port = 8080;

app.get(["", "/", "/index.html"], (_req, res) => {
    res.sendFile(path.join(__dirname, "/../frontend/index.html"));
});
app.get("/script.js", (_req, res) => {
    res.sendFile(path.join(__dirname, "/../frontend/script.js"));
});
app.get("/style.css", (_req, res) => {
    res.sendFile(path.join(__dirname, "/../frontend/style.css"));
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
