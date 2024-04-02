
const chave = "extensao2";

/** salva uma string no dispositivo */
export function save(data: string) {

    if (data != "") {

        // adiciona o tempo atual a informação para podermos depois ver o qual velha é
        data = new Date().toISOString() + "|" + data;

        // salva em localStorage
        try {
            localStorage.setItem(chave, data);
        } catch (_e) {
            // ignora erros
        }

        // salva em cookie
        document.cookie = `${chave}=${encodeURIComponent(data)}; path=/; max-age=3600`;
    } else {
        // apaga localStorage
        try {
            localStorage.removeItem(chave);
        } catch (_e) {
            // ignora erros
        }

        // apaga cookie
        document.cookie = `${chave}=; path=/; max-age=0`;
    }
}

/** retorna a string salva, ou uma string vazia se nada nunca foi salvo */
export function load(): string {

    // carrega os dados salvos em localStorage
    const local_storage = parse_data(localStorage.getItem(chave) ?? "");

    // carrega os dados salvos no cookie
    const cookie = parse_data((document.cookie.split("; ").find((row) => row.startsWith(chave + "=")) ?? "").substring(chave.length + 1));

    if (local_storage && cookie) {
        // os dois estão presentes, pega o mais recente
        if (local_storage.date.getTime() > cookie.date.getTime()) {
            return local_storage.data;
        } else {
            return cookie.data;
        }
    } else if (local_storage) {
        return local_storage.data;
    } else if (cookie) {
        return cookie.data;
    } else {
        return "";
    }
}

/** divide uma string no formato "<ISODate>|..." em data e dados, retorna null se o formato estiver incorreto */
function parse_data(text: string): {date: Date, data: string} | null {
    const index = text.indexOf("|");
    if (index == -1) return null;
    const date_text = text.substring(0, index);
    const data = text.substring(index + 1);
    try {
        return {date: new Date(date_text), data};
    } catch (_e) {
        return null;
    }
}
