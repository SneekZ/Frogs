import { ServerConnection } from "../../structures/ServerConnection";
import { buildErrorMessage, safeParse } from "../ApiHandler";

export interface EventHandlers {
  // Поток открыт; с logs следом придёт весь сегодняшний лог.
  onOpen: () => void;
  // Данные /status на сервере изменились.
  onStatus: () => void;
  onLogs: (lines: string[]) => void;
}

// Читает /events построчно, пока сервер не закроет поток или не сработает signal.
// Строки: "status" — статус изменился, "log <строка>" — строка лога (только с logs),
// остальные (например, "hello" сразу после открытия) пропускаются.
// EventSource не подходит: он не умеет отправлять заголовок Authorization.
export async function StreamEvents(
  conn: ServerConnection,
  logs: boolean,
  handlers: EventHandlers,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch(
    `http://${conn.host}:${conn.port}/events${logs ? "?logs=true" : ""}`,
    { headers: { Authorization: conn.password }, signal }
  );
  if (!res.ok || !res.body) {
    throw new Error(buildErrorMessage(res, await safeParse(res)));
  }
  handlers.onOpen();

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let tail = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    // Кусок может оборваться посреди строки: неполный хвост ждёт следующего куска.
    const lines = (tail + value).split("\n");
    tail = lines.pop() ?? "";

    // Несколько status в одном куске — один перезапрос.
    let status = false;
    const logLines: string[] = [];
    for (const line of lines) {
      if (line === "status") status = true;
      else if (line.startsWith("log ")) logLines.push(line.slice(4));
    }
    if (logLines.length > 0) handlers.onLogs(logLines);
    if (status) handlers.onStatus();
  }
}
