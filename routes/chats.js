const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

// Send a message
router.post("/", authenticateToken, async (req, res) => {
  const { appointment_id, message } = req.body;
  const sender_id = req.user.id;

  if (!appointment_id || !message) {
    return res
      .status(400)
      .json({ error: "appointment_id and message are required" });
  }

  try {
    // Appointment fetch karo
    const [appointments] = await pool.query(
      `SELECT * FROM appointments WHERE id = ? AND (user_id = ? OR professional_id = ?)`,
      [appointment_id, sender_id, sender_id]
    );

    if (!appointments.length) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const appointment = appointments[0];

    // Agar sender user hai to receiver professional_id hoga
    // Agar sender professional hai to receiver user_id hoga
    let receiver_id;
    if (sender_id === appointment.user_id) {
      receiver_id = appointment.professional_id;
    } else if (sender_id === appointment.professional_id) {
      receiver_id = appointment.user_id;
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Invalid access" });
    }

    // Message save
    const [result] = await pool.query(
      `INSERT INTO chats (appointment_id, sender_id, receiver_id, message)
       VALUES (?, ?, ?, ?)`,
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
  } catch (error) {
    console.error("Error inserting chat:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Pehle inbox route rakho
router.get("/inbox", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [conversations] = await pool.query(
      `SELECT c1.id AS chat_id, c1.message, c1.created_at, c1.appointment_id,
              s.id AS sender_id, s.name AS sender_name, s.email AS sender_email, s.role AS sender_role,
              r.id AS receiver_id, r.name AS receiver_name, r.email AS receiver_email, r.role AS receiver_role,
              a.date, a.time, a.status, a.service, a.duration, a.price, a.notes,
              u.id AS user_id, u.name AS user_name, u.email AS user_email, u.role AS user_role,
              p.id AS professional_id, p.name AS professional_name, p.email AS professional_email, p.role AS professional_role,
              o.id AS org_id, o.name AS org_name, o.description AS org_description, o.established_date AS org_established
       FROM chats c1
       JOIN (
          SELECT appointment_id, MAX(created_at) AS last_time
          FROM chats
          WHERE sender_id = ? OR receiver_id = ?
          GROUP BY appointment_id
       ) c2 ON c1.appointment_id = c2.appointment_id AND c1.created_at = c2.last_time
       JOIN users s ON c1.sender_id = s.id
       JOIN users r ON c1.receiver_id = r.id
       JOIN appointments a ON c1.appointment_id = a.id
       JOIN users u ON a.user_id = u.id
       JOIN users p ON a.professional_id = p.id
       LEFT JOIN organizations o ON p.organization_id = o.id
       WHERE a.user_id = ? OR a.professional_id = ?
       ORDER BY c1.created_at DESC`,
      [userId, userId, userId, userId]
    );

    const formatted = conversations.map((c) => ({
      user_id: userId,
      last_message: {
        id: c.chat_id,
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
      },
      appointment: {
        id: c.appointment_id,
        date: c.date,
        time: c.time,
        status: c.status,
        service: c.service,
        duration: c.duration,
        price: c.price,
        notes: c.notes,
        user: {
          id: c.user_id,
          name: c.user_name,
          email: c.user_email,
          role: c.user_role,
        },
        professional: {
          id: c.professional_id,
          name: c.professional_name,
          email: c.professional_email,
          role: c.professional_role,
          organization: c.org_id
            ? {
                id: c.org_id,
                name: c.org_name,
                description: c.org_description,
                established_date: c.org_established,
              }
            : null,
        },
      },
    }));

    res.json({
      success: true,
      count: formatted.length,
      conversations: formatted,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

router.get("/:appointment_id", authenticateToken, async (req, res) => {
  const { appointment_id } = req.params;
  const userId = req.user.id; // token se

  try {
    // 1Chat data fetch
    const [chats] = await pool.query(
      `SELECT c.*, 
              s.id AS sender_id, s.name AS sender_name, s.email AS sender_email, s.role AS sender_role,
              r.id AS receiver_id, r.name AS receiver_name, r.email AS receiver_email, r.role AS receiver_role
       FROM chats c
       JOIN users s ON c.sender_id = s.id
       JOIN users r ON c.receiver_id = r.id
       WHERE c.appointment_id = ? 
         AND (c.sender_id = ? OR c.receiver_id = ?)
       ORDER BY c.created_at ASC`,
      [appointment_id, userId, userId]
    );

    if (chats.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No chats or access denied" });
    }

    // 2️Appointment full detail fetch
    const [appointments] = await pool.query(
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

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or access denied",
      });
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
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});


module.exports = router;
