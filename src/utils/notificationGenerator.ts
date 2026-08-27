import type { Employee, Certificate, NotificationItem } from '../types';
import type { NavTab } from '../components/Sidebar';

export interface DynamicNotificationItem extends NotificationItem {
  targetTab?: NavTab;
}

export function generateLiveNotifications(
  employees: Employee[],
  certificates: Certificate[],
  readIds: Set<string> = new Set()
): DynamicNotificationItem[] {
  const items: DynamicNotificationItem[] = [];
  const today = new Date();

  // 1. Expiring / Expired Certificates
  certificates.forEach((cert) => {
    if (!cert.expiryDate) return;
    const expDate = new Date(cert.expiryDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      const isExpired = diffDays < 0;
      const notifId = `cert-${cert.id}-${cert.expiryDate}`;
      items.push({
        id: notifId,
        title: isExpired
          ? `⚠️ ใบรับรองหมดอายุแล้ว: ${cert.certName}`
          : `⏳ ใบรับรองใกล้หมดอายุ (${diffDays} วัน): ${cert.certName}`,
        message: `${cert.employeeName} (${cert.empCode}) • ${cert.department} • สิ้นอายุ ${cert.expiryDate}`,
        type: 'CERT_EXPIRING',
        date: cert.expiryDate,
        read: readIds.has(notifId),
        targetTab: 'certificates',
      });
    }
  });

  // 2. Probation Employees (Status = PROBATION)
  employees
    .filter((e) => e.status === 'PROBATION')
    .forEach((emp) => {
      const start = new Date(emp.startingDate);
      const passedDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const notifId = `probation-${emp.id}-${emp.startingDate}`;

      let stage = 'ระยะทดลองงาน';
      if (passedDays >= 100) stage = 'ใกล้ครบ 119 วัน (ประเมินครั้งสุดท้าย)';
      else if (passedDays >= 80) stage = 'ใกล้ครบ 90 วัน (ประเมินรอบ 2)';
      else if (passedDays >= 50) stage = 'ใกล้ครบ 60 วัน (ประเมินรอบ 1)';

      items.push({
        id: notifId,
        title: `📋 ครบกำหนดติดตามผลทดลองงาน: ${emp.name}`,
        message: `${emp.empCode} • ${emp.department} (${emp.position}) • ทำงานมาแล้ว ${passedDays} วัน (${stage})`,
        type: 'PROBATION_DUE',
        date: emp.startingDate,
        read: readIds.has(notifId),
        targetTab: 'probation_history',
      });
    });

  // 3. New Employees without Orientation Pass
  employees
    .filter((e) => !e.orientationPassed)
    .forEach((emp) => {
      const notifId = `orientation-${emp.id}`;
      items.push({
        id: notifId,
        title: `🎓 พนักงานใหม่รอการปฐมนิเทศ (F-HR-002)`,
        message: `${emp.name} (${emp.empCode}) • ${emp.department} • ยังไม่ผ่านการอบรม/สอบปฐมนิเทศ`,
        type: 'SKILL_EVAL_DUE',
        date: emp.startingDate || 'ล่าสุด',
        read: readIds.has(notifId),
        targetTab: 'training',
      });
    });

  // Sort unread first, then by date descending
  return items.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.date.localeCompare(a.date);
  });
}
