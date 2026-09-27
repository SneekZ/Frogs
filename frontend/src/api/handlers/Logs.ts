import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";

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
