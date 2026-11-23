export interface Note {
    id: string;
    title: string;
    author: string;
    rating: number;
    done: boolean;
    createdAt: string;
}

export type NoteInput = Omit<Note, "id" | "createdAt">;

export type FieldErrors = Record<string, string>;

export interface ListFilters {
    author?: string;
    done?: boolean;
    min?: number;
}
