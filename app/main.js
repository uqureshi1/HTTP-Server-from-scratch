const net = require("net");

const CRLF = "\r\n";

function statusResponse(statusCode, statusMessage) {
    return `HTTP/1.1 ${statusCode} ${statusMessage} ${CRLF}`;
}

function extractHeaders(request) {
    const [requestHeaders, requestBody] = request.split(CRLF + CRLF);

    const headersObject = {};
    const [statusLine, otherHeaders] = requestHeaders.split(CRLF);
    const [method, path, _] = statusLine.split(" ");
    headersObject["method"] = method;
    headersObject["path"] = path;

    Array(otherHeaders).forEach(element => {
        let [name, value] = element.split(": ")
        headersObject[name] = value
    });
    return headersObject
}

const server = net.createServer((socket) => {
    socket.on("data", (data) => {
        const content = data.toString()
        const headers = extractHeaders(content)
        httpResponse = headers.path === "/" ? socket.write(statusResponse(200, "OK") + CRLF) : socket.write(statusResponse(404, "NOT FOUND") + CRLF)
        socket.write(httpResponse)
        socket.end();
    });
});

server.listen(4221, () => {
    console.log("Server listening on the port 4221.");
});