"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      theme?: "auto" | "light" | "dark";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function TurnstileWidget({
  siteKey,
  resetSignal,
  onVerify,
  onExpire,
}: {
  siteKey: string;
  resetSignal: number;
  onVerify: (token: string) => void;
  onExpire: () => void;
}) {
  const reactId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<"pending" | "ready" | "error">("pending");

  useEffect(() => {
    if (!scriptReady || !window.turnstile || !containerRef.current || widgetIdRef.current) {
      return;
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "auto",
      callback: (token) => {
        setStatus("ready");
        onVerify(token);
      },
      "expired-callback": () => {
        setStatus("pending");
        onExpire();
      },
      "error-callback": () => {
        setStatus("error");
        onExpire();
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onExpire, onVerify, scriptReady, siteKey]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setStatus("pending");
      onExpire();
    }
  }, [onExpire, resetSignal]);

  return (
    <div className="rounded-md border border-line bg-surface-2 p-3">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div id={`turnstile-${reactId}`} ref={containerRef} className="min-h-[65px]" />
      <p className="mt-2 text-xs leading-5 text-subtle">
        {status === "ready"
          ? "認証チェックが完了しました。"
          : status === "error"
            ? "認証チェックを完了できませんでした。再読み込みしてもう一度お試しください。"
            : "認証チェックを完了してください。"}
      </p>
    </div>
  );
}
