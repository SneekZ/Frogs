import "./styleNotification.css";
import { FC, useState, useEffect, useRef, CSSProperties } from "react";
import { useNotificationTimer } from "../../utils/Timer";

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

  const { pause, resume, reset } = useNotificationTimer(3, () => {
    setHidden(true);
  });

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
    reset();
  }, [tick, reset]);

  return (
    <div
      className={`notification ${hidden === null ? "" : hidden ? "hide" : "show"}`}
      style={{ "--tint": color } as CSSProperties}
      role="status"
      aria-live="polite"
      onMouseOver={() => {
        setExpanded(true);
        pause();
      }}
      onMouseLeave={() => {
        setExpanded(false);
        resume();
      }}
    >
      <span className="notification-title">{title}</span>

      <div className={`message ${expanded ? "expanded" : "collapsed"}`}>
        {message}
      </div>
    </div>
  );
};
