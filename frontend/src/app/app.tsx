export function App(): Elems {
    const myUsername = prompt("Please enter your name") || "Anonymous";

    const usernames = new State<string[]>([]);
    const conversation = new State<{username: string, message: string}[]>([]);

    const socket = new WebSocket(
        `ws://localhost:8080/start_web_socket?username=${myUsername}`,
    );

    socket.onmessage = m => {
        const data = JSON.parse(m.data);
        switch (data.event) {
            case "update-users":
                usernames.value = data.usernames;
                break;
            case "send-message":
                conversation.value.push(data);
                break;
        }
    };

    return (
        <div style={{textAlign: "center"}}>
            <div>
                <b>Users</b>
                <hr />
                <div>
                    {usernames.thenMap(name => <div>{name}</div>)}
                </div>
                <hr />
            </div>
            <div>
                <input id="data" placeholder="send message" onKeyDown={handleEnter} />
                <hr />
                <div>
                    {conversation.thenMap(x => <><b>{x.username}</b>: {x.message}<br/></>)}
                </div>
            </div>
        </div>
    );
    function handleEnter(this: HTMLInputElement, e: KeyboardEvent) {
        if (e.key === "Enter") {
            const message = this.value;
            this.value = "";
            socket.send(
                JSON.stringify({
                    event: "send-message",
                    message: message,
                }),
            );
        }
    }
}
