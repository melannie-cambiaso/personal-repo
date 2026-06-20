export type ImprovementType =
  | "Decoración"
  | "Organización"
  | "Reparación"
  | "Instalación"
  | "Otro";

export interface ImprovementItem {
  id: string;
  zoneId: string;
  title: string;
  type: ImprovementType;
  estimatedCost: number | null;
  purchaseUrl?: string;
  done: boolean;
  createdAt: string;
  description?: string;
  notes?: string;
}
