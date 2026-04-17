import { useCallback, useEffect } from "react";

import { useAlarmThresholds } from "../hooks/useAlarmThresholds";
import type { AlarmThresholdRow } from "../types/alarm-thresholds";
import { ALARM_SEVERITIES } from "../types/alarm-thresholds";

interface AlarmManagerModalProps {
  open: boolean;
  lagoonId: string;
  wsTagIds?: string[];
  canEdit?: boolean;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AlarmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 3.5a6 6 0 0 0-6 6v4.05l-1.15 1.8a1.1 1.1 0 0 0 .93 1.65h12.45a1.1 1.1 0 0 0 .93-1.65L18 13.55V9.5a6 6 0 0 0-6-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M10.1 19a1.9 1.9 0 0 0 3.8 0" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="animate-pulse rounded-lg border border-slate-100 bg-slate-50 p-3"
        >
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="mt-2 h-2.5 w-40 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function parseNumericInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export default function AlarmManagerModal({
  open,
  lagoonId,
  wsTagIds = [],
  canEdit = true,
  onClose,
}: AlarmManagerModalProps) {
  const manager = useAlarmThresholds({ lagoonId, open, wsTagIds });

  const requestClose = useCallback(() => {
    if (manager.hasUnsavedChanges) {
      const shouldClose = window.confirm(
        "Hay cambios sin guardar. Deseas cerrar el gestor de alarmas?",
      );
      if (!shouldClose) return;
    }

    onClose();
  }, [manager.hasUnsavedChanges, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      requestClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, requestClose]);

  if (!open) return null;

  const hasAnyRows = manager.rows.length > 0;

  const handleSelect = (tagId: string) => {
    if (manager.selectedTagId === tagId) return;
    if (manager.hasUnsavedChanges) {
      const shouldContinue = window.confirm(
        "Tienes cambios sin guardar. Deseas descartarlos para abrir otra alarma?",
      );
      if (!shouldContinue) return;
    }
    manager.selectTag(tagId);
  };

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/40 px-3 py-6 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        requestClose();
      }}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Gestion de alarmas"
        className="relative max-h-[92vh] w-full max-w-[960px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_34px_80px_-38px_rgba(15,23,42,0.55)]"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 sm:text-lg">
              <AlarmIcon />
              Gestion de alarmas
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Laguna: <span className="font-semibold">{lagoonId}</span>. Fase actual:
              umbrales PT/FIT.
            </p>
          </div>

          <button
            type="button"
            onClick={requestClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label="Cerrar gestor de alarmas"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="max-h-[calc(92vh-64px)] overflow-y-auto p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={manager.searchTerm}
              onChange={(event) => manager.setSearchTerm(event.target.value)}
              placeholder="Buscar por tag_id"
              className="h-10 min-w-[240px] flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />

          </div>

          <div className="mt-4 min-h-[300px]">
            {manager.loading && <SkeletonRows />}

            {!manager.loading && manager.error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <p>{manager.error}</p>
                <button
                  type="button"
                  onClick={() => {
                    manager.dismissError();
                    void manager.load(lagoonId);
                  }}
                  className="mt-2 inline-flex h-8 items-center rounded-md border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!manager.loading && !manager.error && !hasAnyRows && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No hay alarmas configuradas ni candidatos PT/FIT para esta laguna.
              </div>
            )}

            {!manager.loading && !manager.error && hasAnyRows && manager.filteredRows.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No hay resultados para el filtro actual.
              </div>
            )}

            {!manager.loading && !manager.error && manager.filteredRows.length > 0 && (
              <div className="space-y-2">
                <div className="hidden grid-cols-[minmax(0,1.2fr)_100px_100px_120px_110px_auto] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 sm:grid">
                  <span>Tag</span>
                  <span>Min</span>
                  <span>Max</span>
                  <span>Severity</span>
                  <span>Activa</span>
                  <span className="text-right">Guardar</span>
                </div>

                {manager.filteredRows.map((row) => {
                  const isSelected = manager.selectedTagId === row.tag_id;
                  const isSavingTag = manager.isTagSaving(row.tag_id);
                  const allowRowEdit = canEdit && !manager.saving;
                  const rowValidation = manager.rowErrors[row.tag_id] ?? {};

                  return (
                    <article
                      key={row.tag_id}
                      className={[
                        "rounded-lg border bg-white p-3 transition",
                        isSelected
                          ? "border-sky-300 shadow-[0_20px_36px_-28px_rgba(14,116,144,0.55)]"
                          : "border-slate-200 hover:border-slate-300",
                      ].join(" ")}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelect(row.tag_id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelect(row.tag_id);
                        }
                      }}
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.2fr)_100px_100px_120px_110px_auto] sm:items-center">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {row.tag_id}
                          </div>
                          {row.tag_name && row.tag_name !== row.tag_id && (
                            <div className="mt-0.5 text-xs text-slate-500">
                              {row.tag_name}
                            </div>
                          )}
                          {row.dirty && (
                            <div className="mt-1">
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-800">
                                Dirty
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 sm:sr-only">
                            Min
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={row.min_value === null ? "" : String(row.min_value)}
                            disabled={!allowRowEdit}
                            onClick={(event) => event.stopPropagation()}
                            onFocus={() => manager.selectTag(row.tag_id)}
                            onChange={(event) => {
                              manager.selectTag(row.tag_id);
                              manager.updateRow(row.tag_id, {
                                min_value: parseNumericInput(event.target.value),
                              });
                            }}
                            className={[
                              "h-9 w-full rounded-md border px-2 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50",
                              rowValidation.min_value
                                ? "border-rose-300 text-rose-800 focus:border-rose-300 focus:ring-rose-100"
                                : "border-slate-200 text-slate-700 focus:border-sky-300 focus:ring-sky-100",
                            ].join(" ")}
                          />
                          {rowValidation.min_value && (
                            <p className="mt-1 text-xs font-medium text-rose-700">
                              {rowValidation.min_value}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 sm:sr-only">
                            Max
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={row.max_value === null ? "" : String(row.max_value)}
                            disabled={!allowRowEdit}
                            onClick={(event) => event.stopPropagation()}
                            onFocus={() => manager.selectTag(row.tag_id)}
                            onChange={(event) => {
                              manager.selectTag(row.tag_id);
                              manager.updateRow(row.tag_id, {
                                max_value: parseNumericInput(event.target.value),
                              });
                            }}
                            className={[
                              "h-9 w-full rounded-md border px-2 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50",
                              rowValidation.max_value
                                ? "border-rose-300 text-rose-800 focus:border-rose-300 focus:ring-rose-100"
                                : "border-slate-200 text-slate-700 focus:border-sky-300 focus:ring-sky-100",
                            ].join(" ")}
                          />
                          {rowValidation.max_value && (
                            <p className="mt-1 text-xs font-medium text-rose-700">
                              {rowValidation.max_value}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 sm:sr-only">
                            Severity
                          </label>
                          <select
                            value={row.severity}
                            disabled={!allowRowEdit}
                            onClick={(event) => event.stopPropagation()}
                            onFocus={() => manager.selectTag(row.tag_id)}
                            onChange={(event) => {
                              manager.selectTag(row.tag_id);
                              manager.updateRow(row.tag_id, {
                                severity: event.target.value as AlarmThresholdRow["severity"],
                              });
                            }}
                            className={[
                              "h-9 w-full rounded-md border px-2 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50",
                              rowValidation.severity
                                ? "border-rose-300 text-rose-800 focus:border-rose-300 focus:ring-rose-100"
                                : "border-slate-200 text-slate-700 focus:border-sky-300 focus:ring-sky-100",
                            ].join(" ")}
                          >
                            {ALARM_SEVERITIES.map((severity) => (
                              <option key={severity} value={severity}>
                                {severity}
                              </option>
                            ))}
                          </select>
                          {rowValidation.severity && (
                            <p className="mt-1 text-xs font-medium text-rose-700">
                              {rowValidation.severity}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 sm:sr-only">
                            Activa
                          </label>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={row.enabled}
                            aria-busy={isSavingTag || undefined}
                            disabled={!allowRowEdit}
                            onClick={(event) => {
                              event.stopPropagation();
                              void manager.toggleEnabled(row.tag_id);
                            }}
                            className={[
                              "relative inline-flex h-9 w-[88px] items-center rounded-full border px-1.5 transition",
                              row.enabled
                                ? "border-emerald-400 bg-emerald-500/90 text-white"
                                : "border-slate-300 bg-slate-200 text-slate-600",
                              !allowRowEdit ? "cursor-not-allowed opacity-70" : "hover:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]",
                            ].join(" ")}
                          >
                            <span className="sr-only">
                              {row.enabled ? "Desactivar alarma" : "Activar alarma"}
                            </span>
                            <span
                              aria-hidden="true"
                              className={[
                                "absolute left-3 text-[10px] font-semibold uppercase tracking-[0.08em] transition",
                                row.enabled ? "opacity-100" : "opacity-0",
                              ].join(" ")}
                            >
                              ON
                            </span>
                            <span
                              aria-hidden="true"
                              className={[
                                "absolute right-3 text-[10px] font-semibold uppercase tracking-[0.08em] transition",
                                row.enabled ? "opacity-0" : "opacity-100",
                              ].join(" ")}
                            >
                              OFF
                            </span>
                            <span
                              aria-hidden="true"
                              className={[
                                "inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[9px] font-bold text-slate-700 shadow-[0_2px_6px_rgba(15,23,42,0.18)] transition-transform",
                                row.enabled ? "translate-x-[48px]" : "translate-x-0",
                                isSavingTag ? "animate-pulse" : "",
                              ].join(" ")}
                            >
                              {isSavingTag ? "..." : ""}
                            </span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            manager.selectTag(row.tag_id);
                            void manager.saveSelected(row.tag_id, row);
                          }}
                          disabled={manager.saving || !canEdit}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-sky-600 px-3 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300 sm:justify-self-end"
                        >
                          {isSavingTag ? "Guardando..." : "Guardar"}
                        </button>
                      </div>

                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {manager.toast && (
          <div
            className={[
              "pointer-events-none absolute bottom-4 right-4 max-w-[380px] rounded-lg border px-4 py-3 text-sm shadow-lg",
              manager.toast.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800",
            ].join(" ")}
          >
            <div className="pointer-events-auto flex items-start gap-3">
              <p>{manager.toast.message}</p>
              <button
                type="button"
                onClick={manager.dismissToast}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-xs font-semibold"
                aria-label="Cerrar toast"
              >
                x
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
