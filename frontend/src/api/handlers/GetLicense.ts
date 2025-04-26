import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { License } from "../../structures/License";

export async function GetLicense(
  connection: ServerConnection
): Promise<License> {
  const license = defaultRequest(connection, "/license")
    .then((response) => {
      return response.license;
    })
    .catch((e) => {
      throw new Error(e?.message);
    });

  return license;
}
