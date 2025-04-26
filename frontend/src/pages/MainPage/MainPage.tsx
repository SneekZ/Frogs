import "./styleMainpage.css";
import SideMenu from "../../components/SideMenu/SideMenu";
import ConnectionsContextProvider from "../../api/Connections/ConnectionsContextProvider";
import SignsContextProvider from "../../components/SignsContext/SignsContextProvider";
import SignsContainer from "../../components/SignsContainer/SignsContainer";
import HeaderMenu from "../../components/HeaderMenu/HeaderMenu";

export default function MainPage() {
  return (
    <div className="main-container">
      <SignsContextProvider>
        <ConnectionsContextProvider>
          <SideMenu />
        </ConnectionsContextProvider>
        <HeaderMenu />
        <SignsContainer />
      </SignsContextProvider>
    </div>
  );
}
