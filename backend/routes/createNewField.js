const express = require('express');
const router = express.Router();
const { Field } = require('../Datatypes/Field.js');

router.post('/', async (req, res) => {
  try {
    const { id,coords } = req.body;

    if (!coords || !Array.isArray(coords) || coords.length < 1) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const newField = await Field.create({
      boundary: coords, // store as JSON
      ownerId: id,
    });

    res.status(201).json({ message: "Field created successfully", field: newField });
  } catch (error) {
    console.error("Error creating field:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
