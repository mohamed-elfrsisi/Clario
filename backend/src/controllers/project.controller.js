// src/controllers/project.controller.js

const projectService = require('../services/project.service');

async function listProjects(req, res) {
  const { page, limit } = req.validatedQuery;
  const projects = await projectService.listProjects(req.user.userId, { page, limit });
  res.status(200).json({ projects, page, limit });
}

async function getProject(req, res) {
  const project = await projectService.getProject(req.user.userId, req.params.projectId);
  res.status(200).json({ project });
}

async function createProject(req, res) {
  const project = await projectService.createProject(req.user.userId, req.body);
  res.status(201).json({ project });
}

async function updateProject(req, res) {
  const project = await projectService.updateProject(
    req.user.userId,
    req.params.projectId,
    req.body
  );
  res.status(200).json({ project });
}

async function deleteProject(req, res) {
  await projectService.deleteProject(req.user.userId, req.params.projectId);
  res.status(204).send();
}

async function listProjectSkills(req, res) {
  const skills = await projectService.listProjectSkills(req.user.userId, req.params.projectId);
  res.status(200).json({ skills });
}

async function addProjectSkill(req, res) {
  const skill = await projectService.addProjectSkill(
    req.user.userId,
    req.params.projectId,
    req.body
  );
  res.status(201).json({ skill });
}

async function removeProjectSkill(req, res) {
  await projectService.removeProjectSkill(
    req.user.userId,
    req.params.projectId,
    req.params.skillId
  );
  res.status(204).send();
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listProjectSkills,
  addProjectSkill,
  removeProjectSkill,
};
