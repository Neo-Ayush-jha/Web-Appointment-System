import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { appointmentAPI, userAPI, organizationAPI } from "../services/api";
import { Appointment } from "../types";
import {
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import AppointmentCalendar from "../components/AppointmentCalendar";

interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  totalUsers?: number;
  totalOrganizations?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        let appointmentsData: Appointment[] = [];

        if (user?.role === "customer" || user?.role === "admin") {
          const response = await appointmentAPI.getAllAppointments();
          appointmentsData = response || [];
        } else if (user?.role === "doctor" || user?.role === "barber") {
          const response = await appointmentAPI.getClientAppointments();
          appointmentsData = response || [];
          console.log("appointmentsData = ", appointmentsData);
        }
        console.log("appointmentsData = ", appointmentsData);

        setAppointments(appointmentsData.slice(0, 5));

        const totalAppointments = appointmentsData.length;
        const completedAppointments = appointmentsData.filter(
          (apt) => apt.status === "completed"
        ).length;
        const cancelledAppointments = appointmentsData.filter(
          (apt) => apt.status === "cancelled"
        ).length;
        const totalRevenue = appointmentsData
          .filter((apt) => apt.status === "completed")
          .reduce((sum, apt) => sum + parseFloat(String(apt?.price)), 0);

        let additionalStats = {};

        if (user?.role === "admin") {
          try {
            const users = await userAPI.getAllUsers();
            const organizations = await organizationAPI.getAllOrganizations();
            additionalStats = {
              totalUsers: users.length,
              totalOrganizations: organizations.length,
            };
          } catch (error) {
            console.error("Error fetching admin stats:", error);
          }
        }

        setStats({
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          totalRevenue,
          ...additionalStats,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", user?.role, error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      case "scheduled":
        return "text-blue-600 bg-blue-100";
      case "reschedule_requested":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-blue-100 capitalize">
          Welcome to your {user?.role} dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Appointments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalAppointments}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completedAppointments}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <XCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.cancelledAppointments}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Admin-specific stats */}
        {user?.role === "admin" && (
          <>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <UsersIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                  <UsersIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Organizations
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalOrganizations || 0}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <br />
      <AppointmentCalendar />
      {/* Recent Appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Appointments
          </h2>
          <ClockIcon className="h-5 w-5 text-gray-400" />
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No appointments
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === "customer"
                ? "You haven't booked any appointments yet."
                : "No client appointments found."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors
    ${
      appointment.service === "Haircut"
        ? "bg-red-50 hover:bg-red-100"
        : "bg-green-50 hover:bg-green-100"
    }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.service.charAt(0).toUpperCase() +
                            appointment.service.slice(1)}
                        </p>

                        <p className="text-sm text-gray-500">
                          {`with ${
                            user?.role === "customer"
                              ? appointment.professional?.name
                              : appointment.client?.name ||
                                appointment.customer?.name
                          }`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(appointment.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.time}
                      </p>
                    </div>

                    <span
                      className={`status-badge ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status.replace("_", " ")}
                    </span>

                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(appointment?.price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.duration} min
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
