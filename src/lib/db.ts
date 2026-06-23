import { supabase } from "./supabase";
import type {
  AppUser, Office, Area, House, Business,
  PostalLead, PostalSale, Article, Delivery,
  DeliveryProof, Followup, BeatActivity, DashboardStats
} from "../types";

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  return data as AppUser | null;
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function getUsers() {
  const { data, error } = await supabase.from("users").select("*").order("name");
  if (error) throw error;
  return data as AppUser[];
}

export async function createUser(user: Omit<AppUser, "id" | "created_at">) {
  const { data, error } = await supabase.from("users").insert(user).select().single();
  if (error) throw error;
  return data as AppUser;
}

export async function updateUser(id: string, updates: Partial<AppUser>) {
  const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as AppUser;
}

export async function deleteUser(id: string) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
}

// ─── Offices ─────────────────────────────────────────────────────────────────

export async function getOffices() {
  const { data, error } = await supabase.from("offices").select("*").order("office_name");
  if (error) throw error;
  return data as Office[];
}

export async function createOffice(office: Omit<Office, "id">) {
  const { data, error } = await supabase.from("offices").insert(office).select().single();
  if (error) throw error;
  return data as Office;
}

export async function updateOffice(id: string, updates: Partial<Office>) {
  const { data, error } = await supabase.from("offices").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as Office;
}

export async function deleteOffice(id: string) {
  const { error } = await supabase.from("offices").delete().eq("id", id);
  if (error) throw error;
}

// ─── Areas ───────────────────────────────────────────────────────────────────

export async function getAreas(officeId?: string) {
  let query = supabase.from("areas").select("*").order("beat_number");
  if (officeId) query = query.eq("office_id", officeId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Area[];
}

export async function createArea(area: Omit<Area, "id">) {
  const { data, error } = await supabase.from("areas").insert(area).select().single();
  if (error) throw error;
  return data as Area;
}

export async function updateArea(id: string, updates: Partial<Area>) {
  const { data, error } = await supabase.from("areas").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as Area;
}

export async function deleteArea(id: string) {
  const { error } = await supabase.from("areas").delete().eq("id", id);
  if (error) throw error;
}

// ─── Houses ──────────────────────────────────────────────────────────────────

export async function getHouses(areaId?: string) {
  let query = supabase.from("houses").select("*").order("house_number");
  if (areaId) query = query.eq("area_id", areaId);
  const { data, error } = await query;
  if (error) throw error;
  return data as House[];
}

export async function createHouse(house: Omit<House, "id">) {
  const { data, error } = await supabase.from("houses").insert(house).select().single();
  if (error) throw error;
  return data as House;
}

export async function updateHouse(id: string, updates: Partial<House>) {
  const { data, error } = await supabase.from("houses").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as House;
}

export async function deleteHouse(id: string) {
  const { error } = await supabase.from("houses").delete().eq("id", id);
  if (error) throw error;
}

// ─── Businesses ───────────────────────────────────────────────────────────────

export async function getBusinesses(areaId?: string) {
  let query = supabase.from("businesses").select("*").order("business_name");
  if (areaId) query = query.eq("area_id", areaId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Business[];
}

export async function createBusiness(business: Omit<Business, "id">) {
  const { data, error } = await supabase.from("businesses").insert(business).select().single();
  if (error) throw error;
  return data as Business;
}

export async function updateBusiness(id: string, updates: Partial<Business>) {
  const { data, error } = await supabase.from("businesses").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as Business;
}

export async function deleteBusiness(id: string) {
  const { error } = await supabase.from("businesses").delete().eq("id", id);
  if (error) throw error;
}

// ─── Postal Leads ─────────────────────────────────────────────────────────────

export async function getLeads(assignedTo?: string) {
  let query = supabase.from("postal_leads").select("*").order("created_at", { ascending: false });
  if (assignedTo) query = query.eq("assigned_to", assignedTo);
  const { data, error } = await query;
  if (error) throw error;
  return data as PostalLead[];
}

export async function createLead(lead: Omit<PostalLead, "id" | "created_at">) {
  const { data, error } = await supabase.from("postal_leads").insert(lead).select().single();
  if (error) throw error;
  return data as PostalLead;
}

export async function updateLead(id: string, updates: Partial<PostalLead>) {
  const { data, error } = await supabase.from("postal_leads").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as PostalLead;
}

export async function deleteLead(id: string) {
  const { error } = await supabase.from("postal_leads").delete().eq("id", id);
  if (error) throw error;
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export async function getSales(soldBy?: string) {
  let query = supabase.from("postal_sales").select("*").order("sale_date", { ascending: false });
  if (soldBy) query = query.eq("sold_by", soldBy);
  const { data, error } = await query;
  if (error) throw error;
  return data as PostalSale[];
}

export async function createSale(sale: Omit<PostalSale, "id">) {
  const { data, error } = await supabase.from("postal_sales").insert(sale).select().single();
  if (error) throw error;
  return data as PostalSale;
}

export async function updateSale(id: string, updates: Partial<PostalSale>) {
  const { data, error } = await supabase.from("postal_sales").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as PostalSale;
}

export async function deleteSale(id: string) {
  const { error } = await supabase.from("postal_sales").delete().eq("id", id);
  if (error) throw error;
}

// ─── Articles ────────────────────────────────────────────────────────────────

export async function getArticles(assignedPostman?: string) {
  let query = supabase.from("articles").select("*").order("scanned_at", { ascending: false });
  if (assignedPostman) query = query.eq("assigned_postman", assignedPostman);
  const { data, error } = await query;
  if (error) throw error;
  return data as Article[];
}

export async function getArticleByBarcode(barcode: string) {
  const { data, error } = await supabase.from("articles").select("*").eq("barcode", barcode).single();
  if (error) throw error;
  return data as Article;
}

export async function createArticle(article: Omit<Article, "id">) {
  const { data, error } = await supabase.from("articles").insert(article).select().single();
  if (error) throw error;
  return data as Article;
}

export async function updateArticle(id: string, updates: Partial<Article>) {
  const { data, error } = await supabase.from("articles").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as Article;
}

// ─── Deliveries ───────────────────────────────────────────────────────────────

export async function getDeliveries(postmanId?: string) {
  let query = supabase.from("deliveries").select("*, articles(*)").order("delivered_at", { ascending: false });
  if (postmanId) query = query.eq("postman_id", postmanId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createDelivery(delivery: Omit<Delivery, "id">) {
  const { data, error } = await supabase.from("deliveries").insert(delivery).select().single();
  if (error) throw error;
  return data as Delivery;
}

export async function createDeliveryProof(proof: Omit<DeliveryProof, "id">) {
  const { data, error } = await supabase.from("delivery_proofs").insert(proof).select().single();
  if (error) throw error;
  return data as DeliveryProof;
}

// ─── Follow-ups ───────────────────────────────────────────────────────────────

export async function getFollowups(assignedTo?: string) {
  let query = supabase.from("followups").select("*").order("follow_up_date");
  if (assignedTo) query = query.eq("assigned_to", assignedTo);
  const { data, error } = await query;
  if (error) throw error;
  return data as Followup[];
}

export async function createFollowup(followup: Omit<Followup, "id">) {
  const { data, error } = await supabase.from("followups").insert(followup).select().single();
  if (error) throw error;
  return data as Followup;
}

export async function updateFollowup(id: string, updates: Partial<Followup>) {
  const { data, error } = await supabase.from("followups").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as Followup;
}

export async function deleteFollowup(id: string) {
  const { error } = await supabase.from("followups").delete().eq("id", id);
  if (error) throw error;
}

// ─── Beat Activity ────────────────────────────────────────────────────────────

export async function logBeatActivity(activity: Omit<BeatActivity, "id">) {
  const { data, error } = await supabase.from("beat_activity").insert(activity).select().single();
  if (error) throw error;
  return data as BeatActivity;
}

export async function getBeatActivity(userId?: string) {
  let query = supabase.from("beat_activity").select("*").order("timestamp", { ascending: false }).limit(100);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return data as BeatActivity[];
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split("T")[0];

  const [houses, businesses, deliveries, followups, activity, sales] = await Promise.all([
    supabase.from("houses").select("id", { count: "exact", head: true }),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("deliveries").select("delivery_status, delivered_at"),
    supabase.from("followups").select("completed").eq("completed", false),
    supabase.from("beat_activity").select("id", { count: "exact", head: true }).gte("timestamp", `${today}T00:00:00`),
    supabase.from("postal_sales").select("amount"),
  ]);

  const deliveryData = deliveries.data ?? [];
  const totalDeliveries = deliveryData.length;
  const pendingDeliveries = deliveryData.filter(d => d.delivery_status !== "delivered").length;
  const totalSales = (sales.data ?? []).reduce((sum, s) => sum + (s.amount ?? 0), 0);

  return {
    totalHouses: houses.count ?? 0,
    totalBusinesses: businesses.count ?? 0,
    totalDeliveries,
    pendingDeliveries,
    todayActivity: activity.count ?? 0,
    totalSales,
    pendingFollowups: followups.data?.length ?? 0,
  };
}
