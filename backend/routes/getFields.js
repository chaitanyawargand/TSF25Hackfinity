const express = require('express');
const router = express.Router();
const { Field } = require('../Datatypes/Field.js');

// Fetch all fields for a specific user by ownerId
router.post("/", async (req, res) => {
  try {
      const { id } = req.body; // id is the user's UUID
      console.log(id);

    if (!id) {
      return res.status(400).json({ error: "User ID (ownerId) is required" });
    }

    // Find all fields belonging to this user
    const fields = await Field.findAll({
      where: { ownerId: id },
      order: [['createdAt', 'DESC']], // optional: latest first
    });
    console.log(fields);
    res.status(200).json({ fields });
  } catch (error) {
    console.error("Error fetching fields:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
