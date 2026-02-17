export type ItemStatus = "available" | "low" | "expired" | "consumed";

export interface ItemFormValues {
  name: string;
  quantity: number;
  unit?: string;
  location_id: string;
  category_id?: string;
  expiry_date?: string; // ISO date string "YYYY-MM-DD" or undefined
  status: ItemStatus;
}

export interface GroupedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  expiry_date: string | null;
  status: ItemStatus;
  location_id: string | null;
  category_id: string | null;
  locations: { name: string } | null;
  categories: { name: string } | null;
}

export interface LocationRow {
  id: string;
  name: string;
}

export interface CategoryRow {
  id: string;
  name: string;
}
