// ─── MOCK DATA FOR DEV PREVIEW ───
// Returns fake data so the dashboard UI renders fully without a backend.

import type { Job, Application, Transaction, NotificationItem, UserRatingSummary, JobWithApplicants, ApplicantBrief } from "./api";

// Helper: random date within last N days
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * n));
  return d.toISOString();
}

export const mockJobs: Job[] = [
  { id: 1, title: "Mesero para evento corporativo", description: "Se necesita mesero con experiencia para evento de 50 personas. Uniforme incluido.", category: "Gastronomía", location: "Caracas, CCCT", budget: 85, duration: "6 horas", status: "open", client_id: 1, worker_id: null, created_at: daysAgo(10), updated_at: daysAgo(10) },
  { id: 2, title: "Cajero para fin de semana", description: "Atención al cliente y manejo de caja en restaurante de comida rápida.", category: "Ventas", location: "Caracas, Las Mercedes", budget: 120, duration: "2 días", status: "in_progress", client_id: 1, worker_id: 2, created_at: daysAgo(8), updated_at: daysAgo(8) },
  { id: 3, title: "Repartidor con moto", description: "Reparto de comida en sector este de Caracas. Horario nocturno.", category: "Logística", location: "Caracas, Chacao", budget: 60, duration: "4 horas", status: "open", client_id: 1, worker_id: null, created_at: daysAgo(7), updated_at: daysAgo(7) },
  { id: 4, title: "Ayudante de cocina", description: "Apoyo en cocina para restaurante italiano. Experiencia básica requerida.", category: "Gastronomía", location: "Caracas, Altamira", budget: 70, duration: "8 horas", status: "completed", client_id: 1, worker_id: 2, created_at: daysAgo(20), updated_at: daysAgo(15) },
  { id: 5, title: "Seguridad para evento privado", description: "Vigilancia en evento privado, 8pm a 2am. Experiencia comprobable.", category: "Seguridad", location: "Caracas, Country Club", budget: 95, duration: "6 horas", status: "review_pending", client_id: 1, worker_id: 2, created_at: daysAgo(5), updated_at: daysAgo(3) },
  { id: 6, title: "Recepcionista temporal", description: "Recepción en clínica dental, horario de oficina. Ingles básico.", category: "Oficina", location: "Caracas, Sabana Grande", budget: 55, duration: "1 día", status: "cancelled", client_id: 1, worker_id: 2, created_at: daysAgo(30), updated_at: daysAgo(28) },
  { id: 7, title: "Jardinero para residencia", description: "Mantenimiento de jardín residencial. Corte de césped y poda.", category: "Mantenimiento", location: "Caracas, La Florida", budget: 45, duration: "3 horas", status: "open", client_id: 1, worker_id: null, created_at: daysAgo(2), updated_at: daysAgo(2) },
  { id: 8, title: "Fotógrafo para evento", description: "Cobertura fotográfica de boda. Equipo propio requerido.", category: "Servicios", location: "Caracas, Hacienda La Trinidad", budget: 250, duration: "8 horas", status: "open", client_id: 1, worker_id: null, created_at: daysAgo(1), updated_at: daysAgo(1) },
];

export const mockApplications: Application[] = [
  { id: 1, job_id: 1, worker_id: 2, message: "Tengo 3 años de experiencia como mesero en eventos corporativos.", status: "pending", created_at: daysAgo(9) },
  { id: 2, job_id: 3, worker_id: 2, message: "Tengo moto propia y conozco bien la zona este de Caracas.", status: "accepted", created_at: daysAgo(6) },
  { id: 3, job_id: 7, worker_id: 2, message: "Experiencia en jardinería residencial por 5 años.", status: "pending", created_at: daysAgo(1) },
];

export const mockTransactions: Transaction[] = [
  { id: 1, user_id: 1, job_id: 4, type: "payment", amount: 70, network: "USDT-Polygon", tx_hash: "0xabc123", from_address: "0xcontrato", to_address: "0xtrabajador", status: "confirmed", requires_confirmation: false, created_at: daysAgo(15) },
  { id: 2, user_id: 1, job_id: null, type: "deposit", amount: 500, network: "USDT-Polygon", tx_hash: "0xdef456", from_address: "0xdeposito", to_address: null, status: "confirmed", requires_confirmation: false, created_at: daysAgo(20) },
  { id: 3, user_id: 1, job_id: 5, type: "escrow", amount: 95, network: "USDT-Polygon", tx_hash: null, from_address: null, to_address: null, status: "pending", requires_confirmation: true, created_at: daysAgo(5) },
  { id: 4, user_id: 1, job_id: 2, type: "payment", amount: 120, network: "USDT-Polygon", tx_hash: "0xghi789", from_address: "0xcontrato", to_address: "0xtrabajador", status: "confirmed", requires_confirmation: false, created_at: daysAgo(7) },
  { id: 5, user_id: 1, job_id: null, type: "withdrawal", amount: 200, network: "USDT-Polygon", tx_hash: "0xjkl012", from_address: null, to_address: "0xretiro", status: "confirmed", requires_confirmation: false, created_at: daysAgo(25) },
  { id: 6, user_id: 1, job_id: null, type: "deposit", amount: 1000, network: "USDT-Polygon", tx_hash: "0xmno345", from_address: "0xdeposito", to_address: null, status: "confirmed", requires_confirmation: false, created_at: daysAgo(30) },
  { id: 7, user_id: 1, job_id: 1, type: "escrow", amount: 85, network: "USDT-Polygon", tx_hash: null, from_address: null, to_address: null, status: "pending", requires_confirmation: true, created_at: daysAgo(10) },
  { id: 8, user_id: 1, job_id: 6, type: "refund", amount: 55, network: "USDT-Polygon", tx_hash: "0xpqr678", from_address: "0xcontrato", to_address: "0xcliente", status: "confirmed", requires_confirmation: false, created_at: daysAgo(28) },
  { id: 9, user_id: 1, job_id: 3, type: "escrow", amount: 60, network: "USDT-Polygon", tx_hash: null, from_address: null, to_address: null, status: "pending", requires_confirmation: true, created_at: daysAgo(7) },
];

export const mockNotifications: NotificationItem[] = [
  { id: 1, event: "job_applied", message: "María Rodríguez aplicó a tu trabajo 'Mesero para evento corporativo'", data: { job_id: 1, worker_name: "María Rodríguez" }, read: false, created_at: daysAgo(0) },
  { id: 2, event: "job_completed", message: "El trabajo 'Ayudante de cocina' fue completado exitosamente", data: { job_id: 4 }, read: false, created_at: daysAgo(15) },
  { id: 3, event: "payment_released", message: "Pago de Bs. 70 por 'Ayudante de cocina' liberado", data: { job_id: 4, amount: 70 }, read: true, created_at: daysAgo(14) },
  { id: 4, event: "job_accepted", message: "Tu postulación a 'Repartidor con moto' fue aceptada", data: { job_id: 3 }, read: true, created_at: daysAgo(5) },
  { id: 5, event: "job_cancelled", message: "El trabajo 'Recepcionista temporal' fue cancelado", data: { job_id: 6 }, read: true, created_at: daysAgo(28) },
  { id: 6, event: "review_pending", message: "Solicitud de finalización para 'Seguridad evento privado'", data: { job_id: 5 }, read: false, created_at: daysAgo(3) },
];

export const mockApplicants: JobWithApplicants[] = [
  {
    job: mockJobs[0],
    applicants: [
      { id: 1, worker_id: 2, worker_name: "María Rodríguez", worker_rating: 4.2, worker_email: "empleado@test.com", worker_phone: "+584149876543", worker_cedula: "V-87654321", worker_since: daysAgo(60), jobs_completed: 12, message: "Tengo 3 años de experiencia como mesero en eventos corporativos.", status: "pending", created_at: daysAgo(9) },
      { id: 2, worker_id: 3, worker_name: "Pedro Castillo", worker_rating: 4.5, worker_email: "pedro@test.com", worker_phone: "+584141112233", worker_cedula: "V-11223344", worker_since: daysAgo(120), jobs_completed: 25, message: "Experto en eventos de alta categoría. Disponible inmediato.", status: "pending", created_at: daysAgo(8) },
      { id: 3, worker_id: 4, worker_name: "Ana Martínez", worker_rating: 4.8, worker_email: "ana@test.com", worker_phone: "+584144556677", worker_cedula: "V-55667788", worker_since: daysAgo(90), jobs_completed: 18, message: "Mesera profesional con referencias verificadas.", status: "pending", created_at: daysAgo(8) },
    ],
  },
  {
    job: mockJobs[6],
    applicants: [
      { id: 4, worker_id: 2, worker_name: "María Rodríguez", worker_rating: 4.2, worker_email: "empleado@test.com", worker_phone: "+584149876543", worker_cedula: "V-87654321", worker_since: daysAgo(60), jobs_completed: 12, message: "Experiencia en jardinería residencial por 5 años.", status: "pending", created_at: daysAgo(1) },
    ],
  },
  {
    job: mockJobs[7],
    applicants: [
      { id: 5, worker_id: 5, worker_name: "Carlos Ruiz", worker_rating: 4.6, worker_email: "carlos@test.com", worker_phone: "+584147778899", worker_cedula: "V-77889900", worker_since: daysAgo(200), jobs_completed: 35, message: "Fotógrafo profesional con equipo propio. 8 años de experiencia.", status: "pending", created_at: daysAgo(0) },
    ],
  },
];

export const mockRatingSummary: UserRatingSummary = {
  avg: 4.8,
  total: 24,
  breakdown: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 21 },
  reviews: [
    { id: 1, rater_id: 2, rater_name: "María Rodríguez", rating: 5, comment: "Excelente contratista, paga a tiempo y muy profesional.", created_at: daysAgo(15) },
    { id: 2, rater_id: 3, rater_name: "Pedro Castillo", rating: 5, comment: "Muy buen ambiente laboral y comunicación clara.", created_at: daysAgo(30) },
    { id: 3, rater_id: 4, rater_name: "Ana Martínez", rating: 4, comment: "Buen trato, solo que el pago tardó un par de días.", created_at: daysAgo(45) },
    { id: 4, rater_id: 5, rater_name: "Carlos Ruiz", rating: 5, comment: "Recomendado, cumple con lo acordado.", created_at: daysAgo(60) },
    { id: 5, rater_id: 6, rater_name: "Luisa Fernández", rating: 5, comment: "Contratista serio y responsable. Volvería a trabajar con él.", created_at: daysAgo(75) },
    { id: 6, rater_id: 7, rater_name: "Jorge Hernández", rating: 3, comment: "Bien en general, pero la comunicación podría mejorar.", created_at: daysAgo(90) },
    { id: 7, rater_id: 8, rater_name: "Sofia Pérez", rating: 5, comment: "Todo perfecto, pago inmediato al completar el trabajo.", created_at: daysAgo(100) },
  ],
};

export const mockWorkerRatingSummary: UserRatingSummary = {
  avg: 4.2,
  total: 15,
  breakdown: { 1: 0, 2: 1, 3: 2, 4: 4, 5: 8 },
  reviews: [
    { id: 1, rater_id: 1, rater_name: "Carlos Méndez", rating: 5, comment: "Excelente trabajadora, puntual y profesional.", created_at: daysAgo(15) },
    { id: 2, rater_id: 9, rater_name: "Robert",
    rating: 4, comment: "Buena atención al cliente. Recomendada.", created_at: daysAgo(30) },
    { id: 3, rater_id: 10, rater_name: "Marta Rivas", rating: 5, comment: "Muy responsable, llegó temprano y cumplió con todo.", created_at: daysAgo(40) },
    { id: 4, rater_id: 11, rater_name: "José Gómez", rating: 3, comment: "Cumplió pero pidió salir antes.", created_at: daysAgo(55) },
    { id: 5, rater_id: 12, rater_name: "Diana Silva", rating: 4, comment: "Volvería a contratarla. Hizo buen trabajo.", created_at: daysAgo(70) },
    { id: 6, rater_id: 13, rater_name: "Andrés Rangel", rating: 2, comment: "Llegó tarde en varias ocasiones.", created_at: daysAgo(85) },
    { id: 7, rater_id: 14, rater_name: "Valentina Torres", rating: 5, comment: "Excelente actitud y buen trabajo.", created_at: daysAgo(95) },
    { id: 8, rater_id: 15, rater_name: "Fernando Paz", rating: 4, comment: "Buen servicio al cliente.", created_at: daysAgo(110) },
  ],
};
