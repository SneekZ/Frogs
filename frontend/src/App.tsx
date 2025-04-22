import MainPage from "./pages/MainPage/MainPage";
import { NotificationContextProvider } from "./components/Notification/NotificationContextProvider";

export default function App() {
  return (
    <NotificationContextProvider>
      <MainPage />
    </NotificationContextProvider>
  );
}
