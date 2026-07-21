import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { LagoonAccess } from "../api/lagoonsApi";
import { useProduct } from "../modules/shared/product/useProduct";
import { legacyCrystalLagoonPath, productLagoonPath } from "../modules/shared/routing/paths";

interface Props {
  lagoons: LagoonAccess[];
  selectedLagoonId: string | null;
  onNavigate?: () => void;
  className?: string;
  legacyRoute?: boolean;
}

interface LagoonCountryGroup {
  key: string;
  name: string;
  lagoons: LagoonAccess[];
}

const UNASSIGNED_COUNTRY_NAME = "Sin país";
const alphabeticalOrder = new Intl.Collator("es", { sensitivity: "base" });

function compareByNameAndKey(
  leftName: string,
  rightName: string,
  leftKey: string,
  rightKey: string,
): number {
  return (
    alphabeticalOrder.compare(leftName, rightName) ||
    leftKey.localeCompare(rightKey)
  );
}

function groupLagoonsByCountry(lagoons: LagoonAccess[]): LagoonCountryGroup[] {
  const groups = new Map<string, LagoonCountryGroup>();

  lagoons
    .filter((lagoon) => lagoon.can_view && lagoon.enable)
    .forEach((lagoon) => {
      const countryName = lagoon.country_name?.trim();
      const hasCountry = lagoon.country_id !== null && Boolean(countryName);
      const key = hasCountry ? `country-${lagoon.country_id}` : "unassigned";
      const group = groups.get(key) ?? {
        key,
        name: countryName || UNASSIGNED_COUNTRY_NAME,
        lagoons: [],
      };

      group.lagoons.push(lagoon);
      groups.set(key, group);
    });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      lagoons: [...group.lagoons].sort((left, right) =>
        compareByNameAndKey(
          left.lagoon_name,
          right.lagoon_name,
          left.lagoon_id,
          right.lagoon_id,
        ),
      ),
    }))
    .sort((left, right) =>
      compareByNameAndKey(left.name, right.name, left.key, right.key),
    );
}

export default function Sidebar({
  lagoons,
  selectedLagoonId,
  onNavigate,
  className,
  legacyRoute = false,
}: Props) {
  const navigate = useNavigate();
  const product = useProduct();
  const lagoonGroups = useMemo(() => groupLagoonsByCountry(lagoons), [lagoons]);
  const selectedCountryKey =
    lagoonGroups.find((group) =>
      group.lagoons.some((lagoon) => lagoon.lagoon_id === selectedLagoonId),
    )?.key ?? null;
  const [countryExpansionOverrides, setCountryExpansionOverrides] = useState<
    Record<string, boolean>
  >({});

  const toggleCountry = (countryKey: string, expanded: boolean) => {
    setCountryExpansionOverrides((current) => ({
      ...current,
      [countryKey]: !expanded,
    }));
  };

  const selectLagoon = (
    lagoonId: string,
    countryKey: string,
    active: boolean,
  ) => {
    if (active) {
      onNavigate?.();
      return;
    }

    // Selecting a lagoon turns the country list into an accordion: only the
    // selected lagoon's country remains expanded.
    setCountryExpansionOverrides({ [countryKey]: true });
    navigate(
      legacyRoute
        ? legacyCrystalLagoonPath(lagoonId)
        : productLagoonPath(product.id, lagoonId),
    );
    onNavigate?.();
  };

  return (
    <aside
      className={["lagoon-sidebar relative h-full w-full px-4 pb-6 pt-4", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-full w-2 shadow-[4px_0_18px_-6px_rgba(33,103,150,0.18)]" />

      <div className="relative mb-6 rounded-[16px] border border-white/60 bg-white/68 px-4 py-4 shadow-[0_18px_34px_-24px_rgba(29,92,128,0.4)] backdrop-blur">
        <div className="text-[12px] font-semibold uppercase tracking-[0.28em] text-sky-700/70">
          {product.theme.eyebrow}
        </div>
        <div className="mt-1 text-xl font-bold tracking-[0.08em] text-slate-800">
          {product.theme.title}
        </div>
        <div className="mt-2 text-xs text-sky-900/70">
          {product.theme.tagline}
        </div>
      </div>

      <nav className="relative space-y-2">
        {!lagoonGroups.length && (
          <div className="rounded-[14px] border border-slate-200 bg-white/75 px-4 py-3 text-[15px] text-slate-600">
            No lagoons available.
          </div>
        )}

        {lagoonGroups.map((group) => {
          const expanded =
            countryExpansionOverrides[group.key] ?? group.key === selectedCountryKey;
          const groupContentId = `lagoon-country-${group.key}`;

          return (
            <section key={group.key} className="pt-4 first:pt-0">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={groupContentId}
                onClick={() => toggleCountry(group.key, expanded)}
                className="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700/70 transition-colors hover:bg-white/55 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
              >
                <span className="truncate">{group.name}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={[
                    "h-4 w-4 shrink-0 transition-transform duration-200 ease-out",
                    expanded ? "rotate-0" : "-rotate-90",
                  ].join(" ")}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 7 5 5 5-5" />
                </svg>
              </button>

              <div
                id={groupContentId}
                role="group"
                aria-label={`Lagunas de ${group.name}`}
                aria-hidden={!expanded}
                inert={!expanded}
                className={[
                  "grid transition-[grid-template-rows,opacity,padding] duration-200 ease-out",
                  expanded
                    ? "grid-rows-[1fr] pt-2 opacity-100"
                    : "grid-rows-[0fr] pt-0 opacity-0",
                ].join(" ")}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-2">
                    {group.lagoons.map((lagoon) => {
                      const active = selectedLagoonId === lagoon.lagoon_id;

                      return (
                        <button
                          type="button"
                          key={lagoon.lagoon_id}
                          onClick={() =>
                            selectLagoon(lagoon.lagoon_id, group.key, active)
                          }
                          className={[
                            "w-full rounded-[14px] px-4 py-3 text-left text-sm transition",
                            active
                              ? "border border-sky-100 bg-white/92 font-semibold text-slate-900 shadow-[0_18px_34px_-24px_rgba(29,92,128,0.45)]"
                              : "text-slate-700 hover:bg-white/72 hover:text-slate-900",
                          ].join(" ")}
                        >
                          <div className="truncate">{lagoon.lagoon_name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
