import { createServer } from "node:http";
import { handleRequest } from "./controller.ts";
import { closeDatabase } from "./database.ts";
import { sendJson } from "./http.ts";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "127.0.0.1";

const server = createServer((request, response) => {
    handleRequest(request, response).catch((error: unknown) => {
        console.error(error);
        sendJson(response, 500, { error: "Internal server error" });
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
});

const shutdown = (signal: string): void => {
    console.log(`\n${signal} — shutting down…`);
    server.close(() => {
        closeDatabase();
        process.exit(0);
    });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
