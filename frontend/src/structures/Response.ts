import { Info } from "./Info";
import { Sign } from "./Sign";
import { Container } from "./Container";
import { License } from "./License";

export interface Response {
  error: string;
  info: Info;
  signs: Sign[];
  containers: Container[];
  license: License;
}
