export const GROUPS: { name: string; type: "income" | "expense"; categories: string[] }[] = [
  {
    name: "Sueldo",
    type: "income",
    categories: ["Peter", "Mel"],
  },
  {
    name: "Devolución",
    type: "income",
    categories: ["Isapre", "Seguro"],
  },
  {
    name: "Gastos fijos",
    type: "expense",
    categories: [
      "Arriendo",
      "Estudios Pedro",
      "Canasta GES",
      "Comida",
      "Comisiones",
      "Cuentas",
      "Gastos comunes",
      "Internet",
      "Limpieza",
      "Mascota",
      "Pedidos",
      "Pedro",
      "Planes",
      "Psiquiatra",
      "DBT",
      "Utiles de aseo",
    ],
  },
  {
    name: "Remedios",
    type: "expense",
    categories: ["Jardiance", "Rosuvastatina", "Omega 3", "Femalvi", "Duloxetina", "Gabapentina"],
  },
  {
    name: "Suscripciones",
    type: "expense",
    categories: [
      "Claude",
      "Disney",
      "Down dog",
      "iCloud",
      "Melimas",
      "Netflix",
      "Prime Video",
      "SaveMoney",
      "Sentido del humor",
      "Uber Eats",
      "Viki",
      "Wow",
      "YouTube",
    ],
  },
];

export function getGroupForCategory(category: string): string {
  return GROUPS.find((g) => g.categories.includes(category))?.name ?? "Otro";
}
