import { ApiErrorBody } from "@/types/api";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
const TOKEN_KEY = "bazaar_token";


/* ---------- token storage (the only place that touches it) ---------- */

export const getToken = (): string | null => {
    if (typeof window === "undefined") return null;

    try {
        return window.localStorage.getItem(TOKEN_KEY);

    } catch {
        return null;
    }
};

export const setToken = (token: string): void => {
    try {
        window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
        //storage blocked: user stays logged out
    }
}

export const clearToken = (): void => {
    try {
        window.localStorage.removeItem(TOKEN_KEY);
    } catch {
        //ignore
    }
}

/* ---------- 401 handling ---------- */

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (fn: (() => void) | null): void => {
    onUnauthorized = fn;
}

/* ---------- errors ---------- */

export class ApiError extends Error {
    status: number;
    details?: unknown;

    constructor(status: number, message: string, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }

    get fieldErrors(): Record<string, string> {
        const out: Record<string, string> = {};
        if (!Array.isArray(this.details)) return out;

        for (const d of this.details) {
            if (d && typeof d === "object" && "field" in d && "message" in d) {
                const field = String((d as { field: unknown }).field);
                if (!(field in out)) out[field] = String((d as { message: unknown }).message);
            }
        }
        return out;
    }
}

export const errorMessage = (err: unknown): string =>
    err instanceof Error ? err.message : "Something went wrong";

/* ---------- request ---------- */

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
    query?: Record<string, QueryValue>; //set false for public routes so no token is sent
    auth?: boolean;
    signal?: AbortSignal; // pass "no-store" in server components that must always show fresh data
    cache?: RequestCache;
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts: RequestOptions = {}

): Promise<T> {
    const url = new URL(`${API_URL}${path}`);

    for (const [key, value] of Object.entries(opts.query ?? {})) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {Accept: "application/json"};
    if(body !== undefined) headers["Content-Type"] = "application/json";

    const token = opts.auth === false ? null : getToken();
    if(token) headers.Authorization = `Bearer ${token}`;

    let res: Response;
    try {
        res = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: opts.signal,
            cache: opts.cache,
        });
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        throw new ApiError(0, "Cannot reach the server. check your connection and try again.");
    }

    const text = await res.text();
    let data: unknown = null;
    if(text){
        try{
            data = JSON.parse(text);
        }catch{
            data = null;
        }
    }

    if(!res.ok){
       const errBody = (data ?? {}) as Partial<ApiErrorBody>;
       
       if(res.status === 401 && token ) onUnauthorized?.();

       throw new ApiError(res.status, errBody.error ?? "Something went wrong", errBody.details);
    }

    return data as T;

}

export const api = {
    get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
    post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("POST", path, body, opts),
    put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PUT", path, body, opts),
    patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PATCH", path, body, opts),
    delte: <T>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, undefined, opts),
};


