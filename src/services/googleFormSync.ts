import type { GoogleFormExamResult, NotificationItem } from '../types';

export const DEFAULT_GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdwlTwGNNMrvtcYBt9aEFmxSF2NiT7AzOGf0_jFlorzXqtH7g/viewform';

export const INITIAL_DEMO_EXAM_RESULTS: Record<string, GoogleFormExamResult[]> = {
  'EMP-1001': [
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
      answersDetail: [
        { questionNo: 1, questionText: 'อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE) ใดที่เป็นข้อบังคับพื้นฐานที่สุดในโรงงาน CAR?', userAnswer: 'หมวกนิรภัยและรองเท้าเซฟตี้', correctAnswer: 'หมวกนิรภัยและรองเท้าเซฟตี้', isCorrect: true },
        { questionNo: 2, questionText: 'เมื่อเกิดเหตุเพลิงไหม้ในพื้นที่ผลิต ขั้นตอนแรกที่ต้องปฏิบัติคืออะไร?', userAnswer: 'กดสัญญาณแจ้งเตือนและโทรแจ้ง จป.', correctAnswer: 'กดสัญญาณแจ้งเตือนและโทรแจ้ง จป.', isCorrect: true },
        { questionNo: 3, questionText: 'มาตรฐานระบบคุณภาพของอุตสาหกรรมยานยนต์ที่บริษัทใช้คือข้อใด?', userAnswer: 'IATF 16949 & ISO 9001', correctAnswer: 'IATF 16949 & ISO 9001', isCorrect: true },
        { questionNo: 4, questionText: 'หลักการ 5ส. ข้อใดหมายถึงการทำให้เป็นระเบียบเรียบร้อยอยู่เสมอ?', userAnswer: 'สุขลักษณะ', correctAnswer: 'สุขลักษณะ', isCorrect: true },
        { questionNo: 5, questionText: 'การควบคุมผลิตภัณฑ์ที่ไม่เป็นไปตามข้อกำหนด (Non-conforming Product) ต้องติดป้ายสีใด?', userAnswer: 'ป้ายสีแดง (REJECT)', correctAnswer: 'ป้ายสีแดง (REJECT)', isCorrect: true },
        { questionNo: 6, questionText: 'การซ่อมบำรุงเครื่องจักรขณะทำงานต้องทำการ Lockout / Tagout (LOTO) หรือไม่?', userAnswer: 'ต้องทำทุกครั้งก่อนเริ่มงานซ่อม', correctAnswer: 'ต้องทำทุกครั้งก่อนเริ่มงานซ่อม', isCorrect: true },
        { questionNo: 7, questionText: 'การจัดการขยะอันตราย (เช่น ผ้าปนเปื้อนน้ำมัน) ต้องทิ้งในถังสีใด?', userAnswer: 'ถังสีส้ม/ดำ (ขยะอันตราย)', correctAnswer: 'ถังสีส้ม/ดำ (ขยะอันตราย)', isCorrect: true },
        { questionNo: 8, questionText: 'ข้อใดเป็นเกณฑ์การประเมินทักษะความสามารถพนักงาน (F-HR-014) ระดับ 100%?', userAnswer: 'ทำได้เองและสามารถสอนงานผู้อื่นได้', correctAnswer: 'ทำได้เองและสามารถสอนงานผู้อื่นได้', isCorrect: true },
        { questionNo: 9, questionText: 'การประเมินอันตรายก่อนเริ่มงานในพื้นที่เรียกว่าอะไร?', userAnswer: 'KYT / CCCF Assessment', correctAnswer: 'KYT / CCCF Assessment', isCorrect: true },
        { questionNo: 10, questionText: 'ระยะเวลาการทดลองงานของพนักงานใหม่ตามกฎระเบียบบริษัทคือเท่าใด?', userAnswer: 'ไม่เกิน 119 วัน', correctAnswer: 'ไม่เกิน 119 วัน', isCorrect: true },
        { questionNo: 11, questionText: 'เอกสาร F-HR-016 Form A ใช้สำหรับการประเมินประเภทใด?', userAnswer: 'การประเมิน OJT พนักงานใหม่', correctAnswer: 'การประเมิน OJT พนักงานใหม่', isCorrect: true },
        { questionNo: 12, questionText: 'เมื่อเกิดอุบัติเหตุจากการทำงาน ต้องแจ้งผู้บังคับบัญชาภายในเวลากี่นาที?', userAnswer: 'ทันที (ภายใน 15 นาที)', correctAnswer: 'ทันที (ภายใน 15 นาที)', isCorrect: true },
        { questionNo: 13, questionText: 'สารเคมีที่ใช้ในโรงงานต้องมีเอกสารความปลอดภัยชนิดใดกำกับ?', userAnswer: 'MSDS / SDS', correctAnswer: 'MSDS / SDS', isCorrect: true },
        { questionNo: 14, questionText: 'จุดรวมพล (Evacuation Assembly Point) ของโรงงาน CAR อยู่ที่ใด?', userAnswer: 'ลานจอดรถหน้าอาคาร M-1', correctAnswer: 'ลานจอดรถหน้าอาคาร M-1', isCorrect: true },
        { questionNo: 15, questionText: 'การตรวจเช็กเครื่องจักรประจำวัน (Daily Inspection) เป็นหน้าที่ของใคร?', userAnswer: 'พนักงานผู้ปฏิบัติงานประจำเครื่อง', correctAnswer: 'พนักงานผู้ปฏิบัติงานประจำเครื่อง', isCorrect: true },
        { questionNo: 16, questionText: 'การฉีดอัดชิ้นงานยางต้องควบคุมอุณหภูมิและเวลา (Curing Time) ตามเอกสารใด?', userAnswer: 'Work Instruction (WI)', correctAnswer: 'Work Instruction (WI)', isCorrect: true },
        { questionNo: 17, questionText: 'ข้อใดไม่ใช่สาเหตุของการเกิดของเสียในกระบวนการผลิต (4M1E)?', userAnswer: 'สภาพอากาศภายนอกโรงงาน', correctAnswer: 'สภาพอากาศภายนอกโรงงาน', isCorrect: true },
        { questionNo: 18, questionText: 'การวัดความแข็งยางด้วย Durometer Shore A มีเกณฑ์ความคลาดเคลื่อนเท่าใด?', userAnswer: '± 5 Shore A', correctAnswer: '± 5 Shore A', isCorrect: true },
        { questionNo: 19, questionText: 'การแต่งกายของพนักงานในพื้นที่ผลิตต้องเป็นอย่างไร?', userAnswer: 'สวมยูนิฟอร์ม ติดบัตรพนักงาน และใส่ PPE ครบถ้วน', correctAnswer: 'สวมยูนิฟอร์ม ติดบัตรพนักงาน และใส่ PPE ครบถ้วน', isCorrect: true },
        { questionNo: 20, questionText: 'การลาป่วยตั้งแต่กี่วันทำงานขึ้นไปต้องมีใบรับรองแพทย์?', userAnswer: '3 วันทำงานขึ้นไป', correctAnswer: '3 วันทำงานขึ้นไป', isCorrect: true },
        { questionNo: 21, questionText: 'ป้ายเตือนความปลอดภัยสีเหลือง-ดำ หมายถึงอะไร?', userAnswer: 'ระวังอันตราย / พื้นที่เสี่ยง', correctAnswer: 'ระวังอันตราย / พื้นที่เสี่ยง', isCorrect: true },
        { questionNo: 22, questionText: 'การส่งมอบชิ้นงานไปยังกระบวนการถัดไป เรียกว่าการควบคุมอะไร?', userAnswer: 'Next Process Customer Rule', correctAnswer: 'Next Process Customer Rule', isCorrect: true },
        { questionNo: 23, questionText: 'การประเมินผลการทดลองงานมีกี่ระยะ?', userAnswer: '30, 60, 90 วัน', correctAnswer: '30, 60, 90 วัน', isCorrect: true },
        { questionNo: 24, questionText: 'การฝึกอบรมกรณีเปลี่ยนงานย้ายตำแหน่งใช้แบบฟอร์มใด?', userAnswer: 'F-HR-016 Form B (4M1E Change)', correctAnswer: 'F-HR-016 Form B (4M1E Change)', isCorrect: true },
        { questionNo: 25, questionText: 'การยกของหนักตามกฎหมายความปลอดภัย กำหนดให้น้ำหนักไม่เกินเท่าใด (ชาย)?', userAnswer: 'ไม่เกิน 55 กิโลกรัม', correctAnswer: 'ไม่เกิน 55 กิโลกรัม', isCorrect: true },
        { questionNo: 26, questionText: 'การบันทึกรายงานการผลิตประจำวันต้องลงบันทึกเมื่อใด?', userAnswer: 'ทุกๆ 1 ชั่วโมง / หลังจบชิฟท์', correctAnswer: 'ทุกๆ 1 ชั่วโมง / หลังจบชิฟท์', isCorrect: true },
        { questionNo: 27, questionText: 'การคัดแยกชิ้นงานเสียต้องแยกกองในโซนใด?', userAnswer: 'Red Tag Box / Holding Area', correctAnswer: 'Red Tag Box / Holding Area', isCorrect: true },
        { questionNo: 28, questionText: 'นโยบายคุณภาพของบริษัท CAR เน้นเรื่องใดเป็นสำคัญ?', userAnswer: 'คุณภาพเป็นหนึ่ง ส่งมอบตรงเวลา ปลอดภัยสูงสุด', correctAnswer: 'คุณภาพเป็นหนึ่ง ส่งมอบตรงเวลา ปลอดภัยสูงสุด', isCorrect: true },
        { questionNo: 29, questionText: 'การใช้อุปกรณ์ดับเพลิงเคมีแห้ง (พ่นฐานไฟ) มีระยะห่างเท่าใด?', userAnswer: 'ห่าง 2 - 3 เมตรเหนือลม', correctAnswer: 'ห่าง 2 - 3 เมตรเหนือลม', isCorrect: false },
        { questionNo: 30, questionText: 'การแจ้งปรับปรุงข้อเสนอแนะ (Kaizen Idea) สามารถยื่นผ่านช่องทางใด?', userAnswer: 'ตู้รับข้อเสนอแนะ HR หรือระบบออนไลน์', correctAnswer: 'ตู้รับข้อเสนอแนะ HR หรือระบบออนไลน์', isCorrect: false },
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
        { questionNo: 27, questionText: 'นโยบายคุณภาพ CAR เน้นอะไร?', userAnswer: 'กำไรสูงสุด', correctAnswer: 'คุณภาพเป็นหนึ่ง ส่งมอบตรงเวลา ปลอดภัยสูงสุด', isCorrect: false },
        { questionNo: 28, questionText: 'การลากิจต้องยื่นล่วงหน้ากี่วัน?', userAnswer: '1 วัน', correctAnswer: '3 วันขึ้นไป', isCorrect: false },
        { questionNo: 29, questionText: 'การล้างมือ 7 ขั้นตอนป้องกันอะไร?', userAnswer: 'เชื้อโรคและความสกปรก', correctAnswer: 'เชื้อโรคและความสกปรก', isCorrect: true },
        { questionNo: 30, questionText: 'เมื่อพบน้ำมันรั่วไหลบนพื้นต้องทำอย่างไร?', userAnswer: 'นำทราย/ขี้เลื่อยมาโรยซับน้ำมันทันที', correctAnswer: 'นำทราย/ขี้เลื่อยมาโรยซับน้ำมันทันที', isCorrect: true },
      ],
    },
  ],
};

export function getEmployeeExamResults(empCode: string): GoogleFormExamResult[] {
  return INITIAL_DEMO_EXAM_RESULTS[empCode] || [];
}

export function getLatestEmployeeExamResult(empCode: string): GoogleFormExamResult | null {
  const list = getEmployeeExamResults(empCode);
  if (!list.length) return null;
  return list[list.length - 1]; // Latest by timestamp/attempt
}

export function generateHrFailedNotification(result: GoogleFormExamResult): NotificationItem {
  return {
    id: `notif-failed-${Date.now()}`,
    title: `🚨 [ผลสอบไม่ผ่านเกณฑ์] ${result.employeeName} (${result.empCode})`,
    message: `ทำข้อสอบปฐมนิเทศ Google Forms ได้ ${result.score}/30 ข้อ (${result.percentage}%) ไม่ผ่านเกณฑ์ 24 ข้อ กรุณาตรวจสอบข้อสอบที่ตอบผิดและแจ้งพนักงานทำซ้ำ`,
    type: 'EXAM_FAILED',
    date: result.submittedAt.split(' ')[0],
    read: false,
    actionUrl: 'exam_engine',
  };
}

export function getSampleGoogleAppsScriptCode(): string {
  return `/**
 * Google Apps Script (Code.gs)
 * แปะโค้ดนี้ใน Google Sheets -> Extensions -> Apps Script
 * จากนั้นกด Deploy -> New deployment -> Select type: Web app
 * Execute as: Me, Who has access: Anyone
 */

function doGet(e) {
  var empCode = e.parameter.empCode;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({ status: "empty" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var results = [];
  var attemptCounter = {};
  
  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var timestamp = row[0];
    var code = String(row[1]).trim();
    var name = String(row[2]).trim();
    var scoreStr = String(row[3]); // e.g. "26 / 30" or 26
    
    if (empCode && code !== empCode) continue;
    
    var scoreNum = parseInt(scoreStr) || 0;
    attemptCounter[code] = (attemptCounter[code] || 0) + 1;
    
    var answersDetail = [];
    // Read question columns dynamically
    for (var col = 4; col < row.length; col += 2) {
      var qNo = Math.floor((col - 4) / 2) + 1;
      var uAns = String(row[col]);
      var isCorr = String(row[col + 1]).toLowerCase().indexOf("true") !== -1 || String(row[col + 1]).indexOf("ถูก") !== -1;
      answersDetail.push({
        questionNo: qNo,
        questionText: "ข้อสอบที่ " + qNo,
        userAnswer: uAns,
        correctAnswer: isCorr ? uAns : "ดูในเฉลย Google Form",
        isCorrect: isCorr
      });
    }
    
    results.push({
      id: "gas-" + i,
      attemptNumber: attemptCounter[code],
      submittedAt: Utilities.formatDate(new Date(timestamp), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      empCode: code,
      employeeName: name,
      score: scoreNum,
      totalQuestions: 30,
      percentage: Math.round((scoreNum / 30) * 100),
      isPassed: scoreNum >= 24,
      answersDetail: answersDetail,
      source: "GOOGLE_FORMS"
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    empCode: empCode,
    totalRecords: results.length,
    results: results
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
}
