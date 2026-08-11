import type { GoogleFormExamResult, PreTestLockMap, ExamType, ExamPhase } from '../types';
import * as XLSX from 'xlsx';

export const DEFAULT_SAFETY_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd00NQ2GHypV5BIc-uUAYyTGmg1yrM-37tjjsSm1wqqBnah8A/viewform';

export const DEFAULT_ORIENTATION_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScQwtTetuBtxB1UyLFvK9WhQdDW_vV5VXw9FqyEl7hL7I52vg/viewform';

export const DEFAULT_GOOGLE_FORM_URL = DEFAULT_SAFETY_FORM_URL;

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzfnbMgve_3rT9x2bWbu1qNEl-ShbhV15toklon2D60tYgozlsSIkPwN-X9JnT09mTGEg/exec';

export const INITIAL_DEMO_EXAM_RESULTS: Record<string, GoogleFormExamResult[]> = {};

export const SAFETY_ATTITUDE_QUESTIONS_BANK = [
  {
    questionNo: 1,
    questionText: "1. คุณเพิ่งเข้าทำงานวันแรกในโรงงาน หัวหน้าได้มอบหมายให้คุณทำงานเกี่ยวกับเครื่องจักร ซึ่งมีลักษณะคล้ายๆกับที่\nคุณเคยทำมาก่อน (สถานที่ทำงานเก่า) แต่คุณไม่แน่ใจว่าจะทำงานกับเครื่องจักรนั้นได้ หัวหน้างานเข้าใจว่าคุณมีประสบการณ์มากกว่าที่คุณมีจริงๆ ดังนั้นเขาจึงสั่งให้คุณเริ่มทำงานให้ดีที่สุดเท่าที่จะทำได้ แล้วเขาก็เดินจากไป \nคุณจะทำอย่างไร",
    correctAnswer: "เรียกหัวหน้างานกลับมา และบอกเขาว่า คุณยังไม่ทราบวิธีการทำงานกับเครื่องจักรที่กำลังได้รับมอบหมาย\nให้ทำ"
  },
  {
    questionNo: 2,
    questionText: "2. มีชายผู้หนึ่งกำลังคุมเครื่องจักรทำงานอยู่ใกล้ๆคุณ ขณะนั้นชายอีกคนหนึ่งต้องการจะหยอกล้อกับชายผู้นั้น \nจึงได้เอาหนังสติ๊กเล็งเข้าที่ใบหูของชายผู้ที่กำลังทำงานกับเครื่องจักร คุณจะทำอย่างไร",
    correctAnswer: "รีบเดินเข้าไปหาชายคนที่กำลังเล็งหนังสติ๊ก แล้วพยายามบอกให้เขาหยุดการล้อเล่นนั้น ก่อนที่เขาจะยิงหนังสติ๊กออกไป"
  },
  {
    questionNo: 3,
    questionText: "3. คุณได้รับมอบหมายให้ขนของกองใหญ่ไปไว้ในห้องเก็บของให้เสร็จภายในเวลาเที่ยง คุณได้เริ่มทำงานตั้งแต่เช้าด้วยดีมาตลอด ขณะที่เหลือเวลาอีก 10 นาที จะถึงเวลารับประทานอาหารเที่ยง ของที่เหลือต้องใช้เวลาอีกประมาณครึ่งชั่วโมงจึงจะขนเสร็จ หันไปรอบๆก็ไม่มีใครช่วยคุณได้ คุณจะทำอย่างไร",
    correctAnswer: "หยุดขนของตอนเที่ยงตรง ไปรับประทานอาหารแล้วกลับมาทำงานใหม่ ยอมเสี่ยงที่จะถูกหัวหน้างานดุ"
  },
  {
    questionNo: 4,
    questionText: "4. คุณได้รับโทรศัพท์เรียกให้ไปทำงานในวันหยุดอย่างกะทันหันเพียงคนเดียว เพื่อให้ยกของลงจากรถบรรทุก ขณะที่คุณทำงานนั้นต้องพบกับลังไม้ซึ่งมีน้ำหนักมาก และรูปร่างเทอะทะ คุณไม่แน่ใจว่าจะยอกคนเดียวได้ คนที่อยู่ข้างๆคุณขณะนั้นมีเพียงผู้จัดการโรงงานเพียงคนเดียว ซึ่งคุณก็รู้สึกเกรงอยู่นิดๆ คุณจะทำอย่างไร",
    correctAnswer: "ถามผู้จัดการโรงงานว่า เขาพอจะช่วยคุณยกลังไม้นั้นได้ไหม"
  },
  {
    questionNo: 5,
    questionText: "5. มีรถยกของคันหนึ่งวิ่งผ่านหน้าคุณไป เผอิญคุณเหลือบไปเห็นว่ารถยกคันนั้นทำน้ำมันหล่อลื่นหกลงพื้นที่ใช้สัญจรนั้นคุณจะทำอย่างไร",
    correctAnswer: "ส่งข่าวให้คนทำความสะอาดทราบ แล้วยืนใกล้ๆ บริเวณนั้นเพื่อคอยลบอกคนอื่นที่ผ่านมาให้ระวังตัว \nรอจนกว่าคนทำความสะอาดจะมาเช็ดน้ำมันนั้น"
  },
  {
    questionNo: 6,
    questionText: "6. คุณมีความจำเป็นที่จะต้องทำงานอย่างรีบเร่งด่วนอันหนึ่ง ซึ่งเป็นผลทำให้สถานที่ทำงานของคุณสกปรกรกรุงรัง \nคุณทราบดีแต่ต้องรีบทำงานให้เสร็จ ทันใดนั้นนายจ้างของคุณเดินผ่านมา เมื่อเขาเห็นสภาพเช่นนั้น เขาก็แสดงความ\nไม่พอใจออกมาแล้วตะโกนว่า “คุณเห็นไหมมีอะไรที่ไม่เรียบร้อย ทำไมจึงปล่อยสถานที่ทำงานให้เห็นเช่นนี้ รีบทำความสะอาดโดยเร็ว” คุณจะทำอย่างไร",
    correctAnswer: "หยุดทำงานทั้งหมด แล้วรีบทำความละอาด ทั้งๆ ที่ไม่แน่ใจว่างานเร่งด่วนนั้นจะต้องไม่เสร็จภายในกำหนด"
  },
  {
    questionNo: 7,
    questionText: "7. คุณเป็นนักเพาะกายที่มีกล้ามเนื้อใหญ่โต และสง่างาม เป็นที่น่าภูมิใจยิ่งนัก และยังเป็นนักยกน้ำหนักสมัครเล่นด้วย \nวันหนึ่งมีคนมาท้าพนันให้คุณยกน้ำหนักในเวลาพักรับประทานอาหาร โดยใช้ที่ยกน้ำหนักเหล็กที่มีรูปร่างเทอะทะ \nทำให้ถือ หรือยกลำบาก ซึ่งเป็นเจตนาของผู้ท้าพนันที่จะทำให้การพนันยกน้ำหนักนั้นสนุกสนานยิ่งขึ้น เพื่อนสนิทของคุณกลายคนช่วยกันสนับสนุนให้คุณรับคำท้านั้น เพราะแน่ในว่าคุณต้องชนะ คุณจะทำอย่างไร",
    correctAnswer: "บอกผู้มาท้าพนันว่า คุณจะรับคำท้านั้นก็ต่อเมื่อใช้อุปกรณ์ยกน้ำหนักจริงๆ (บาเบล)"
  },
  {
    questionNo: 8,
    questionText: "8. คุณเป็นช่างไฟฟ้าประจำโรงงาน ตอนบ่ายวันหนึ่งภายหลังอาหารเที่ยงมีเหตุขัดข้องสายไฟฟ้า ทำให้ไฟฟ้าดับ เลยต้องทำให้หยุดงานส่วนสำคัญของโรงงานทั้งหมด ผู้จัดการโรงงวานจึงเรียกให้คุณไปแก้ไขด่วน คุณก็รับปฏิบัติตามโดยใช้บันใดปีนขึ้นไปซ่อมสายไฟ ขณะยืนทำงานอยู่บนบันใดนั้น คุณรู้สึกมึนศีรษะและรู้สึกเจ็บบริเวณที่ท้องและหน้าอก คุณคิดว่าคงจะเนื่องมาจากอาหารไม่ย่อย แต่ก็ไม่แน่ใจ ปกติที่โรงงานก็มีช่างไฟอีกคนหนึ่ง แต่เผอิญเขาลาพักร้อน คุณจะทำอย่างไร",
    correctAnswer: "บอกหัวหน้างานว่าคุณรู้สึกไม่สบายทั้ง ๆ ที่ทราบดีว่าหัวหน้างานอาจจะส่งคุณไปหาแพทย์หรือให้กลับบ้าน งานทั้งโรงงานก็ต้องหยุดชะงัก จนกว่าจะหาช่างคนใหม่มาซ่อมไฟฟ้าแทนคุณ"
  },
  {
    questionNo: 9,
    questionText: "9. หลังอาหารเที่ยงวันหนึ่ง คุณต้องรับกลับไปทำงานเลยไม่มีเวลาสูบบุหรี่ในห้องอาหาร ขณะที่คุณทำงานอยู่นั้นนึกอยากสูบบุหรี่ขึ้นมา ในสถานที่ทำงานของคุณมีป้ายปิดประกาศไว้ว่า “อันตราย ห้ามสูบบุหรี่” เท่าที่คุณทราบดีแล้วไม่น่าจะมีอันตรายอะไรในบริเวณนั้น และยิ่งกว่านั้น นายจ้างก็ไม่มาทำงาน เพราะไปตากอากาศ คุณจะทำอย่างไร",
    correctAnswer: "ตัดสินใจยอมอดบุหรี่ไว้ ทั้ง ๆ ที่คุณจะต้องนึกถึงตลอดเวลา"
  },
  {
    questionNo: 10,
    questionText: "10. คุณทำงานเกี่ยวข้องกับสารเคมีที่เป็นอันตราย คุณมีหน้าที่เทโซดาไฟ ซึ่งมีโอกาสที่จะกระเด็นได้ คุณได้ถูกสอนให้ใช้อุปกรณ์ป้องกันอันตรายโดยใส่เครื่องป้องกันหน้าในขณะที่เทโซดาไฟ วันหนึ่งปรากฏว่าเครื่องป้องกันหน้าของคุณเกิดหายไป คุณจะทำอย่างไร",
    correctAnswer: "ไม่ยอมทำงานโดยไม่มีเครื่องป้องกันหน้า"
  },
  {
    questionNo: 11,
    questionText: "11. คุณเป็นคนทำงานใหม่ และกำลังถูกฝึกให้ทำงานประกอบวัสดุชิ้นส่วนที่ซับซ้อนชนิดหนึ่ง หลังจากนั้น 2-3 วัน \nคุณก็พบว่าคุณมีวิธีการทำงานที่ปลอดภัยกว่าที่ถูกสอนมา แต่การทำงานนั้นจะช้าลงเล็กน้อย คุณจะทำอย่างไร",
    correctAnswer: "แนะนำให้หัวหน้างานลองทำตามวิธีใหม่ของคุณ"
  },
  {
    questionNo: 12,
    questionText: "12. วันหนึ่งคุณกลับถึงบ้านหลังจากเสร็จงานจากโรงงานแล้ว พบว่าบรรยากาศในบ้านช่างเคร่งเครียดเสียเหลือเกิน เพราะว่าบุตรชายอายุ 3 ขวบ ซึ่งเป็นที่รักของคุณนั้นศีรษะบวมปูดออกมา ภรรยาคุณได้แจ้งให้ทราบว่าลูกชายแสนซนคนนั้นตกจากบันไดที่ไม่มีราวกั้นลงมาที่พื้นเผอิญโชคดีเหลื่ออีก 2-3 ขั้น จะถึงพื้นแล้ว ลูกจึงเจ็บเพียงเล็กน้อย คุณจะทำอย่างไร",
    correctAnswer: "หาทางทำราวบันไดโดยเร็ว ถึงแม้ว่าจะทำให้บ้านราคาแพงของคุณเสียความสวยงามลงไปบ้าง"
  },
  {
    questionNo: 13,
    questionText: "13. คุณเป็นพนักงานขับรถของบริษัท วันหนึ่งบริษัทฯได้จัดให้ภาพยนตร์มาฉายให้พวกพนักงานได้ชม ภาพยนตร์นั้นเกี่ยวกับวิธีการขับรถยนต์ให้ปลอดภัยวิธีใหม่ เวลานั้นอยู่ในเวลาทำงานของบริษัท คุณจะทำอย่างไร",
    correctAnswer: "ไปชมภาพยนต์นั้นทั้งๆที่รู้ว่าตนเองเป็นนักขับรถที่ดีอยู่แล้ว"
  },
  {
    questionNo: 14,
    questionText: "14. คุณกำลังทำงาน วันหนึ่งเห็นประกาศรับสมัครในหนังสือพิมพ์ ซึ่งเป็นงานที่คุณคิดว่าคุณสามารถทำได้และรายได้ก็ดี \nคุณเคยทราบประวัติไม่ดีของบริษัทฯนี้เกี่ยวกับเรื่องความปลอดภัย โดยทราบว่า คนงาน 2 คน พึ่งได้รับอุบัติเหตุถึงแก่กรรมเมื่อสัปดาห์ที่แล้ว คุณจะทำอย่างไร",
    correctAnswer: "บอกตัวเองว่า เป็นการดีที่จะต้องปลอดภัยไว้ แต่เรื่องเงินเป็นเรื่องใหญ่ ดังนั้นจึงตัดสินใจสมัครเข้าทำงาน"
  },
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
      const parsed: Record<string, GoogleFormExamResult[]> = JSON.parse(saved);
      const merged: Record<string, GoogleFormExamResult[]> = {};

      // Seed with initial demo data
      Object.keys(INITIAL_DEMO_EXAM_RESULTS).forEach((k) => {
        merged[k] = [...INITIAL_DEMO_EXAM_RESULTS[k]];
      });

      // Merge saved localStorage data
      Object.keys(parsed).forEach((code) => {
        const empCode = code.trim().toUpperCase();
        if (!merged[empCode]) {
          merged[empCode] = parsed[code];
        } else {
          const existingList = merged[empCode];
          parsed[code].forEach((pItem) => {
            const idx = existingList.findIndex(
              (e) => e.attemptNumber === pItem.attemptNumber && e.examType === pItem.examType && e.phase === pItem.phase
            );
            if (idx >= 0) {
              existingList[idx] = pItem;
            } else {
              existingList.push(pItem);
            }
          });
        }
      });

      // Sanitize all records to ensure examType, totalQuestions, percentage, and isPassed are always 100% accurate
      Object.keys(merged).forEach((code) => {
        merged[code] = merged[code].map((r) => {
          const isSafety = r.examType === 'SAFETY_ATTITUDE' || (r.totalQuestions && r.totalQuestions <= 14);
          const totalQuestions = isSafety ? 14 : 30;
          const examType: ExamType = isSafety ? 'SAFETY_ATTITUDE' : 'ORIENTATION';
          const percentage = Math.round((r.score / totalQuestions) * 100);
          const isPassed = isSafety ? r.score >= 12 : r.score >= 24;

          return {
            ...r,
            examType,
            totalQuestions,
            percentage,
            isPassed,
            phase: r.phase || (!isSafety ? 'POST_TEST' : (r.attemptNumber === 1 ? 'PRE_TEST' : 'POST_TEST')),
          };
        });
      });

      return merged;
    }
  } catch (err) {
    console.error('Failed to load exam results from localStorage:', err);
  }
  return INITIAL_DEMO_EXAM_RESULTS;
}

export async function parseExcelOrCsvFile(file: File): Promise<{
  results: Record<string, GoogleFormExamResult[]>;
  detectedExamType?: ExamType;
  detectedPhase?: ExamPhase;
}> {
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

  const rawHeaders = jsonRows[0].map((h) => String(h || '').trim());
  const hLower = rawHeaders.map((h) => h.toLowerCase());

  // Dynamic Header Matching (resilient against extra columns like Email or rearranged columns)
  let tsCol = hLower.findIndex((h) => h.includes('ประทับ') || h.includes('timestamp'));
  let scoreCol = hLower.findIndex((h) => h.includes('คะแนน') || h.includes('score'));
  let empCol = hLower.findIndex((h) => h.includes('รหัส') || h.includes('employee id') || h.includes('emp'));
  let nameCol = hLower.findIndex((h) => h.includes('ชื่อ') || h.includes('name'));
  let deptCol = hLower.findIndex((h) => h.includes('แผนก') || h.includes('dept'));
  let phaseCol = hLower.findIndex((h) => h.includes('รอบ') || h.includes('phase'));

  // Fallbacks if specific text is missing
  const tsIdx = tsCol >= 0 ? tsCol : 0;
  const scoreIdx = scoreCol >= 0 ? scoreCol : 1;
  const empIdx = empCol >= 0 ? empCol : 2;
  const nameIdx = nameCol >= 0 ? nameCol : 3;
  const deptIdx = deptCol >= 0 ? deptCol : 4;
  const phaseIdx = phaseCol >= 0 ? phaseCol : 5;

  const metadataCols = new Set([tsIdx, scoreIdx, empIdx, nameIdx, deptIdx, phaseIdx].filter((idx) => idx >= 0));

  let lastDetectedType: ExamType | undefined;
  let lastDetectedPhase: ExamPhase | undefined;

  for (let i = 1; i < jsonRows.length; i++) {
    const row = jsonRows[i];
    if (!row || row.length === 0) continue;

    let timestampStr = String(row[tsIdx] || '');
    if (typeof row[tsIdx] === 'number') {
      const d = XLSX.SSF.parse_date_code(row[tsIdx]);
      if (d) {
        timestampStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')} ${String(d.H).padStart(2, '0')}:${String(d.M).padStart(2, '0')}:${String(d.S).padStart(2, '0')}`;
      }
    }

    const rawScore = String(row[scoreIdx] || '0');
    const scoreMatch = rawScore.match(/^(\d+)/);
    const scoreNum = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

    const empCode = String(row[empIdx] || '').trim().toUpperCase();
    if (!empCode) continue;

    const employeeName = String(row[nameIdx] || '').trim();
    const department = String(row[deptIdx] || '').trim();
    const phaseText = String(row[phaseIdx] || '');
    const phase: ExamPhase = phaseText.includes('ก่อน') ? 'PRE_TEST' : 'POST_TEST';
    lastDetectedPhase = phase;

    // Detect question columns dynamically
    const questionCols = [];
    for (let col = 0; col < row.length; col++) {
      if (!metadataCols.has(col) && rawHeaders[col]) {
        questionCols.push(col);
      }
    }

    const questionColsCount = questionCols.length > 0 ? questionCols.length : Math.max(0, row.length - 6);
    const isSafety = questionColsCount <= 14;
    const totalQuestions = isSafety ? 14 : 30;
    const examType: ExamType = isSafety ? 'SAFETY_ATTITUDE' : 'ORIENTATION';
    lastDetectedType = examType;

    const isPassed = isSafety ? scoreNum >= 12 : scoreNum >= 24;
    const percentage = Math.round((scoreNum / totalQuestions) * 100);

    attemptCounter[empCode] = (attemptCounter[empCode] || 0) + 1;
    const attemptNumber = attemptCounter[empCode];

    const bank = isSafety ? SAFETY_ATTITUDE_QUESTIONS_BANK : MASTER_QUESTIONS_BANK;

    const answersDetail = [];
    let qNo = 1;
    for (const col of questionCols) {
      const qText = rawHeaders[col] || `ข้อสอบข้อที่ ${qNo}`;
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
      qNo++;
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

    const existingIndex = results[empCode].findIndex(
      (r) => r.attemptNumber === attemptNumber && r.examType === examType && r.phase === phase
    );
    if (existingIndex >= 0) {
      results[empCode][existingIndex] = resultObj;
    } else {
      results[empCode].push(resultObj);
    }
  }

  saveExamResultsToLocalStorage(results);
  return {
    results,
    detectedExamType: lastDetectedType,
    detectedPhase: lastDetectedPhase,
  };
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
