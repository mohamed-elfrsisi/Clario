// src/controllers/profile.controller.js

const profileService = require('../services/profile.service');

async function createProfile(req, res) {
  const profile = await profileService.createProfile(req.user.userId, req.body);
  res.status(201).json({ profile });
}

async function getMyProfile(req, res) {
  const profile = await profileService.getMyProfile(req.user.userId);
  res.status(200).json({ profile });
}

async function updateMyProfile(req, res) {
  const profile = await profileService.updateMyProfile(req.user.userId, req.body);
  res.status(200).json({ profile });
}

module.exports = {
  createProfile,
  getMyProfile,
  updateMyProfile,
};
