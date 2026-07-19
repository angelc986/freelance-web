export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export interface User {
  id: number;
  email: string;
  phone: string;
  full_name: string;
  cedula: string;
  role: string;
  is_admin: boolean;
  wallet_address: string | null;
  is_active: boolean;
  balance: number;
  rating_avg: number;
  avatar_url: string | null;
  avatar_verified: boolean;
  cedula_locked: boolean;
  is_verified: boolean;
  profile_completed?: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

import { mockJobs, mockApplications, mockTransactions, mockNotifications, mockApplicants, mockRatingSummary, mockWorkerRatingSummary } from "./mock-data";

function isDevMock(): boolean {
  if (typeof window === "undefined" || typeof window.location === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

/* ===== FETCH WRAPPER ===== */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const useMock = isDevMock();
  
  // In dev mode without backend, return mock data directly
  if (useMock) {
    const mock = getMockResponse<T>(path, options);
    if (mock !== undefined) return mock;
  }

  const url = `${API_BASE}${path}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    // Dev mode fallback: try mock data even after failed real request
    if (useMock) {
      const mock = getMockResponse<T>(path, options);
      if (mock !== undefined) return mock;
    }
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Error ${res.status}`);
  }

  return res.json();
}

/* ===== MOCK RESOLVER ===== */
function getMockResponse<T>(path: string, options: RequestInit): T | undefined {
  const method = options.method || "GET";

  // ── AUTH ──
  if (path === "/auth/me" && method === "GET") {
    const email = localStorage.getItem("mock_email");
    if (email === "empleado@test.com") {
      return { id: 2, email: "empleado@test.com", full_name: "María Rodríguez", phone: "+584149876543", cedula: "V-87654321", role: "worker", avatar_url: null, rating_avg: 4.2, is_admin: false, is_active: true, wallet_address: null, balance: 580, profile_completed: true } as unknown as T;
    }
    return { id: 1, email: "contratista@test.com", full_name: "Carlos Méndez", phone: "+584141234567", cedula: "V-12345678", role: "contractor", avatar_url: null, rating_avg: 4.8, is_admin: false, is_active: true, wallet_address: null, balance: 1500, profile_completed: true } as unknown as T;
  }

  // ── JOBS ──
  if (path === "/jobs/mine" && method === "GET") {
    return mockJobs as unknown as T;
  }
  if (path.startsWith("/jobs/") && path.endsWith("/applications") && method === "GET") {
    return mockApplications as unknown as T;
  }
  if (path === "/jobs/my-applications" && method === "GET") {
    return mockApplications as unknown as T;
  }
  if (path === "/jobs/my-applicants" && method === "GET") {
    return mockApplicants as unknown as T;
  }
  if (path.match(/^\/jobs\/\d+$/) && method === "GET") {
    const id = parseInt(path.split("/")[2]);
    const job = mockJobs.find((j: Job) => j.id === id);
    return (job || mockJobs[0]) as unknown as T;
  }
  if (path.match(/^\/jobs$/) && method === "GET") {
    return mockJobs as unknown as T;
  }

  // ── PAYMENTS ──
  if (path === "/payments/balance" && method === "GET") {
    const email = localStorage.getItem("mock_email");
    return { balance: email === "empleado@test.com" ? 580 : 1500 } as unknown as T;
  }
  if (path === "/payments/history" && method === "GET") {
    return mockTransactions as unknown as T;
  }

  // ── NOTIFICATIONS ──
  if (path.startsWith("/notifications") && path.includes("unread-count") && method === "GET") {
    return { count: mockNotifications.filter((n: NotificationItem) => !n.read).length } as unknown as T;
  }
  if (path.startsWith("/notifications") && method === "GET") {
    return mockNotifications as unknown as T;
  }

  // ── RATINGS ──
  if (path.match(/^\/users\/\d+\/ratings$/) && method === "GET") {
    const email = localStorage.getItem("mock_email");
    return (email === "empleado@test.com" ? mockWorkerRatingSummary : mockRatingSummary) as unknown as T;
  }

  // ── USERS ──
  if (path.match(/^\/users\/\d+$/) && method === "GET") {
    return { id: 2, full_name: "María Rodríguez", role: "worker", rating_avg: 4.2, is_active: true, created_at: "2026-01-15T00:00:00Z", avatar_url: null } as unknown as T;
  }

  return undefined;
}

/* ===== AUTH ENDPOINTS ===== */

export function register(data: {
  email: string;
  password: string;
  role: string;
}): Promise<User> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: {
  email: string;
  password: string;
}): Promise<AuthTokens> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMe(): Promise<User> {
  return request("/auth/me");
}

export function completeProfile(data: {
  full_name: string;
  phone: string;
  cedula: string;
}): Promise<User> {
  return request("/auth/complete-profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function updateProfile(data: {
  full_name?: string;
  phone?: string;
  email?: string;
  cedula?: string;
}): Promise<User> {
  return request("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function updateWallet(address: string): Promise<User> {
  return request("/auth/me/wallet", {
    method: "PATCH",
    body: JSON.stringify({ wallet_address: address }),
  });
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("access_token");
  const base = API_BASE.replace("/api/v1", "");
  const res = await fetch(base + "/api/v1/users/avatar", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.detail || "Error al subir la foto");
  }
  return body;
}

/* ===== JOBS ===== */

export interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  duration: string;
  status: string;
  client_id: number;
  worker_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  job_id: number;
  worker_id: number;
  message: string;
  status: string;
  created_at: string;
  worker?: User;
}

export function listJobs(status?: string): Promise<Job[]> {
  const query = status ? `?status=${status}` : "";
  return request(`/jobs${query}`);
}

export function myJobs(): Promise<Job[]> {
  return request("/jobs/mine");
}

export function getJob(id: number): Promise<Job> {
  return request(`/jobs/${id}`);
}

export function createJob(data: {
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  duration: string;
}): Promise<Job> {
  return request("/jobs/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateJob(jobId: number, data: {
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  duration: string;
}): Promise<Job> {
  return request(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function applyToJob(jobId: number, message: string): Promise<Application> {
  return request(`/jobs/${jobId}/apply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function getApplications(jobId: number): Promise<Application[]> {
  return request(`/jobs/${jobId}/applications`);
}

export function getMyApplications(): Promise<Application[]> {
  return request("/jobs/my-applications");
}

export interface ApplicantBrief {
  id: number;
  worker_id: number;
  worker_name: string;
  worker_rating: number;
  worker_email: string;
  worker_phone: string;
  worker_cedula: string;
  worker_since: string | null;
  jobs_completed: number;
  message: string | null;
  status: string;
  created_at: string;
}

export interface JobWithApplicants {
  job: Job;
  applicants: ApplicantBrief[];
}

export function getMyApplicants(): Promise<JobWithApplicants[]> {
  return request("/jobs/my-applicants");
}

export interface RatingInfo {
  id: number;
  job_id: number;
  rater_id: number;
  rated_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function rateJob(jobId: number, data: { rating: number; comment?: string }): Promise<RatingInfo> {
  return request(`/jobs/${jobId}/rate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Notifications ───
export interface NotificationItem {
  id: number;
  event: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export function getNotifications(limit = 20): Promise<NotificationItem[]> {
  return request(`/notifications?limit=${limit}`);
}

export function getUnreadCount(): Promise<{ count: number }> {
  return request("/notifications/unread-count");
}

export function markNotificationRead(id: number): Promise<any> {
  return request(`/notifications/${id}/read`, { method: "PUT" });
}

export function markAllNotificationsRead(): Promise<any> {
  return request("/notifications/read-all", { method: "PUT" });
}

// ─── Ratings ───
export function getJobRatings(jobId: number): Promise<RatingInfo[]> {
  return request(`/jobs/${jobId}/ratings`);
}

export function acceptApplication(jobId: number, appId: number): Promise<any> {
  return request(`/jobs/${jobId}/accept/${appId}`, {
    method: "POST",
  });
}

export function checkIn(jobId: number): Promise<any> {
  return request(`/jobs/${jobId}/check-in`, {
    method: "POST",
  });
}

export function completeRequest(jobId: number): Promise<any> {
  return request(`/jobs/${jobId}/complete-request`, {
    method: "POST",
  });
}

export function approveJob(jobId: number): Promise<any> {
  return request(`/jobs/${jobId}/approve`, {
    method: "POST",
  });
}

export function cancelJob(jobId: number): Promise<any> {
  return request(`/jobs/${jobId}/cancel`, {
    method: "POST",
  });
}

/* ===== PAYMENTS ===== */

export interface Transaction {
  id: number;
  user_id: number;
  job_id: number | null;
  type: string;
  amount: number;
  network: string;
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  status: string;
  requires_confirmation: boolean;
  created_at: string;
}

export function getBalance(): Promise<{ balance: number }> {
  return request("/payments/balance");
}

export function getHistory(): Promise<Transaction[]> {
  return request("/payments/history");
}

export function deposit(data: { tx_hash: string; amount: number }): Promise<any> {
  return request("/payments/deposit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function releasePayment(jobId: number): Promise<any> {
  return request(`/payments/release/${jobId}`, {
    method: "POST",
  });
}

export function confirmTransaction(txId: number, token: string): Promise<any> {
  return request(`/payments/confirm/${txId}`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function withdraw(data: { amount: number; to_address: string }): Promise<any> {
  return request("/payments/withdraw", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ===== USERS ===== */

export interface UserPublic {
  id: number;
  full_name: string;
  role: string;
  rating_avg: number;
  is_active: boolean;
  created_at: string | null;
  avatar_url: string | null;
}

export function getUser(userId: number): Promise<UserPublic> {
  return request(`/users/${userId}`);
}

export interface UserRatingSummary {
  avg: number;
  total: number;
  breakdown: Record<number, number>;
  reviews: Array<{
    id: number;
    rater_id: number;
    rater_name: string | null;
    rating: number;
    comment: string | null;
    created_at: string | null;
  }>;
}

export function getUserRatings(userId: number): Promise<UserRatingSummary> {
  return request(`/users/${userId}/ratings`);
}

// ─── Verification ───

export interface VerificationSession {
  status: string;
  verification_url?: string;
  session_id?: string;
  message?: string;
}

export function createVerificationSession(): Promise<VerificationSession> {
  return request("/verification/create", {
    method: "POST",
  });
}

export function getVerificationStatus(): Promise<{ is_verified: boolean; verified_at: string | null }> {
  return request("/verification/status");
}
