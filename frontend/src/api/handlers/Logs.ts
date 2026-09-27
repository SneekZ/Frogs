import { ServerConnection } from "../../structures/ServerConnection";
import { buildErrorMessage, defaultRequest, safeParse } from "../ApiHandler";

// Читает /logs/stream построчно, пока сервер не закроет поток или не сработает signal.
// EventSource не подходит: он не умеет отправлять заголовок Authorization.
export async function StreamLogs(
  conn: ServerConnection,
  onLines: (lines: string[]) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch(`http://${conn.host}:${conn.port}/logs/stream`, {
    headers: { Authorization: conn.password },
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(buildErrorMessage(res, await safeParse(res)));
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let tail = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    // Кусок может оборваться посреди строки: неполный хвост ждёт следующего куска.
    const lines = (tail + value).split("\n");
    tail = lines.pop() ?? "";
    if (lines.length > 0) onLines(lines);
  }
}

export interface LogDays {
  today: string;
  days: string[];
}

// Текущая дата сервера и даты, за которые есть логи, от новых к старым.
export async function GetLogDays(conn: ServerConnection): Promise<LogDays> {
  return (await defaultRequest(conn, "/logs/days")) as unknown as LogDays;
}

// Лог за день целиком, построчно.
export async function GetLogDay(
  conn: ServerConnection,
  day: string
): Promise<string[]> {
  const text = (await defaultRequest(conn, `/logs/days/${day}`)) as unknown as string;
  return text.split("\n").filter((line) => line !== "");
}
