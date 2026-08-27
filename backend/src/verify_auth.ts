import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'car_hr_skill_matrix_jwt_secret_dev_key_2026';

console.log('===============================================================');
console.log('🔐 CAR HR SKILL MATRIX — AUTHENTICATION & RBAC TEST SUITE');
console.log('===============================================================');

async function runAuthTests() {
  let passedCount = 0;
  const totalCount = 8;

  // 1. Verify Admin User Auth
  console.log('\n[1/8] 👑 Testing Admin Account (EMP-1001)...');
  const adminEmp = await prisma.employee.findUnique({ where: { empCode: 'EMP-1001' } });
  if (!adminEmp || !adminEmp.passwordHash) {
    throw new Error('Admin employee EMP-1001 not found or passwordHash missing in DB');
  }
  const isAdminPwMatch = await bcrypt.compare('admin1234', adminEmp.passwordHash);
  if (!isAdminPwMatch) throw new Error('Admin password admin1234 failed to verify');
  if (adminEmp.role !== 'ADMIN') throw new Error(`Expected role ADMIN, got ${adminEmp.role}`);
  console.log(`  ✅ [PASS] Admin EMP-1001 verified (${adminEmp.name}, Role: ${adminEmp.role})`);
  passedCount++;

  // 2. Verify HR User Auth
  console.log('\n[2/8] 💼 Testing HR Account (EMP-1002)...');
  const hrEmp = await prisma.employee.findUnique({ where: { empCode: 'EMP-1002' } });
  if (!hrEmp || !hrEmp.passwordHash) {
    throw new Error('HR employee EMP-1002 not found or passwordHash missing');
  }
  const isHrPwMatch = await bcrypt.compare('hr1234', hrEmp.passwordHash);
  if (!isHrPwMatch) throw new Error('HR password hr1234 failed to verify');
  if (hrEmp.role !== 'HR') throw new Error(`Expected role HR, got ${hrEmp.role}`);
  console.log(`  ✅ [PASS] HR EMP-1002 verified (${hrEmp.name}, Role: ${hrEmp.role})`);
  passedCount++;

  // 3. Verify Supervisor User Auth
  console.log('\n[3/8] 👔 Testing Supervisor Account (EMP-1004)...');
  const superEmp = await prisma.employee.findUnique({ where: { empCode: 'EMP-1004' } });
  if (!superEmp || !superEmp.passwordHash) {
    throw new Error('Supervisor employee EMP-1004 not found or passwordHash missing');
  }
  const isSuperPwMatch = await bcrypt.compare('super1234', superEmp.passwordHash);
  if (!isSuperPwMatch) throw new Error('Supervisor password super1234 failed to verify');
  if (superEmp.role !== 'SUPERVISOR') throw new Error(`Expected role SUPERVISOR, got ${superEmp.role}`);
  console.log(`  ✅ [PASS] Supervisor EMP-1004 verified (${superEmp.name}, Role: ${superEmp.role})`);
  passedCount++;

  // 4. Verify Employee User Auth
  console.log('\n[4/8] 👷 Testing Employee Account (EMP-1003)...');
  const emp = await prisma.employee.findUnique({ where: { empCode: 'EMP-1003' } });
  if (!emp || !emp.passwordHash) {
    throw new Error('Employee EMP-1003 not found or passwordHash missing');
  }
  const isEmpPwMatch = await bcrypt.compare('emp1234', emp.passwordHash);
  if (!isEmpPwMatch) throw new Error('Employee password emp1234 failed to verify');
  if (emp.role !== 'EMPLOYEE') throw new Error(`Expected role EMPLOYEE, got ${emp.role}`);
  console.log(`  ✅ [PASS] Employee EMP-1003 verified (${emp.name}, Role: ${emp.role})`);
  passedCount++;

  // 5. Test Password Failure (Wrong password rejection)
  console.log('\n[5/8] 🚫 Testing Wrong Password Rejection...');
  const isWrongMatch = await bcrypt.compare('wrong_password_999', adminEmp.passwordHash);
  if (isWrongMatch) throw new Error('Incorrect password was mistakenly accepted');
  console.log('  ✅ [PASS] Incorrect password correctly rejected');
  passedCount++;

  // 6. Test Non-existent user query
  console.log('\n[6/8] 🔍 Testing Non-existent Account Query...');
  const nonExistent = await prisma.employee.findUnique({ where: { empCode: 'EMP-9999' } });
  if (nonExistent !== null) throw new Error('Non-existent user returned data');
  console.log('  ✅ [PASS] Non-existent account EMP-9999 returns null (404)');
  passedCount++;

  // 7. Test JWT Token Generation and Decoding
  console.log('\n[7/8] 🎟️ Testing JWT Token Creation & Verification...');
  const token = jwt.sign(
    { id: adminEmp.id, empCode: adminEmp.empCode, name: adminEmp.name, role: adminEmp.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  if (decoded.empCode !== adminEmp.empCode || decoded.role !== 'ADMIN') {
    throw new Error('Decoded JWT payload does not match expected user details');
  }
  console.log(`  ✅ [PASS] JWT token signed and verified successfully (Payload: empCode=${decoded.empCode}, role=${decoded.role})`);
  passedCount++;

  // 8. Test Invalid JWT Token Rejection
  console.log('\n[8/8] 🛡️ Testing Tampered / Invalid JWT Rejection...');
  let rejected = false;
  try {
    jwt.verify(token + '_tampered', JWT_SECRET);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error('Tampered JWT was mistakenly accepted');
  console.log('  ✅ [PASS] Tampered JWT token correctly rejected');
  passedCount++;

  console.log('\n===============================================================');
  console.log(`📊 FINAL RESULT: ${passedCount}/${totalCount} TESTS PASSED (100%)`);
  console.log('🎉 REAL AUTHENTICATION & ALL ROLE ACCOUNTS FULLY OPERATIONAL!');
  console.log('===============================================================');
}

runAuthTests()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Test failed with error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
