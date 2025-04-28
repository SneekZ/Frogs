import "./styleHeaderMenu.css";
import { FC, useContext, useCallback, useState, useEffect } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import FrogsInput from "../Input/Input";
import FrogsButton from "../Button/Button";
import { NotificationContext } from "../Notification/NotificationContext";

const HeaderMenu: FC = () => {
  return (
    <div className="header-container">
      <FilterInput />
      <UpdateButton />
      <CheckAllButton />
    </div>
  );
};

const FilterInput: FC = () => {
  const { setFilter } = useContext(SignsContext);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        const input = document.getElementById(
          "signsSearch"
        ) as HTMLInputElement;
        input?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <FrogsInput
      id="signsSearch"
      className="filter-input"
      placeholder="Поиск сертификатов..."
      onChange={(e) => setFilter(e.target.value)}
    />
  );
};

const UpdateButton: FC = () => {
  const { refreshActiveConnectionStatus } = useContext(SignsContext);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    refreshActiveConnectionStatus(() => setLoading(false));
  }, [refreshActiveConnectionStatus]);

  return (
    <FrogsButton
      label="Обновить"
      onClick={handleClick}
      className="update-button"
      loading={loading}
    />
  );
};

const CheckAllButton: FC = () => {
  const { Notify } = useContext(NotificationContext);
  const { checkAllSigns } = useContext(SignsContext);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    Notify({ type: "warning", message: "Это может занять до полутора минут" });
    setLoading(true);
    checkAllSigns(() => setLoading(false));
  }, [Notify, checkAllSigns]);

  return (
    <FrogsButton
      label="Проверить все"
      onClick={handleClick}
      className="check-all-button"
      loading={loading}
    />
  );
};

export default HeaderMenu;
