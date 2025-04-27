import "./styleHeaderMenu.css";
import { FC, useContext, useCallback, useState } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import FrogsInput from "../Input/Input";
import FrogsButton from "../Button/Button";
import FrogsChoice from "../Choice/Choice";

const HeaderMenu: FC = () => {
  return (
    <div className="header-container">
      <FilterInput />
      <FilterChoice />
      <UpdateButton />
      <CheckAllButton />
    </div>
  );
};

const FilterInput: FC = () => {
  const { setFilter } = useContext(SignsContext);
  return (
    <FrogsInput
      className="filter-input"
      placeholder="Поиск сертификатов..."
      onChange={(e) => setFilter(e.target.value)}
    />
  );
};

const FilterChoice: FC = () => {
  const { setFilterType } = useContext(SignsContext);

  const changeHandler = useCallback(
    (value: string) => {
      setFilterType(value === "snils" || value === "name" ? value : "snils");
    },
    [setFilterType]
  );

  return (
    <FrogsChoice
      options={[
        { value: "snils", label: "СНИЛС" },
        { value: "name", label: "Имя" },
      ]}
      defaultOption={0}
      className="filter-type"
      onChange={changeHandler}
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
  const { checkAllSigns } = useContext(SignsContext);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    checkAllSigns(() => setLoading(false));
  }, [checkAllSigns]);

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
