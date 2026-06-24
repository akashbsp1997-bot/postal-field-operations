export type UserRole = "admin" | "inspector" | "supervisor" | "postman" | "bpm_spm";

export interface AppUser {
  id: string;
  name: string;
  employee_id: string;
  designation: string;
  mobile: string;
  email: string;
  role: UserRole;
  office_id: string | null;
  active: boolean;
  created_at: string;
}

export interface Office {
  id: string;
  office_name: string;
  office_type: string;
  office_code: string;
  pincode: string;
}

export interface Area {
  id: string;
  name: string;
  beat_number: string;
  office_id: string;
  assigned_to: string | null;
}

export interface House {
  id: string;
  area_id: string;
  house_number: string;
  head_of_family: string;
  mobile: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  remarks: string | null;
  assigned_to: string | null;
}

export interface Business {
  id: string;
  area_id: string;
  business_name: string;
  owner_name: string;
  mobile: string | null;
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  assigned_to: string | null;
}

export interface PostalLead {
  id: string;
  lead_type: string;
  prospect_name: string;
  mobile: string;
  source: string;
  status: "new" | "contacted" | "converted" | "lost";
  remarks: string | null;
  assigned_to: string | null;
  created_at: string;
}

export interface PostalSale {
  id: string;
  product_name: string;
  customer_name: string;
  amount: number;
  sale_date: string;
  sold_by: string;
}

export interface Article {
  id: string;
  barcode: string;
  article_type: string;
  sender: string;
  receiver: string;
  address: string;
  status: "in_transit" | "out_for_delivery" | "delivered" | "failed" | "returned";
  assigned_postman: string | null;
  scanned_at: string | null;
}

export interface Delivery {
  id: string;
  article_id: string;
  delivery_status: "delivered" | "failed" | "attempted";
  delivered_at: string | null;
  postman_id: string;
  remarks: string | null;
}

export interface DeliveryProof {
  id: string;
  article_id: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  delivered_at: string;
}

export interface Followup {
  id: string;
  title: string;
  notes: string | null;
  follow_up_date: string;
  completed: boolean;
  assigned_to: string | null;
}

export interface BeatActivity {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  activity_type: string;
  timestamp: string;
}

export interface DashboardStats {
  totalHouses: number;
  totalBusinesses: number;
  totalDeliveries: number;
  pendingDeliveries: number;
  todayActivity: number;
  totalSales: number;
  pendingFollowups: number;
}
