"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  formId:    string;
  formTitle: string;
  children:  React.ReactNode;
}

export function SignatureModal({ formId, formTitle, children }: Props) {
  const [open, setOpen]       = useState(false);
  const [tab, setTab]         = useState<"draw" | "typed">("draw");
  const [typedName, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const canvasRef             = useRef<HTMLCanvasElement>(null);
  const drawing               = useRef(false);
  const router                = useRouter();

  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  useEffect(() => {
    if (!open || tab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#F0F2F8";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function start(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      drawing.current = true;
      const { x, y } = getPos(e, canvas!);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    function move(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      if (!drawing.current) return;
      const { x, y } = getPos(e, canvas!);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    function end() { drawing.current = false; }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);
    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, [open, tab]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function onSubmit() {
    setLoading(true);
    setError(null);

    let signatureData: string;
    let signatureType: "draw" | "typed";

    if (tab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) { setLoading(false); return; }
      signatureData = canvas.toDataURL("image/png");
      signatureType = "draw";
    } else {
      if (!typedName.trim()) {
        setError("Please enter your name to sign");
        setLoading(false);
        return;
      }
      signatureData = typedName.trim();
      signatureType = "typed";
    }

    try {
      const res  = await fetch(`/api/v1/student/consent-forms/${formId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData, signatureType }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Failed to sign form");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        router.refresh();
      }, 1500);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  function onClose() {
    setOpen(false);
    setError(null);
    setSuccess(false);
    setTyped("");
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-100 border border-border rounded-lg w-full max-w-lg shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">Sign Consent Form</h2>
                <p className="text-xs text-ink-muted mt-0.5 truncate max-w-xs">{formTitle}</p>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-200 hover:text-ink transition-colors" aria-label="Close">
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 gap-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-prime" aria-hidden />
                <p className="font-semibold text-prime">Consent form signed!</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-below-soft border border-below/20 rounded-md text-sm text-below" role="alert">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                    <p>{error}</p>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-surface-50 border border-border rounded-md">
                  {(["draw", "typed"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setError(null); }}
                      className={`flex-1 h-7 rounded text-sm font-medium transition-colors duration-80 ${
                        tab === t ? "bg-accent text-white" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {t === "draw" ? "Draw" : "Type Name"}
                    </button>
                  ))}
                </div>

                {tab === "draw" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-ink-muted">Draw your signature below:</p>
                    <canvas
                      ref={canvasRef}
                      width={440}
                      height={150}
                      className="w-full border border-border rounded-md bg-surface-50 cursor-crosshair touch-none"
                      style={{ maxHeight: 150 }}
                    />
                    <button
                      onClick={clearCanvas}
                      className="text-xs text-ink-muted hover:text-ink transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-ink-muted">Type your full name to sign:</p>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTyped(e.target.value)}
                      placeholder="Your full name"
                      autoFocus
                      className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    {typedName && (
                      <p className="font-body text-2xl italic text-ink px-3 py-2 border border-border rounded-md bg-surface-50">
                        {typedName}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={onClose}
                    className="px-4 h-9 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors duration-80"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={loading}
                    className="px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80 disabled:opacity-50 min-w-24 flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
                    ) : (
                      "Sign"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
