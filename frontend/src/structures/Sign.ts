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

const mockIssuer: Issuer = {
  e: "uc@esphere.ru",
  s: "78 г. Санкт-Петербург",
  inn: "",
  ogrn: "1057812752502",
  street: "Большой Сампсониевский пр., д.68, лит. Н, пом. 1Н",
  l: "Санкт-Петербург",
  c: "RU",
  ou: "Удостоверяющий центр",
  o: "ООО КОРУС Консалтинг СНГ",
  cn: "ООО КОРУС Консалтинг СНГ",
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

const mockSubject: Subject = {
  e: "nadyacool2601@mail.ru",
  s: "72 Тюменская обл",
  inn: "860806315542",
  ogrn: "",
  street: "",
  l: "Тюмень",
  c: "RU",
  ou: "",
  o: "",
  cn: "Сидоряк Надежда Петровна",
  t: "",
  sn: "Сидоряк",
  g: "Надежда Петровна",
  snils: "14523496259",
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

export const mockSign: Sign = {
  issuer: mockIssuer,
  subject: mockSubject,
  serial: "0x025008C500BDB0149542B51175B35717F1",
  thumbprint: "ab2de83d5d9cd6f38be35af57e3c5f1c49c9b085",
  subjkey: "53a89b3b90e2e68c4855d51925b1cb8fe7491f77",
  signaturealgorithm: "ГОСТ Р 34.11-2012/34.10-2012 256 бит",
  publickeyalgorithm: "ГОСТ Р 34.10-2012 (512 bits)",
  notvalidbefore: 1700221643,
  notvalidafter: 1731844643,
  container: {
    name: "",
    foldername: "Sidory.000",
  },
  providername: "Crypto-Pro GOST R 34.10-2012 KC1 CSP",
  checked: true,
  valid: false,
  checkerror: ["Сертификат просрочен"],
  password: "",
  databaseids: [],
};
