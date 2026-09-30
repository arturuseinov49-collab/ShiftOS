"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ZodError } from "zod";
import { createDemoState } from "@/modules/operations/fixtures";
import { demoStorageKey, restoreDemo } from "@/modules/operations/storage";
import type { DemoState } from "@/modules/operations/types";
import type { DemoContext } from "./common";
type Store = DemoContext & {
  ready: boolean;
  message: string;
  error: boolean;
  dismiss: () => void;
  reset: () => void;
};
const Context = createContext<Store | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createDemoState);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const latest = useRef(state);
  /* eslint-disable react-hooks/set-state-in-effect -- Browser demo persistence is an external system, restored after hydration. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(demoStorageKey);
      if (raw) {
        const saved = restoreDemo(raw);
        if (saved) {
          latest.current = saved;
          setState(saved);
        } else
          setMessage(
            "Сохранённое демо устарело или повреждено. Загружен исходный сценарий.",
          );
      }
    } catch {
      setMessage(
        "Браузер ограничил сохранение. Изменения доступны только до закрытия страницы.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(demoStorageKey, JSON.stringify(state));
    } catch {
      setMessage(
        "Не удалось сохранить изменения в браузере. Не закрывайте вкладку, если они нужны.",
      );
    }
  }, [state, ready]);
  /* eslint-enable react-hooks/set-state-in-effect */
  function apply(update: (state: DemoState) => DemoState, success?: string) {
    try {
      const next = update(latest.current);
      latest.current = next;
      setState(next);
      setError(false);
      if (success) setMessage(success);
      return true;
    } catch (e) {
      setError(true);
      setMessage(
        e instanceof ZodError
          ? "Проверьте заполненные поля и допустимые значения."
          : e instanceof Error
            ? e.message
            : "Не удалось выполнить действие.",
      );
      return false;
    }
  }
  return (
    <Context.Provider
      value={{
        state,
        actor: { role: state.role, employeeId: state.employeeId },
        ready,
        apply,
        message,
        error,
        dismiss: () => setMessage(""),
        reset: () => {
          apply(() => createDemoState(), "Исходное демо восстановлено.");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Missing demo provider");
  return ctx;
}
