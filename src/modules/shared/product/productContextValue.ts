import { createContext } from "react";

import type { ProductConfig } from "./types";

export const ProductContext = createContext<ProductConfig | null>(null);
