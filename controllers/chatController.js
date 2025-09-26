const db = require("../config/db");

// GET: Get chat messages for an appointment along with full appointment detail
exports.getChatsByAppointment = async (req, res) => {
  const { appointment_id } = req.params;
  const userId = req.user.id;

  try {
    // Check if user belongs to the appointment
    const [appointments] = await db.query(
      `SELECT 
         a.id, a.date, a.time, a.status, a.service, a.duration, a.price, a.notes,
         a.pending_date, a.pending_time,
         u.id AS user_id, u.name AS user_name, u.email AS user_email, u.role AS user_role,
         p.id AS professional_id, p.name AS professional_name, p.email AS professional_email, p.role AS professional_role,
         o.id AS org_id, o.name AS org_name, o.description AS org_description, o.established_date AS org_established
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN users p ON a.professional_id = p.id
       LEFT JOIN organizations o ON p.organization_id = o.id
       WHERE a.id = ? AND (a.user_id = ? OR a.professional_id = ?)`,
      [appointment_id, userId, userId]
    );

    if (!appointments.length) {
      return res.status(403).json({ success: false, message: "Access denied or appointment not found" });
    }

    const a = appointments[0];
    const appointment = {
      id: a.id,
      date: a.date,
      time: a.time,
      status: a.status,
      pending_date: a.pending_date,
      pending_time: a.pending_time,
      service: a.service,
      duration: a.duration,
      price: a.price,
      notes: a.notes,
      user: {
        id: a.user_id,
        name: a.user_name,
        email: a.user_email,
        role: a.user_role,
      },
      professional: {
        id: a.professional_id,
        name: a.professional_name,
        email: a.professional_email,
        role: a.professional_role,
        organization: a.org_id
          ? {
              id: a.org_id,
              name: a.org_name,
              description: a.org_description,
              established_date: a.org_established,
            }
          : null,
      },
    };

    // Fetch chat messages
    const [chats] = await db.query(
      `SELECT c.id, c.message, c.created_at,
              s.id AS sender_id, s.name AS sender_name, s.email AS sender_email, s.role AS sender_role,
              r.id AS receiver_id, r.name AS receiver_name, r.email AS receiver_email, r.role AS receiver_role
       FROM chats c
       JOIN users s ON c.sender_id = s.id
       JOIN users r ON c.receiver_id = r.id
       WHERE c.appointment_id = ? AND (c.sender_id = ? OR c.receiver_id = ?)
       ORDER BY c.created_at ASC`,
      [appointment_id, userId, userId]
    );

    res.json({
      success: true,
      appointment,
      count: chats.length,
      chats: chats.map((c) => ({
        id: c.id,
        message: c.message,
        created_at: c.created_at,
        sender: {
          id: c.sender_id,
          name: c.sender_name,
          email: c.sender_email,
          role: c.sender_role,
        },
        receiver: {
          id: c.receiver_id,
          name: c.receiver_name,
          email: c.receiver_email,
          role: c.receiver_role,
        },
      })),
    });
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// POST: Send a chat message
exports.sendMessage = async (req, res) => {
  const { appointment_id, receiver_id, message } = req.body;
  const sender_id = req.user.id;

  if (!appointment_id || !receiver_id || !message) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    // Check appointment access
    const [appointment] = await db.query(
      `SELECT * FROM appointments WHERE id = ? AND (user_id = ? OR professional_id = ?)`,
      [appointment_id, sender_id, sender_id]
    );

    if (!appointment.length) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [result] = await db.query(
      `INSERT INTO chats (appointment_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)`,
      [appointment_id, sender_id, receiver_id, message]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      appointment_id,
      sender: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      receiver_id,
      message,
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};


exports.saveChatMessage = async (sender_id, receiver_id, appointment_id, message) => {
  return await db.query(
    `INSERT INTO chats (appointment_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)`,
    [appointment_id, sender_id, receiver_id, message]
  );
};