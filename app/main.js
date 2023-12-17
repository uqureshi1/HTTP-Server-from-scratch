const net = require("net");
const fs = require("fs/promises");
const path = require("path");

const CRLF = "\r\n";

function statusResponse(statusCode, statusMessage) {
    return `HTTP/1.1 ${statusCode} ${statusMessage} ${CRLF}`;
}

function parseRequestObject(request) {
    const [requestHeaders, requestBody] = request.split(CRLF + CRLF);

    const headersObject = {};
    const [statusLine, ...otherHeaders] = requestHeaders.split(CRLF);
    const [method, path, _] = statusLine.split(" ");
    headersObject["method"] = method;
    headersObject["path"] = path;

    otherHeaders.forEach(element => {
        let [name, value] = element.split(": ");
        headersObject[name] = value;
    });
    return [headersObject, requestBody]
}

async function Route(socket, header, body) {
    if (header.path === "/") {
        socket.write(statusResponse(200, "OK") + CRLF);

    } else if (header.path.startsWith('/echo/')) {
        const parsedWord = header.path.split('/echo/')[1];
        socket.write(statusResponse(200, 'OK'));
        socket.write('Content-Type: text/plain' + CRLF);
        socket.write(`Content-Length: ${parsedWord.length}` + CRLF);
        socket.write(CRLF);
        socket.write(parsedWord);
        socket.write(CRLF);

    } else if (header.path.startsWith('/user-agent')) {
        let userAgent = header["User-Agent"];
        socket.write(statusResponse(200, 'OK'));
        socket.write('Content-Type: text/plain' + CRLF);
        socket.write(`Content-Length: ${userAgent.length}` + CRLF);
        socket.write(CRLF);
        socket.write(userAgent);
        socket.write(CRLF);

    } else if (header.path.startsWith('/files') && header["method"] === "GET") {
        const directory = process.argv[3];
        const filename = header.path.split('/files/')[1];
        const filePath = path.join(directory, filename);
        try {
            const file = await fs.readFile(filePath);
            socket.write(statusResponse(200, 'OK'));
            socket.write('Content-Type: application/octet-stream' + CRLF);
            socket.write(`Content-Length: ${file.byteLength}` + CRLF);
            socket.write(CRLF);
            socket.write(file);
        } catch (err) {
            socket.write(statusResponse(404, "NOT FOUND") + CRLF);
        }

    } else if (header.path.startsWith('/files') && header["method"] === "POST") {
        const directory = process.argv[3];
        const filename = header.path.split('/files/')[1];
        const filePath = path.join(directory, filename);
        try {
            await fs.writeFile(filePath, body);
            socket.write(statusResponse(201, 'OK') + CRLF);
        } catch (err) {
            socket.write(statusResponse(500, "INTERNAL SERVER ERROR") + CRLF);
        }

    } else {
        socket.write(statusResponse(404, "NOT FOUND") + CRLF);
    }
}

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
    });

    socket.on("data", async (data) => {
        const content = data.toString();
        const [header, body] = parseRequestObject(content);
        await Route(socket, header, body);
        socket.end();
    });
});

server.listen(4221, () => {
    console.log("Server listening on the port 4221.");
});