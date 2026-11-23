import type { IncomingMessage, ServerResponse } from "node:http";

export const sendJson = (
    response: ServerResponse,
    status: number,
    payload: unknown,
    headers: Record<string, string> = {},
): void => {
    response.writeHead(status, { "Content-Type": "application/json", ...headers });
    response.end(JSON.stringify(payload));
};

export const sendNotFound = (response: ServerResponse): void => {
    sendJson(response, 404, { error: "Not found" });
};

export const readBody = (request: IncomingMessage): Promise<string> =>
    new Promise((resolve) => {
        let body = "";
        request.setEncoding("utf8");
        request.on("data", (chunk: string) => {
            body += chunk;
        });
        request.on("end", () => resolve(body));
    });
