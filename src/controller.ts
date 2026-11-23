import type { IncomingMessage, ServerResponse } from "node:http";
import { countNotes, createNote, deleteNote, findNoteById, listNotes } from "./database.ts";
import { readBody, sendJson, sendNotFound } from "./http.ts";
import { parseListFilters, validateNoteInput } from "./validation.ts";

function getHealth(response: ServerResponse): void {
    sendJson(response, 200, { status: "ok", notes: countNotes() });
}

function getNotes(url: URL, response: ServerResponse): void {
    const filters = parseListFilters(url.searchParams);
    if (!filters.ok) {
        sendJson(response, 400, { error: "Invalid query parameters", details: filters.errors });
        return;
    }
    sendJson(response, 200, listNotes(filters.value));
}

async function postNote(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const raw = await readBody(request);

    let body: unknown;
    try {
        body = JSON.parse(raw);
    } catch {
        sendJson(response, 400, { error: "Invalid JSON" });
        return;
    }

    const validation = validateNoteInput(body);
    if (!validation.ok) {
        sendJson(response, 422, { error: "Validation failed", details: validation.errors });
        return;
    }

    const note = createNote(validation.value);
    sendJson(response, 201, note, { Location: `/notes/${note.id}` });
}

function getNote(id: string, response: ServerResponse): void {
    const note = findNoteById(id);
    if (!note) {
        sendNotFound(response);
        return;
    }
    sendJson(response, 200, note);
}

function removeNote(id: string, response: ServerResponse): void {
    if (!deleteNote(id)) {
        sendNotFound(response);
        return;
    }
    response.writeHead(204);
    response.end();
}

function getNoteId(path: string): string | undefined {
    const [root, resource, id, ...rest] = path.split("/");
    if (root !== "" || resource !== "notes" || !id || rest.length > 0) {
        return undefined;
    }
    return id;
}

export async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? "/", "http://localhost");
    const path = url.pathname;

    if (request.method === "GET" && path === "/health") {
        getHealth(response);
        return;
    }

    if (request.method === "GET" && path === "/notes") {
        getNotes(url, response);
        return;
    }

    if (request.method === "POST" && path === "/notes") {
        await postNote(request, response);
        return;
    }

    const id = getNoteId(path);

    if (request.method === "GET" && id !== undefined) {
        getNote(id, response);
        return;
    }

    if (request.method === "DELETE" && id !== undefined) {
        removeNote(id, response);
        return;
    }

    sendNotFound(response);
}
