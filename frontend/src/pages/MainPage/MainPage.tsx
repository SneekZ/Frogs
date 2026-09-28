import "./styleMainPage.css";
import { useEffect, useRef, useState } from "react";
import SideMenu from "../../components/SideMenu/SideMenu";
import ConnectionsContextProvider from "../../api/Connections/ConnectionsContextProvider";
import SignsContextProvider from "../../components/SignsContext/SignsContextProvider";
import SignsContainer from "../../components/SignsContainer/SignsContainer";
import HeaderMenu from "../../components/HeaderMenu/HeaderMenu";
import FooterMenu from "../../components/FooterMenu/FooterMenu";

export default function MainPage() {
  // Выезжающая панель есть только на телефоне, на компьютере .drawer не влияет на раскладку
  const [menuOpen, setMenuOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Фокус в открытую панель, чтобы с клавиатуры не остаться за затемнением
  useEffect(() => {
    if (menuOpen) closeRef.current?.focus();
  }, [menuOpen]);

  return (
    <div className="main-container">
      <SignsContextProvider>
        <ConnectionsContextProvider>
          <div
            id="drawer"
            className={`drawer${menuOpen ? " open" : ""}`}
            // Выбрал сервер — панель больше не нужна
            onClick={(e) =>
              (e.target as Element).closest(".side-menu-list-item-button-main") &&
              setMenuOpen(false)
            }
          >
            {/* Стоит на месте кнопки открытия в шапке */}
            <button
              ref={closeRef}
              type="button"
              className="button menu-button drawer-close"
              aria-label="Закрыть меню"
              onClick={() => setMenuOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path
                  d="M2.5 2.5l9 9M11.5 2.5l-9 9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <SideMenu />
            <FooterMenu />
          </div>
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Закрыть меню"
            tabIndex={menuOpen ? 0 : -1}
            onClick={() => setMenuOpen(false)}
          />
          <HeaderMenu menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
        </ConnectionsContextProvider>
        <SignsContainer />
      </SignsContextProvider>
    </div>
  );
}
