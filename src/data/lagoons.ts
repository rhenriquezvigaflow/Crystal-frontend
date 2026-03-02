export interface LagoonInfo {
  id: string;
  name: string;
  layout: string;
  country: string;
}

export const lagoons: LagoonInfo[] = [
  {
    id: "costa_del_lago",
    name: "Costa del Lago",
    layout: "layout1",
    country: "Paraguay",
  },
  {
    id: "ava_lagoons",
    name: "AVA Lagoons",
    layout: "layout3",
    country: "Mexico",
  },
  {
    id: "laguna_santa_rosalia",
    name: "Santa Rosalia",
    layout: "layout2",
    country: "España",
  },
];
