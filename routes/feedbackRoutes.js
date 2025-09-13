const express = require("express");
const router = express.Router();
const { submitFeedback,viewMyFeedback,viewFeedback } = require("../controllers/feedbackController");
const { authenticateToken } = require("../middleware/auth"); 

router.post("/appointments/:id/feedback", authenticateToken, submitFeedback);
router.get('/appointments/:id/professional', viewFeedback);
router.get('/my-feedback', authenticateToken, viewMyFeedback);

module.exports = router;
