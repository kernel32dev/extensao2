import { networkInterfaces } from "os";
import QRCode from "qrcode";
import { ip as defaultIp, port } from "./config";

let cacheLastAddr = "";
let cache = null as Promise<Buffer> | null;

export function hasQrCode() {
    return !!findWiFiIPv4Address();
}

export function getQrCode(): Promise<Buffer> | null {
    const addr = findWiFiIPv4Address();
    if (!addr) return null;
    if (cacheLastAddr != addr) {
        cacheLastAddr = addr;
        cache = null;
    }
    if (!cache) {
        cache = QRCode.toBuffer(port == 80 ? `http://${addr}` : `http://${addr}:${port}`);
    }
    return cache;
}

function findWiFiIPv4Address() {
    if (defaultIp) return defaultIp;
    const interfaces = networkInterfaces();

    let ipv4 = null as string | null;
    for (const interfaceName in interfaces) {
        const name = interfaceName.toLowerCase().trim();
        if (name.includes("vpn") || name.includes("docker") || name.includes("virtual box")) {
            continue;
        }

        const wireless = name.includes("wi-fi") || name.includes("wifi") || name.includes("sem fio") || name.includes("wireless");
        if (!wireless && ipv4) continue;

        const interfaceInfo = interfaces[interfaceName];
        for (const addressInfo of interfaceInfo || []) {
            if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
                console.log(`${addressInfo.address} = ${interfaceName}`);
                if (wireless) {
                    return addressInfo.address
                }
                ipv4 = addressInfo.address;
                break;
            }
        }
    }
    return ipv4;
}

findWiFiIPv4Address();