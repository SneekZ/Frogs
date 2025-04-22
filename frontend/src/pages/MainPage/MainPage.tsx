import "./styleMainpage.css";
import SideMenu from "../../components/SideMenu/SideMenu";
import ConnectionsContextProvider from "../../api/Connections/ConnectionsContextProvider";

export default function MainPage() {
  return (
    <div className="main-container">
      <ConnectionsContextProvider>
        <SideMenu />
      </ConnectionsContextProvider>
    </div>
  );
}
