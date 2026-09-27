import { FC, useContext } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import "./styleSignsContainer.css";
import SignCard from "../SignCard/SignCard";
import Choice from "../Choice/Choice";
import { SignStatus } from "../../structures/Sign";

const statusOptions = [
  { value: "", label: "Все" },
  { value: "valid", label: "Действительные" },
  { value: "invalid", label: "Недействительные" },
  { value: "unchecked", label: "Непроверенные" },
];

const SignsContainer: FC = () => {
  const {
    filteredSignsList,
    activeConnection,
    statusLoading,
    statusFilter,
    setStatusFilter,
  } = useContext(SignsContext);

  if (activeConnection.id === -1) {
    return (
      <main className="signs-container signs-empty">
        <p>Выберите сервер</p>
        <span>Список сертификатов появится здесь</span>
      </main>
    );
  }

  return (
    <main className="default-container signs-container" aria-busy={statusLoading}>
      <Choice
        className="signs-status-filter"
        aria-label="Статус сертификатов"
        options={statusOptions}
        value={statusFilter}
        onChange={(value) => setStatusFilter(value as SignStatus | "")}
      />
      {statusLoading && (
        <div className="signs-loading" role="status">
          <span className="signs-loading-ring" />
          Загрузка сертификатов…
        </div>
      )}
      {Array.from(filteredSignsList.entries()).map(([thumbprint]) => (
        <SignCard key={thumbprint} inputThumbprint={thumbprint} />
      ))}
    </main>
  );
};

export default SignsContainer;
