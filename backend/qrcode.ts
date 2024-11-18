import { networkInterfaces } from "os";
import QRCode from "qrcode";
import fs from "fs";

const cache = new Map<string, Promise<Buffer>>();

let noAddrReason = "";
const addr = getAddr();

export function hasQrCode(): { enabled: true } | { enabled: false, reason: string } {
    return addr ? { enabled: true } : { enabled: false, reason: noAddrReason };
}

export function getQrCode(roomid: string): Promise<Buffer> | null {
    if (!addr) return null;
    roomid = roomid.toLowerCase();
    let buffer = cache.get(roomid);
    if (!buffer) {
        buffer = QRCode.toBuffer(`http://${addr}/?j=${roomid}`);
        cache.set(roomid, buffer);
    }
    return buffer;
}

function getAddr() {
    try {
        const ip = fs.readFileSync("addr.txt", "utf-8").trim();
        if (!/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}/.test(ip)) {
            noAddrReason = "especifique o endereço no addr.txt nesse formato: (XXX.XXX.XXX.XXX:PPPPP)";
            console.warn(noAddrReason);
            return null;
        }
        return ip;
    } catch (e) {
        noAddrReason = String(e);
        console.warn(e);
        return null;
    }
}

function listIPv4Addresses() {
    const interfaces = networkInterfaces();

    for (const interfaceName in interfaces) {
        const interfaceInfo = interfaces[interfaceName];

        for (const addressInfo of interfaceInfo || []) {
            if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
                console.log(`${addressInfo.address} = ${interfaceName}`);
            }
        }
    }
}