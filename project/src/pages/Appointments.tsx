import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { appointmentAPI, userAPI } from "../services/api";
import { Appointment, User } from "../types";
import CreateAppointmentModal from "../components/CreateAppointmentModal";
import RescheduleModal from "../components/RescheduleModal";
import EditAppointmentModal from "../components/EditAppointmentModal";
import {
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import ViewAppointments from "../components/ViewAppointments";
import FeedbackModal from "../components/FeedbackModal";

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [viewedAppointment, setViewedAppointment] =
    useState<Appointment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
    if (user?.role === "customer") {
      fetchProfessionals();
    }
  }, [user]);

  const handleView = async (appointmentId: number) => {
    try {
      const appointment = await appointmentAPI.getAppointmentById(
        appointmentId
      );
      console.log(appointment);
      setViewedAppointment(appointment);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      alert("Could not load appointment details.");
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let appointmentsData: Appointment[];

      if (user?.role === "customer" || user?.role === "admin") {
        const res = await appointmentAPI.getAllAppointments();
        appointmentsData = Array.isArray(res) ? res : res || [];
      } else {
        const res = await appointmentAPI.getClientAppointments();
        appointmentsData = Array.isArray(res) ? res : res || [];
      }

      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const users = await userAPI.getAllUsers();
      setAllUsers(users);
      console.log("All users:", users);
      const professionalUsers = users?.filter(
        (u: User) => u.role === "doctor" || u.role === "barber"
      );

      setProfessionals(professionalUsers);
    } catch (error) {
      console.error("Error fetching professionals:", error);
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?"))
      return;
    try {
      await appointmentAPI.cancelAppointment(appointmentId);
      fetchAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment");
    }
  };

  // const handleRescheduleRequest = (appointment: Appointment) => {
  //   setSelectedAppointment(appointment);
  //   setShowRescheduleModal(true);
  // };

  const handleGiveFeedback = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowFeedbackModal(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowEditModal(true);
  };

  // const handleApproveReschedule = async (id: number) => {
  //   try {
  //     await appointmentAPI.approveReschedule(id);
  //     fetchAppointments();
  //   } catch (error) {
  //     console.error("Error approving reschedule:", error);
  //   }
  // };

  // const handleRejectReschedule = async (id: number) => {
  //   try {
  //     await appointmentAPI.rejectReschedule(id);
  //     fetchAppointments();
  //   } catch (error) {
  //     console.error("Error rejecting reschedule:", error);
  //   }
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "cancelled":
        return "status-cancelled";
      case "scheduled":
        return "status-scheduled";
      case "reschedule_requested":
      case "reschedule_approved":
      case "reschedule_rejected":
        return "status-reschedule-requested";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAppointments = appointments.filter(
    (a) => filter === "all" || a.status === filter
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="loader" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-sm text-gray-500">
            {user?.role === "customer"
              ? "Manage your appointments"
              : "Manage client appointments"}
          </p>
        </div>
        {user?.role === "customer" && (
          <button
            className="btn-primary flex items-center"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="h-5 w-5 mr-1" /> Book Appointment
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          "all",
          "booked",
          "scheduled",
          "completed",
          "cancelled",
          "reschedule_requested",
        ].map((status) => (
          <button
            key={status}
            className={`px-4 py-2 rounded text-sm ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setFilter(status)}
          >
            {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="card">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900">
              No appointments found
            </h3>
            <p className="text-sm text-gray-500">
              {filter === "all"
                ? user?.role === "customer"
                  ? "You haven't booked any appointments yet."
                  : "No client appointments found."
                : `No ${filter} appointments found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th>Service</th>
                  <th>
                    {user?.role === "customer" ? "Professional" : "Customer"}
                  </th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 ">
                {filteredAppointments.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-50 text-center space-y-16"
                  >
                    <td>{a.service}</td>
                    <td>
                      {user?.role === "customer"
                        ? a.professional?.name
                        : a.client?.name}
                    </td>
                    <td>
                      {new Date(a.date).toLocaleDateString()}
                      <br />
                      <span className="text-sm text-gray-500">{a.time}</span>
                    </td>
                    <td>{a.duration} min</td>
                    <td>{formatCurrency(a.price)}</td>
                    <td>
                      <span
                        className={`status-badge ${getStatusColor(a.status)}`}
                      >
                        {a.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="space-x-2">
                      <button
                        onClick={() => handleEdit(a)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4 inline" /> Edit
                      </button>
                      <button
                        onClick={() =>
                          handleView(
                            // user.role === "customer" ? a.id : a.appointment_id
                            user?.role === "customer" ? a.id : a.id 
                          )
                        }
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <EyeIcon className="h-4 w-4 inline" /> View
                      </button>

                      {user?.role !== "customer" && (
                        <button
                          onClick={() => handleCancelAppointment(a.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4 inline" /> Delete
                        </button>
                      )}

                      {user?.role === "customer" &&
                        a.status === "completed" && (
                          <>
                            {!a.feedback ? (
                              <button
                                onClick={() => handleGiveFeedback(a)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-green-600 inline" />{" "}
                                Give Feedback
                              </button>
                            ) : (
                              <span className="text-gray-500 italic">
                                Feedback submitted
                              </span>
                            )}
                          </>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showViewModal && viewedAppointment && (
        <ViewAppointments
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewedAppointment(null);
          }}
          appointment={viewedAppointment}
        />
      )}

      {showCreateModal && (
        <CreateAppointmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          professionals={professionals}
          users={allUsers}
          onSuccess={fetchAppointments}
        />
      )}

      {showRescheduleModal && selectedAppointment && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onSuccess={fetchAppointments}
        />
      )}

      {showFeedbackModal && selectedAppointment && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onSuccess={fetchAppointments}
        />
      )}

      {showEditModal && selectedAppointment && (
        <EditAppointmentModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAppointment(null);
          }}
          onSuccess={fetchAppointments}
          users={allUsers}
        />
      )}
    </div>
  );
};

export default Appointments;
