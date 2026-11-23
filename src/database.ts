import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue, SQLOutputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ListFilters, Note, NoteInput } from "./types.ts";

type DatabaseRow = Record<string, SQLOutputValue>;

const DATABASE_PATH = join(import.meta.dirname, "..", "data", "notes.db");

mkdirSync(dirname(DATABASE_PATH), { recursive: true });

const db = new DatabaseSync(DATABASE_PATH);

db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
        id         TEXT    PRIMARY KEY,
        title      TEXT    NOT NULL,
        author     TEXT    NOT NULL,
        rating     INTEGER NOT NULL,
        done       INTEGER NOT NULL,
        created_at TEXT    NOT NULL
    )
`);

const countNotesStatement = db.prepare("SELECT COUNT(*) AS total FROM notes");
const selectNoteStatement = db.prepare(
    "SELECT id, title, author, rating, done, created_at FROM notes WHERE id = ?",
);
const insertNoteStatement = db.prepare(
    `INSERT INTO notes (id, title, author, rating, done, created_at)
     VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?)
     RETURNING id, title, author, rating, done, created_at`,
);
const deleteNoteStatement = db.prepare("DELETE FROM notes WHERE id = ?");

function runInTransaction<T>(work: () => T): T {
    db.exec("BEGIN IMMEDIATE");
    try {
        const result = work();
        db.exec("COMMIT");
        return result;
    } catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}

function rowToNote(row: DatabaseRow): Note {
    const { id, title, author, rating, done, created_at: createdAt } = row;
    if (
        typeof id !== "string" ||
        typeof title !== "string" ||
        typeof author !== "string" ||
        typeof rating !== "number" ||
        typeof done !== "number" ||
        typeof createdAt !== "string"
    ) {
        throw new Error("Unexpected row shape in notes table");
    }
    return { id, title, author, rating, done: done === 1, createdAt };
}

export function countNotes(): number {
    const row = countNotesStatement.get();
    const total = row?.total;
    if (typeof total !== "number") {
        throw new Error("Unexpected result for notes count");
    }
    return total;
}

export function findNoteById(id: string): Note | undefined {
    const row = selectNoteStatement.get(id);
    return row ? rowToNote(row) : undefined;
}

export function listNotes(filters: ListFilters): Note[] {
    const conditions: string[] = [];
    const params: SQLInputValue[] = [];

    if (filters.author !== undefined) {
        conditions.push("author = ? COLLATE NOCASE");
        params.push(filters.author);
    }
    if (filters.done !== undefined) {
        conditions.push("done = ?");
        params.push(filters.done ? 1 : 0);
    }
    if (filters.min !== undefined) {
        conditions.push("rating >= ?");
        params.push(filters.min);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const statement = db.prepare(
        `SELECT id, title, author, rating, done, created_at FROM notes ${where}
         ORDER BY created_at DESC, title COLLATE NOCASE ASC, title ASC`,
    );
    return statement.all(...params).map(rowToNote);
}

export function createNote(input: NoteInput): Note {
    const createdAt = new Date().toISOString();
    return runInTransaction(() => {
        const row = insertNoteStatement.get(
            input.title,
            input.author,
            input.rating,
            input.done ? 1 : 0,
            createdAt,
        );
        if (!row) {
            throw new Error("Insert did not return the created note");
        }
        return rowToNote(row);
    });
}

export function deleteNote(id: string): boolean {
    return runInTransaction(() => deleteNoteStatement.run(id).changes > 0);
}

export function closeDatabase(): void {
    db.close();
}
