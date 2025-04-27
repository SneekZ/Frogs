import { FC, useContext } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import "./styleSignsContainer.css";
import SignCard from "../SignCard/SignCard";

const SignsContainer: FC = () => {
  const { filteredSignsList } = useContext(SignsContext);

  return (
    <div className="default-container signs-container">
      {Array.from(filteredSignsList.entries()).map(([thumbprint]) => (
        <SignCard key={thumbprint} inputThumbprint={thumbprint} />
      ))}
    </div>
  );
};

export default SignsContainer;
