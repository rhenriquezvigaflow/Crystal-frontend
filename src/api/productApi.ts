import { getStoredSession, parseJwt } from "../auth/session";
import type { ProductType } from "../modules/shared/product/types";

const ROLE_ADMIN_CRYSTAL = "AdminCrystal";
const ROLE_VISUAL_CRYSTAL = "VisualCrystal";
const ROLE_ADMIN_SMALL = "AdminSmall";
const ROLE_VISUAL_SMALL = "VisualSmall";
const ROLE_SUPERADMIN = "SuperAdmin";

export const SMALL_PERMISSIONS = {
  view: "small_view",
  operate: "small_operate",
  scheduleView: "small_schedule_view",
  scheduleCreate: "small_schedule_create",
  scheduleUpdate: "small_schedule_update",
  scheduleDelete: "small_schedule_delete",
} as const;

export type SmallPermission =
  (typeof SMALL_PERMISSIONS)[keyof typeof SMALL_PERMISSIONS];

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
  permissions: string[];
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
  const permissionSet = new Set<string>();
  const rawPermissions = parsed?.permissions;
  if (Array.isArray(rawPermissions)) {
    rawPermissions.forEach((value) => {
      if (typeof value === "string" && value.trim()) {
        permissionSet.add(value.trim());
      }
    });
  }

  // Role fallback keeps existing sessions usable until the next login refresh.
  if (hasAdminSmall || hasSuperAdmin) {
    Object.values(SMALL_PERMISSIONS).forEach((permission) => {
      permissionSet.add(permission);
    });
  } else if (hasVisualSmall) {
    permissionSet.add(SMALL_PERMISSIONS.view);
    permissionSet.add(SMALL_PERMISSIONS.scheduleView);
  }

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
    permissions: Array.from(permissionSet).sort(),
    accessTokenPresent: Boolean(token),
    hasAdminCrystal,
    hasVisualCrystal,
    hasAdminSmall,
    hasVisualSmall,
    hasSuperAdmin,
  };
}

export function hasSmallPermission(
  scope: UserScope,
  permission: SmallPermission,
): boolean {
  return scope.permissions.includes(permission);
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
