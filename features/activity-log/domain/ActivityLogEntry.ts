export const PEOPLE = ["Meme", "Pedro"] as const;
export type Person = (typeof PEOPLE)[number];

export type ActivityLogEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  person: Person;
  activity: string;
  notes?: string;
  createdAt: string; // ISO timestamp
};
