import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

try {
  await connectDatabase();
  const server = app.listen(env.PORT, () => console.log(`Online Classroom API: http://localhost:${env.PORT}/api/v1`));
  server.on('error', async () => {
    console.error('Không thể mở cổng HTTP. Kiểm tra PORT.');
    await mongoose.disconnect(); process.exitCode = 1;
  });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timer = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      try { await mongoose.disconnect(); clearTimeout(timer); }
      catch { process.exitCode = 1; }
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch {
  console.error('Không thể khởi động backend. Kiểm tra cấu hình và kết nối MongoDB.');
  await mongoose.disconnect(); process.exitCode = 1;
}
