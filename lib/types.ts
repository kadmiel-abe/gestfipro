export interface Profile {
  id: string;
  full_name: string | null;
  net_salary: number;
  payday_with_month: number;
  created_at?: string;
  updated_at?: string;
}

export type AccountType = "cash" | "wave" | "orange_money" | "bank" | "Espèces" | "Mobile Money" | "Banque";

export interface Account {
  id: string;
  user_id?: string;
  name: string;
  type: AccountType;
  balance: number;
  created_at?: string;
  colorClass?: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  account_id?: string | null;
  title: string;
  category: string;
  amount: number;
  type: "expense" | "income";
  transaction_date: string;
  note?: string | null;
  created_at?: string;
  account?: string; // Nom du compte joint
  icon?: string;
  date?: string; // Affichage formaté
}

export interface Goal {
  id: string;
  user_id?: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  created_at?: string;
}
