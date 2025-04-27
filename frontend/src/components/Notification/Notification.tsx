import "./styleNotification.css";
import { FC, useState, useEffect, useRef } from "react";
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
  const [hidden, setHidden] = useState(true);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("");

  const isFirstRender = useRef(true);

  const { pause, resume, reset } = useNotificationTimer(3, () => {
    setHidden(true);
  });

  useEffect(() => {
    switch (type) {
      case "success":
        setTitle("Success");
        setColor("#00bb00");
        break;

      case "error":
        setTitle("Error");
        setColor("#bb0000");
        break;

      case "warning":
        setTitle("Warning");
        setColor("#bbbb00");
        break;

      default:
        setTitle("Message");
        setColor("#000000");
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
      className={`notification ${hidden ? "hide" : "show"}`}
      style={{ color: color }}
      onMouseOver={() => {
        setExpanded(true);
        pause();
      }}
      onMouseLeave={() => {
        setExpanded(false);
        resume();
      }}
    >
      <span style={{ marginBottom: "auto" }}>{title}</span>

      <div className={`message ${expanded ? "expanded" : "collapsed"}`}>
        {message}
      </div>
    </div>
  );
};
