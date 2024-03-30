import { handle_server_message } from "./game";

/** todos os diferentes modos que é possível conectar ao servidor */
type ConnectionMode = {
    mode: "open";
} | {
    mode: "join";
    room: string;
} | {
    mode: "reconnect";
    room: string;
    member: string;
    secret: string;
};

/** a connecção websocket, com o modo com o qual ele foi criado */
let ws: WebSocket & { mode: ConnectionMode } | null = null;

/** a lista de mensagens esperando serem enviadas */
const queue: CliMsg[] = [];

/** conecta ao servidor, se mode não for especificado, reconecta
 *
 * você pode especificar um callback a ser chamado quando a conecção acontecer */
export function connect(mode?: ConnectionMode) {

    if (mode) {
        // o modo foi especificado, o que significa que não queremos reconectar
        // isso significa que mensagens antigas devem ser de uma conecção antiga e não devemos enviar mais elas
        queue.length = 0;
    }
    if (ws) {
        // tira os handlers antigos para não recebermos novas mensagens antes do novo ser conectado
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        try {
            ws.close();
        } catch (_e) {
            // ignora erros na hora de fechar
        }
        // caso o modo seja undefined, reutiliza o último modo
        mode = mode ?? ws.mode;
    }

    // nenhum modo foi especificado, e não há último modo para reutilizar, nada a fazer
    if (!mode) return;

    // faz a url web socket
    const url = new URL("/connect", location.href);
    url.protocol = location.protocol === "https:" ? "wss" : "ws";
    url.searchParams.set("mode", mode.mode);

    if (mode.mode === "join") {
        url.searchParams.set("room", mode.room);
    } else if (mode.mode === "reconnect") {
        url.searchParams.set("room", mode.room);
        url.searchParams.set("member", mode.member);
        url.searchParams.set("secret", mode.secret);
    }

    spinner.start_spinning();

    // cria o objeto, adiciona a propiedade mode e bota os handlers
    ws = Object.assign(new WebSocket(url), { mode });
    ws.onmessage = onmessage;
    ws.onerror = onclose;
    ws.onclose = onclose;

    function onmessage(e: MessageEvent<any>) {
        // assume que a mensagem chegando é um `SvrMsg`
        const msg = JSON.parse(e.data.toString()) as SvrMsg;
        console.log(msg);
        
        if (msg.event == "Connected") {
            ws!.mode = {mode: "reconnect", room: msg.room_id, member: msg.member_id, secret: msg.secret};
            spinner.stop_spinning();
        } else if (msg.event == "BadRoomId") {
            disconnect();
            spinner.stop_spinning();
        }
        handle_server_message(msg)
    }

    function onclose() {
        handle_server_message({ event: "Disconnected" });
        connect();
    }
}

export function disconnect() {
    if (ws) {
        // tira os handlers antigos para não recebermos novas mensagens antes do novo ser conectado
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        try {
            ws.close();
        } catch (_e) {
            // ignora erros na hora de fechar
        }
        ws = null;
    }
    queue.length = 0;
}

/** bota mais mensagens na fila e envia elas ao servidor, caso não seja possível enviar, ela continua na fila */
export function send(...msg: CliMsg[]) {
    // bota a mensagem na fila
    if (msg) queue.push(...msg);
    // se o websocket está pronto para receber mensagens
    if (ws && ws.readyState == WebSocket.OPEN) {
        // enquanto não estiver vazio
        while (queue.length != 0) {
            // envia a primeira mensagem
            ws.send(JSON.stringify(queue[0]));
            // mensagem enviada com sucesso, retira ela da fila
            console.log(queue.shift());
        }
    }
}

namespace spinner {
    const spinner = (
        <div class="loading-screen">
            <h1 class="loading-title">Conectando...</h1>
            {/*https://www.svgrepo.com/svg/479714/hourglass*/}
            <svg class="loading-spinner" height="100px" width="100px" version="1.1" viewBox="0 0 512 512">
                <g>
                    <path d="M315.883,231.155l82.755-115.143c7.152-9.942,11.038-21.785,11.038-33.92V46.12h23.912V0H78.412v46.12h23.912
                        v35.971c0,12.135,3.886,23.978,11.038,33.92l82.755,115.143c2.963,4.135,4.472,8.856,4.483,13.655v22.371
                        c-0.011,4.797-1.52,9.519-4.483,13.666l-82.755,115.132c-7.152,9.942-11.038,21.784-11.038,33.93v35.96H78.412V512h355.177v-46.131
                        h-23.912v-35.96c0-12.146-3.886-23.988-11.038-33.93l-82.755-115.132c-2.963-4.147-4.482-8.868-4.482-13.666V244.81
                        C311.4,240.011,312.92,235.29,315.883,231.155z M386.61,461.267H125.39v-31.358c0-7.229,2.29-14.328,6.697-20.471l82.754-115.132
                        c5.71-7.935,8.825-17.41,8.825-27.125V244.81c0-9.714-3.116-19.191-8.825-27.115l-82.743-115.144
                        c-4.418-6.143-6.708-13.231-6.708-20.46V50.733h261.22v31.358c-0.01,7.229-2.29,14.317-6.708,20.46l-82.754,115.144
                        c-5.698,7.924-8.814,17.4-8.814,27.115v22.371c0,9.714,3.116,19.19,8.814,27.125l82.765,115.132
                        c4.407,6.143,6.686,13.242,6.696,20.471V461.267z"/>
                    <path d="M271.5,337.571c-8.564-8.543-22.436-8.543-31,0l-99.155,99.166c-1.866,1.877-2.431,4.688-1.41,7.131
                        c1.009,2.442,3.397,4.037,6.034,4.037h220.062c2.637,0,5.025-1.595,6.034-4.037c1.02-2.443,0.457-5.254-1.41-7.131L271.5,337.571z"
                        />
                </g>
            </svg>
            <button onClick={() => {
                stop_spinning();
                disconnect();
            }}>
                Cancelar
            </button>
        </div>
    ) as HTMLDivElement;
    
    const loading_timeout_ms = 100;
    let loading_timeout_id = 0;
    
    export function start_spinning() {
        if (loading_timeout_id === 0) {
            loading_timeout_id = window.setTimeout(
                () => document.body.appendChild(spinner),
                loading_timeout_ms,
            );
        }
    }
    
    export function stop_spinning() {
        clearTimeout(loading_timeout_id);
        loading_timeout_id = 0;
        spinner.remove();
    }
    
    css`${{__filename, __line}}
    
    .loading-screen {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    .loading-title {
        background-color: rgb(50, 50, 50);
        border-radius: 0.5em;
        padding: 0.3em;
        display: inline-block;
    }
    .loading-spinner {
        margin: 2em;
        fill: currentColor;
        animation: loading-spinner-rotation 1s ease-in-out 0s infinite;
    }
    
    @keyframes loading-spinner-rotation {
        0% {
            transform: rotate(0deg) scaleY(1);
        }
        50% {
            transform: rotate(180deg) scaleY(1);
        }
        100% {
            transform: rotate(180deg) scaleY(-1);
        }
    }
    `
}

