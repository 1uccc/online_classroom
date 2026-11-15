// Optional local QA fixture. Always uses a new temporary MongoDB process/database.
// It never reads or writes the application's normal database.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';

const root = await mkdtemp(path.join(tmpdir(), 'classroom-preview-'));
const listener = net.createServer();
await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
const mongoPort = listener.address().port;
await new Promise(resolve => listener.close(resolve));
await mkdir(path.join(root, 'db'));
const mongo = spawn(process.env.MONGOD_BINARY || 'mongod', ['--dbpath', path.join(root, 'db'), '--port', String(mongoPort), '--bind_ip', '127.0.0.1', '--noauth', '--quiet', '--logpath', path.join(root, 'mongo.log')], { windowsHide: true, stdio: 'ignore' });
let spawnError;
mongo.on('error', error => { spawnError = error; });
let server;
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo.pid && mongo.exitCode === null) { const exited = once(mongo, 'exit'); mongo.kill(); await exited; }
  const relative = path.relative(path.resolve(tmpdir()), path.resolve(root));
  if (!relative.startsWith('..') && !path.isAbsolute(relative) && relative.startsWith('classroom-preview-')) await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
process.once('SIGINT', () => stop().catch(() => { process.exitCode = 1; }));
process.once('SIGTERM', () => stop().catch(() => { process.exitCode = 1; }));
try {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = `mongodb://127.0.0.1:${mongoPort}/classroom_preview`;
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  process.env.CLIENT_ORIGIN = 'http://127.0.0.1:5173';
  process.env.UPLOAD_DIR = path.join(root, 'uploads');
  const { app } = await import('../src/app.js');
  for (let attempt = 0; attempt < 50; attempt++) {
    if (spawnError) throw spawnError;
    if (mongo.exitCode !== null) throw new Error('Preview MongoDB exited early');
    try { await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 500 }); break; }
    catch (error) { await mongoose.disconnect(); if (attempt === 49) throw error; }
  }
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  const { User, Category, Course, Material, Assignment, Enrollment } = mongoose.models;
  const { hashPassword } = await import('../src/models/User.js');
  const passwordHash = await hashPassword('ClassroomPreview123!');
  const [teacher, student] = await User.create([
    { fullName: 'Nguyễn Minh Anh', email: 'teacher@qa.classroom.test', role: 'teacher', passwordHash },
    { fullName: 'Trần Hoàng Nam', email: 'student@qa.classroom.test', role: 'student', passwordHash },
    { fullName: 'Quản trị Classroom', email: 'admin@qa.classroom.test', role: 'admin', passwordHash },
  ]);
  const categories = await Category.create([{ name: 'Lập trình Web', slug: 'lap-trinh-web' }, { name: 'Thiết kế giao diện', slug: 'thiet-ke-giao-dien' }, { name: 'Khoa học máy tính', slug: 'khoa-hoc-may-tinh' }]);
  const titles = ['Lập trình React từ nền tảng', 'Xây dựng API với Node.js', 'Thiết kế giao diện với Figma', 'JavaScript: tư duy và thực hành', 'Cơ sở dữ liệu MongoDB', 'HTML & CSS cho người bắt đầu'];
  const descriptions = ['Khám phá component, Hooks và cách xây dựng những giao diện tương tác bằng React.', 'Từ những route đầu tiên đến một REST API có xác thực và phân quyền.', 'Hiểu bố cục, màu sắc và tạo ra trải nghiệm giao diện dễ sử dụng.', 'Rèn luyện tư duy lập trình qua những bài tập JavaScript gần gũi.', 'Làm quen document, truy vấn dữ liệu và thiết kế database cho ứng dụng.', 'Xây dựng nền tảng Web và tạo những trang giao diện responsive đầu tiên.'];
  const courses = await Course.create(titles.map((title, index) => ({ title, description: descriptions[index], teacher: teacher._id, category: categories[index === 2 ? 1 : index === 4 ? 2 : 0]._id, status: 'published' })));
  await Material.create([{ course: courses[0]._id, title: 'Bắt đầu cùng React', type: 'text', content: 'Chào mừng bạn đến với lớp React!\n\nTrong bài học này, chúng ta cùng tìm hiểu component, props và useState.\n\nHãy đọc yêu cầu bài tập và xây dựng một ứng dụng Todo nhỏ để luyện tập.', position: 1 }]);
  await Assignment.create({ course: courses[0]._id, title: 'Xây dựng giao diện Todo App', description: 'Tạo một ứng dụng React cho phép thêm và xóa công việc.\n\nYêu cầu:\n• Sử dụng Functional Components và useState.\n• Kiểm tra nội dung trống trước khi thêm.\n• Nộp mô tả cách thực hiện hoặc file bài làm.', maxScore: 10, submissionType: 'both', status: 'published' });
  await Enrollment.create({ student: student._id, course: courses[3]._id });
  server = app.listen(5501, '127.0.0.1', () => console.log('Isolated Classroom QA API ready at http://127.0.0.1:5501'));
  server.once('error', async () => { console.error('QA port unavailable.'); await stop(); process.exitCode = 1; });
} catch (error) {
  console.error(`Cannot start isolated QA fixture: ${error.code || error.name}`);
  await stop(); process.exitCode = 1;
}
