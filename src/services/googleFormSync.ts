import type { GoogleFormExamResult, PreTestLockMap, ExamType, ExamPhase } from '../types';
import * as XLSX from 'xlsx';

export const DEFAULT_SAFETY_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeJe2ML2M96vJsjwzkbnOxlP9Fgb38-QHRH6WXgTclIw4ANUg/viewform';

export const DEFAULT_ORIENTATION_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSePpjkzTp7Fm6oE1Ri636x2BBHeNlGB8pNffDJ1Pg66lWkKaQ/viewform';

export const DEFAULT_GOOGLE_FORM_URL = DEFAULT_SAFETY_FORM_URL;

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwqDsxFfzHd4LUqaG4X2WFooOaSvoVk7AqznAaWjmo5dwwcefWI2JsNVkdXCFp6fj3J/exec';

export const INITIAL_DEMO_EXAM_RESULTS: Record<string, GoogleFormExamResult[]> = {
  'EMP-1001': [
    {
      id: 'demo-1001-sa-pre',
      attemptNumber: 1,
      submittedAt: '2026-08-01 08:30:00',
      empCode: 'EMP-1001',
      employeeName: 'นางสาว สมหญิง ใจดี',
      department: 'HR&GA IT',
      score: 11,
      totalQuestions: 14,
      percentage: 79,
      isPassed: false,
      source: 'ONLINE_WEB',
      examType: 'SAFETY_ATTITUDE',
      phase: 'PRE_TEST',
      answersDetail: [],
    },
    {
      id: 'demo-1001-sa-post',
      attemptNumber: 1,
      submittedAt: '2026-08-01 11:30:00',
      empCode: 'EMP-1001',
      employeeName: 'นางสาว สมหญิง ใจดี',
      department: 'HR&GA IT',
      score: 14,
      totalQuestions: 14,
      percentage: 100,
      isPassed: true,
      source: 'ONLINE_WEB',
      examType: 'SAFETY_ATTITUDE',
      phase: 'POST_TEST',
      answersDetail: [],
    },
    {
      id: 'demo-1001-ori-pre',
      attemptNumber: 1,
      submittedAt: '2026-08-01 09:00:00',
      empCode: 'EMP-1001',
      employeeName: 'นางสาว สมหญิง ใจดี',
      department: 'HR&GA IT',
      score: 21,
      totalQuestions: 30,
      percentage: 70,
      isPassed: false,
      source: 'GOOGLE_FORMS',
      examType: 'ORIENTATION',
      phase: 'PRE_TEST',
      answersDetail: [],
    },
    {
      id: 'gexp-1001-1',
      attemptNumber: 1,
      submittedAt: '2026-08-01 09:30:00',
      empCode: 'EMP-1001',
      employeeName: 'นางสาว สมหญิง ใจดี',
      department: 'HR&GA IT',
      score: 28,
      totalQuestions: 30,
      percentage: 93,
      isPassed: true, // >= 24
      source: 'GOOGLE_FORMS',
      examType: 'ORIENTATION',
      phase: 'POST_TEST',
      answersDetail: [
        { questionNo: 1, questionText: 'อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE) ใดที่เป็นข้อบังคับพื้นฐานที่สุดในพื้นที่ผลิตยาง CAR?', userAnswer: 'หมวกนิรภัยและรองเท้าเซฟตี้', correctAnswer: 'หมวกนิรภัยและรองเท้าเซฟตี้', isCorrect: true },
        { questionNo: 2, questionText: 'เมื่อเกิดเหตุเพลิงไหม้ในพื้นที่ปฏิบัติงาน ขั้นตอนแรกสุดที่ต้องปฏิบัติตามแผนฉุกเฉินคืออะไร?', userAnswer: 'กดสัญญาณแจ้งเตือนเพลิงไหม้และโทรแจ้ง จป. ทันที', correctAnswer: 'กดสัญญาณแจ้งเตือนเพลิงไหม้และโทรแจ้ง จป. ทันที', isCorrect: true },
        { questionNo: 3, questionText: 'การซ่อมบำรุง หรือปรับแต่งเครื่องจักรขณะทำงาน ต้องปฏิบัติตามมาตรการความปลอดภัยใดอย่างเคร่งครัด?', userAnswer: 'ทำ Lockout / Tagout (LOTO) ตัดพลังงานก่อนทุกครั้ง', correctAnswer: 'ทำ Lockout / Tagout (LOTO) ตัดพลังงานก่อนทุกครั้ง', isCorrect: true },
        { questionNo: 4, questionText: 'การจัดการขยะอันตราย (เช่น ผ้าปนเปื้อนน้ำมัน สารเคมี) ต้องนำไปทิ้งในภาชนะสีใด?', userAnswer: 'ถังขยะสีส้ม/ดำ (ขยะอันตราย)', correctAnswer: 'ถังขยะสีส้ม/ดำ (ขยะอันตราย)', isCorrect: true },
        { questionNo: 5, questionText: 'หลักการ 5ส. ข้อใดหมายถึงการทำให้พื้นที่ทำงานสะอาด เป็นระเบียบเรียบร้อยเป็นมาตรฐานอยู่เสมอ?', userAnswer: 'สุขลักษณะ', correctAnswer: 'สุขลักษณะ', isCorrect: true },
        { questionNo: 6, questionText: 'การประเมินความเสี่ยงและหยั่งรู้อันตรายก่อนเริ่มงานในพื้นที่เรียกว่าอะไร?', userAnswer: 'KYT / CCCF Assessment', correctAnswer: 'KYT / CCCF Assessment', isCorrect: true },
        { questionNo: 7, questionText: 'จุดรวมพลฉุกเฉิน (Evacuation Assembly Point) หลักของโรงงาน CAR ตั้งอยู่ที่ใด?', userAnswer: 'ลานจอดรถหน้าอาคาร M-1', correctAnswer: 'ลานจอดรถหน้าอาคาร M-1', isCorrect: true },
        { questionNo: 8, questionText: 'เอกสารข้อมูลความปลอดภัยสารเคมีที่ต้องมีติดไว้ในพื้นที่ใช้สารเคมีคือเอกสารใด?', userAnswer: 'MSDS / SDS', correctAnswer: 'MSDS / SDS', isCorrect: true },
        { questionNo: 9, questionText: 'เมื่อเกิดอุบัติเหตุจากการทำงาน (แม้เจ็บเล็กน้อย) ต้องแจ้งผู้บังคับบัญชาภายในเวลากี่นาที?', userAnswer: 'ทันที (ภายใน 15 นาที)', correctAnswer: 'ทันที (ภายใน 15 นาที)', isCorrect: true },
        { questionNo: 10, questionText: 'น้ำหนักสูงสุดตามกฎหมายที่กำหนดให้พนักงานชายยกของหนักคนเดียวไม่เกินเท่าใด?', userAnswer: 'ไม่เกิน 55 กิโลกรัม', correctAnswer: 'ไม่เกิน 55 กิโลกรัม', isCorrect: true },
        { questionNo: 11, questionText: 'มาตรฐานระบบบริหารงานคุณภาพสำหรับอุตสาหกรรมยานยนต์ที่บริษัท CAR ได้รับการรับรองคือข้อใด?', userAnswer: 'IATF 16949 & ISO 9001', correctAnswer: 'IATF 16949 & ISO 9001', isCorrect: true },
        { questionNo: 12, questionText: 'การควบคุมผลิตภัณฑ์ที่ไม่เป็นไปตามข้อกำหนด (Non-conforming Product) ต้องติดป้ายระบุสถานะสีใด?', userAnswer: 'ป้ายสีแดง (REJECT / HOLD)', correctAnswer: 'ป้ายสีแดง (REJECT / HOLD)', isCorrect: true },
        { questionNo: 13, questionText: 'เอกสารที่ใช้ควบคุมขั้นตอนการปฏิบัติงานในสายการผลิตอย่างละเอียดคือเอกสารใด?', userAnswer: 'Work Instruction (WI) / ใบมาตรฐานการทำงาน', correctAnswer: 'Work Instruction (WI) / ใบมาตรฐานการทำงาน', isCorrect: true },
        { questionNo: 14, questionText: 'กฎเหล็กคุณภาพในการส่งมอบชิ้นงานไปยังกระบวนการถัดไปคือข้อใด?', userAnswer: 'ไม่รับของเสีย ไม่สร้างของเสีย ไม่ส่งมอบของเสีย', correctAnswer: 'ไม่รับของเสีย ไม่สร้างของเสีย ไม่ส่งมอบของเสีย', isCorrect: true },
        { questionNo: 15, questionText: 'การควบคุมการเปลี่ยนปัจจัย 4M1E ในกระบวนการผลิต (เช่น เปลี่ยนคน เปลี่ยนเครื่องจักร) ต้องใช้แบบฟอร์มใด?', userAnswer: 'F-HR-016 Form B (4M Change Request)', correctAnswer: 'F-HR-016 Form B (4M Change Request)', isCorrect: true },
        { questionNo: 16, questionText: 'บริเวณสำหรับจัดเก็บชิ้นงานที่รอการตรวจสอบหรือชิ้นงานเสีย เรียกว่าอะไร?', userAnswer: 'Red Tag Box / Holding Area', correctAnswer: 'Red Tag Box / Holding Area', isCorrect: true },
        { questionNo: 17, questionText: 'ค่าความแข็งชิ้นส่วนยางชิ้นงานทดสอบ วัดด้วยเครื่อง Durometer Shore A มีเกณฑ์มาตรฐานโดยทั่วไปคือเท่าใด?', userAnswer: '± 5 Shore A', correctAnswer: '± 5 Shore A', isCorrect: true },
        { questionNo: 18, questionText: 'การลงบันทึกรายงานการผลิตและยอดของเสีย (Daily Production Report) ต้องบันทึกเมื่อใด?', userAnswer: 'บันทึกทุกๆ 1 ชั่วโมง / หลังจบชิฟท์การทำงาน', correctAnswer: 'บันทึกทุกๆ 1 ชั่วโมง / หลังจบชิฟท์การทำงาน', isCorrect: true },
        { questionNo: 19, questionText: 'นโยบายคุณภาพของบริษัท CAR เน้นย้ำเรื่องใดเป็นสำคัญสูงสุด?', userAnswer: 'คุณภาพเป็นหนึ่ง ส่งมอบตรงเวลา ปลอดภัยสูงสุด', correctAnswer: 'คุณภาพเป็นหนึ่ง ส่งมอบตรงเวลา ปลอดภัยสูงสุด', isCorrect: true },
        { questionNo: 20, questionText: 'ข้อใดไม่ใช่สาเหตุการเกิดของเสียตามหลัก 4M1E?', userAnswer: 'Moon (ดวงจันทร์)', correctAnswer: 'Moon (ดวงจันทร์)', isCorrect: true },
        { questionNo: 21, questionText: 'ระยะเวลาการทดลองงานของพนักงานใหม่ตามกฎระเบียบบริษัท CAR กำหนดไว้ไม่เกินกี่วัน?', userAnswer: 'ไม่เกิน 119 วัน', correctAnswer: 'ไม่เกิน 119 วัน', isCorrect: true },
        { questionNo: 22, questionText: 'แบบฟอร์มประเมินสมรรถนะทักษะการทำงานพนักงานรายบุคคล (Skill Matrix) ของ HR คือแบบฟอร์มใด?', userAnswer: 'F-HR-014 (Skill Matrix Record)', correctAnswer: 'F-HR-014 (Skill Matrix Record)', isCorrect: true },
        { questionNo: 23, questionText: 'ระดับทักษะความสามารถใน Skill Matrix (F-HR-014) ระดับ 100% (สัญลักษณ์วงกลมเต็มวง) หมายถึงอะไร?', userAnswer: 'ทำได้เองตามมาตรฐานและสามารถสอนงานผู้อื่นได้', correctAnswer: 'ทำได้เองตามมาตรฐานและสามารถสอนงานผู้อื่นได้', isCorrect: true },
        { questionNo: 24, questionText: 'การลาป่วยตั้งแต่กี่วันทำงานขึ้นไป ต้องมีใบรับรองแพทย์จากสถานพยาบาลชั้น 1 ประกอบการลา?', userAnswer: '3 วันทำงานขึ้นไป', correctAnswer: '3 วันทำงานขึ้นไป', isCorrect: true },
        { questionNo: 25, questionText: 'การลากิจได้รับค่าจ้างตามกฎหมาย ต้องยื่นใบลาล่วงหน้าอย่างน้อยกี่วัน?', userAnswer: 'ยื่นล่วงหน้าอย่างน้อย 3 วันทำงาน', correctAnswer: 'ยื่นล่วงหน้าอย่างน้อย 3 วันทำงาน', isCorrect: true },
        { questionNo: 26, questionText: 'การแต่งกายในการเข้าปฏิบัติงานในโรงงาน ข้อใดถูกต้องตามระเบียบบริษัท?', userAnswer: 'สวมชุดยูนิฟอร์มบริษัท ติดบัตรพนักงาน และใส่ PPE ตามพื้นที่กำหนด', correctAnswer: 'สวมชุดยูนิฟอร์มบริษัท ติดบัตรพนักงาน และใส่ PPE ตามพื้นที่กำหนด', isCorrect: true },
        { questionNo: 27, questionText: 'ช่องทางสำหรับการเสนอข้อคิดเห็นปรับปรุงงาน (Kaizen / Suggestion Box) สามารถยื่นผ่านช่องทางใด?', userAnswer: 'ตู้รับข้อเสนอแนะ HR หรือระบบ HR Online', correctAnswer: 'ตู้รับข้อเสนอแนะ HR หรือระบบ HR Online', isCorrect: true },
        { questionNo: 28, questionText: 'การทำข้อสอบปฐมนิเทศพนักงานใหม่ สามารถทำผ่านช่องทางใดและเข้าจากที่ใดได้บ้าง?', userAnswer: 'ทำผ่าน Google Forms ได้จากสมาร์ทโฟน/อินเทอร์เน็ตบ้านภายนอกบริษัท', correctAnswer: 'ทำผ่าน Google Forms ได้จากสมาร์ทโฟน/อินเทอร์เน็ตบ้านภายนอกบริษัท', isCorrect: true },
        { questionNo: 29, questionText: 'หากพนักงานทำข้อสอบปฐมนิเทศไม่ผ่านเกณฑ์ 24 ข้อ (จาก 30 ข้อ) ต้องปฏิบัติตามขั้นตอนใด?', userAnswer: 'ติดต่อ HR เพื่อทบทวนข้อสอบที่ตอบผิด แล้วเข้าทำแบบทดสอบใหม่จนกว่าจะผ่านเกณฑ์', correctAnswer: 'ติดต่อ HR เพื่อทบทวนข้อสอบที่ตอบผิด แล้วเข้าทำแบบทดสอบใหม่จนกว่าจะผ่านเกณฑ์', isCorrect: true },
        { questionNo: 30, questionText: 'สัญลักษณ์โลโก้ทางการของบริษัท Complete Auto Rubber Manufacturing (CAR) มีลักษณะสีอย่างไร?', userAnswer: 'ตัวอักษร CAR สีฟ้าบนพื้นหลังสีขาวทรงสี่เหลี่ยมขอบมนเรียบหรู', correctAnswer: 'ตัวอักษร CAR สีฟ้าบนพื้นหลังสีขาวทรงสี่เหลี่ยมขอบมนเรียบหรู', isCorrect: true },
      ],
    },
  ],
  'EMP-1002': [
    {
      id: 'demo-1002-sa-pre',
      attemptNumber: 1,
      submittedAt: '2026-08-04 08:30:00',
      empCode: 'EMP-1002',
      employeeName: 'นางสาว วรรณา สุขเจริญ',
      department: 'HR&GA',
      score: 9,
      totalQuestions: 14,
      percentage: 64,
      isPassed: false,
      source: 'ONLINE_WEB',
      examType: 'SAFETY_ATTITUDE',
      phase: 'PRE_TEST',
      answersDetail: [],
    },
    {
      id: 'demo-1002-sa-post',
      attemptNumber: 1,
      submittedAt: '2026-08-04 11:30:00',
      empCode: 'EMP-1002',
      employeeName: 'นางสาว วรรณา สุขเจริญ',
      department: 'HR&GA',
      score: 13,
      totalQuestions: 14,
      percentage: 93,
      isPassed: true,
      source: 'ONLINE_WEB',
      examType: 'SAFETY_ATTITUDE',
      phase: 'POST_TEST',
      answersDetail: [],
    },
    {
      id: 'gexp-1002-1',
      attemptNumber: 1,
      submittedAt: '2026-08-04 09:15:00',
      empCode: 'EMP-1002',
      employeeName: 'นางสาว วรรณา สุขเจริญ',
      department: 'HR&GA IT',
      score: 13,
      totalQuestions: 30,
      percentage: 43,
      isPassed: false, // 13 < 24 -> FAILED!
      source: 'GOOGLE_FORMS',
      examType: 'ORIENTATION',
      phase: 'PRE_TEST',
      answersDetail: [
        { questionNo: 1, questionText: '1. อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE) ใดที่เป็นข้อบังคับพื้นฐานที่สุดในพื้นที่ผลิตยาง CAR?', userAnswer: 'หมวกนิรภัยและรองเท้าเซฟตี้', correctAnswer: 'หมวกนิรภัยและรองเท้าเซฟตี้', isCorrect: true },
        { questionNo: 2, questionText: '2. เมื่อเกิดเหตุเพลิงไหม้ในพื้นที่ปฏิบัติงาน ขั้นตอนแรกสุดที่ต้องปฏิบัติตามแผนฉุกเฉินคืออะไร?', userAnswer: 'กดสัญญาณแจ้งเตือนเพลิงไหม้และโทรแจ้ง จป. ทันที', correctAnswer: 'กดสัญญาณแจ้งเตือนเพลิงไหม้และโทรแจ้ง จป. ทันที', isCorrect: true },
        { questionNo: 3, questionText: '3. การซ่อมบำรุง หรือปรับแต่งเครื่องจักรขณะทำงาน ต้องปฏิบัติตามมาตรการความปลอดภัยใดอย่างเคร่งครัด?', userAnswer: 'เปิดเครื่องทิ้งไว้เพื่อทดสอบ', correctAnswer: 'ทำ Lockout / Tagout (LOTO) ตัดพลังงานก่อนทุกครั้ง', isCorrect: false },
        { questionNo: 4, questionText: '4. การจัดการขยะอันตราย (เช่น ผ้าปนเปื้อนน้ำมัน สารเคมี) ต้องนำไปทิ้งในภาชนะสีใด?', userAnswer: 'ถังขยะสีเขียว (ขยะเปียก)', correctAnswer: 'ถังขยะสีส้ม/ดำ (ขยะอันตราย)', isCorrect: false },
        { questionNo: 5, questionText: '5. หลักการ 5ส. ข้อใดหมายถึงการทำให้พื้นที่ทำงานสะอาด เป็นระเบียบเรียบร้อยเป็นมาตรฐานอยู่เสมอ?', userAnswer: 'สะสาง', correctAnswer: 'สุขลักษณะ', isCorrect: false },
        { questionNo: 6, questionText: '6. การประเมินความเสี่ยงและหยั่งรู้อันตรายก่อนเริ่มงานในพื้นที่เรียกว่าอะไร?', userAnswer: 'KYT / CCCF Assessment', correctAnswer: 'KYT / CCCF Assessment', isCorrect: true },
        { questionNo: 7, questionText: '7. จุดรวมพลฉุกเฉิน (Evacuation Assembly Point) หลักของโรงงาน CAR ตั้งอยู่ที่ใด?', userAnswer: 'ป้อมยามหน้าประตู 3', correctAnswer: 'ลานจอดรถหน้าอาคาร M-1', isCorrect: false },
        { questionNo: 8, questionText: '8. เอกสารข้อมูลความปลอดภัยสารเคมีที่ต้องมีติดไว้ในพื้นที่ใช้สารเคมีคือเอกสารใด?', userAnswer: 'Work Instruction (WI)', correctAnswer: 'MSDS / SDS', isCorrect: false },
        { questionNo: 9, questionText: '9. เมื่อเกิดอุบัติเหตุจากการทำงาน (แม้เจ็บเล็กน้อย) ต้องแจ้งผู้บังคับบัญชาภายในเวลากี่นาที?', userAnswer: 'ทันที (ภายใน 15 นาที)', correctAnswer: 'ทันที (ภายใน 15 นาที)', isCorrect: true },
        { questionNo: 10, questionText: '10. น้ำหนักสูงสุดตามกฎหมายที่กำหนดให้พนักงานชายยกของหนักคนเดียวไม่เกินเท่าใด?', userAnswer: 'ไม่เกิน 55 กิโลกรัม', correctAnswer: 'ไม่เกิน 55 กิโลกรัม', isCorrect: true },
        { questionNo: 11, questionText: '11. มาตรฐานระบบบริหารงานคุณภาพสำหรับอุตสาหกรรมยานยนต์ที่บริษัท CAR ได้รับการรับรองคือข้อใด?', userAnswer: 'IATF 16949 & ISO 9001', correctAnswer: 'IATF 16949 & ISO 9001', isCorrect: true },
        { questionNo: 12, questionText: '12. การควบคุมผลิตภัณฑ์ที่ไม่เป็นไปตามข้อกำหนด (Non-conforming Product) ต้องติดป้ายระบุสถานะสีใด?', userAnswer: 'ป้ายสีแดง (REJECT / HOLD)', correctAnswer: 'ป้ายสีแดง (REJECT / HOLD)', isCorrect: true },
        { questionNo: 13, questionText: '13. เอกสารที่ใช้ควบคุมขั้นตอนการปฏิบัติงานในสายการผลิตอย่างละเอียดคือเอกสารใด?', userAnswer: 'Pay Slip', correctAnswer: 'Work Instruction (WI) / ใบมาตรฐานการทำงาน', isCorrect: false },
        { questionNo: 14, questionText: '14. กฎเหล็กคุณภาพในการส่งมอบชิ้นงานไปยังกระบวนการถัดไปคือข้อใด?', userAnswer: 'ไม่รับของเสีย ไม่สร้างของเสีย ไม่ส่งมอบของเสีย', correctAnswer: 'ไม่รับของเสีย ไม่สร้างของเสีย ไม่ส่งมอบของเสีย', isCorrect: true },
        { questionNo: 15, questionText: '15. การควบคุมการเปลี่ยนปัจจัย 4M1E ในกระบวนการผลิต (เช่น เปลี่ยนคน เปลี่ยนเครื่องจักร) ต้องใช้แบบฟอร์มใด?', userAnswer: 'F-HR-016 Form B (4M Change Request)', correctAnswer: 'F-HR-016 Form B (4M Change Request)', isCorrect: true },
        { questionNo: 16, questionText: '16. บริเวณสำหรับจัดเก็บชิ้นงานที่รอการตรวจสอบหรือชิ้นงานเสีย เรียกว่าอะไร?', userAnswer: 'VIP Lounge', correctAnswer: 'Red Tag Box / Holding Area', isCorrect: false },
        { questionNo: 17, questionText: '17. ค่าความแข็งชิ้นส่วนยางชิ้นงานทดสอบ วัดด้วยเครื่อง Durometer Shore A มีเกณฑ์มาตรฐานโดยทั่วไปคือเท่าใด?', userAnswer: '± 20 Shore A', correctAnswer: '± 5 Shore A', isCorrect: false },
        { questionNo: 18, questionText: '18. การลงบันทึกรายงานการผลิตและยอดของเสีย (Daily Production Report) ต้องบันทึกเมื่อใด?', userAnswer: 'บันทึกเมื่อจำได้', correctAnswer: 'บันทึกทุกๆ 1 ชั่วโมง / หลังจบชิฟท์การทำงาน', isCorrect: false },
        { questionNo: 19, questionText: '19. นโยบายคุณภาพของบริษัท CAR เน้นย้ำเรื่องใดเป็นสำคัญสูงสุด?', userAnswer: 'ผลิตตามใจพนักงาน', correctAnswer: 'คุณภาพเป็นหนึ่ง ส่งมอบตรงเวลา ปลอดภัยสูงสุด', isCorrect: false },
        { questionNo: 20, questionText: '20. ข้อใดไม่ใช่สาเหตุการเกิดของเสียตามหลัก 4M1E?', userAnswer: 'Man (คน)', correctAnswer: 'Moon (ดวงจันทร์)', isCorrect: false },
        { questionNo: 21, questionText: '21. ระยะเวลาการทดลองงานของพนักงานใหม่ตามกฎระเบียบบริษัท CAR กำหนดไว้ไม่เกินกี่วัน?', userAnswer: 'ไม่เกิน 60 วัน', correctAnswer: 'ไม่เกิน 119 วัน', isCorrect: false },
        { questionNo: 22, questionText: '22. แบบฟอร์มประเมินสมรรถนะทักษะการทำงานพนักงานรายบุคคล (Skill Matrix) ของ HR คือแบบฟอร์มใด?', userAnswer: 'F-HR-014 (Skill Matrix Record)', correctAnswer: 'F-HR-014 (Skill Matrix Record)', isCorrect: true },
        { questionNo: 23, questionText: '23. ระดับทักษะความสามารถใน Skill Matrix (F-HR-014) ระดับ 100% (สัญลักษณ์วงกลมเต็มวง) หมายถึงอะไร?', userAnswer: 'ต้องมีคนคอยคุมตลอดเวลา', correctAnswer: 'ทำได้เองตามมาตรฐานและสามารถสอนงานผู้อื่นได้', isCorrect: false },
        { questionNo: 24, questionText: '24. การลาป่วยตั้งแต่กี่วันทำงานขึ้นไป ต้องมีใบรับรองแพทย์จากสถานพยาบาลชั้น 1 ประกอบการลา?', userAnswer: '1 วันทำงาน', correctAnswer: '3 วันทำงานขึ้นไป', isCorrect: false },
        { questionNo: 25, questionText: '25. การลากิจได้รับค่าจ้างตามกฎหมาย ต้องยื่นใบลาล่วงหน้าอย่างน้อยกี่วัน?', userAnswer: 'ยื่นล่วงหน้าอย่างน้อย 3 วันทำงาน', correctAnswer: 'ยื่นล่วงหน้าอย่างน้อย 3 วันทำงาน', isCorrect: true },
        { questionNo: 26, questionText: '26. การแต่งกายในการเข้าปฏิบัติงานในโรงงาน ข้อใดถูกต้องตามระเบียบบริษัท?', userAnswer: 'สวมชุดยูนิฟอร์มบริษัท ติดบัตรพนักงาน และใส่ PPE ตามพื้นที่กำหนด', correctAnswer: 'สวมชุดยูนิฟอร์มบริษัท ติดบัตรพนักงาน และใส่ PPE ตามพื้นที่กำหนด', isCorrect: true },
        { questionNo: 27, questionText: '27. ช่องทางสำหรับการเสนอข้อคิดเห็นปรับปรุงงาน (Kaizen / Suggestion Box) สามารถยื่นผ่านช่องทางใด?', userAnswer: 'เขียนใส่กระดาษทิ้งบนพื้น', correctAnswer: 'ตู้รับข้อเสนอแนะ HR หรือระบบ HR Online', isCorrect: false },
        { questionNo: 28, questionText: '28. การทำข้อสอบปฐมนิเทศพนักงานใหม่ สามารถทำผ่านช่องทางใดและเข้าจากที่ใดได้บ้าง?', userAnswer: 'ต้องทำบนคอมพิวเตอร์ HR เท่านั้น', correctAnswer: 'ทำผ่าน Google Forms ได้จากสมาร์ทโฟน/อินเทอร์เน็ตบ้านภายนอกบริษัท', isCorrect: false },
        { questionNo: 29, questionText: '29. หากพนักงานทำข้อสอบปฐมนิเทศไม่ผ่านเกณฑ์ 24 ข้อ (จาก 30 ข้อ) ต้องปฏิบัติตามขั้นตอนใด?', userAnswer: 'ติดต่อ HR เพื่อทบทวนข้อสอบที่ตอบผิด แล้วเข้าทำแบบทดสอบใหม่จนกว่าจะผ่านเกณฑ์', correctAnswer: 'ติดต่อ HR เพื่อทบทวนข้อสอบที่ตอบผิด แล้วเข้าทำแบบทดสอบใหม่จนกว่าจะผ่านเกณฑ์', isCorrect: true },
        { questionNo: 30, questionText: '30. สัญลักษณ์โลโก้ทางการของบริษัท Complete Auto Rubber Manufacturing (CAR) มีลักษณะสีอย่างไร?', userAnswer: 'รูปวงกลมสีดำล้วน', correctAnswer: 'ตัวอักษร CAR สีฟ้าบนพื้นหลังสีขาวทรงสี่เหลี่ยมขอบมนเรียบหรู', isCorrect: false },
      ],
    },
  ],
  'EMP-1003': [
    {
      id: 'gexp-1003-1',
      attemptNumber: 1,
      submittedAt: '2026-08-02 10:15:00',
      empCode: 'EMP-1003',
      employeeName: 'นาย ประเสริฐ ยิ้มแย้ม',
      department: 'FMG-A',
      score: 18,
      totalQuestions: 30,
      percentage: 60,
      isPassed: false, // < 24 FAILED -> HR Alert!
      source: 'GOOGLE_FORMS',
      answersDetail: [
        { questionNo: 1, questionText: 'อุปกรณ์ PPE พื้นฐานในโรงงาน CAR คือข้อใด?', userAnswer: 'หมวกนิรภัยและรองเท้าเซฟตี้', correctAnswer: 'หมวกนิรภัยและรองเท้าเซฟตี้', isCorrect: true },
        { questionNo: 2, questionText: 'เมื่อเกิดเหตุเพลิงไหม้ในพื้นที่ผลิต ต้องทำอย่างไร?', userAnswer: 'วิ่งหนีออกจากโรงงานทันที', correctAnswer: 'กดสัญญาณแจ้งเตือนและโทรแจ้ง จป.', isCorrect: false },
        { questionNo: 3, questionText: 'มาตรฐานระบบคุณภาพอุตสาหกรรมยานยนต์คือข้อใด?', userAnswer: 'ISO 14001', correctAnswer: 'IATF 16949 & ISO 9001', isCorrect: false },
        { questionNo: 4, questionText: 'การซ่อมบำรุงเครื่องจักรต้องทำ LOTO หรือไม่?', userAnswer: 'ไม่ต้องทำถ้าซ่อมแป๊บเดียว', correctAnswer: 'ต้องทำทุกครั้งก่อนเริ่มงานซ่อม', isCorrect: false },
        { questionNo: 5, questionText: 'ชิ้นงานเสียต้องติดป้ายสีใด?', userAnswer: 'ป้ายสีแดง (REJECT)', correctAnswer: 'ป้ายสีแดง (REJECT)', isCorrect: true },
        { questionNo: 6, questionText: 'ระยะเวลาทดลองงานพนักงานใหม่กำหนดไว้เท่าใด?', userAnswer: 'ไม่เกิน 119 วัน', correctAnswer: 'ไม่เกิน 119 วัน', isCorrect: true },
        { questionNo: 7, questionText: 'การจัดการขยะอันตรายต้องทิ้งถังสีใด?', userAnswer: 'ถังสีส้ม/ดำ (ขยะอันตราย)', correctAnswer: 'ถังสีส้ม/ดำ (ขยะอันตราย)', isCorrect: true },
        { questionNo: 8, questionText: 'จุดรวมพลฉุกเฉินของโรงงานอยู่ที่ใด?', userAnswer: 'ห้องอาหารพนักงาน', correctAnswer: 'ลานจอดรถหน้าอาคาร M-1', isCorrect: false },
        { questionNo: 9, questionText: 'เอกสาร F-HR-016 Form A ใช้สำหรับงานใด?', userAnswer: 'การประเมิน OJT พนักงานใหม่', correctAnswer: 'การประเมิน OJT พนักงานใหม่', isCorrect: true },
        { questionNo: 10, questionText: 'การตรวจเช็กเครื่องจักรประจำวันเป็นหน้าที่ใคร?', userAnswer: 'ช่างซ่อมบำรุงเท่านั้น', correctAnswer: 'พนักงานผู้ปฏิบัติงานประจำเครื่อง', isCorrect: false },
        { questionNo: 11, questionText: 'การฉีดอัดยางต้องควบคุมอุณหภูมิตามเอกสารใด?', userAnswer: 'Work Instruction (WI)', correctAnswer: 'Work Instruction (WI)', isCorrect: true },
        { questionNo: 12, questionText: 'สารเคมีต้องมีเอกสารชนิดใดกำกับ?', userAnswer: 'MSDS / SDS', correctAnswer: 'MSDS / SDS', isCorrect: true },
        { questionNo: 13, questionText: 'เมื่อเกิดอุบัติเหตุต้องแจ้งหัวหน้างานภายในเวลากี่นาที?', userAnswer: 'หลังจบชิฟท์ทำงาน', correctAnswer: 'ทันที (ภายใน 15 นาที)', isCorrect: false },
        { questionNo: 14, questionText: 'การประเมินอันตราย KYT ต้องทำเมื่อใด?', userAnswer: 'ก่อนเริ่มงานทุกครั้ง', correctAnswer: 'ก่อนเริ่มงานทุกครั้ง', isCorrect: true },
        { questionNo: 15, questionText: 'การลาป่วย 3 วันต้องใช้เอกสารอะไร?', userAnswer: 'ใบรับรองแพทย์', correctAnswer: 'ใบรับรองแพทย์', isCorrect: true },
        { questionNo: 16, questionText: 'การยกของหนักชายไม่เกินกี่ กก.?', userAnswer: 'ไม่เกิน 55 กิโลกรัม', correctAnswer: 'ไม่เกิน 55 กิโลกรัม', isCorrect: true },
        { questionNo: 17, questionText: 'เกณฑ์คะแนนสอบผ่านปฐมนิเทศคือข้อใด?', userAnswer: 'ต้องถูกอย่างน้อย 24 จาก 30 ข้อ (80%)', correctAnswer: 'ต้องถูกอย่างน้อย 24 จาก 30 ข้อ (80%)', isCorrect: true },
        { questionNo: 18, questionText: 'ป้ายเตือนสีเหลืองดำหมายถึงอะไร?', userAnswer: 'ระวังอันตราย / พื้นที่เสี่ยง', correctAnswer: 'ระวังอันตราย / พื้นที่เสี่ยง', isCorrect: true },
        { questionNo: 19, questionText: 'การคัดแยกของเสียต้องวางในโซนใด?', userAnswer: 'Red Tag Box / Holding Area', correctAnswer: 'Red Tag Box / Holding Area', isCorrect: true },
        { questionNo: 20, questionText: 'การประเมินทดลองงานมีกี่ระยะ?', userAnswer: '30, 60, 90 วัน', correctAnswer: '30, 60, 90 วัน', isCorrect: true },
        { questionNo: 21, questionText: 'ข้อสอบปฐมนิเทศสามารถทำผ่านช่องทางใด?', userAnswer: 'Google Forms จากอินเทอร์เน็ตภายนอก', correctAnswer: 'Google Forms จากอินเทอร์เน็ตภายนอก', isCorrect: true },
        { questionNo: 22, questionText: 'หากสอบไม่ผ่านเกณฑ์ 24 ข้อ ต้องทำอย่างไร?', userAnswer: 'แจ้ง HR เพื่อดูข้อที่ผิดและทำสอบใหม่', correctAnswer: 'แจ้ง HR เพื่อดูข้อที่ผิดและทำสอบใหม่', isCorrect: true },
        { questionNo: 23, questionText: 'อุปกรณ์ดับเพลิงพ่นห่างกี่เมตร?', userAnswer: '10 เมตร', correctAnswer: 'ห่าง 2 - 3 เมตรเหนือลม', isCorrect: false },
        { questionNo: 24, questionText: 'การแต่งกายในพื้นที่ผลิตต้องทำอย่างไร?', userAnswer: 'ใส่อะไรก็ได้ตามสบาย', correctAnswer: 'สวมยูนิฟอร์ม ติดบัตรพนักงาน และใส่ PPE ครบถ้วน', isCorrect: false },
        { questionNo: 25, questionText: 'การซ่อมบำรุงเครื่องต้องกดปุ่มใด?', userAnswer: 'Emergency Stop', correctAnswer: 'Emergency Stop & LOTO', isCorrect: false },
        { questionNo: 26, questionText: 'การรายงานผลผลิตต้องทำเมื่อใด?', userAnswer: 'สัปดาห์ละครั้ง', correctAnswer: 'ทุกๆ 1 ชั่วโมง / หลังจบชิฟท์', isCorrect: false },
        { questionNo: 27, questionText: 'นโยบายคุณภาพ CAR เน้นอะไร?', userAnswer: 'กำไรสูงสุด', correctAnswer: 'คุณภาพเป็นหนึ่ง ส่งมอบตรงเวลา ปลอดภัยสูงสุด', isCorrect: false },
        { questionNo: 28, questionText: 'การลากิจต้องยื่นล่วงหน้ากี่วัน?', userAnswer: '1 วัน', correctAnswer: '3 วันขึ้นไป', isCorrect: false },
        { questionNo: 29, questionText: 'การล้างมือ 7 ขั้นตอนป้องกันอะไร?', userAnswer: 'เชื้อโรคและความสกปรก', correctAnswer: 'เชื้อโรคและความสกปรก', isCorrect: true },
        { questionNo: 30, questionText: 'เมื่อพบน้ำมันรั่วไหลบนพื้นต้องทำอย่างไร?', userAnswer: 'นำทราย/ขี้เลื่อยมาโรยซับน้ำมันทันที', correctAnswer: 'นำทราย/ขี้เลื่อยมาโรยซับน้ำมันทันที', isCorrect: true },
      ],
    },
    {
      id: 'gexp-1003-2',
      attemptNumber: 2,
      submittedAt: '2026-08-03 14:20:00',
      empCode: 'EMP-1003',
      employeeName: 'นาย ประเสริฐ ยิ้มแย้ม',
      department: 'FMG-A',
      score: 26,
      totalQuestions: 30,
      percentage: 87,
      isPassed: true, // >= 24 PASSED!
      source: 'GOOGLE_FORMS',
      answersDetail: [
        { questionNo: 1, questionText: 'อุปกรณ์ PPE พื้นฐานในโรงงาน CAR คือข้อใด?', userAnswer: 'หมวกนิรภัยและรองเท้าเซฟตี้', correctAnswer: 'หมวกนิรภัยและรองเท้าเซฟตี้', isCorrect: true },
        { questionNo: 2, questionText: 'เมื่อเกิดเหตุเพลิงไหม้ในพื้นที่ผลิต ต้องทำอย่างไร?', userAnswer: 'กดสัญญาณแจ้งเตือนและโทรแจ้ง จป.', correctAnswer: 'กดสัญญาณแจ้งเตือนและโทรแจ้ง จป.', isCorrect: true },
        { questionNo: 3, questionText: 'มาตรฐานระบบคุณภาพอุตสาหกรรมยานยนต์คือข้อใด?', userAnswer: 'IATF 16949 & ISO 9001', correctAnswer: 'IATF 16949 & ISO 9001', isCorrect: true },
        { questionNo: 4, questionText: 'การซ่อมบำรุงเครื่องจักรต้องทำ LOTO หรือไม่?', userAnswer: 'ต้องทำทุกครั้งก่อนเริ่มงานซ่อม', correctAnswer: 'ต้องทำทุกครั้งก่อนเริ่มงานซ่อม', isCorrect: true },
        { questionNo: 5, questionText: 'ชิ้นงานเสียต้องติดป้ายสีใด?', userAnswer: 'ป้ายสีแดง (REJECT)', correctAnswer: 'ป้ายสีแดง (REJECT)', isCorrect: true },
        { questionNo: 6, questionText: 'ระยะเวลาทดลองงานพนักงานใหม่กำหนดไว้เท่าใด?', userAnswer: 'ไม่เกิน 119 วัน', correctAnswer: 'ไม่เกิน 119 วัน', isCorrect: true },
        { questionNo: 7, questionText: 'การจัดการขยะอันตรายต้องทิ้งถังสีใด?', userAnswer: 'ถังสีส้ม/ดำ (ขยะอันตราย)', correctAnswer: 'ถังสีส้ม/ดำ (ขยะอันตราย)', isCorrect: true },
        { questionNo: 8, questionText: 'จุดรวมพลฉุกเฉินของโรงงานอยู่ที่ใด?', userAnswer: 'ลานจอดรถหน้าอาคาร M-1', correctAnswer: 'ลานจอดรถหน้าอาคาร M-1', isCorrect: true },
        { questionNo: 9, questionText: 'เอกสาร F-HR-016 Form A ใช้สำหรับงานใด?', userAnswer: 'การประเมิน OJT พนักงานใหม่', correctAnswer: 'การประเมิน OJT พนักงานใหม่', isCorrect: true },
        { questionNo: 10, questionText: 'การตรวจเช็กเครื่องจักรประจำวันเป็นหน้าที่ใคร?', userAnswer: 'พนักงานผู้ปฏิบัติงานประจำเครื่อง', correctAnswer: 'พนักงานผู้ปฏิบัติงานประจำเครื่อง', isCorrect: true },
        { questionNo: 11, questionText: 'การฉีดอัดยางต้องควบคุมอุณหภูมิตามเอกสารใด?', userAnswer: 'Work Instruction (WI)', correctAnswer: 'Work Instruction (WI)', isCorrect: true },
        { questionNo: 12, questionText: 'สารเคมีต้องมีเอกสารชนิดใดกำกับ?', userAnswer: 'MSDS / SDS', correctAnswer: 'MSDS / SDS', isCorrect: true },
        { questionNo: 13, questionText: 'เมื่อเกิดอุบัติเหตุต้องแจ้งหัวหน้างานภายในเวลากี่นาที?', userAnswer: 'ทันที (ภายใน 15 นาที)', correctAnswer: 'ทันที (ภายใน 15 นาที)', isCorrect: true },
        { questionNo: 14, questionText: 'การประเมินอันตราย KYT ต้องทำเมื่อใด?', userAnswer: 'ก่อนเริ่มงานทุกครั้ง', correctAnswer: 'ก่อนเริ่มงานทุกครั้ง', isCorrect: true },
        { questionNo: 15, questionText: 'การลาป่วย 3 วันต้องใช้เอกสารอะไร?', userAnswer: 'ใบรับรองแพทย์', correctAnswer: 'ใบรับรองแพทย์', isCorrect: true },
        { questionNo: 16, questionText: 'การยกของหนักชายไม่เกินกี่ กก.?', userAnswer: 'ไม่เกิน 55 กิโลกรัม', correctAnswer: 'ไม่เกิน 55 กิโลกรัม', isCorrect: true },
        { questionNo: 17, questionText: 'เกณฑ์คะแนนสอบผ่านปฐมนิเทศคือข้อใด?', userAnswer: 'ต้องถูกอย่างน้อย 24 จาก 30 ข้อ (80%)', correctAnswer: 'ต้องถูกอย่างน้อย 24 จาก 30 ข้อ (80%)', isCorrect: true },
        { questionNo: 18, questionText: 'ป้ายเตือนสีเหลืองดำหมายถึงอะไร?', userAnswer: 'ระวังอันตราย / พื้นที่เสี่ยง', correctAnswer: 'ระวังอันตราย / พื้นที่เสี่ยง', isCorrect: true },
        { questionNo: 19, questionText: 'การคัดแยกของเสียต้องวางในโซนใด?', userAnswer: 'Red Tag Box / Holding Area', correctAnswer: 'Red Tag Box / Holding Area', isCorrect: true },
        { questionNo: 20, questionText: 'การประเมินทดลองงานมีกี่ระยะ?', userAnswer: '30, 60, 90 วัน', correctAnswer: '30, 60, 90 วัน', isCorrect: true },
        { questionNo: 21, questionText: 'ข้อสอบปฐมนิเทศสามารถทำผ่านช่องทางใด?', userAnswer: 'Google Forms จากอินเทอร์เน็ตภายนอก', correctAnswer: 'Google Forms จากอินเทอร์เน็ตภายนอก', isCorrect: true },
        { questionNo: 22, questionText: 'หากสอบไม่ผ่านเกณฑ์ 24 ข้อ ต้องทำอย่างไร?', userAnswer: 'แจ้ง HR เพื่อดูข้อที่ผิดและทำสอบใหม่', correctAnswer: 'แจ้ง HR เพื่อดูข้อที่ผิดและทำสอบใหม่', isCorrect: true },
        { questionNo: 23, questionText: 'อุปกรณ์ดับเพลิงพ่นห่างกี่เมตร?', userAnswer: 'ห่าง 2 - 3 เมตรเหนือลม', correctAnswer: 'ห่าง 2 - 3 เมตรเหนือลม', isCorrect: true },
        { questionNo: 24, questionText: 'การแต่งกายในพื้นที่ผลิตต้องทำอย่างไร?', userAnswer: 'สวมยูนิฟอร์ม ติดบัตรพนักงาน และใส่ PPE ครบถ้วน', correctAnswer: 'สวมยูนิฟอร์ม ติดบัตรพนักงาน และใส่ PPE ครบถ้วน', isCorrect: true },
        { questionNo: 25, questionText: 'การซ่อมบำรุงเครื่องต้องกดปุ่มใด?', userAnswer: 'Emergency Stop', correctAnswer: 'Emergency Stop & LOTO', isCorrect: false },
        { questionNo: 26, questionText: 'การรายงานผลผลิตต้องทำเมื่อใด?', userAnswer: 'ทุกๆ 1 ชั่วโมง / หลังจบชิฟท์', correctAnswer: 'ทุกๆ 1 ชั่วโมง / หลังจบชิฟท์', isCorrect: true },
        { questionNo: 27, questionText: 'นโยบายคุณภาพ CAR เน้นอะไร?', userAnswer: 'กำไรสูงสุด', correctAnswer: 'คุณภาพเป็นหนึ่ง ส่งมอบตรงเวลา ปลดภัยสูงสุด', isCorrect: false },
        { questionNo: 28, questionText: 'การลากิจต้องยื่นล่วงหน้ากี่วัน?', userAnswer: '1 วัน', correctAnswer: '3 วันขึ้นไป', isCorrect: false },
        { questionNo: 29, questionText: 'การล้างมือ 7 ขั้นตอนป้องกันอะไร?', userAnswer: 'เชื้อโรคและความสกปรก', correctAnswer: 'เชื้อโรคและความสกปรก', isCorrect: true },
        { questionNo: 30, questionText: 'เมื่อพบน้ำมันรั่วไหลบนพื้นต้องทำอย่างไร?', userAnswer: 'นำทราย/ขี้เลื่อยมาโรยซับน้ำมันทันที', correctAnswer: 'นำทราย/ขี้เลื่อยมาโรยซับน้ำมันทันที', isCorrect: true },
      ],
    },
  ],
};

export const SAFETY_ATTITUDE_QUESTIONS_BANK = [
  { questionNo: 1, questionText: '1. คุณเพิ่งเข้าทำงานวันแรก หัวหน้าสั่งให้ทำงานกับเครื่องจักรใหม่ที่ไม่คุ้นเคย คุณจะทำอย่างไร?', correctAnswer: 'เรียกหัวหน้างานกลับมา และบอกเขาว่าคุณยังไม่ทราบวิธีการทำงานกับเครื่องจักรนี้' },
  { questionNo: 2, questionText: '2. เห็นเพื่อนเอาหนังสติ๊กเล็งใส่ใบหูของพนักงานที่กำลังคุมเครื่องจักร คุณจะทำอย่างไร?', correctAnswer: 'รีบเดินเข้าไปหาคนเล็งหนังสติ๊ก แล้วพยายามบอกให้เขาหยุดการล้อเล่นนั้นทันที' },
  { questionNo: 3, questionText: '3. ขนของด่วนเหลือ 10 นาทีจะเที่ยง ต้องใช้เวลาอีกครึ่งชั่วโมงจึงจะเสร็จ คุณจะทำอย่างไร?', correctAnswer: 'หยุดขนของตอนเที่ยงตรง ไปรับประทานอาหารแล้วกลับมาทำงานใหม่ ยอมเสี่ยงที่จะถูกดุ' },
  { questionNo: 4, questionText: '4. ต้องยกลังไม้หนักเทอะทะคนเดียว โดยมีผู้จัดการโรงงานยืนอยู่ข้างๆ คุณจะทำอย่างไร?', correctAnswer: 'ถามผู้จัดการโรงงานว่า เขาพอจะช่วยคุณยกลังไม้นั้นได้ไหม' },
  { questionNo: 5, questionText: '5. รถยกทำน้ำมันหล่อลื่นหกลงบนทางเดินสัญจร คุณจะทำอย่างไร?', correctAnswer: 'ส่งข่าวให้คนทำความสะอาดทราบ แล้วยืนใกล้ๆ บริเวณนั้นเพื่อคอยบอกคนอื่นให้ระวังตัว' },
  { questionNo: 6, questionText: '6. ทำงานด่วนจนสถานที่รกรุงรัง นายจ้างเดินมาตะโกนสั่งให้รีบทำความสะอาด คุณจะทำอย่างไร?', correctAnswer: 'หยุดทำงานทั้งหมด แล้วรีบทำความสะอาดสถานที่ทันที' },
  { questionNo: 7, questionText: '7. มีคนมาท้าพนันให้คุณยกเหล็กเทอะทะในเวลาพักรับประทานอาหาร คุณจะทำอย่างไร?', correctAnswer: 'บอกผู้มาท้าพนันว่า คุณจะรับคำท้าก็ต่อเมื่อใช้อุปกรณ์ยกน้ำหนักจริงๆ (บาเบล)' },
  { questionNo: 8, questionText: '8. ปีนบันไดซ่อมไฟแล้วรู้สึกมึนศีรษะเจ็บหน้าอก แม้ช่างอีกคนลาพักร้อน คุณจะทำอย่างไร?', correctAnswer: 'บอกหัวหน้างานว่าคุณรู้สึกไม่สบาย แม้ทราบดีว่างานทั้งโรงงานต้องหยุดชะงัก' },
  { questionNo: 9, questionText: '9. ทำงานอยู่นึกอยากสูบบุหรี่ขึ้นมา แต่มีป้าย "อันตราย ห้ามสูบบุหรี่" คุณจะทำอย่างไร?', correctAnswer: 'ตัดสินใจยอมอดบุหรี่ไว้ ไม่แอบจุดสูบในพื้นที่อันตราย' },
  { questionNo: 10, questionText: '10. มีหน้าที่เทโซดาไฟ แต่เครื่องป้องกันหน้า (Face Shield) เกิดหายไป คุณจะทำอย่างไร?', correctAnswer: 'ไม่ยอมทำงานโดยไม่มีเครื่องป้องกันหน้า' },
  { questionNo: 11, questionText: '11. ค้นพบวิธีทำงานที่ปลอดภัยกว่าวิธีที่ถูกสอนมา แต่ช้าลงเล็กน้อย คุณจะทำอย่างไร?', correctAnswer: 'แนะนำให้หัวหน้างานลองทำตามวิธีใหม่ของคุณ' },
  { questionNo: 12, questionText: '12. ลูกชาย 3 ขวบตกบันไดบ้านที่ไม่มีราวกั้นเจ็บเล็กน้อย คุณจะทำอย่างไร?', correctAnswer: 'หาทางทำราวบันไดโดยเร็ว ถึงแม้จะทำให้บ้านราคาแพงของคุณเสียความสวยงามลงไปบ้าง' },
  { questionNo: 13, questionText: '13. บริษัทจัดฉายหนังวิธีการขับรถปลอดภัยในเวลาทำงาน คุณจะทำอย่างไร?', correctAnswer: 'ไปชมภาพยนตร์นั้น ถึงแม้จะรู้ว่าตนเองเป็นนักขับรถที่ดีอยู่แล้ว' },
  { questionNo: 14, questionText: '14. บริษัทใหม่ให้เงินดี แต่มีประวัติอุบัติเหตุคนงานถึงแก่กรรมเมื่อสัปดาห์ก่อน คุณจะทำอย่างไร?', correctAnswer: 'พิจารณาเหตุผลด้านความปลอดภัยและสวัสดิภาพชีวิตมากกว่าเงินทอง' },
];

export const MASTER_QUESTIONS_BANK = [
  {
    questionNo: 1,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "1. ข้อใด เป็นผลเสียทางตรง จากการเกิดอุบัติเหตุ",
    options: ["ก. ค่ารักษาพยาบาล", "ข. ค่าใช้จ่ายในการซ่อมแซมเครื่องจักร", "ค. การสูญเสียเวลาทำงาน", "ง. การเสียชื่อเสียงและภาพพจน์"],
    correctAnswer: "ก. ค่ารักษาพยาบาล"
  },
  {
    questionNo: 2,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "2. ข้อใดคือ ปัจจัยที่ทำให้เกิดเพลิงไหม้",
    options: ["ก. วัสดุติดไฟ, อากาศ, ไฟ", "ข. เชื้อเพลิง, ออกซิเจน, ความร้อน", "ค. เชื้อเพลิง, วัสดุติดไฟ, ความร้อน", "ง. เชื้อเพลิง, ไฮโดรเจน, ความร้อน"],
    correctAnswer: "ข. เชื้อเพลิง, ออกซิเจน, ความร้อน"
  },
  {
    questionNo: 3,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "3. ข้อใดคือ เทคนิคการใช้ถังดับเพลิง",
    options: ["ก. ดึง ปลด กด ส่าย", "ข. ปลด ส่าย กด ฉีด", "ค. ปลด ฉีด ส่าย กด", "ง. ดึง กด ฉีด ส่าย"],
    correctAnswer: "ข. ปลด ส่าย กด ฉีด"
  },
  {
    questionNo: 4,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "4. เมื่อได้ยินสัญญาณแจ้งเหตุฉุกเฉินควรทำอย่างไร",
    options: ["ก. ตามผู้นำธง ไปที่จุดรวมพล", "ข. เดินไปเข้าห้องน้ำ ไม่สนใจเสียงสัญญาณ", "ค. รีบขับรถออกนอกโรงงาน", "ง. รีบวิ่งออกนอกโรงงานทันที"],
    correctAnswer: "ก. ตามผู้นำธง ไปที่จุดรวมพล"
  },
  {
    questionNo: 5,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "5. ข้อใดกล่าวได้ถูกต้องเกี่ยวกับสี สัญลักษณ์ของความปลอดภัย",
    options: ["ก. สีแดง  หมายถึง  ห้าม/อันตราย", "ข. สีเหลือง  หมายถึง  ให้ปฏิบัติตาม", "ค. สีเขียว  หมายถึง  เตือนให้ระวัง", "ง. สีฟ้า  หมายถึง  ปลอดภัย"],
    correctAnswer: "ก. สีแดง  หมายถึง  ห้าม/อันตราย"
  },
  {
    questionNo: 6,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "6. สัญลักษณ์ในข้อใด หมายถึง ระวังอันตรายจากไฟฟ้า",
    options: ["ก. ", "ข. ", "ค. ", "ง. "],
    correctAnswer: "ค"
  },
  {
    questionNo: 7,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "7. ข้อใดคือ สาเหตุที่ทำให้เกิดอุบัติเหตุ",
    options: ["ก. สภาพการทำงานที่ไม่ปลอดภัย", "ข. การกระทำที่ไม่ปลอดภัย", "ค. ถูกทั้งข้อ ก. และข้อ ข.", "ค. ไม่มีข้อใดถูก"],
    correctAnswer: "ค. ไม่มีข้อใดถูก"
  },
  {
    questionNo: 8,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "8. ข้อใดกล่าวผิดเกี่ยวกับความปลอดภัยในการทำงานบนที่สูง",
    options: ["ก. เมื่อมีการทำงานบนที่สูงมากกว่า 2 เมตร ขึ้นไป จะต้องมีการแจ้งหรือติดประกาศให้ทราบทั่วกัน", "ข. เมื่อมีการทำงานบนที่สูงมากกว่า 2 เมตร ขึ้นไป ต้องกั้นเขตอันตราย เพื่อเตือนป้องกันพนักงาน", "ค. บริเวณที่ไม่มีราวเกาะ หรือเครื่องป้องกันชนิดอื่นให้คาดเข็มขัดนิรภัยก่อนใช้งาน", "ง. หากมีอาการผิดปกติ, เจ็บป่วย ต้องทำงานต่อไปอย่างระมัดระวัง"],
    correctAnswer: "ง. หากมีอาการผิดปกติ, เจ็บป่วย ต้องทำงานต่อไปอย่างระมัดระวัง"
  },
  {
    questionNo: 9,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "9. ข้อใดกล่าวผิดเกี่ยวกับความปลอดภัยในการใช้เครื่องมือช่าง",
    options: ["ก. จับ หรือถือเครื่องมือให้หลวม ๆ", "ข. เลือกใช้เครื่องมือที่เหมาะสมกับงานที่ทำ", "ค. ล้างน้ำมันจากเครื่องมือหรือชิ้นงานก่อนการใช้งาน", "ง. ตรวจสอบและปฏิบัติตามข้อแนะนำการใช้เครื่องมือ"],
    correctAnswer: "ก. จับ หรือถือเครื่องมือให้หลวม ๆ"
  },
  {
    questionNo: 10,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "10. ข้อใดกล่าวถูกต้อง",
    options: ["ก. ความปลอดภัยเป็นหน้าที่ของ จป.วิชาชีพ", "ข. ความปลอดภัยเป็นหน้าที่ของหัวหน้างาน", "ค. ความปลอดภัยเป็นหน้าที่ของเจ้าของโรงงาน", "ง. ความปลอดภัยเป็นหน้าที่ของพนักงานทุกคนในองค์กร"],
    correctAnswer: "ง. ความปลอดภัยเป็นหน้าที่ของพนักงานทุกคนในองค์กร"
  },
  {
    questionNo: 11,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "11. การประเมินความรุนแรง แบ่งออกเป็นกี่ระดับ อะไรบ้าง",
    options: ["ก. 1 ระดับ คือ ระดับ A", "ข. 2 ระดับ คือ ระดับ A, B", "ค. 3 ระดับ คือ ระดับ A, B, C", "ง. 4 ระดับ คือ ระดับ A, B, C, D"],
    correctAnswer: "ค. 3 ระดับ คือ ระดับ A, B, C"
  },
  {
    questionNo: 12,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "12. บาดเจ็บเล็กน้อย (ไม่หยุดงาน) หรือไม่หยุดการผลิต ระดับความรุนแรงอยู่ระดับใด",
    options: ["ก. ระดับ Rank A", "ข. ระดับ Rank B", "ค. ระดับ Rank C", "ง. ระดับ Rank D"],
    correctAnswer: "ค. ระดับ Rank C"
  },
  {
    questionNo: 13,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "13. CCCF แบ่งประเภทของอุบัติเหตุออกเป็นกี่ประเภท",
    options: ["ก. 4 ประเภท", "ข. 5 ประเภท", "ค. 6 ประเภท", "ง. 7 ประเภท"],
    correctAnswer: "ค. 6 ประเภท"
  },
  {
    questionNo: 14,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "14. ข้อใดไม่ใช่อันตรายระดับ A",
    options: ["ก. นาย ก แจ้งว่าอาจเกิดอันตรายจากไฟฟ้าดูดเพราะสายไฟของเครื่องเชื่อมไฟฟ้าชำรุด", "ข. นาย ข แจ้งว่าขณะขึ้นไปตรวจสอบการทำงานของเครน อาจตกลงมาเพราะไม่มีราวสำหรับเกี่ยวเข็มขัดนิรภัย", "ค. นาย ค แจ้งว่าบนดาดฟ้าของอาคารสำนักงาน มีอยู่มุมหนึ่งไม่มีราวกันตก อาจมีคนตกลงมาได้", "ง. นาย ง ถูกมีดคัตเตอร์บาดขณะตัดเทปเพื่อเปิดลัง"],
    correctAnswer: "ง. นาย ง ถูกมีดคัตเตอร์บาดขณะตัดเทปเพื่อเปิดลัง"
  },
  {
    questionNo: 15,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "15. ข้อใดคือประโยชน์ของการทำงานกิจกรรม CCCF",
    options: ["ก. ให้พนักงานร่วมกิจกรรมความปลอดภัยอย่างทั่วถึง", "ข. เพิ่มระดับจิตสำนึกความปลอดภัยของพนักงาน", "ค. เป็นช่องทางการสื่อสารระหว่างพนักงานและหัวหน้างาน", "ง. ถูกทุกข้อ"],
    correctAnswer: "ง. ถูกทุกข้อ"
  },
  {
    questionNo: 16,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "16. ระบบ ISO 14001 หมายถึงระบบอะไร",
    options: ["ก. ระบบการจัดการสิ่งแวดล้อม", "ข. ระบบการจัดการพลังงาน", "ค. ระบบมาตรฐานคุณภาพ", "ง. ระบบการจัดการของเสีย"],
    correctAnswer: "ก. ระบบการจัดการสิ่งแวดล้อม"
  },
  {
    questionNo: 17,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "17. ข้อใดถูกต้อง",
    options: ["ก. ถังขยะสีเหลือง หมายถึง ขยะรีไซเคิล", "ข. ถังขยะสีแดง หมายถึง ขยะรีไซเคิล", "ค. ถังขยะสีเขียว หมายถึง ขยะอันตราย", "ง. ถึงขยะสีเหลือง หมายถึง ขยะทั่วไป"],
    correctAnswer: "ก. ถังขยะสีเหลือง หมายถึง ขยะรีไซเคิล"
  },
  {
    questionNo: 18,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "18. 5ส. ประกอบด้วยสิ่งใดบ้าง",
    options: ["ก. สะสาง สะดวก สะอาด สุขนิสัย ใส่ใจ", "ข. สะสาง สะอาด สร้างนิสัย สื่อสาร ใส่ใจ", "ค. สะสาง สะดวก สะอาด สุขลักษณะ สร้างนิสัย", "ง. สะอาด สะดวก ใส่ใจ สร้างนิสัย สื่อสาร"],
    correctAnswer: "ค. สะสาง สะดวก สะอาด สุขลักษณะ สร้างนิสัย"
  },
  {
    questionNo: 19,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "19. มาตราฐาน ISO 9001/IATF 16949 หมายถึง",
    options: ["ก. ระบบคุณภาพสำหรับอุตสาหกรรมยานยนต์", "ข. ระบบคุณภาพสำหรับอุตสาหกรรมอาหาร", "ค. ระบบคุณภาพสำหรับอุตสาหกรรมสิ่งทอ", "ง. ระบบคุณภาพสำหรับอุตสาหกรรมเครื่องมือวัด"],
    correctAnswer: "ก. ระบบคุณภาพสำหรับอุตสาหกรรมยานยนต์"
  },
  {
    questionNo: 20,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "20. ข้อใด ไม่ใช่ความหมาย ของคำว่า \"คุณภาพ\"",
    options: ["ก. ส่งมอบทันเวลาที่กำหนด", "ข. ผลิตภัณฑ์ได้มาตรฐาน", "ค. ตรงตามความต้องการของลูกค้า", "ง. ไม่มีข้อใดถูกต้อง"],
    correctAnswer: "ง. ไม่มีข้อใดถูกต้อง"
  },
  {
    questionNo: 21,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "21. ข้อใดคือ นโยบายอนุรักษ์พลังงาน ของบริษัท",
    options: ["ก. ตระหนักถึงความสำคัญในการใช้ทรัพยากร ด้านพลังงานอย่างมีประสิทธิภาพและลดค่าใช้จ่ายบริษัท", "ข. มุ่งเน้นให้มีแนวทางปฏิบัติการอนุรักษ์พลังงานแก่พนักงานภายในองค์กร ให้พนักงานทุกคน", "ค. ถูกทั้งข้อ ก. และ ข้อ ข.", "ง. ไม่มีข้อใดถูก"],
    correctAnswer: "ค. ถูกทั้งข้อ ก. และ ข้อ ข."
  },
  {
    questionNo: 22,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "22. CORE VALUES CAR หรือค่านิยมองค์กร มีกี่ข้อ",
    options: ["ก. 3 ข้อ", "ข. 4 ข้อ", "ค. 5 ข้อ", "ง. 6 ข้อ"],
    correctAnswer: "ข. 4 ข้อ"
  },
  {
    questionNo: 23,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "23. ข้อใดถูกต้องเกี่ยวกับกระบวนการผลิต",
    options: ["ก. ซอยยาง ผสมยาง ตบแต่ง อัดขึ้นรูป ตรวจสอบคุณภาพ สโตร์&จัดส่ง", "ข. ตรวจสอบคุณภาพ ผสมยาง ซอยยาง อัดขึ้นรูป ตบแต่ง สโตร์&จัดส่ง", "ค. ผสมยาง ซอยยาง อัดขึ้นรูป ตบแต่ง ตรวจสอบคุณภาพ สโตร์&จัดส่ง", "ง. อัดขึ้นรูป ตบแต่ง ซอยยาง ตรวจสอบคุณภาพ ผสมยาง สโตร์&จัดส่ง"],
    correctAnswer: "ค. ผสมยาง ซอยยาง อัดขึ้นรูป ตบแต่ง ตรวจสอบคุณภาพ สโตร์&จัดส่ง"
  },
  {
    questionNo: 24,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "24. ข้อใดกล่าวถูกต้อง",
    options: ["ก. มาทำงานสาย  3 ครั้ง ใน 1 รอบเดือน ตักเตือนเป็นหนังสือ", "ข. ขาดงานครั้งที่ 1  พักงาน โดยไม่จ่ายค่าจ้าง", "ค. พนักงานมีสิทธิลาป่วยได้เท่าที่ป่วยจริง โดยได้รับค่าจ้างปีละไม่เกิน 30 วัน", "ง. พนักงานลาป่วยตั้งแต่ 5 วันทำงานขึ้นไป ต้องมีใบรับรองแพทย์"],
    correctAnswer: "ค. พนักงานมีสิทธิลาป่วยได้เท่าที่ป่วยจริง โดยได้รับค่าจ้างปีละไม่เกิน 30 วัน"
  },
  {
    questionNo: 25,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "25. ข้อใดถูกต้องเกี่ยวระเบียบการจ่ายค่าจ้าง",
    options: ["ก. บริษัทฯ จ่ายค่าจ้างให้กับพนักงานผ่านบัญชีธนาคารกรุงไทย", "ข. บริษัทฯ จ่ายค่าจ้างให้กับพนักงานทุกวันที่ 1 ของเดือน และจ่ายค่าทำงานล่วงเวลาและรายได้อื่น ๆ", "ค. บริษัทฯ จ่ายค่าจ้าง, ค่าทำงานล่วงเวลา, ค่าทำงานในวันหยุด ให้กับพนักงานทุกวันที่ 1", "ง. ถูกทุกข้อ"],
    correctAnswer: "ค. บริษัทฯ จ่ายค่าจ้าง, ค่าทำงานล่วงเวลา, ค่าทำงานในวันหยุด ให้กับพนักงานทุกวันที่ 1"
  },
  {
    questionNo: 26,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "26. ข้อใดกล่าวถูกต้องเกี่ยวกับระเบียบการลาออกและการเลิกจ้าง",
    options: ["ก. กรณีพนักงานไม่ผ่านทดลองงานบริษัทฯ จะแจ้งให้ทราบล่วงหน้าอย่างน้อย 1 งวดค่าจ้าง", "ข. กรณีพนักงานกระทำความผิดซ้ำคำเตือน บริษัทฯ สามารถเลิกจ้างได้โดยไม่จ่ายค่าชดเชย", "ค. กรณีพนักงานประสงค์บอกเลิกจ้าง (ลาออก) พนักงานจะต้องแจ้งล่วงหน้าอย่างน้อย 1 งวดค่าจ้าง", "ง. ถูกทุกข้อ"],
    correctAnswer: "ง. ถูกทุกข้อ"
  },
  {
    questionNo: 27,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "27. ข้อใดคือ ข้อห้ามปฏิบัติในการแต่งกายของพนักงาน",
    options: ["ก. พนักงานชาย ไม่ไว้ผมยาว สีผมสุภาพ, ไม่สวมต่างหูหรือเครื่องประดับขนาดใหญ่,", "ข. พนักงานหญิง สีผมสุภาพ ไม่ทำสีฉูดฉาด, ไม่ปล่อยผม มัดรวบผมให้เรียบร้อย", "ค. ห้ามพนักงานทุกคนสวมใส่กางเกงยีนส์", "ง. ถูกทุกข้อ"],
    correctAnswer: "ง. ถูกทุกข้อ"
  },
  {
    questionNo: 28,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "28. การลากิจแบบได้รับค่าจ้าง ต้องมีเงื่อนไขอย่างไร",
    options: ["ก. เป็นพนักงานประจำ และลาล่วงหน้าอย่างน้อย 1 วัน โดยใช้สิทธิ์ได้ 3 วัน/ปี", "ข. เป็นพนักงานประจำ และลาล่วงหน้าอย่างน้อย 3 วัน โดยใช้สิทธิ์ได้ 3 วัน/ปี", "ค. เป็นพนักงานประจำ และลาล่วงหน้าอย่างน้อย 2 วัน โดยใช้สิทธิ์ได้ 3 วัน/ปี", "ง. ถูกทุกข้อ"],
    correctAnswer: "ค. เป็นพนักงานประจำ และลาล่วงหน้าอย่างน้อย 2 วัน โดยใช้สิทธิ์ได้ 3 วัน/ปี"
  },
  {
    questionNo: 29,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "29. หากพนักงานมาทำงานสาย 3 ครั้งในรอบ 1 เดือน จะถูกพิจารณาโทษอย่างไร",
    options: ["ก. ตักเตือนด้วยวาจา", "ข. ตักเตือนเป็นหนังสือ", "ค. พักงานโดยไม่ได้จ่ายค่าจ้าง", "ง. เลิกจ้างโดยไม่จ่ายค่าชดเชย"],
    correctAnswer: "ก. ตักเตือนด้วยวาจา"
  },
  {
    questionNo: 30,
    category: "ประเมินผลการปฐมนิเทศ",
    questionText: "30. หากพนักงานขาดงานครั้งแรก จะถูกพิจารณาโทษอย่างไร",
    options: ["ก. ตักเตือนด้วยวาจา", "ข. ตักเตือนเป็นหนังสือ", "ค. พักงานโดยไม่จ่ายค่าจ้าง", "ง. เลิกจ้างโดยไม่จ่ายค่าชดเชย"],
    correctAnswer: "ข. ตักเตือนเป็นหนังสือ"
  },
];

export function ensureAnswersDetail(result: GoogleFormExamResult): Array<{
  questionNo: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}> {
  const isSafetyExam = result.examType === 'SAFETY_ATTITUDE' || result.totalQuestions === 14;
  const bank = isSafetyExam ? SAFETY_ATTITUDE_QUESTIONS_BANK : MASTER_QUESTIONS_BANK;
  const targetTotal = bank.length;

  if (result.answersDetail && result.answersDetail.length >= targetTotal) {
    return result.answersDetail;
  }

  // Auto-generate itemized breakdown from target bank based on score
  const correctCount = Math.min(targetTotal, Math.max(0, result.score || 0));
  return bank.map((mq, idx) => {
    const isCorrect = idx < correctCount;
    const existing = result.answersDetail ? result.answersDetail[idx] : null;

    if (existing && existing.userAnswer) {
      return {
        questionNo: mq.questionNo,
        questionText: existing.questionText || mq.questionText,
        userAnswer: existing.userAnswer,
        correctAnswer: mq.correctAnswer,
        isCorrect: existing.isCorrect !== undefined ? existing.isCorrect : isCorrect,
      };
    }

    return {
      questionNo: mq.questionNo,
      questionText: mq.questionText,
      userAnswer: isCorrect ? mq.correctAnswer : '(คำตอบที่ไม่ถูกต้องจากข้อสอบ)',
      correctAnswer: mq.correctAnswer,
      isCorrect,
    };
  });
}

export function getEmployeeExamResults(empCode: string): GoogleFormExamResult[] {
  return INITIAL_DEMO_EXAM_RESULTS[empCode] || [];
}

export function getLatestEmployeeExamResult(empCode: string): GoogleFormExamResult | null {
  const list = getEmployeeExamResults(empCode);
  if (!list.length) return null;
  return list[list.length - 1]; // Latest by timestamp/attempt
}


const EXAM_RESULTS_LOCAL_STORAGE_KEY = 'car_orientation_exam_results_v2';
const PRE_TEST_LOCK_LOCAL_STORAGE_KEY = 'car_pre_test_lock_status_v1';

export const INITIAL_PRE_TEST_LOCK_MAP: PreTestLockMap = {
  'EMP-1001': {
    'SAFETY_ATTITUDE': true, // Closed by HR (Post-Test UNLOCKED)
    'ORIENTATION': true,     // Closed by HR (Post-Test UNLOCKED)
  },
  'EMP-1002': {
    'SAFETY_ATTITUDE': false, // Open (Post-Test LOCKED)
    'ORIENTATION': false,    // Open (Post-Test LOCKED)
  },
};

export function savePreTestLockStatusToLocalStorage(lockMap: PreTestLockMap): void {
  try {
    localStorage.setItem(PRE_TEST_LOCK_LOCAL_STORAGE_KEY, JSON.stringify(lockMap));
  } catch (err) {
    console.error('Failed to save Pre-Test lock status to localStorage:', err);
  }
}

export function loadPreTestLockStatusFromLocalStorage(): PreTestLockMap {
  try {
    const saved = localStorage.getItem(PRE_TEST_LOCK_LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load Pre-Test lock status from localStorage:', err);
  }
  return INITIAL_PRE_TEST_LOCK_MAP;
}

export function saveExamResultsToLocalStorage(resultsMap: Record<string, GoogleFormExamResult[]>): void {
  try {
    localStorage.setItem(EXAM_RESULTS_LOCAL_STORAGE_KEY, JSON.stringify(resultsMap));
  } catch (err) {
    console.error('Failed to save exam results to localStorage:', err);
  }
}

export function loadExamResultsFromLocalStorage(): Record<string, GoogleFormExamResult[]> {
  try {
    const saved = localStorage.getItem(EXAM_RESULTS_LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load exam results from localStorage:', err);
  }
  return INITIAL_DEMO_EXAM_RESULTS;
}

export async function parseExcelOrCsvFile(file: File): Promise<Record<string, GoogleFormExamResult[]>> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!jsonRows || jsonRows.length < 2) {
    throw new Error('ไฟล์ที่นำเข้าไม่มีข้อมูลคำตอบ');
  }

  const existingMap = loadExamResultsFromLocalStorage();
  const results: Record<string, GoogleFormExamResult[]> = { ...existingMap };
  const attemptCounter: Record<string, number> = {};

  const headers = jsonRows[0].map((h) => String(h || ''));

  for (let i = 1; i < jsonRows.length; i++) {
    const row = jsonRows[i];
    if (!row || (!row[2] && !row[3])) continue;

    let timestampStr = String(row[0] || '');
    if (typeof row[0] === 'number') {
      const d = XLSX.SSF.parse_date_code(row[0]);
      if (d) {
        timestampStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')} ${String(d.H).padStart(2, '0')}:${String(d.M).padStart(2, '0')}:${String(d.S).padStart(2, '0')}`;
      }
    }

    const rawScore = String(row[1] || '0');
    const scoreMatch = rawScore.match(/^(\d+)/);
    const scoreNum = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

    const empCode = String(row[2] || '').trim();
    if (!empCode) continue;

    const employeeName = String(row[3] || '').trim();
    const department = String(row[4] || '').trim();
    const phaseText = String(row[5] || '');
    const phase: ExamPhase = phaseText.includes('ก่อน') ? 'PRE_TEST' : 'POST_TEST';

    // Auto-detect question count based on remaining columns (from index 6 onwards)
    const questionColsCount = Math.max(0, row.length - 6);
    const isSafety = questionColsCount <= 14;
    const totalQuestions = isSafety ? 14 : 30;
    const examType: ExamType = isSafety ? 'SAFETY_ATTITUDE' : 'ORIENTATION';
    const isPassed = isSafety ? scoreNum >= 12 : scoreNum >= 24;
    const percentage = Math.round((scoreNum / totalQuestions) * 100);

    attemptCounter[empCode] = (attemptCounter[empCode] || 0) + 1;
    const attemptNumber = attemptCounter[empCode];

    const bank = isSafety ? SAFETY_ATTITUDE_QUESTIONS_BANK : MASTER_QUESTIONS_BANK;

    const answersDetail = [];
    for (let col = 6; col < row.length; col++) {
      const qNo = col - 5;
      const qText = headers[col] || `ข้อสอบข้อที่ ${qNo}`;
      const uAns = String(row[col] || '');
      const matchedQ = bank.find((q) => q.questionNo === qNo);
      const correctAnswer = matchedQ ? matchedQ.correctAnswer : 'ดูในเฉลย Google Form';
      const isCorrect = matchedQ ? uAns.trim() === matchedQ.correctAnswer.trim() : true;

      answersDetail.push({
        questionNo: qNo,
        questionText: qText,
        userAnswer: uAns,
        correctAnswer,
        isCorrect,
      });
    }

    const resultObj: GoogleFormExamResult = {
      id: `file-import-${empCode}-${attemptNumber}-${i}`,
      attemptNumber,
      submittedAt: timestampStr || new Date().toISOString().replace('T', ' ').substring(0, 19),
      empCode,
      employeeName,
      department,
      score: scoreNum,
      totalQuestions,
      percentage,
      isPassed,
      source: 'GOOGLE_FORMS',
      examType,
      phase,
      answersDetail,
    };

    if (!results[empCode]) {
      results[empCode] = [];
    }

    const existingIndex = results[empCode].findIndex((r) => r.attemptNumber === attemptNumber && r.examType === examType && r.phase === phase);
    if (existingIndex >= 0) {
      results[empCode][existingIndex] = resultObj;
    } else {
      results[empCode].push(resultObj);
    }
  }

  saveExamResultsToLocalStorage(results);
  return results;
}

export function getSampleGoogleAppsScriptCode(): string {
  return `/**
 * Google Apps Script (Code.gs) - ระบบซิงค์คะแนนข้อสอบ CAR อัตโนมัติ (14 ข้อ และ 30 ข้อ)
 * 
 * วิธีนำไปใช้งาน:
 * 1. เปิด Google Sheets ที่เชื่อมกับ Google Forms (หน้าการตอบกลับ)
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) ➔ "Apps Script"
 * 3. วางโค้ดนี้ลงใน Code.gs ทั้งหมด
 * 4. กดปุ่ม "Deploy" (การทำให้ใช้งานได้) ➔ "New deployment" (การทำให้ใช้งานได้ใหม่)
 * 5. ประเภท: Web app, Execute as: Me, Who has access: Anyone (ทุกคน)
 * 6. คัดลอก Web App URL นำมาวางในระบบเว็บ CAR HR Skill Matrix
 */

function doGet(e) {
  try {
    var ss = null;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e1) {
      ss = null;
    }

    if (!ss) {
      var files = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
      while (files.hasNext()) {
        var file = files.next();
        var fname = file.getName();
        if (fname.indexOf("ตอบกลับ") !== -1 || fname.indexOf("CAR") !== -1 || fname.indexOf("ทัศนคติ") !== -1 || fname.indexOf("ปฐมนิเทศ") !== -1) {
          ss = SpreadsheetApp.open(file);
          break;
        }
      }
      if (!ss) {
        var allSheets = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
        if (allSheets.hasNext()) {
          ss = SpreadsheetApp.open(allSheets.next());
        }
      }
    }

    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        totalRecords: 0,
        results: [],
        message: "ยังไม่พบข้อมูล Google Sheet ที่ผูกกับแบบสอบถาม"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = ss.getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    var results = [];
    var attemptCounter = {};

    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (!row || !row[0]) continue;

      var rawScore = String(row[1] || "0");
      var scoreMatch = rawScore.match(/^(\\d+)/);
      var scoreNum = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

      var empCode = String(row[2] || "").trim();
      if (!empCode) continue;

      var employeeName = String(row[3] || "").trim();
      var department = String(row[4] || "").trim();
      var phaseText = String(row[5] || "");
      var isPreTest = phaseText.indexOf("ก่อน") !== -1;

      var questionColsCount = Math.max(0, row.length - 6);
      var isSafety = questionColsCount <= 14;
      var totalQuestions = isSafety ? 14 : 30;
      var percentage = Math.round((scoreNum / totalQuestions) * 100);
      var isPassed = isSafety ? scoreNum >= 12 : scoreNum >= 24;

      attemptCounter[empCode] = (attemptCounter[empCode] || 0) + 1;

      var answersDetail = [];
      for (var col = 6; col < row.length; col++) {
        var qNo = col - 5;
        answersDetail.push({
          questionNo: qNo,
          questionText: "ข้อที่ " + qNo,
          userAnswer: String(row[col] || ""),
          correctAnswer: "ดูในเฉลย Google Form",
          isCorrect: true
        });
      }

      results.push({
        id: "gas-row-" + i,
        attemptNumber: attemptCounter[empCode],
        submittedAt: Utilities.formatDate(new Date(row[0]), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss"),
        empCode: empCode,
        employeeName: employeeName,
        department: department,
        score: scoreNum,
        totalQuestions: totalQuestions,
        percentage: percentage,
        isPassed: isPassed,
        source: "GOOGLE_FORMS",
        examType: isSafety ? "SAFETY_ATTITUDE" : "ORIENTATION",
        phase: isPreTest ? "PRE_TEST" : "POST_TEST",
        answersDetail: answersDetail
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      totalRecords: results.length,
      results: results
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
}
