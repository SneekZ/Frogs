import React, { useState, useEffect, useRef } from "react";
import "./Notification.css";

interface NotificationProps {
  message: string;
  details?: string;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  details,
  duration = 5000,
}) => {
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>(duration);

  const show = () => {
    setVisible(true);
    startTimer();
  };

  const hide = () => {
    setVisible(false);
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(hide, duration);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    startTimer();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Функция для внешнего вызова
  const showNotification = () => {
    show();
  };

  if (!visible) return null;

  return (
    <div
      className={`notification ${isHovered ? "expanded" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="notification-content">
        <div className="notification-message">{message}</div>
        {details && <div className="notification-details">{details}</div>}
      </div>
    </div>
  );
};

// Экспортируем функцию для вызова уведомления
export const notify = (
  message: string,
  details?: string,
  duration?: number
) => {
  // В реальном приложении здесь будет логика рендеринга Notification
  // Например, через портал или глобальный state
  console.log("Notification:", message, details);
  // Это заглушка - в реальном коде нужно реализовать отображение
};
