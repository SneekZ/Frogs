export interface License {
  licensecode: string;
  licenseerrorcode: number;
  licenseactuality: string;
  licensetype: string;
}

export const defaultLicense: License = {
  licensecode: "",
  licenseactuality: "",
  licenseerrorcode: 0,
  licensetype: "",
};
