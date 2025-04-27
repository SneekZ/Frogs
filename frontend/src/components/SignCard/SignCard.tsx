import "./styleSignCard.css";
import { FC, useContext, useState, useEffect } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import { Sign, defaultSign } from "../../structures/Sign";

interface SignCardProps {
  inputThumbprint: string;
}

const SignCard: FC<SignCardProps> = ({ inputThumbprint }) => {
  const [thumbprint] = useState<string>(inputThumbprint);
  const { signsList } = useContext(SignsContext);
  const [sign, setSign] = useState<Sign>(defaultSign);

  const [statusColor, setStatusColor] = useState("#3b3b3b");

  useEffect(() => {
    if (sign.checked) {
      if (sign.valid) {
        setStatusColor("#009900");
      } else {
        setStatusColor("#990000");
      }
    } else {
      setStatusColor("#3b3b3b");
    }
  }, [sign]);

  useEffect(() => {
    if (signsList.has(thumbprint)) {
      setSign(signsList.get(thumbprint) || defaultSign);
    }
  }, [signsList, thumbprint]);

  return (
    <div className="card-collapsed">
      <div className="card-collapsed-snils">{sign.subject.snils}</div>
      <div className="state-circle-container">
        <div
          className="state-circle"
          style={{ backgroundColor: statusColor }}
        />
      </div>
      <div className="card-collapsed-cn">{sign.subject.cn.toUpperCase()}</div>
    </div>
  );
};

export default SignCard;
