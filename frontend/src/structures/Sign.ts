import { Container } from "./Container";

export interface Issuer {
  e: string;
  s: string;
  inn: string;
  ogrn: string;
  street: string;
  l: string;
  c: string;
  ou: string;
  o: string;
  cn: string;
}

export interface Subject extends Issuer {
  t: string;
  sn: string;
  g: string;
  snils: string;
}

export interface Sign {
  issuer: Issuer;
  subject: Subject;
  serial: string;
  thumbprint: string;
  subjkey: string;
  signaturealgorithm: string;
  publickeyalgorithm: string;
  notvalidbefore: number;
  notvalidafter: number;
  container: Container;
  providername: string;
  checked: boolean;
  valid: boolean;
  checkerror: string[];
  password: string;
  databaseids: number[];
}
