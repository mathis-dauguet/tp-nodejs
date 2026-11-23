import type { FieldErrors, ListFilters, NoteInput } from "./types.ts";

const TITLE_MAX_LENGTH = 100;

type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string };

type Result<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkTitle(value: unknown): FieldResult<string> {
    if (typeof value !== "string" || value.trim() === "") {
        return { ok: false, error: "title is required and must be a non-empty string" };
    }
    if (value.length > TITLE_MAX_LENGTH) {
        return { ok: false, error: `title must be at most ${TITLE_MAX_LENGTH} characters` };
    }
    return { ok: true, value };
}

function checkAuthor(value: unknown): FieldResult<string> {
    if (typeof value !== "string" || value.trim() === "") {
        return { ok: false, error: "author is required and must be a non-empty string" };
    }
    return { ok: true, value };
}

function checkRating(value: unknown): FieldResult<number> {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
        return { ok: false, error: "rating must be an integer between 1 and 5" };
    }
    return { ok: true, value };
}

function checkDone(value: unknown): FieldResult<boolean> {
    if (value === undefined) {
        return { ok: true, value: false };
    }
    if (typeof value !== "boolean") {
        return { ok: false, error: "done must be a boolean" };
    }
    return { ok: true, value };
}

export function validateNoteInput(body: unknown): Result<NoteInput> {
    if (!isRecord(body)) {
        return { ok: false, errors: { body: "Request body must be a JSON object" } };
    }

    const title = checkTitle(body.title);
    const author = checkAuthor(body.author);
    const rating = checkRating(body.rating);
    const done = checkDone(body.done);

    const errors: FieldErrors = {};
    if (!title.ok) errors.title = title.error;
    if (!author.ok) errors.author = author.error;
    if (!rating.ok) errors.rating = rating.error;
    if (!done.ok) errors.done = done.error;

    if (!title.ok || !author.ok || !rating.ok || !done.ok) {
        return { ok: false, errors };
    }
    return {
        ok: true,
        value: { title: title.value, author: author.value, rating: rating.value, done: done.value },
    };
}

export function parseListFilters(params: URLSearchParams): Result<ListFilters> {
    const filters: ListFilters = {};
    const errors: FieldErrors = {};

    const author = params.get("author");
    if (author !== null) {
        filters.author = author;
    }

    const done = params.get("done");
    if (done !== null) {
        if (done === "true") {
            filters.done = true;
        } else if (done === "false") {
            filters.done = false;
        } else {
            errors.done = "done must be 'true' or 'false'";
        }
    }

    const min = params.get("min");
    if (min !== null) {
        const value = Number(min);
        if (min.trim() !== "" && Number.isInteger(value) && value >= 1 && value <= 5) {
            filters.min = value;
        } else {
            errors.min = "min must be an integer between 1 and 5";
        }
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }
    return { ok: true, value: filters };
}
