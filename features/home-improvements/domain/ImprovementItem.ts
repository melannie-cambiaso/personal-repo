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
  quantity?: number;
  purchaseUrl?: string;
  done: boolean;
  plannedMonth?: string;
  createdAt: string;
  description?: string;
  notes?: string;
}
