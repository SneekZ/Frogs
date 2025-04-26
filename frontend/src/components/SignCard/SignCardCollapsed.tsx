import { FC } from "react";
import { Sign, defaultSign } from "../../structures/Sign";

interface SignCardProps {
  thumbprint: string;
}

export const SignCardCollapsed: FC<SignCardProps> = () => {
  return <div className="card"></div>;
};
