import express from "express";
import enableWs from "express-ws";
import * as path from "path";
import { handleNewSocket } from "./logic";
import { getQrCode } from "./qrcode";
import { port } from "./config";

const app = enableWs(express()).app;

app.ws("/connect", (ws, req) => {
    handleNewSocket(ws as any, req.query);
});

app.get("/qrcode", (_req, res) => {
    const promise = getQrCode();
    if (promise) {
        promise
            .then(qrcode => {
                res.header("Content-Type", "image/png").send(qrcode);
            })
            .catch(e => {
                console.error(e);
                res.status(500).send();
            });
    } else {
        res.status(500).send();
    }
});

app.use("/public", express.static(path.join(__dirname, "/../public/")));

app.use(express.static(path.join(__dirname, "/../dist/")));

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
