const express = require('express');
const router = express.Router();
const {FlightLog} = require("../Datatypes/FlightLog.js")

router.post('/', async (req, res) => {
  try {
    const {id,telemetry} = req.body;

    if (!telemetry || !Array.isArray(telemetry) || telemetry.length < 1) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const newLog = await FlightLog.create({
      telemetry: telemetry, // store as JSON
      missionId: id,
    });

    res.status(201).json({ message: "Field created successfully", field: newLog });
  } catch (error) {
    console.error("Error creating field:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
