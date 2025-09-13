import axios from "axios";
import type {
  User,
  Organization,
  Appointment,
  AuthResponse,
  LoginCredentials,
  SignupData,
  CreateAppointmentData,
  CreateOrganizationData,
  RescheduleRequest,
  AssignUserToOrganization,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    api.post("/auth/login", credentials).then((res) => res.data),

  signup: (data: SignupData): Promise<AuthResponse> =>
    api.post("/auth/signup", data).then((res) => res.data),

  getProfile: (): Promise<User> =>
    api.get("/auth/profile").then((res) => res.data?.user),
};

// User APIs
export const userAPI = {
  getAllUsers: (): Promise<User[]> =>
    api.get("/users").then((res) => res.data.users),

  getUserById: (id: number): Promise<User> =>
    api.get(`/users/${id}`).then((res) => res.data),

  updateUser: (id: number, data: Partial<User>): Promise<User> =>
    api.put(`/users/${id}`, data).then((res) => res.data),

  deleteUser: (id: number): Promise<void> =>
    api.delete(`/users/${id}`).then((res) => res.data),
};

// Organization APIs
export const organizationAPI = {
  createOrganization: (data: CreateOrganizationData): Promise<Organization> =>
    api.post("/organizations/create", data).then((res) => res.data),

  getAllOrganizations: (): Promise<Organization[]> =>
    api.get("/organizations/").then((res) => res.data?.organizations),

  assignUserToOrganization: (data: AssignUserToOrganization): Promise<void> =>
    api.put("/organizations/assign/", data).then((res) => res.data),

  isApprove: (id: number): Promise<Appointment[]> =>
    api.post(`/organizations/approve/${id}`).then((res) => res.data),
};

// Appointment APIs
export const appointmentAPI = {
  createAppointment: (data: CreateAppointmentData): Promise<Appointment> =>
    api.post("/appointments", data).then((res) => res.data),

  getAllAppointments: (): Promise<Appointment[]> =>
    api.get("/appointments").then((res) => res.data?.appointments),

  getAppointmentById: (id: number): Promise<Appointment> =>
    api.get(`/appointments/${id}`).then((res) => res.data?.appointment),

  cancelAppointment: (id: number): Promise<void> =>
    api.delete(`/appointments/${id}`).then((res) => res.data),

  requestReschedule: (id: number, data: RescheduleRequest): Promise<void> =>
    api
      .post(`/appointments/${id}/reschedule-request`, data)
      .then((res) => res.data),

  approveReschedule: (id: number): Promise<void> =>
    api.post(`/appointments/${id}/reschedule-approve`).then((res) => res.data),

  rejectReschedule: (id: number): Promise<void> =>
    api.patch(`/appointments/${id}/reschedule-reject`).then((res) => res.data),

  getClientAppointments: (): Promise<Appointment[]> =>
    api.get("/appointments/my/clients").then((res) => res.data?.appointments),

  submitFeedback: (id: number, feedback: any): Promise<void> =>
    api.post(`/appointments/${id}/feedback`, feedback).then((res) => res.data),
  getMyFeedback: (appointmentId: number): Promise<any> =>
    api
      .get(`/appointments/${appointmentId}/viewFeedback`)
      .then((res) => res.data?.feedback),
};
export const feedbackAPI = {
  getMyFeedback: (): Promise<any> =>
    api.get("/my-feedback").then((res) => res.data?.feedback),
};

export default api;
