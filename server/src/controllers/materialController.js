import { Material } from '../models/Material.js';
import * as service from '../services/materialService.js';
import { readCourseContent } from '../services/accessService.js';
import { download } from '../services/storageService.js';
import { success, list } from '../utils/response.js';

export async function getMaterials(req, res) {
  await readCourseContent(req.user, req.params.courseId);
  return list(res, Material, { course: req.params.courseId }, req.validated.query, { sort: { position: 1, _id: 1 } });
}
export async function getMaterial(req, res) { return success(res, await service.getMaterial(req.user, req.params.courseId, req.params.materialId)); }
export async function downloadMaterial(req, res, next) {
  const material = await service.getMaterial(req.user, req.params.courseId, req.params.materialId, true);
  return download(res, material.file, next);
}
export async function createMaterial(req, res) { return success(res, await service.createMaterial(req.user, req.params.courseId, req.validated.body, req.file), 201); }
export async function updateMaterial(req, res) { return success(res, await service.updateMaterial(req.user, req.params.courseId, req.params.materialId, req.validated.body, req.file)); }
export async function deleteMaterial(req, res) { await service.deleteMaterial(req.user, req.params.courseId, req.params.materialId); return res.status(204).end(); }
