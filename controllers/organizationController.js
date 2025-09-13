const db = require("../config/db");

exports.createOrganization = async (req, res) => {
  const { name, description, established_date, address, phone, email } =
    req.body;
  const creatorId = req.user.id;
  const isAdmin = req.user.role === "admin";
  try {
    await db.query(
      `INSERT INTO organizations (name, description, established_date, address, phone, email, creator_id, is_approved)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        established_date,
        address,
        phone,
        email,
        creatorId,
        isAdmin,
      ]
    );

    res.status(201).json({
      success: true,
      message: isAdmin
        ? "Organization created and approved"
        : "Organization request submitted, pending admin approval",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error creating organization",
      error: err.message,
    });
  }
};

exports.approveOrganization = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can approve organizations",
    });
  }

  const organizationId = req.params.id;

  try {
    await db.query(`UPDATE organizations SET is_approved = TRUE WHERE id = ?`, [
      organizationId,
    ]);
    res.status(200).json({ success: true, message: "Organization approved" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to approve organization",
      error: err.message,
    });
  }
};

exports.getOrganizations = async (req, res) => {
  try {
    const [organizations] = await db.query(`SELECT * FROM organizations`);

    const enrichedOrganizations = await Promise.all(
      organizations.map(async (org) => {
        const [users] = await db.query(
          `SELECT id, name, email, role FROM users WHERE organization_id = ?`,
          [org.id]
        );

        return {
          ...org,
          membersCount: users.length,
          members: users,
        };
      })
    );

    res.status(200).json({
      success: true,
      organizations: enrichedOrganizations,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching organizations",
      error: err.message,
    });
  }
};

exports.assignProfessionalToOrganization = async (req, res) => {
  const { userId, organizationId } = req.body;
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Only admin can assign professionals" });
  }
  try {
    await db.query(
      `UPDATE users SET organization_id = ? WHERE id = ? AND role IN ('doctor', 'barber')`,
      [organizationId, userId]
    );
    res
      .status(200)
      .json({ success: true, message: "User assigned to organization" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to assign user",
      error: err.message,
    });
  }
};
