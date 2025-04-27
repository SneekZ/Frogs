import { Info, defaultInfo } from "./Info";
import { Sign } from "./Sign";
import { Container } from "./Container";
import { License, defaultLicense } from "./License";

export interface Response {
  error: string;
  info: Info;
  signs: Sign[];
  containers: Container[];
  license: License;
}

export const defaultResponse = {
  error: "",
  info: defaultInfo,
  signs: [],
  containers: [],
  license: defaultLicense,
};
