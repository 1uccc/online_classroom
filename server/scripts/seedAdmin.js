import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { User, hashPassword } from '../src/models/User.js';
import { register } from '../src/validators/schemas.js';

try {
  const data = register.parse({ fullName: process.env.ADMIN_NAME || 'Administrator', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  await connectDatabase();
  if (await User.exists({ email: data.email })) {
    console.log('Email đã tồn tại. Script không thay đổi role hoặc mật khẩu tài khoản hiện có.');
    process.exitCode = 1;
  } else {
    await User.create({ fullName: data.fullName, email: data.email, passwordHash: await hashPassword(data.password), role: 'admin' });
    console.log('Đã tạo tài khoản Admin.');
  }
} catch (error) {
  console.error(error.name === 'ZodError' ? 'ADMIN_NAME, ADMIN_EMAIL hoặc ADMIN_PASSWORD không hợp lệ (mật khẩu tối thiểu 12 ký tự).' : 'Không thể tạo Admin. Kiểm tra cấu hình và MongoDB.');
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
