import { ServerConnection } from "../../structures/ServerConnection";
import { buildErrorMessage, safeParse } from "../ApiHandler";
import { Container } from "../../structures/Container";
import { Response } from "../../structures/Response";

async function UploadContainers(
  conn: ServerConnection,
  files: File[]
): Promise<Container[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  // Content-Type не задаем: boundary для multipart браузер проставит сам
  const response = await fetch(
    `http://${conn.host}:${conn.port}/containers/upload`,
    {
      method: "POST",
      body: formData,
      headers: {
        Authorization: conn.password,
      },
    }
  );

  const body = await safeParse(response);
  if (!response.ok) {
    throw new Error(buildErrorMessage(response, body));
  }

  return (body as Response).containers;
}

export default UploadContainers;
