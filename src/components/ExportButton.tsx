import { useState } from "react";
import type { GardenState } from "../types";
import { exportGardenAsImage } from "../engine/export-image";

interface ExportButtonProps {
  garden: GardenState;
  onExported?: () => void;
}

export function ExportButton({ garden, onExported }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportGardenAsImage(garden);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = garden.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `garden-plan-${safeName}-${date}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onExported?.();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="text-[7px] text-text-secondary border border-text-secondary/30 px-2 py-1 rounded-sm hover:bg-panel-light hover:text-text-primary transition-colors disabled:opacity-50"
    >
      {exporting ? "Exporting..." : "Export PNG"}
    </button>
  );
}
