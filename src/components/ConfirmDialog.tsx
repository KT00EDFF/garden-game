import { useEffect, useRef, useState } from "react";

interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** When provided, shows a text input and passes its value to onConfirm. */
  inputLabel?: string;
  inputPlaceholder?: string;
  inputInitialValue?: string;
  inputRequired?: boolean;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  inputLabel,
  inputPlaceholder,
  inputInitialValue = "",
  inputRequired = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const hasInput = inputLabel !== undefined;
  const [value, setValue] = useState(inputInitialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (hasInput) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [hasInput]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleConfirm() {
    if (hasInput) {
      const trimmed = value.trim();
      if (inputRequired && !trimmed) return;
      onConfirm(trimmed);
    } else {
      onConfirm();
    }
  }

  const confirmDisabled = hasInput && inputRequired && !value.trim();
  const confirmClasses = destructive
    ? "text-[8px] text-danger bg-danger/15 border border-danger/40 px-3 py-1.5 rounded-sm hover:bg-danger/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    : "text-[8px] text-accent bg-accent/15 border border-accent/40 px-3 py-1.5 rounded-sm hover:bg-accent/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onCancel}
    >
      <div
        className="bg-panel border border-text-secondary/30 rounded-sm p-4 w-full max-w-xs mx-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[10px] text-accent uppercase tracking-wider mb-3">
          {title}
        </h2>
        {message && (
          <p className="text-[8px] text-text-secondary mb-3 leading-relaxed">
            {message}
          </p>
        )}
        {hasInput && (
          <div className="mb-3 flex flex-col gap-1">
            <label className="text-[7px] text-text-secondary uppercase tracking-wider">
              {inputLabel}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={value}
              placeholder={inputPlaceholder}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              className="settings-input"
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-[8px] text-text-secondary border border-text-secondary/30 px-3 py-1.5 rounded-sm hover:bg-panel-light hover:text-text-primary transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className={confirmClasses}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
