import "./styleLogsModal.css";
import { FC, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import Modal, { ModalProps } from "../Modal/Modal";
import Input from "../Input/Input";
import { GetLogDay, GetLogDays, LogDays } from "../../api/handlers/Logs";

// Значение выбора «сегодня, в реальном времени»; остальные — даты ГГГГ-ММ-ДД.
const LIVE = "";

// Держим только хвост лога: каждая новая строка перерисовывает весь список,
// и на десятках тысяч строк вкладка начинает тормозить.
const MAX_LINES = 5000;

const LogsModal: FC<ModalProps> = ({ isOpen, onClose }) => {
  const { activeConnection, subscribeLogs } = useContext(SignsContext);
  const [days, setDays] = useState<LogDays | null>(null);
  const [selected, setSelected] = useState(LIVE);
  const [lines, setLines] = useState<string[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const noConnection = activeConnection.id === -1;

  // Пока окно открыто, подключение не сменить, поэтому выбор дня достаточно сбрасывать при закрытии.
  const close = () => {
    setSelected(LIVE);
    onClose();
  };

  useEffect(() => {
    setDays(null);
    if (!isOpen || noConnection) return;
    let cancelled = false;
    // Без списка дней остаётся только live-режим, поэтому ошибку здесь не показываем.
    GetLogDays(activeConnection)
      .then((d) => !cancelled && setDays(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeConnection, noConnection]);

  // Сегодня: весь файл и новые строки по мере появления — из общего потока событий,
  // переподключается он сам.
  useEffect(() => {
    setLines([]);
    setLive(false);
    setError("");
    if (!isOpen || noConnection || selected !== LIVE) return;

    // При каждом подключении сервер заново шлёт весь сегодняшний лог: первый кусок заменяет список.
    let fresh = true;
    return subscribeLogs({
      onOpen: () => {
        fresh = true;
        setLive(true);
        setError("");
      },
      onLines: (chunk) => {
        const replace = fresh;
        fresh = false;
        setLines((prev) =>
          (replace ? chunk : [...prev, ...chunk]).slice(-MAX_LINES)
        );
      },
      onError: (reason) => {
        setLive(false);
        setError(reason);
      },
    });
  }, [isOpen, activeConnection, noConnection, selected, subscribeLogs]);

  // Прошлый день: загружаем один раз целиком.
  useEffect(() => {
    if (!isOpen || noConnection || selected === LIVE) return;
    let cancelled = false;
    setLoading(true);
    GetLogDay(activeConnection, selected)
      .then((dayLines) => !cancelled && setLines(dayLines.slice(-MAX_LINES)))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeConnection, noConnection, selected]);

  const needle = filter.toLowerCase();
  const shown = needle
    ? lines.filter((line) => line.toLowerCase().includes(needle))
    : lines;

  // Держимся низа, пока пользователь сам не прокрутил вверх.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [lines, filter]);

  let status: string;
  if (selected !== LIVE) {
    status = loading ? "Загрузка…" : error || `Строк: ${lines.length}`;
  } else if (live) {
    status = "В реальном времени";
  } else if (error) {
    status = `Нет связи: ${error}. Переподключение…`;
  } else {
    status = "Подключение…";
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Логи сервера"
      className="logs-modal-container"
    >
      <div className="logs-toolbar">
        <select
          className="logs-day"
          aria-label="День"
          value={selected}
          onChange={(e) => {
            stickToBottom.current = true;
            setSelected(e.target.value);
          }}
          disabled={noConnection}
        >
          <option value={LIVE}>Сегодня — в реальном времени</option>
          {days?.days
            .filter((day) => day !== days.today)
            .map((day) => (
              <option key={day} value={day}>
                {day.split("-").reverse().join(".")}
              </option>
            ))}
        </select>
        <Input
          placeholder="Фильтр"
          className="input-search logs-filter"
          onChange={(e) => setFilter(e.target.value)}
        />
        <span
          className={`logs-status${error && !live ? " logs-status-error" : ""}`}
          role="status"
        >
          {status}
        </span>
      </div>
      <div
        ref={listRef}
        className="logs-list"
        tabIndex={0}
        aria-label="Строки лога"
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
      >
        {lines.length === MAX_LINES && (
          <div className="logs-empty">
            Показаны последние {MAX_LINES} строк
          </div>
        )}
        {shown.map((line, i) => (
          <div key={i} className={`logs-line ${levelClass(line)}`}>
            {line}
          </div>
        ))}
        {shown.length === 0 && !loading && (
          <div className="logs-empty">
            {noConnection ? "Выберите сервер" : "Пока пусто"}
          </div>
        )}
      </div>
    </Modal>
  );
};

// Строка slog выглядит как «2026/09/27 16:05:26 WARN Запрос …».
function levelClass(line: string): string {
  const level = / (ERROR|WARN|DEBUG) /.exec(line)?.[1];
  return level ? `logs-line-${level.toLowerCase()}` : "";
}

export default LogsModal;
