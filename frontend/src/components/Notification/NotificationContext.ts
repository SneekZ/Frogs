import { createContext } from "react";

export interface NotifyProps {
  type?: "success" | "error" | "warning";
  message?: string;
}
export interface NotificationContextProps {
  Notify: ({ ...NotifyProps }) => void;
}

export const NotificationContext = createContext<NotificationContextProps>({
  Notify: () => {},
});
