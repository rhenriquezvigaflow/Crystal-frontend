export type ProductType = "crystal" | "small";

export interface ProductTheme {
  logoText: string;
  eyebrow: string;
  title: string;
  tagline: string;
  colors: {
    accent: string;
    accentSoft: string;
    ink: string;
    sidebarFrom: string;
    sidebarTo: string;
    backgroundFrom: string;
    backgroundTo: string;
  };
}

export interface ProductConfig {
  id: ProductType;
  routeBase: `/${ProductType}`;
  apiBase: `/${ProductType}`;
  wsBase: `/ws/${ProductType}`;
  readRoles: string[];
  writeRoles: string[];
  theme: ProductTheme;
}
