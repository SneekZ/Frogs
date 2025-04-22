import { ReactNode, FC, useState, useCallback } from "react";
import { Notification } from "./Notification";
import { NotificationContext, NotifyProps } from "./NotificationContext";

export const NotificationContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tick, setTick] = useState(false);
  const [type, setType] = useState("success");
  const [message, setMessage] = useState("");

  const Notify = useCallback((props: NotifyProps) => {
    setType(props.type || "success");
    setMessage(props.message || "");
    setTick((prev) => !prev);
  }, []);

  return (
    <NotificationContext.Provider value={{ Notify }}>
      {children}
      <Notification tick={tick} type={type} message={message} />
    </NotificationContext.Provider>
  );
};
