const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

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
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

/* ===== FETCH WRAPPER ===== */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Error ${res.status}`);
  }

  return res.json();
}

/* ===== AUTH ENDPOINTS ===== */

export function register(data: {
  email: string;
  phone: string;
  full_name: string;
  cedula: string;
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

export function updateProfile(data: {
  full_name?: string;
  phone?: string;
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
