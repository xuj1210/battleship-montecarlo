const express = require('express');
const router = express.Router();
const User = require('../models/UserModel.js');

// get all users
router.get('/', async (req, res) => {
  try {
    const USERS = await User.find();
    res.status(200).json(USERS);
  } catch (err) {
    res.status(418).json({ message: err });
  }
});

// get specific user
router.get('/:id', async (req, res) => {
  const ID = req.params.id;
  try {
    const USER = await User.find({ id: ID });
    res.status(200).json(USER);
  } catch (err) {
    res.status(418).json({ message: err });
  }
})

router.post('/', async (req, res) => {
  const USER = new User({
    "id": req.body.id,
    "name": req.body.name
  });

  try {
    const savedUser = await USER.save();
    res.status(200).json(savedUser);
  } catch (err) {
    res.status(418).json({ message: err });
  }
  
  
})

module.exports = router;