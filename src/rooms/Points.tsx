import { Derived } from "rubedo";
import { client } from "../client";

export default function Points() {
    return (
        <div>
            Pontos:
            <br /><span class="red">Time vermelho: {Derived.prop(client.points, "0")}</span>
            <br /><span class="blue">Time azul: {Derived.prop(client.points, "1")}</span>
        </div>
    );
}