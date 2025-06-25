import { Derived } from "rubedo";
import { client } from "../client";

export default function Points() {
    return (
        <div>
            Pontos:
            <br /><span class="green">Time verde: {Derived.prop(client.points, "0")}</span>
            <br /><span class="yellow">Time amarelo: {Derived.prop(client.points, "1")}</span>
        </div>
    );
}