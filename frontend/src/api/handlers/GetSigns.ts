import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest, SetState } from "../ApiHandler";
import { Sign } from "../../structures/Sign";

type SetSigns = SetState<Sign[]>;

export async function GetSigns(
  connection: ServerConnection,
  setter: SetSigns
): Promise<void> {
  try {
    const response = await defaultRequest(connection, "/signs");
    setter(response.signs);
  } catch (e) {
    console.log((e as Error).message);
  }
}
