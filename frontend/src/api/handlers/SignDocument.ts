import { ServerConnection } from "../../structures/ServerConnection";
import { buildErrorMessage, safeParse } from "../ApiHandler";

async function SignDocument(
  conn: ServerConnection,
  thumbprint: string,
  findPassword: boolean,
  password: string,
  file: File
): Promise<Blob> {
  const formData = new FormData();

  formData.append("thumbprint", thumbprint);
  formData.append("findpassword", findPassword.toString());
  formData.append("password", password);

  formData.append("file", file);

  const endpoint = "/signs/signdocument";

  const url = `http://${conn.host}:${conn.port}${
    endpoint.startsWith("/") ? "" : "/"
  }${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: conn.password,
    },
  });

  if (!response.ok) {
    throw new Error(buildErrorMessage(response, await safeParse(response)));
  }

  return await response.blob();
}

export default SignDocument;
