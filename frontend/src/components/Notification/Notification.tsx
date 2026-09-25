import "./styleNotification.css";
import { FC, useState, useEffect, useRef, CSSProperties } from "react";

interface NotificationProps {
  tick: boolean;
  type?: string;
  message?: string;
}

export const Notification: FC<NotificationProps> = ({
  tick,
  type = "success",
  message,
}) => {
  const [expanded, setExpanded] = useState(false);
  // null = ещё не показывали, без класса анимации (иначе hide проигрывается при загрузке)
  const [hidden, setHidden] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("");

  const isFirstRender = useRef(true);

  useEffect(() => {
    switch (type) {
      case "success":
        setTitle("Готово");
        setColor("var(--green)");
        break;

      case "error":
        setTitle("Ошибка");
        setColor("var(--red)");
        break;

      case "warning":
        setTitle("Внимание");
        setColor("var(--orange)");
        break;

      default:
        setTitle("Сообщение");
        setColor("var(--accent)");
        break;
    }
  }, [type]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setHidden(false);
  }, [tick]);

  return (
    <div
      className={`notification ${hidden === null ? "" : hidden ? "hide" : "show"}`}
      style={{ "--tint": color } as CSSProperties}
      role="status"
      aria-live="polite"
      onMouseOver={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <span className="notification-title">{title}</span>

      <div className={`message ${expanded ? "expanded" : "collapsed"}`}>
        {message}
      </div>

      <button
        type="button"
        className="notification-close"
        onClick={() => setHidden(true)}
        aria-label="Закрыть уведомление"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path
            d="M1 1l8 8M9 1l-8 8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Полоска и есть таймер: CSS-анимация встаёт на паузу при наведении,
          по её окончании уведомление скрывается. key перезапускает её на новое сообщение */}
      {hidden === false && (
        <span
          key={String(tick)}
          className="notification-progress"
          aria-hidden="true"
          onAnimationEnd={() => setHidden(true)}
        />
      )}
    </div>
  );
};
