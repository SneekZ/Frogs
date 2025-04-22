import "./styleMainpage.css";
import SideMenu from "../../components/SideMenu/SideMenu";
import { ConnectionsContext } from "../../api/ConnectionsHandler";
import { useState } from "react";

export default function MainPage() {
  const [depend, changeDepend] = useState(0);
  const [list, setList] = useState([]);

  return (
    <div className="main-container">
      <ConnectionsContext.Provider value={{ list, depend, changeDepend }}>
        <SideMenu />
      </ConnectionsContext.Provider>
    </div>
  );
}
