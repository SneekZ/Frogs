import { ServerConnection } from "../structures/ServerConnection";
import { loadConnections } from "./Connections/ConnectionsContext";
import { Response } from "../structures/Response";
import React from "react";

export function buildErrorMessage(
  res: globalThis.Response,
  body: unknown
): string {
  if (typeof body === "object" && body !== null && "error" in body) {
    const { error } = body as { error: string };
    if (error) return error;
  }

  if (typeof body === "string" && body.trim()) {
    return body.trim().slice(0, 200);
  }

  return `HTTP ${res.status}: ${res.statusText}`;
}

async function safeParse(res: globalThis.Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) return await res.json();
    if (ct.startsWith("text/")) return await res.text();
  } catch {
    /* fallthrough */
  }
  return null;
}

export async function defaultRequest(
  connection: ServerConnection | null = null,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const conn =
    connection ??
    loadConnections()[0] ??
    (() => {
      throw new Error("Нет доступных подключений");
    })();

  const url = `http://${conn.host}:${conn.port}${
    endpoint.startsWith("/") ? "" : "/"
  }${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: conn.password,
        ...options.headers,
      },
    });

    const body = await safeParse(res);

    /* --- ругаемся, если пришёл не 2xx --- */
    if (!res.ok) {
      throw new Error(buildErrorMessage(res, body));
    }

    /* --- OK → проверяем, что это действительно JSON ожидаемой формы --- */
    if (body === null) {
      throw new Error("Пустой ответ от сервера");
    }
    return body as Response;
  } catch (err) {
    // TypeError от fetch или наше Error
    if (err instanceof Error) throw err;
    throw new Error(String(err));
  }
}

export type SetState<S> = React.Dispatch<React.SetStateAction<S>>;
