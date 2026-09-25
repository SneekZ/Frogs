import { FC, useContext } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import "./styleSignsContainer.css";
import SignCard from "../SignCard/SignCard";

const SignsContainer: FC = () => {
  const { filteredSignsList, activeConnection } = useContext(SignsContext);

  if (activeConnection.id === -1) {
    return (
      <main className="signs-container signs-empty">
        <p>Выберите сервер</p>
        <span>Список сертификатов появится здесь</span>
      </main>
    );
  }

  return (
    <main className="default-container signs-container">
      {Array.from(filteredSignsList.entries()).map(([thumbprint]) => (
        <SignCard key={thumbprint} inputThumbprint={thumbprint} />
      ))}
    </main>
  );
};

export default SignsContainer;
