import React, { useState, useEffect } from "react";
import { appointmentAPI } from "../services/api";
import { Appointment } from "../types";
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface ClientStats {
  name: string;
  email: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  lastAppointment?: string;
}

interface Feedback {
  appointmentId: number;
  rating: number;
  comment: string;
}

const Clients: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<number, Feedback | null>>(
    {}
  );

  useEffect(() => {
    fetchClientAppointments();
  }, []);

  const fetchClientAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await appointmentAPI.getClientAppointments();
      setAppointments(appointmentsData);
      calculateClientStats(appointmentsData);
    } catch (error) {
      console.error("Error fetching client appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateClientStats = (appointments: Appointment[]) => {
    const clientMap = new Map<string, ClientStats>();
    appointments.forEach((appointment) => {
      const clientKey = appointment.client?.email || "";
      const clientName = appointment.client?.name || "Unknown";
      const clientEmail = appointment.client?.email || "";
      if (!clientMap.has(clientKey)) {
        clientMap.set(clientKey, {
          name: clientName,
          email: clientEmail,
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          totalRevenue: 0,
        });
      }
      const stats = clientMap.get(clientKey)!;
      stats.totalAppointments++;
      if (appointment.status === "completed") {
        stats.completedAppointments++;
        stats.totalRevenue += appointment.price;
      } else if (appointment.status === "cancelled") {
        stats.cancelledAppointments++;
      }
      if (!stats.lastAppointment || appointment.date > stats.lastAppointment) {
        stats.lastAppointment = appointment.date;
      }
    });
    const statsArray = Array.from(clientMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );
    setClientStats(statsArray);
  };

  const getClientAppointments = (clientEmail: string) => {
    return appointments.filter((apt) => apt.client?.email === clientEmail);
  };

  const fetchFeedback = async (appointmentId: number) => {
    try {
      const res = await appointmentAPI.getMyFeedback(appointmentId);
      setFeedbacks((prev) => ({ ...prev, [appointmentId]: res }));
    } catch {
      setFeedbacks((prev) => ({ ...prev, [appointmentId]: null }));
    }
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
        return "status-completed";
      case "cancelled":
        return "status-cancelled";
      case "scheduled":
        return "status-scheduled";
      case "reschedule_requested":
        return "status-reschedule-requested";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalStats = {
    totalClients: clientStats.length,
    totalRevenue: clientStats.reduce(
      (sum, client) => sum + client.totalRevenue,
      0
    ),
    totalAppointments: clientStats.reduce(
      (sum, client) => sum + client.totalAppointments,
      0
    ),
    completedAppointments: clientStats.reduce(
      (sum, client) => sum + client.completedAppointments,
      0
    ),
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your client appointments and statistics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.totalClients}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalStats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Appointments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.totalAppointments}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStats.completedAppointments}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Client Statistics
          </h2>
          <UserGroupIcon className="h-5 w-5 text-gray-400" />
        </div>

        {clientStats.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No clients found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't served any clients yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientStats.map((client, index) => (
              <div
                key={`${client.email}-${index}`}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {client.name}
                        </h3>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {client.totalAppointments}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-600">
                        {client.completedAppointments}
                      </p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-red-600">
                        {client.cancelledAppointments}
                      </p>
                      <p className="text-xs text-gray-500">Cancelled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(client.totalRevenue)}
                      </p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {client.lastAppointment
                          ? new Date(
                              client.lastAppointment
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">Last Visit</p>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedClient(
                          selectedClient === client.email ? null : client.email
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {selectedClient === client.email ? "Hide" : "View"}{" "}
                      Details
                    </button>
                  </div>
                </div>
                {selectedClient === client.email && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Appointment History
                    </h4>
                    <div className="space-y-2">
                      {getClientAppointments(client.email).map(
                        (appointment) => (
                          <div
                            key={appointment.id}
                            className="flex flex-col space-y-2 py-2 px-3 bg-gray-50 rounded"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {appointment.service}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    appointment.date
                                  ).toLocaleDateString()}{" "}
                                  at {appointment.time}
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`status-badge text-xs ${getStatusColor(
                                    appointment.status
                                  )}`}
                                >
                                  {appointment.status.replace("_", " ")}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(appointment.price)}
                                </span>
                              </div>
                            </div>
                            <div>
                              {getStatusColor(appointment.status) ===
                                "status-completed" && (
                                <button
                                  onClick={() => fetchFeedback(appointment.id)}
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  View Feedback
                                </button>
                              )}
                              {feedbacks[appointment.id] && (
                                <div className="mt-2 p-2 bg-white border rounded">
                                  <p className="text-sm">
                                    Rating:{" "}
                                    {feedbacks[appointment.id]?.rating || "N/A"}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {feedbacks[appointment.id]?.comment ||
                                      "No feedback given"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
