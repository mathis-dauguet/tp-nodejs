import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

const port = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 3000;

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`Hello from ${request.method} ${request.url}\n`);
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
