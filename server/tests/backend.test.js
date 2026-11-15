import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, readdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import mongoose from 'mongoose';
import request from 'supertest';

let temporaryRoot, mongo, app, models;
const password = 'ClassroomTestPassword123!';
const pdf = Buffer.from('%PDF-1.4\nClassroom fixture\n%%EOF');
const api = '/api/v1';
const execFileAsync = promisify(execFile);
const json = response => response.body.data;
const auth = token => ({ Authorization: `Bearer ${token}` });

async function freePort() {
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}

before(async () => {
  temporaryRoot = await mkdtemp(path.join(tmpdir(), 'online-classroom-test-'));
  const dbPath = path.join(temporaryRoot, 'database');
  await mkdir(dbPath);
  const port = await freePort();
  mongo = spawn(process.env.MONGOD_BINARY || 'mongod', ['--dbpath', dbPath, '--port', String(port), '--bind_ip', '127.0.0.1', '--noauth', '--quiet', '--logpath', path.join(temporaryRoot, 'mongo.log')], { windowsHide: true, stdio: 'ignore' });
  let spawnError;
  mongo.on('error', error => { spawnError = error; });
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-only-secret-with-more-than-32-characters';
  process.env.MONGODB_URI = `mongodb://127.0.0.1:${port}/online_classroom_test`;
  process.env.UPLOAD_DIR = path.join(temporaryRoot, 'uploads');
  ({ app } = await import('../src/app.js'));
  models = mongoose.models;
  const { connectDatabase } = await import('../src/config/database.js');
  // Wait for the isolated MongoDB process, without touching the developer database.
  for (let attempt = 0; attempt < 60; attempt++) {
    if (spawnError) throw new Error('Cannot start mongod. Put mongod on PATH or set MONGOD_BINARY.', { cause: spawnError });
    if (mongo.exitCode !== null) throw new Error('Test mongod exited before becoming ready.');
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 500 });
      break;
    } catch (error) {
      await mongoose.disconnect();
      if (attempt === 59) throw error;
    }
  }
  await connectDatabase();
}, { timeout: 60000 });

after(async () => {
  await mongoose.disconnect();
  if (mongo && mongo.exitCode === null && mongo.pid) {
    const exited = once(mongo, 'exit');
    mongo.kill();
    await exited;
  }
  if (temporaryRoot) {
    const relative = path.relative(path.resolve(tmpdir()), path.resolve(temporaryRoot));
    assert(!relative.startsWith('..') && !path.isAbsolute(relative) && relative.startsWith('online-classroom-test-'));
    await rm(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

test('Backend lifecycle, authorization and private uploads', async t => {
  let admin, teacher, teacher2, student, student2, outsider;
  let course, category, material, assignment, submission, enrollment;

  async function login(email) {
    const response = await request(app).post(`${api}/auth/login`).send({ email, password }).expect(200);
    assert.equal(json(response).user.passwordHash, undefined);
    return json(response).accessToken;
  }

  await t.test('health, malformed JSON and missing routes have safe responses', async () => {
    await request(app).get('/health').expect(200);
    await request(app).get('/uploads/anything.pdf').expect(404);
    const invalid = await request(app).post(`${api}/auth/login`).set('Content-Type', 'application/json').send('{bad').expect(400);
    assert.equal(invalid.body.code, 'INVALID_JSON');
    await request(app).get(`${api}/does-not-exist`).expect(404);
  });

  await t.test('registration prevents role injection and duplicate email', async () => {
    await request(app).post(`${api}/auth/register`).send({ fullName: 'Attacker', email: 'attacker@example.com', password, role: 'admin' }).expect(400);
    for (const email of ['student@example.com', 'student2@example.com', 'outsider@example.com']) {
      const response = await request(app).post(`${api}/auth/register`).send({ fullName: 'Student', email, password }).expect(201);
      assert.equal(json(response).role, 'student');
      assert.equal(json(response).passwordHash, undefined);
    }
    await request(app).post(`${api}/auth/register`).send({ fullName: 'Duplicate', email: 'STUDENT@example.com', password }).expect(409);
    student = await login('student@example.com');
    student2 = await login('student2@example.com');
    outsider = await login('outsider@example.com');
  });

  await t.test('admin creates teachers; JWT and profile cannot elevate privileges', async () => {
    const seedOptions = { windowsHide: true, env: { ...process.env, ADMIN_NAME: 'Admin', ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: password } };
    await execFileAsync(process.execPath, ['scripts/seedAdmin.js'], seedOptions);
    const originalAdmin = await models.User.findOne({ email: 'admin@example.com' }).select('+passwordHash');
    await assert.rejects(execFileAsync(process.execPath, ['scripts/seedAdmin.js'], seedOptions));
    const unchangedAdmin = await models.User.findById(originalAdmin._id).select('+passwordHash');
    assert.equal(unchangedAdmin.passwordHash, originalAdmin.passwordHash);
    admin = await login('admin@example.com');
    for (const email of ['teacher@example.com', 'teacher2@example.com']) {
      await request(app).post(`${api}/users`).set(auth(admin)).send({ fullName: 'Teacher', email, password, role: 'teacher' }).expect(201);
    }
    teacher = await login('teacher@example.com');
    teacher2 = await login('teacher2@example.com');
    await request(app).get(`${api}/auth/me`).expect(401);
    await request(app).get(`${api}/auth/me`).set(auth('invalid.token')).expect(401);
    await request(app).patch(`${api}/auth/me`).set(auth(student)).send({ fullName: 'Hacked', role: 'admin' }).expect(400);
    await request(app).get(`${api}/users`).set(auth(student)).expect(403);
    await request(app).post(`${api}/users`).set(auth(admin)).send({ fullName: 'Admin 2', email: 'admin2@example.com', password, role: 'admin' }).expect(400);
    const updated = await request(app).patch(`${api}/auth/me`).set(auth(student)).send({ fullName: 'Student Updated' }).expect(200);
    assert.equal(json(updated).fullName, 'Student Updated');
    const jwt = (await import('jsonwebtoken')).default;
    const expired = jwt.sign({}, process.env.JWT_SECRET, { subject: json(updated)._id, expiresIn: -1, issuer: 'online-classroom', audience: 'online-classroom-client' });
    await request(app).get(`${api}/auth/me`).set(auth(expired)).expect(401);
  });

  await t.test('locking revokes existing token and unlocking restores access', async () => {
    const user = await models.User.findOne({ email: 'outsider@example.com' });
    await request(app).patch(`${api}/users/${user.id}/status`).set(auth(admin)).send({ isActive: false }).expect(200);
    await request(app).get(`${api}/auth/me`).set(auth(outsider)).expect(403);
    await request(app).post(`${api}/auth/login`).send({ email: user.email, password }).expect(403);
    await request(app).patch(`${api}/users/${user.id}/status`).set(auth(admin)).send({ isActive: true }).expect(200);
    await request(app).get(`${api}/auth/me`).set(auth(outsider)).expect(200);
    const administrator = await models.User.findOne({ role: 'admin' });
    await request(app).patch(`${api}/users/${administrator.id}/status`).set(auth(admin)).send({ isActive: false }).expect(409);
  });

  await t.test('category management, inactive visibility and partial updates', async () => {
    await request(app).post(`${api}/categories`).set(auth(teacher)).send({ name: 'Web', slug: 'web' }).expect(403);
    category = json(await request(app).post(`${api}/categories`).set(auth(admin)).send({ name: 'Web', slug: 'web' }).expect(201));
    await request(app).patch(`${api}/categories/${category._id}`).set(auth(admin)).send({ isActive: false }).expect(200);
    const edited = json(await request(app).patch(`${api}/categories/${category._id}`).set(auth(admin)).send({ description: 'Web development' }).expect(200));
    assert.equal(edited.isActive, false);
    await request(app).get(`${api}/categories/${category._id}`).expect(404);
    await request(app).get(`${api}/categories?includeInactive=true`).expect(403);
    const all = await request(app).get(`${api}/categories?includeInactive=true`).set(auth(admin)).expect(200);
    assert.equal(json(all).length, 1);
    await request(app).post(`${api}/courses`).set(auth(teacher)).send({ title: 'React', description: 'Course', category: category._id }).expect(400);
    await request(app).patch(`${api}/categories/${category._id}`).set(auth(admin)).send({ isActive: true }).expect(200);
  });

  await t.test('course ownership, publication and safe query parsing', async () => {
    course = json(await request(app).post(`${api}/courses`).set(auth(teacher)).send({ title: 'React', description: 'React course', category: category._id }).expect(201));
    assert.equal(course.status, 'draft');
    await request(app).get(`${api}/courses/${course._id}`).expect(403);
    await request(app).patch(`${api}/courses/${course._id}`).set(auth(teacher2)).send({ title: 'Stolen' }).expect(403);
    await request(app).patch(`${api}/courses/${course._id}`).set(auth(admin)).send({ title: 'Admin mutation' }).expect(403);
    await request(app).get(`${api}/courses/not-an-id`).expect(400);
    await request(app).get(`${api}/courses?limit=101`).expect(400);
    await request(app).get(`${api}/courses?category[$ne]=x`).expect(400);
    await request(app).patch(`${api}/courses/${course._id}/status`).set(auth(teacher)).send({ status: 'published' }).expect(200);
    await request(app).get(`${api}/courses/${course._id}`).expect(200);
    const result = await request(app).get(`${api}/courses?search=React&page=1&limit=10`).expect(200);
    assert.equal(result.body.pagination.total, 1);
    const mine = await request(app).get(`${api}/courses/mine`).set(auth(teacher)).expect(200);
    assert.equal(json(mine).length, 1);
  });

  await t.test('materials stay private and invalid files leave no stored upload', async () => {
    material = json(await request(app).post(`${api}/courses/${course._id}/materials`).set(auth(teacher))
      .field('title', 'React PDF').field('type', 'pdf').field('position', '4')
      .attach('file', pdf, { filename: 'lesson.pdf', contentType: 'application/pdf' }).expect(201));
    assert.equal(material.file.storageKey, undefined);
    await request(app).get(`${api}/courses/${course._id}/materials/${material._id}/download`).expect(401);
    await request(app).get(`${api}/courses/${course._id}/materials`).set(auth(student)).expect(403);
    await request(app).post(`${api}/courses/${course._id}/materials`).set(auth(teacher))
      .field('title', 'Fake').field('type', 'pdf').attach('file', Buffer.from('not pdf'), { filename: 'fake.pdf', contentType: 'application/pdf' }).expect(415);
    await request(app).post(`${api}/courses/${course._id}/materials`).set(auth(teacher))
      .field('title', 'Executable').field('type', 'pdf').attach('file', Buffer.from('bad'), { filename: 'bad.exe', contentType: 'application/octet-stream' }).expect(415);
    assert.equal((await readdir(process.env.UPLOAD_DIR)).length, 1);
  });

  await t.test('enrollment uniqueness, private downloads and cross-course IDs', async () => {
    enrollment = json(await request(app).post(`${api}/courses/${course._id}/enrollments`).set(auth(student)).expect(201));
    await request(app).post(`${api}/courses/${course._id}/enrollments`).set(auth(student)).expect(409);
    await request(app).post(`${api}/courses/${course._id}/enrollments`).set(auth(student2)).expect(201);
    await request(app).get(`${api}/courses/${course._id}/materials`).set(auth(student)).expect(200);
    await request(app).get(`${api}/courses/${course._id}/materials/${material._id}/download`).set(auth(student)).expect(200);
    await request(app).get(`${api}/courses/${course._id}/enrollments`).set(auth(teacher2)).expect(403);
    await request(app).get(`${api}/courses/${course._id}/enrollments`).set(auth(teacher)).expect(200);
    await request(app).patch(`${api}/courses/${course._id}/status`).set(auth(teacher)).send({ status: 'draft' }).expect(409);
    const otherCourse = json(await request(app).post(`${api}/courses`).set(auth(teacher)).send({ title: 'Other', description: 'Other course', category: category._id }).expect(201));
    await request(app).get(`${api}/courses/${otherCourse._id}/materials/${material._id}`).set(auth(teacher)).expect(404);
    await request(app).delete(`${api}/courses/${otherCourse._id}`).set(auth(teacher)).expect(204);
  });

  await t.test('replacing PDF hides storage metadata and cleans the old file', async () => {
    const before = await models.Material.findById(material._id).select('+file.storageKey');
    const oldPath = path.join(process.env.UPLOAD_DIR, before.file.storageKey);
    const response = await request(app).patch(`${api}/courses/${course._id}/materials/${material._id}`).set(auth(teacher))
      .attach('file', pdf, { filename: 'updated.pdf', contentType: 'application/pdf' }).expect(200);
    assert.equal(json(response).file.storageKey, undefined);
    assert.equal(json(response).position, 4);
    await assert.rejects(access(oldPath));
    await request(app).patch(`${api}/courses/${course._id}/materials/${material._id}`).set(auth(teacher)).send({}).expect(400);
  });

  await t.test('draft assignments are hidden; updates preserve published state and score scale', async () => {
    assignment = json(await request(app).post(`${api}/courses/${course._id}/assignments`).set(auth(teacher)).send({
      title: 'Todo App', description: 'Build an app', maxScore: 20, submissionType: 'both', dueAt: new Date(Date.now() + 86400000).toISOString(),
    }).expect(201));
    await request(app).get(`${api}/courses/${course._id}/assignments/${assignment._id}`).set(auth(student)).expect(404);
    const hidden = await request(app).get(`${api}/courses/${course._id}/assignments`).set(auth(student)).expect(200);
    assert.equal(json(hidden).length, 0);
    await request(app).patch(`${api}/courses/${course._id}/assignments/${assignment._id}`).set(auth(teacher2)).send({ status: 'published' }).expect(403);
    await request(app).patch(`${api}/courses/${course._id}/assignments/${assignment._id}`).set(auth(teacher)).send({ status: 'published' }).expect(200);
    const edited = json(await request(app).patch(`${api}/courses/${course._id}/assignments/${assignment._id}`).set(auth(teacher)).send({ title: 'Updated Todo App' }).expect(200));
    assert.equal(edited.status, 'published');
    assert.equal(edited.maxScore, 20);
  });

  await t.test('submission requires enrollment, content and an open deadline', async () => {
    const url = `${api}/assignments/${assignment._id}/submissions`;
    await request(app).post(url).set(auth(outsider)).send({ textAnswer: 'Unauthorized' }).expect(403);
    await request(app).post(url).set(auth(student)).send({}).expect(400);
    await request(app).post(url).set(auth(student)).send({ textAnswer: 'Answer', score: 20 }).expect(400);
    await request(app).patch(`${api}/courses/${course._id}/assignments/${assignment._id}`).set(auth(teacher)).send({ dueAt: new Date(Date.now() - 1000).toISOString() }).expect(200);
    await request(app).post(url).set(auth(student)).send({ textAnswer: 'Late answer' }).expect(409);
    await request(app).patch(`${api}/courses/${course._id}/assignments/${assignment._id}`).set(auth(teacher)).send({ dueAt: null }).expect(200);
    submission = json(await request(app).post(url).set(auth(student)).field('textAnswer', 'My answer')
      .attach('attachments', Buffer.from('UTF-8 answer'), { filename: 'answer.txt', contentType: 'text/plain' }).expect(201));
    assert.equal(submission.attachments[0].storageKey, undefined);
    await request(app).post(url).set(auth(student)).send({ textAnswer: 'Duplicate' }).expect(409);
  });

  await t.test('students cannot view others; only owning teacher can grade', async () => {
    await request(app).get(`${api}/submissions/${submission._id}`).set(auth(student2)).expect(403);
    await request(app).get(`${api}/submissions/${submission._id}`).set(auth(teacher2)).expect(403);
    await request(app).get(`${api}/assignments/${assignment._id}/submissions`).set(auth(student)).expect(403);
    const attachment = `${api}/submissions/${submission._id}/attachments/${submission.attachments[0]._id}/download`;
    await request(app).get(attachment).set(auth(student2)).expect(403);
    await request(app).get(attachment).set(auth(teacher)).expect(200);
    await request(app).patch(`${api}/submissions/${submission._id}/grade`).set(auth(student)).send({ score: 20 }).expect(403);
    await request(app).patch(`${api}/submissions/${submission._id}/grade`).set(auth(teacher2)).send({ score: 20 }).expect(403);
    await request(app).patch(`${api}/submissions/${submission._id}/grade`).set(auth(teacher)).send({ score: 21 }).expect(400);
    await request(app).get(`${api}/assignments/${assignment._id}/submissions`).set(auth(teacher)).expect(200);
  });

  await t.test('replacing an ungraded answer deletes old attachments', async () => {
    const stored = await models.Submission.findById(submission._id).select('+attachments.storageKey');
    const oldPath = path.join(process.env.UPLOAD_DIR, stored.attachments[0].storageKey);
    const replaced = json(await request(app).put(`${api}/assignments/${assignment._id}/submissions/me`).set(auth(student)).send({ textAnswer: 'Final answer' }).expect(200));
    assert.equal(replaced._id, submission._id);
    assert.equal(replaced.attachments.length, 0);
    await assert.rejects(access(oldPath));
  });

  await t.test('grades lock student edits and protect assignment history', async () => {
    const graded = json(await request(app).patch(`${api}/submissions/${submission._id}/grade`).set(auth(teacher)).send({ score: 18, feedback: 'Good work' }).expect(200));
    assert.equal(graded.status, 'graded');
    assert.equal(graded.score, 18);
    const mine = json(await request(app).get(`${api}/assignments/${assignment._id}/submissions/me`).set(auth(student)).expect(200));
    assert.equal(mine.feedback, 'Good work');
    await request(app).put(`${api}/assignments/${assignment._id}/submissions/me`).set(auth(student)).send({ textAnswer: 'Changed after grade' }).expect(409);
    await request(app).patch(`${api}/courses/${course._id}/assignments/${assignment._id}`).set(auth(teacher)).send({ maxScore: 10 }).expect(409);
    await request(app).patch(`${api}/courses/${course._id}/assignments/${assignment._id}`).set(auth(teacher)).send({ status: 'draft' }).expect(409);
    await request(app).delete(`${api}/courses/${course._id}/assignments/${assignment._id}`).set(auth(teacher)).expect(409);
    await request(app).delete(`${api}/categories/${category._id}`).set(auth(admin)).expect(409);
    await request(app).delete(`${api}/courses/${course._id}`).set(auth(teacher)).expect(409);
  });

  await t.test('cancel, reenroll and completion retain history with correct access', async () => {
    await request(app).patch(`${api}/courses/${course._id}/enrollments/me/cancel`).set(auth(student)).expect(200);
    await request(app).get(`${api}/courses/${course._id}/materials`).set(auth(student)).expect(403);
    await request(app).get(`${api}/submissions/${submission._id}`).set(auth(student)).expect(200);
    const reenrolled = json(await request(app).post(`${api}/courses/${course._id}/enrollments`).set(auth(student)).expect(200));
    assert.equal(reenrolled._id, enrollment._id);
    assert.equal(await models.Enrollment.countDocuments({ student: enrollment.student, course: course._id }), 1);
    await request(app).patch(`${api}/courses/${course._id}/enrollments/${enrollment._id}/complete`).set(auth(teacher2)).expect(403);
    await request(app).patch(`${api}/courses/${course._id}/enrollments/${enrollment._id}/complete`).set(auth(teacher)).expect(200);
    await request(app).get(`${api}/courses/${course._id}/materials`).set(auth(student)).expect(200);
    await request(app).put(`${api}/assignments/${assignment._id}/submissions/me`).set(auth(student)).send({ textAnswer: 'Completed student' }).expect(403);
  });

  await t.test('archived courses allow existing content access but refuse new work', async () => {
    await request(app).patch(`${api}/courses/${course._id}/status`).set(auth(teacher)).send({ status: 'archived' }).expect(200);
    await request(app).post(`${api}/courses/${course._id}/enrollments`).set(auth(outsider)).expect(409);
    await request(app).post(`${api}/assignments/${assignment._id}/submissions`).set(auth(student2)).send({ textAnswer: 'Archived' }).expect(409);
    await request(app).get(`${api}/courses/${course._id}/materials/${material._id}/download`).set(auth(student)).expect(200);
    const publicList = await request(app).get(`${api}/courses`).expect(200);
    assert.equal(json(publicList).length, 0);
  });

  await t.test('deleting an unused draft cleans dependent documents and files', async () => {
    const draft = json(await request(app).post(`${api}/courses`).set(auth(teacher)).send({ title: 'Draft to delete', description: 'Disposable', category: category._id }).expect(201));
    const doc = json(await request(app).post(`${api}/courses/${draft._id}/materials`).set(auth(teacher)).field('title', 'Temporary PDF').field('type', 'pdf')
      .attach('file', pdf, { filename: 'temporary.pdf', contentType: 'application/pdf' }).expect(201));
    const stored = await models.Material.findById(doc._id).select('+file.storageKey');
    const filePath = path.join(process.env.UPLOAD_DIR, stored.file.storageKey);
    await request(app).post(`${api}/courses/${draft._id}/assignments`).set(auth(teacher)).send({ title: 'Unused', description: 'Unused', submissionType: 'text' }).expect(201);
    await request(app).delete(`${api}/courses/${draft._id}`).set(auth(teacher)).expect(204);
    assert.equal(await models.Material.countDocuments({ course: draft._id }), 0);
    assert.equal(await models.Assignment.countDocuments({ course: draft._id }), 0);
    await assert.rejects(access(filePath));
  });

  await t.test('concurrent duplicate enrollments create one record', async () => {
    const draft = json(await request(app).post(`${api}/courses`).set(auth(teacher)).send({ title: 'Concurrent enroll', description: 'Concurrency test', category: category._id }).expect(201));
    await request(app).patch(`${api}/courses/${draft._id}/status`).set(auth(teacher)).send({ status: 'published' }).expect(200);
    const responses = await Promise.all([1, 2].map(() => request(app).post(`${api}/courses/${draft._id}/enrollments`).set(auth(outsider))));
    assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
    assert.equal(await models.Enrollment.countDocuments({ course: draft._id }), 1);
  });
});
