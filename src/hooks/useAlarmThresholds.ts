import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiError } from "../auth/authApi";
import { TOAST_AUTO_DISMISS_MS } from "../config/timing";
import {
  getThresholdsView,
  upsertThresholds,
} from "../services/alarm-thresholds.api";
import type {
  AlarmSeverity,
  AlarmThresholdField,
  AlarmThresholdRow,
  AlarmThresholdValidationErrors,
  AlarmToastMessage,
  ThresholdConfigItem,
  ThresholdConfigResponse,
  ThresholdViewRow,
} from "../types/alarm-thresholds";
import { ALARM_SEVERITIES } from "../types/alarm-thresholds";
import type { ProductType } from "../modules/shared/product/types";

const PT_FIT_TAG_REGEX = /^(PT|FIT)/i;

interface UseAlarmThresholdsParams {
  lagoonId: string;
  open: boolean;
  wsTagIds?: string[];
  productType: ProductType;
}

interface SaveResult {
  ok: boolean;
  response: ThresholdConfigResponse | null;
}

type RowErrorsByTag = Record<string, AlarmThresholdValidationErrors>;

const VALID_SOURCES = new Set<AlarmThresholdRow["source"]>([
  "configured",
  "candidate",
]);

function isPtFitTag(tagId: string): boolean {
  return PT_FIT_TAG_REGEX.test(tagId.trim());
}

function normalizeSeverity(value: unknown, fallback: AlarmSeverity): AlarmSeverity {
  if (value === "info" || value === "warning" || value === "critical") {
    return value;
  }
  return fallback;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeSource(value: unknown): AlarmThresholdRow["source"] {
  if (typeof value === "string" && VALID_SOURCES.has(value as AlarmThresholdRow["source"])) {
    return value as AlarmThresholdRow["source"];
  }
  return "candidate";
}

function normalizeWsTagIds(wsTagIds: string[] | undefined): string[] {
  const unique = new Set<string>();

  (wsTagIds ?? []).forEach((tagId) => {
    const normalized = tagId.trim();
    if (!normalized || !isPtFitTag(normalized)) return;
    unique.add(normalized);
  });

  return Array.from(unique).sort((left, right) => left.localeCompare(right));
}

function sortByTag(rows: AlarmThresholdRow[]): AlarmThresholdRow[] {
  return [...rows].sort((left, right) => left.tag_id.localeCompare(right.tag_id));
}

function buildRows(viewRows: ThresholdViewRow[], wsTagIds: string[]): AlarmThresholdRow[] {
  const rowsByTag = new Map<string, AlarmThresholdRow>();

  viewRows.forEach((row) => {
    const tagId = row.tag_id?.trim();
    if (!tagId || !isPtFitTag(tagId)) return;

    rowsByTag.set(tagId, {
      tag_id: tagId,
      tag_name: asNullableString(row.tag_name),
      source: normalizeSource(row.source),
      min_value: asFiniteNumber(row.min_value),
      max_value: asFiniteNumber(row.max_value),
      severity: normalizeSeverity(row.severity, "warning"),
      enabled: row.enabled ?? true,
      dirty: false,
    });
  });

  wsTagIds.forEach((tagId) => {
    if (rowsByTag.has(tagId)) return;
    rowsByTag.set(tagId, {
      tag_id: tagId,
      tag_name: null,
      source: "candidate",
      min_value: null,
      max_value: null,
      severity: "warning",
      enabled: true,
      dirty: false,
    });
  });

  return sortByTag(Array.from(rowsByTag.values()));
}

function areRowsEquivalent(left: AlarmThresholdRow, right: AlarmThresholdRow): boolean {
  return (
    left.tag_id === right.tag_id &&
    left.min_value === right.min_value &&
    left.max_value === right.max_value &&
    left.severity === right.severity &&
    left.enabled === right.enabled
  );
}

function toApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Unauthorized or missing permissions to configure alarms.";
    }
    if (error.status === 422) {
      return error.message || "Validation error while saving the alarm.";
    }
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

function validateRow(row: AlarmThresholdRow): AlarmThresholdValidationErrors {
  const errors: AlarmThresholdValidationErrors = {};

  if (!isPtFitTag(row.tag_id)) {
    errors.tag_id = "The tag must start with PT or FIT.";
  }

  if (row.min_value === null && row.max_value === null) {
    const message = "Define at least Min or Max.";
    errors.min_value = message;
    errors.max_value = message;
  }

  if (
    row.min_value !== null &&
    row.max_value !== null &&
    row.min_value >= row.max_value
  ) {
    errors.min_value = "Min must be lower than Max.";
    errors.max_value = "Max must be higher than Min.";
  }

  if (!ALARM_SEVERITIES.includes(row.severity)) {
    errors.severity = "Invalid severity.";
  }

  return errors;
}

function toConfigItem(row: AlarmThresholdRow): ThresholdConfigItem {
  const item: ThresholdConfigItem = {
    tag_id: row.tag_id,
    enabled: row.enabled,
    severity: row.severity,
  };

  if (row.min_value !== null) {
    item.min_value = row.min_value;
  }

  if (row.max_value !== null) {
    item.max_value = row.max_value;
  }

  return item;
}

function buildToastMessage(response: ThresholdConfigResponse): string {
  void response;
  return "Alarm saved";
}

export function useAlarmThresholds({
  lagoonId,
  open,
  wsTagIds = [],
  productType,
}: UseAlarmThresholdsParams) {
  const normalizedWsTagIds = useMemo(() => normalizeWsTagIds(wsTagIds), [wsTagIds]);
  const baselineByTagRef = useRef<Map<string, AlarmThresholdRow>>(new Map());

  const [rows, setRows] = useState<AlarmThresholdRow[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTagIds, setSavingTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowErrors, setRowErrors] = useState<RowErrorsByTag>({});
  const [toast, setToast] = useState<AlarmToastMessage | null>(null);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => row.tag_id.toLowerCase().includes(query));
  }, [rows, searchTerm]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.tag_id === selectedTagId) ?? null,
    [rows, selectedTagId],
  );

  const hasUnsavedChanges = useMemo(
    () => rows.some((row) => row.dirty),
    [rows],
  );

  const configuredCount = useMemo(
    () => rows.filter((row) => row.source === "configured").length,
    [rows],
  );

  const candidateCount = rows.length - configuredCount;

  const clearRowErrors = useCallback((tagId: string, fields: AlarmThresholdField[]) => {
    setRowErrors((previous) => {
      const current = previous[tagId];
      if (!current) return previous;

      const next = { ...current };
      fields.forEach((field) => {
        delete next[field];
      });

      if (Object.keys(next).length === 0) {
        const rest = { ...previous };
        delete rest[tagId];
        return rest;
      }

      return {
        ...previous,
        [tagId]: next,
      };
    });
  }, []);

  const setTagsSaving = useCallback((tagIds: string[], active: boolean) => {
    if (!tagIds.length) return;

    setSavingTagIds((previous) => {
      if (active) {
        const next = new Set(previous);
        tagIds.forEach((tagId) => next.add(tagId));
        return Array.from(next);
      }

      return previous.filter((tagId) => !tagIds.includes(tagId));
    });
  }, []);

  const applySavedRows = useCallback((savedRows: AlarmThresholdRow[]) => {
    if (!savedRows.length) return;

    const savedByTag = new Map(
      savedRows.map((row) => {
        const savedRow: AlarmThresholdRow = {
          ...row,
          source: "configured",
          dirty: false,
        };
        return [row.tag_id, savedRow] as const;
      }),
    );

    savedByTag.forEach((row, tagId) => {
      baselineByTagRef.current.set(tagId, row);
    });

    setRows((previous) =>
      previous.map((row) => {
        const saved = savedByTag.get(row.tag_id);
        if (!saved) return row;
        return {
          ...row,
          ...saved,
        };
      }),
    );

    setRowErrors((previous) => {
      let changed = false;
      const next = { ...previous };

      savedByTag.forEach((_row, tagId) => {
        if (!(tagId in next)) return;
        delete next[tagId];
        changed = true;
      });

      return changed ? next : previous;
    });
  }, []);

  const saveRows = useCallback(
    async (
      targetRows: AlarmThresholdRow[],
      emptyMessage?: string,
    ): Promise<SaveResult> => {
      if (saving) return { ok: false, response: null };

      if (!targetRows.length) {
        if (emptyMessage) {
          setToast({
            kind: "error",
            message: emptyMessage,
          });
        }
        return { ok: false, response: null };
      }

      const validationErrors: RowErrorsByTag = {};
      targetRows.forEach((row) => {
        const validation = validateRow(row);
        if (Object.keys(validation).length > 0) {
          validationErrors[row.tag_id] = validation;
        }
      });

      if (Object.keys(validationErrors).length > 0) {
        setRowErrors((previous) => ({
          ...previous,
          ...validationErrors,
        }));

        const firstInvalidTag =
          targetRows.find((row) => row.tag_id in validationErrors)?.tag_id ??
          Object.keys(validationErrors)[0] ??
          null;

        setSelectedTagId(firstInvalidTag);

        if (targetRows.length === 1) {
          setToast({
            kind: "error",
            message: "Complete the required fields before saving the alarm.",
          });
        }

        return { ok: false, response: null };
      }

      const tagIds = targetRows.map((row) => row.tag_id);

      try {
        setSaving(true);
        setTagsSaving(tagIds, true);

        const response = await upsertThresholds(
          lagoonId,
          {
            items: targetRows.map(toConfigItem),
          },
          productType,
        );

        applySavedRows(targetRows);
        setError(null);
        setToast({
          kind: "success",
          message: buildToastMessage(response),
        });

        return { ok: true, response };
      } catch (err: unknown) {
        const message = toApiErrorMessage(err, "Could not save the alarm.");
        setToast({ kind: "error", message });
        setError(message);
        return { ok: false, response: null };
      } finally {
        setTagsSaving(tagIds, false);
        setSaving(false);
      }
    },
    [applySavedRows, lagoonId, productType, saving, setTagsSaving],
  );

  const load = useCallback(
    async (lagoonIdArg?: string) => {
      const targetLagoonId = (lagoonIdArg ?? lagoonId).trim();
      if (!targetLagoonId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getThresholdsView(targetLagoonId, productType);
        const mergedRows = buildRows(response.rows ?? [], normalizedWsTagIds);
        baselineByTagRef.current = new Map(
          mergedRows.map((row) => [row.tag_id, row]),
        );

        setRows(mergedRows);
        setRowErrors({});
        setSelectedTagId((previous) =>
          previous && mergedRows.some((row) => row.tag_id === previous)
            ? previous
            : null,
        );
      } catch (err: unknown) {
        setRows([]);
        setRowErrors({});
        setSelectedTagId(null);
        setError(
          toApiErrorMessage(
            err,
            "Could not load alarm thresholds for the lagoon.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [lagoonId, normalizedWsTagIds, productType],
  );

  const selectTag = useCallback((tagId: string) => {
    setSelectedTagId(tagId);
  }, []);

  const updateRow = useCallback(
    (tagId: string, patch: Partial<AlarmThresholdRow>) => {
      const touchedFields = Object.keys(patch) as AlarmThresholdField[];

      setRows((previous) =>
        previous.map((row) => {
          if (row.tag_id !== tagId) return row;

          const base = baselineByTagRef.current.get(tagId) ?? row;
          const nextRow = {
            ...row,
            ...patch,
          };

          nextRow.dirty = !areRowsEquivalent(nextRow, base);
          return nextRow;
        }),
      );

      if (touchedFields.length) {
        clearRowErrors(tagId, touchedFields);
      }
    },
    [clearRowErrors],
  );

  const resetRow = useCallback((tagId: string) => {
    const base = baselineByTagRef.current.get(tagId);
    if (!base) return;

    setRows((previous) =>
      previous.map((row) =>
        row.tag_id === tagId
          ? {
              ...base,
              dirty: false,
            }
          : row,
      ),
    );

    setRowErrors((previous) => {
      if (!(tagId in previous)) return previous;
      const rest = { ...previous };
      delete rest[tagId];
      return rest;
    });
  }, []);

  const saveSelected = useCallback(
    async (tagId: string, rowOverride?: AlarmThresholdRow): Promise<SaveResult> => {
      const row = rowOverride ?? rows.find((item) => item.tag_id === tagId);
      if (!row) return { ok: false, response: null };

      return saveRows([row]);
    },
    [rows, saveRows],
  );

  const saveDirty = useCallback(async (): Promise<SaveResult> => {
    const dirtyRows = rows.filter((row) => row.dirty);
    return saveRows(dirtyRows, "There are no pending changes to save.");
  }, [rows, saveRows]);

  const toggleEnabled = useCallback(
    async (tagId: string): Promise<SaveResult> => {
      const currentRow = rows.find((row) => row.tag_id === tagId);
      if (!currentRow || saving) return { ok: false, response: null };

      const base = baselineByTagRef.current.get(tagId) ?? currentRow;
      const nextRow: AlarmThresholdRow = {
        ...currentRow,
        enabled: !currentRow.enabled,
        dirty: false,
      };

      nextRow.dirty = !areRowsEquivalent(nextRow, base);

      setSelectedTagId(tagId);
      setRows((previous) =>
        previous.map((row) => (row.tag_id === tagId ? nextRow : row)),
      );
      clearRowErrors(tagId, ["enabled"]);

      return saveRows([nextRow]);
    },
    [clearRowErrors, rows, saveRows, saving],
  );

  const isTagSaving = useCallback(
    (tagId: string) => savingTagIds.includes(tagId),
    [savingTagIds],
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      setRows([]);
      setSelectedTagId(null);
      setLoading(false);
      setSaving(false);
      setSavingTagIds([]);
      setError(null);
      setSearchTerm("");
      setRowErrors({});
      setToast(null);
      baselineByTagRef.current = new Map();
      return;
    }

    setSearchTerm("");
    void load(lagoonId);
  }, [lagoonId, load, open]);

  useEffect(() => {
    if (!open) return;

    setRows((previous) => {
      const byTag = new Map(previous.map((row) => [row.tag_id, row]));

      normalizedWsTagIds.forEach((tagId) => {
        if (byTag.has(tagId)) return;
        byTag.set(tagId, {
          tag_id: tagId,
          tag_name: null,
          source: "candidate",
          min_value: null,
          max_value: null,
          severity: "warning",
          enabled: true,
          dirty: false,
        });
      });

      return sortByTag(Array.from(byTag.values()));
    });
  }, [normalizedWsTagIds, open]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, TOAST_AUTO_DISMISS_MS);

    return () => window.clearTimeout(timer);
  }, [toast]);

  return {
    rows,
    filteredRows,
    selectedRow,
    selectedTagId,
    loading,
    saving,
    error,
    rowErrors,
    searchTerm,
    toast,
    configuredCount,
    candidateCount,
    hasUnsavedChanges,
    load,
    selectTag,
    updateRow,
    resetRow,
    saveSelected,
    saveDirty,
    toggleEnabled,
    isTagSaving,
    setSearchTerm,
    dismissToast,
    dismissError,
  };
}
