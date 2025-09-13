const multer = require("multer");
const path = require("path");
const db = require("../config/db");

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/feedback_images");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `feedback-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

exports.submitFeedback = [
  upload.single("image"),

  async (req, res) => {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    const { rating, experience, suggestion } = req.body;

    try {
      const [rows] = await db.query(
        `SELECT * FROM appointments WHERE id = ? AND user_id = ?`,
        [appointmentId, userId]
      );

      if (!rows.length) {
        return res.status(403).json({
          success: false,
          message: "Access denied or appointment not found.",
        });
      }

      const appointment = rows[0];
      const now = new Date();
      const start = new Date(`${appointment.date}T${appointment.time}`);
      const end = new Date(start.getTime() + appointment.duration * 60000);

      if (now < end) {
        return res.status(400).json({
          success: false,
          message: "Feedback can only be submitted after the appointment ends.",
        });
      }

      const imageUrl = req.file
        ? `/uploads/feedback_images/${req.file.filename}`
        : null;

      await db.query(
        `INSERT INTO feedbacks (appointment_id, user_id, professional_id, rating, experience, suggestion, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          appointmentId,
          userId,
          appointment.professional_id,
          parseFloat(rating),
          experience,
          suggestion,
          imageUrl,
        ]
      );

      res.status(201).json({ success: true, message: "Feedback submitted!" });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Error submitting feedback",
        error: err.message,
      });
    }
  },
];
exports.viewFeedback = async (req, res) => {
  const professionalId = req.user?.id; // Extracted from token by middleware

  if (!professionalId) {
    return res.status(400).json({
      success: false,
      message: "Professional ID not found in token.",
    });
  }

  try {
    const [feedbacks] = await db.query(
      `
      SELECT 
        f.id,
        f.rating,
        f.experience,
        f.suggestion,
        f.image_url,
        f.created_at,
        u.name AS user_name
      FROM feedbacks f
      JOIN users u ON f.user_id = u.id
      WHERE f.professional_id = ?
      ORDER BY f.created_at DESC
      `,
      [professionalId]
    );

    const [averageRatingResult] = await db.query(
      `
      SELECT AVG(rating) AS average_rating
      FROM feedbacks
      WHERE professional_id = ?
      `,
      [professionalId]
    );

    const averageRating = averageRatingResult[0].average_rating
      ? parseFloat(averageRatingResult[0].average_rating).toFixed(1)
      : null;

    res.status(200).json({
      success: true,
      message: "Feedback retrieved successfully.",
      data: {
        feedbacks,
        averageRating,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error retrieving feedback",
      error: err.message,
    });
  }
};

exports.viewMyFeedback = async (req, res) => {
  const professionalId = req.user.id;

  try {
    const [feedbacks] = await db.query(
      `
      SELECT 
        f.id,
        f.rating,
        f.experience,
        f.suggestion,
        f.image_url,
        f.created_at,
        u.name AS user_name
      FROM feedbacks f
      JOIN users u ON f.user_id = u.id
      WHERE f.professional_id = ?
      ORDER BY f.created_at DESC
      `,
      [professionalId]
    );

    const [averageRatingResult] = await db.query(
      `
      SELECT AVG(rating) AS average_rating
      FROM feedbacks
      WHERE professional_id = ?
      `,
      [professionalId]
    );

    const averageRating = averageRatingResult[0].average_rating
      ? parseFloat(averageRatingResult[0].average_rating).toFixed(1)
      : null;

    res.status(200).json({
      success: true,
      message: "My feedback retrieved successfully.",
      data: {
        feedbacks,
        averageRating,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error retrieving my feedback",
      error: err.message,
    });
  }
};
