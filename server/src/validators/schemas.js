import { z } from 'zod';
import { objectId } from '../middlewares/validateRequest.js';

const text = max => z.string().trim().min(1).max(max);
export const email = z.email().trim().toLowerCase().max(254);
export const password = z.string().min(12).max(128);
const httpUrl = z.url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol), 'Chỉ chấp nhận HTTP/HTTPS.');
const nonempty = schema => schema.refine(value => Object.keys(value).length > 0, 'Cần ít nhất một trường cập nhật.');
export const register = z.object({ fullName: text(120), email, password }).strict();
export const login = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const createUser = register.extend({ role: z.enum(['teacher', 'student']) });
export const profile = z.object({ fullName: text(120) }).strict();
export const userStatus = z.object({ isActive: z.boolean() }).strict();
const newPassword = password.refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Mật khẩu không được vượt 72 byte UTF-8.');
export const changeOwnPassword = z.object({ currentPassword: z.string().min(1).max(128), newPassword }).strict();
export const resetUserPassword = z.object({ newPassword }).strict();
export const category = z.object({
  name: text(100), slug: text(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(2000).default(''), isActive: z.boolean().default(true),
}).strict();
export const categoryUpdate = nonempty(category.extend({ description: z.string().trim().max(2000), isActive: z.boolean() }).partial());
export const course = z.object({
  title: text(200), description: text(20000), category: objectId, thumbnailUrl: httpUrl.optional(),
}).strict();
export const courseUpdate = nonempty(course.partial());
export const courseStatus = z.object({ status: z.enum(['draft', 'published', 'archived']) }).strict();
export const material = z.object({
  title: text(200), type: z.enum(['pdf', 'video', 'text']),
  content: z.string().trim().max(100000).optional(), videoUrl: httpUrl.optional(),
  position: z.coerce.number().int().min(0).max(100000).default(0),
}).strict();
// Type changes are intentionally disallowed; create a new material instead.
export const materialUpdate = material.omit({ type: true }).extend({ position: z.coerce.number().int().min(0).max(100000) }).partial();
export const assignment = z.object({
  title: text(200), description: text(20000),
  dueAt: z.iso.datetime({ offset: true }).nullable().optional(),
  maxScore: z.number().positive().max(10000).default(10),
  submissionType: z.enum(['text', 'file', 'both']),
  status: z.enum(['draft', 'published', 'closed']).default('draft'),
}).strict();
export const assignmentCreate = assignment.omit({ status: true });
export const assignmentUpdate = nonempty(assignment.extend({
  maxScore: z.number().positive().max(10000), status: z.enum(['draft', 'published', 'closed']),
}).partial());
export const submission = z.object({ textAnswer: z.string().trim().max(100000).default('') }).strict();
export const grade = z.object({ score: z.number().min(0), feedback: z.string().trim().max(10000).default('') }).strict();

const pagination = { page: z.coerce.number().int().min(1).max(100000).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) };
export const pageQuery = z.object(pagination).strict();
export const courseQuery = z.object({ ...pagination, search: text(100).optional(), category: objectId.optional() }).strict();
export const userQuery = z.object({ ...pagination, search: text(100).optional(), role: z.enum(['admin', 'teacher', 'student']).optional(), isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional() }).strict();
export const categoryQuery = z.object({ ...pagination, includeInactive: z.enum(['true', 'false']).transform(v => v === 'true').optional() }).strict();
