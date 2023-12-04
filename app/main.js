const net = require("net");

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
        let [name, value] = element.split(": ")
        headersObject[name] = value
    });
    return [headersObject, requestBody]
}

function Route(socket, header) {
    if (header.path === "/") {
        socket.write(statusResponse(200, "OK") + CRLF)

    } else if (header.path.startsWith('/echo/')) {
        const parsedWord = header.path.split('/echo/')[1]
        socket.write(statusResponse(200, 'OK'))
        socket.write('Content-Type: text/plain' + CRLF)
        socket.write(`Content-Length: ${parsedWord.length}` + CRLF)
        socket.write(CRLF)
        socket.write(parsedWord)
        socket.write(CRLF)

    } else if (header.path.startsWith('/user-agent')) {
        let userAgent = header["User-Agent"]
        socket.write(statusResponse(200, 'OK'))
        socket.write('Content-Type: text/plain' + CRLF)
        socket.write(`Content-Length: ${userAgent.length}` + CRLF)
        socket.write(CRLF)
        socket.write(userAgent)
        socket.write(CRLF)
    } else {
        socket.write(statusResponse(404, "NOT FOUND") + CRLF)
    }
}

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
    });

    socket.on("data", (data) => {
        const content = data.toString()
        const [header, body] = parseRequestObject(content)
        Route(socket, header)
        socket.end();
    });
});

server.listen(4221, () => {
    console.log("Server listening on the port 4221.");
});