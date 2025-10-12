const express = require('express');
const router = express.Router();
const Mission = require("../Datatypes/Mission.js");

router.post('/', async (req, res) => {
  try {
    const {id,altitude,speed} = req.body; //id=fieldid

    const newMission = await Mission.create({
      altitude: altitude, // store as JSON
      speed:speed,
      fieldId: id,
    });

    res.status(201).json({ message: "Field created successfully", field: newMission });
  } catch (error) {
    console.error("Error creating field:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
