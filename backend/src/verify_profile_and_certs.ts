import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'car_hr_skill_matrix_jwt_secret_dev_key_2026';

console.log('--- Starting Profile, Change Password & Certificate Verification Tests ---');

// Test 1: Password Hash & Verification logic
const password = 'mySecretPassword123';
const hash = await bcrypt.hash(password, 10);
assert.equal(await bcrypt.compare('mySecretPassword123', hash), true, 'Valid password should match hash');
assert.equal(await bcrypt.compare('wrongPassword', hash), false, 'Invalid password should not match hash');
console.log('✅ Test 1: Bcrypt password hashing and verification passed');

// Test 2: JWT token creation and decoding
const testUser = { id: 1, empCode: 'EMP-1001', name: 'สมหญิง', role: 'ADMIN' };
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });
const decoded = jwt.verify(token, JWT_SECRET) as any;
assert.equal(decoded.empCode, 'EMP-1001');
assert.equal(decoded.role, 'ADMIN');
console.log('✅ Test 2: JWT signing and verification passed');

// Test 3: Certificate status computation validation
function computeStatus(expiryDate: string, now = new Date('2026-08-20')): string {
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 30) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

assert.equal(computeStatus('2025-12-31'), 'EXPIRED', 'Past date is EXPIRED');
assert.equal(computeStatus('2026-09-10'), 'EXPIRING_SOON', 'Within 30 days is EXPIRING_SOON');
assert.equal(computeStatus('2027-01-01'), 'ACTIVE', 'Far future is ACTIVE');
console.log('✅ Test 3: Certificate status computation passed');

console.log('🎉 ALL Profile & Certificate unit tests passed successfully!');
