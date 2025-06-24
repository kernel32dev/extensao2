import { client } from "../client";

export default function Podium({}: {}) {
    return (
        <div>
            Podium
            {client.points.join(":")}
        </div>
    );
}