import { Container, defaultContainer } from "./Container";

interface Issuer {
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

const defaultIssuer: Issuer = {
  e: "",
  s: "",
  inn: "",
  ogrn: "",
  street: "",
  l: "",
  c: "",
  ou: "",
  o: "",
  cn: "",
};

interface Subject extends Issuer {
  t: string;
  sn: string;
  g: string;
  snils: string;
}

const defaultSubject: Subject = {
  e: "",
  s: "",
  inn: "",
  ogrn: "",
  street: "",
  l: "",
  c: "",
  ou: "",
  o: "",
  cn: "",
  t: "",
  sn: "",
  g: "",
  snils: "",
};

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

export const defaultSign: Sign = {
  issuer: defaultIssuer,
  subject: defaultSubject,
  serial: "",
  thumbprint: "",
  subjkey: "",
  signaturealgorithm: "",
  publickeyalgorithm: "",
  notvalidbefore: 0,
  notvalidafter: 0,
  container: defaultContainer,
  providername: "",
  checked: false,
  valid: false,
  checkerror: [],
  password: "",
  databaseids: [],
};
