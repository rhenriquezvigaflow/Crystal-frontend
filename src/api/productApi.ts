import { getStoredSession, parseJwt } from "../auth/session";
import type { ProductType } from "../modules/shared/product/types";

const ROLE_ADMIN_CRYSTAL = "AdminCrystal";
const ROLE_VISUAL_CRYSTAL = "VisualCrystal";
const ROLE_ADMIN_SMALL = "AdminSmall";
const ROLE_VISUAL_SMALL = "VisualSmall";
const ROLE_SUPERADMIN = "SuperAdmin";

function normalizeRole(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned : null;
}

function normalizeProductType(value: unknown): ProductType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "crystal" || normalized === "small") return normalized;
  return null;
}

export interface UserScope {
  userId: string | null;
  email: string | null;
  roles: string[];
  accessTokenPresent: boolean;
  hasAdminCrystal: boolean;
  hasVisualCrystal: boolean;
  hasAdminSmall: boolean;
  hasVisualSmall: boolean;
  hasSuperAdmin: boolean;
}

export function resolveCurrentUserScope(): UserScope {
  const session = getStoredSession();
  const token = session?.accessToken ?? null;
  const payload = token ? parseJwt(token) : null;
  const parsed = payload && typeof payload === "object" ? payload : null;

  const rawRoles = parsed?.roles;
  const roles: string[] = [];
  const seen = new Set<string>();

  const pushRole = (value: unknown) => {
    const role = normalizeRole(value);
    if (!role || seen.has(role)) return;
    seen.add(role);
    roles.push(role);
  };

  if (Array.isArray(rawRoles)) {
    rawRoles.forEach(pushRole);
  } else {
    pushRole(rawRoles);
  }
  pushRole(parsed?.role);

  const lowerRoles = new Set(roles.map((role) => role.toLowerCase()));
  const hasAdminCrystal = lowerRoles.has(ROLE_ADMIN_CRYSTAL.toLowerCase());
  const hasVisualCrystal = lowerRoles.has(ROLE_VISUAL_CRYSTAL.toLowerCase());
  const hasAdminSmall = lowerRoles.has(ROLE_ADMIN_SMALL.toLowerCase());
  const hasVisualSmall = lowerRoles.has(ROLE_VISUAL_SMALL.toLowerCase());
  const hasSuperAdmin = lowerRoles.has(ROLE_SUPERADMIN.toLowerCase());

  return {
    userId:
      typeof parsed?.sub === "string" && parsed.sub.trim()
        ? parsed.sub.trim()
        : null,
    email:
      typeof parsed?.email === "string" && parsed.email.trim()
        ? parsed.email.trim()
        : null,
    roles,
    accessTokenPresent: Boolean(token),
    hasAdminCrystal,
    hasVisualCrystal,
    hasAdminSmall,
    hasVisualSmall,
    hasSuperAdmin,
  };
}

export function inferProductTypeFromValue(value: unknown): ProductType | null {
  return normalizeProductType(value);
}

export function hasWritePrivilegesForProduct(
  scope: UserScope,
  productType: ProductType | null,
): boolean {
  if (scope.hasSuperAdmin) return true;
  if (productType === "crystal") return scope.hasAdminCrystal;
  if (productType === "small") return scope.hasAdminSmall;
  return false;
}

export function hasReadPrivilegesForProduct(
  scope: UserScope,
  productType: ProductType | null,
): boolean {
  if (scope.hasSuperAdmin) return true;
  if (productType === "crystal") {
    return scope.hasAdminCrystal || scope.hasVisualCrystal;
  }
  if (productType === "small") {
    return scope.hasAdminSmall || scope.hasVisualSmall;
  }
  return false;
}
