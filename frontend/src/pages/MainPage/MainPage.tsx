import "./styleMainpage.css";
import SideMenu from "../../components/SideMenu/SideMenu";
import ConnectionsContextProvider from "../../api/Connections/ConnectionsContextProvider";
import SignsContextProvider from "../../components/SignsContext/SignsContextProvider";

export default function MainPage() {
  return (
    <div className="main-container">
      <SignsContextProvider>
        <ConnectionsContextProvider>
          <SideMenu />
        </ConnectionsContextProvider>
      </SignsContextProvider>
    </div>
  );
}
