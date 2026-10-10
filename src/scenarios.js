import { seed, todayHK, dateAdd } from './model';
export function demoSeed() {
  const db = seed();
  db.teachers.forEach(t => {
    if (t.type === 'full') t.weekly.forEach(w => w.days = [0, 1, 2, 3, 4, 5, 6]);
  });
  return db;
}
const step = (title, say, action, check) => ({
  title,
  say,
  action,
  check
});
const show = (page, dialog, role = 'admin') => ({
  kind: 'show',
  page,
  dialog,
  role
});
const fill = values => ({
  kind: 'fill',
  values
});
const submit = {
  kind: 'submit'
};
const today = () => todayHK();
const tomorrow = () => dateAdd(todayHK(), 1);
const lesson = (db, id) => db.sessions.find(b => b.id === id);
export const scenarios = [{
  id: 'three-days',
  group: '核心排課',
  title: '明天起，連續上三天',
  duration: '約 40 秒',
  pitch: '臨時需求也能一次安排，老師可以每天不同。',
  route: '預約與調課 → 安排老師 → 確認安排',
  steps: [step('收到家長的臨時需求', '林浩然明天起想連上三天。管理員從待辦直接處理，不需要先建立班級。', show('requests')), step('打開安排表', '學生、課程、三天日期及時間已帶入；只需挑選可用老師。', show('requests', db => ({
    type: 'schedule',
    request: db.requests.find(r => r.id === 'r1')
  }))), step('逐日安排老師', '前兩天安排兼職黃老師，第三天安排李老師。每一天都檢查學生、老師與課室衝突。', fill(() => ({
    teachers: {
      0: 't3',
      1: 't3',
      2: 't1'
    }
  }))), step('確認三堂課', '點一次確認，三堂課全部進入課表。預約時不預扣課時；餘額不足會提示續購。', submit, db => db.requests.find(r => r.id === 'r1').status === 'accepted' && db.sessions.length === 8), step('在課表看結果', '打開課堂記錄，可以看到三天及不同老師。日常臨時約課就是這條最短路徑。', show('schedule'))]
}, {
  id: 'weekly',
  group: '核心排課',
  title: '每週固定來，也能靈活調整',
  duration: '約 30 秒',
  pitch: '固定的是預約時間，不必建立固定班級。',
  route: '靈活排課 → 安排課堂 → 每週同一時間',
  steps: [step('開始每週預約', '何子謙希望每週同一時間上閱讀課，先安排四週。', show('schedule', () => ({
    type: 'schedule'
  }))), step('填好四週安排', '同一個表單選每週、四次，逐堂檢查空檔；以後仍可單獨調整其中一堂。', fill(() => ({
    studentIds: ['s5'],
    courseId: 'c1',
    date: tomorrow(),
    start: '12:00',
    end: '13:00',
    days: 4,
    repeat: 'weekly',
    teacherId: 't1',
    teachers: {},
    room: 'A'
  }))), step('生成四次預約', '四次預約各自獨立。取消或調整一次，不會自動改掉其餘三次。', submit, db => db.sessions.filter(b => b.studentIds.includes('s5')).length === 4), step('查看四堂結果', '列表中可以逐堂查看時間、老師及學生。', show('schedule'))]
}, {
  id: 'availability',
  group: '核心排課',
  title: '兼職老師臨時多上一個時段',
  duration: '約 30 秒',
  pitch: '先確認能教的時間，再安排課堂。',
  route: '老師與可用時間 → 編輯可用時間 → 新增指定日期',
  steps: [step('看見全職與兼職的區別', '全職維護每週在崗時段；兼職只填已確認可以到校的日期。', show('teachers')), step('打開兼職可用時間', '黃老師確認四天後下午可以多教兩小時。', show('teachers', db => ({
    type: 'availability',
    teacher: db.teachers.find(t => t.id === 't3')
  }))), step('新增確認時段', '加入指定日期的 14:00–16:00，保留原來已確認的安排。', fill(db => ({
    extra: [...db.teachers.find(t => t.id === 't3').extra, {
      date: dateAdd(today(), 4),
      start: '14:00',
      end: '16:00'
    }]
  }))), step('保存老師時間', '儲存後，這個時段才可被排課。若縮短時間影響已排課堂，系統會要求先調課。', submit, db => db.teachers.find(t => t.id === 't3').extra.length === 4)]
}, {
  id: 'conflict',
  group: '核心排課',
  title: '撞期了，系統怎樣提醒',
  duration: '約 35 秒',
  pitch: '把不可能的安排攔在確認之前。',
  route: '靈活排課 → 選時間 → 查看衝突 → 改時間',
  steps: [step('嘗試安排一堂新課', '何子謙想在今天下午上課。', show('schedule', () => ({
    type: 'schedule'
  }))), step('看到衝突原因', '14:00 李老師和 A 室都已有課，這個安排不能直接確認。', fill(() => ({
    studentIds: ['s5'],
    courseId: 'c1',
    date: today(),
    start: '14:00',
    end: '15:00',
    teacherId: 't1',
    teachers: {
      0: 't1'
    },
    room: 'A'
  }))), step('嘗試確認被攔截', '使用同一個確認按鈕驗證。系統顯示錯誤，課表不會增加記錄。', {
    kind: 'blocked'
  }, db => db.sessions.length === 5), step('換成可用空檔', '改成 17:00–18:00，學生、老師、課室均可安排。', fill(() => ({
    start: '17:00',
    end: '18:00'
  }))), step('再確認成功', '衝突處理完才寫入課表，無需事後人工找撞期。', submit, db => db.sessions.length === 6)]
}, {
  id: 'group-move',
  group: '核心排課',
  title: '小組中一個孩子要調課',
  duration: '約 35 秒',
  pitch: '只移動申請的孩子，不打亂其他學生。',
  route: '家長課堂詳情 → 申請調課 → 管理員確認',
  steps: [step('家長提出單人調課', '陳梓晴和張凱琳同堂上課，只有梓晴需要換時間。', show('schedule', db => ({
    type: 'request',
    session: lesson(db, 'b2')
  }), 'parent')), step('填寫希望的時間', '希望改到明天 17:00–18:00，並留下原因。', fill(() => ({
    date: tomorrow(),
    start: '17:00',
    end: '18:00',
    note: '學校有活動，梓晴單獨調課。'
  }))), step('提交調課申請', '提交後等待管理員安排，原課堂仍然保留。', submit, db => db.requests.some(r => r.sessionId === 'b2')), step('管理員安排新課堂', '系統明確提示：同堂其他學生不受影響。', show('requests', db => ({
    type: 'schedule',
    request: db.requests.find(r => r.sessionId === 'b2')
  }))), step('確認單人調課', '梓晴獲得獨立的新課堂；張凱琳仍在原時間上課。', submit, db => lesson(db, 'b2').studentIds.length === 1 && lesson(db, 'b2').studentIds[0] === 's6'), step('對照結果', '課堂記錄同時保留原課及新課，操作記錄保留調課原因來源。', show('schedule'))]
}, {
  id: 'attendance',
  group: '課消與收費',
  title: '課上完了，點名並扣課',
  duration: '約 30 秒',
  pitch: '出勤和課消一次完成，避免重複扣減。',
  route: '考勤與課消 → 待記錄 → 確認完成課堂',
  steps: [step('老師只看自己的待辦', '李老師在自己的端記錄今天的課堂，不需要操作帳務。', show('attendance', undefined, 'teacher')), step('打開考勤表', '梓晴出席，凱琳請假。按學生分別記錄，不會整堂一起扣課。', show('attendance', db => ({
    type: 'attendance',
    session: lesson(db, 'b2')
  }), 'teacher')), step('記錄不同的出勤狀態', '演示規則：出席或遲到扣 1 堂，請假及缺席不扣。正式規則需與機構確認。', fill(() => ({
    attendance: {
      s1: 'present',
      s6: 'leave'
    },
    note: '完成寫作練習；凱琳請假，下次補上。'
  }))), step('完成並更新課時', '梓晴由 8 堂變成 7 堂；凱琳維持 10 堂。相同課堂不能重複確認。', submit, db => db.students[0].balance === 7 && db.students.find(s => s.id === 's6').balance === 10), step('家長查看餘額和課後記錄', '切換家長端可以看到自己孩子的新餘額。', show('students', db => ({
    type: 'studentDetail',
    student: db.students[0]
  }), 'parent'))]
}, {
  id: 'correction',
  group: '課消與收費',
  title: '考勤點錯了，怎樣更正',
  duration: '約 35 秒',
  pitch: '退回原扣課，再重新記錄，留存更正原因。',
  route: '課堂詳情 → 更正考勤 → 填原因 → 重新記錄',
  steps: [step('先完成一次考勤', '演示一堂誤把學生記為出席的課堂。', show('attendance', db => ({
    type: 'attendance',
    session: lesson(db, 'b1')
  }))), step('出席扣一堂', '樂彤先從 5 堂扣到 4 堂。', submit, db => db.students.find(s => s.id === 's3').balance === 4), step('管理員更正記錄', '只有管理員可以更正。已開單的課堂會攔截，避免帳務與課消脫節。', show('attendance', db => ({
    type: 'correction',
    session: lesson(db, 'b1')
  }))), step('留下更正原因', '正確情況是請假，先退回原扣課，再重新記錄。', fill(() => ({
    reason: '誤記出席，學生實際請假。'
  }))), step('退回待記錄狀態', '餘額恢復 5 堂，流水保留扣課及退回記錄。', submit, db => db.students.find(s => s.id === 's3').balance === 5 && lesson(db, 'b1').status === 'scheduled')]
}, {
  id: 'renewal',
  group: '課消與收費',
  title: '課時快用完，續購十堂',
  duration: '約 35 秒',
  pitch: '開帳單與真正收到款項分開處理。',
  route: '學生與課時 → 續購課包 → 開帳單 → 登記收款',
  steps: [step('从學生檔案續購', '浩然只剩 2 堂，管理員直接為他續購 10 堂。', show('students', () => ({
    type: 'bill',
    studentId: 's2',
    source: 'package'
  }))), step('先開待收款帳單', '10 堂 × HK$280。現在只是開帳單，不能提前增加課時。', submit, db => db.invoices.length === 1 && db.students.find(s => s.id === 's2').balance === 2), step('收到款項後登記', '收到轉數快後，選擇付款方式並確認全額收款。', show('billing', db => ({
    type: 'payment',
    invoice: db.invoices[0]
  }))), step('課包入帳', '課時從 2 變 12，對應收據一併生成；不能重複收款加課。', submit, db => db.students.find(s => s.id === 's2').balance === 12 && db.invoices[0].paid), step('展示給家長的單據', '帳單與收據保留明細、金額、付款方式，可使用瀏覽器列印或另存 PDF。', show('billing', db => ({
    type: 'invoice',
    invoice: db.invoices[0]
  })))]
}, {
  id: 'single-bill',
  group: '課消與收費',
  title: '按次上課，再開帳單收款',
  duration: '約 40 秒',
  pitch: '從已到課記錄帶入單據，不重抄課堂資料。',
  route: '完成考勤 → 待開單 → 開立單據 → 登記收款',
  steps: [step('按次學生完成課堂', '卓軒沒有課包；確認出席後進入待開單，不會扣成負課時。', show('attendance', db => ({
    type: 'attendance',
    session: lesson(db, 'b3')
  }))), step('確認到課', '完成課堂，待開單增加一條記錄。', submit, db => lesson(db, 'b3').status === 'completed'), step('從課堂直接開單', '日期、時段、時長和單價均帶入；不用人工再找學生和課堂。', show('billing', () => ({
    type: 'bill',
    studentId: 's4',
    source: 'lesson',
    sessionIds: ['b3']
  }))), step('開立帳單', '同一課堂開單後從待開單清單移除，避免重複收費。', submit, db => db.invoices.length === 1 && db.invoices[0].total === 380), step('收到款項', '管理員登記收到款項。這只是前端演示，不會執行真實支付。', show('billing', db => ({
    type: 'payment',
    invoice: db.invoices[0]
  }))), step('完成收款', 'Invoice 和 Receipt 都可從單據列表打開。', submit, db => db.invoices[0].paid), step('查看帳單和收據', '將這一頁展示給對方，說明完整帳務閉環。', show('billing', db => ({
    type: 'invoice',
    invoice: db.invoices[0]
  })))]
}, {
  id: 'new-student',
  group: '基礎與家長',
  title: '新學生加入，先建簡單檔案',
  duration: '約 25 秒',
  pitch: '先記必要資料，零課時開始，不強制分班。',
  route: '學生與課時 → 新增學生 → 再約課或購課',
  steps: [step('建立學生檔案', '只需姓名、年級、家長聯絡和計費方式，不要求先選班。', show('students', () => ({
    type: 'student'
  }))), step('填寫必要資料', '示範新生周悅，按次付費，先安排一堂體驗課也可以。', fill(() => ({
    name: '周悅',
    english: 'Joy',
    grade: 'P4',
    parent: '周太',
    phone: '+852 6000 0000',
    mode: 'single',
    notes: '先試一堂閱讀課，再決定課包。'
  }))), step('儲存即可使用', '學生立即可以被選入約課表單。未購課前不會自動產生餘額。', submit, db => db.students.some(s => s.name === '周悅'))]
}, {
  id: 'parent-request',
  group: '基礎與家長',
  title: '家長自己提出預約',
  duration: '約 35 秒',
  pitch: '家長提供需求，管理員掌握最終安排。',
  route: '家長提出預約 → 管理員待辦 → 確認老師',
  steps: [step('切換家長視角', '陳太只看到梓晴的安排、課時和帳單，不能查看其他孩子。', show('home', undefined, 'parent')), step('填寫想上課的時間', '家長不用知道老師排班，只需告訴我們希望何時來。', show('requests', () => ({
    type: 'request'
  }), 'parent')), step('寫明需求', '明天 16:00–17:00 想上閱讀課，老師可由管理員安排。', fill(() => ({
    date: tomorrow(),
    courseId: 'c1',
    start: '16:00',
    end: '17:00',
    note: '想練習英文閱讀，老師可以靈活安排。'
  }))), step('申請進入待辦', '提交不代表已排課，也不扣課時。', submit, db => db.requests.length === 3), step('管理員看到申請', '管理員在同一個預約清單處理，避免散落在訊息中。', show('requests'))]
}];
scenarios.push({
  id: 'credit-followup',
  group: '異常與跟進',
  title: '課時不足，先點名再補扣',
  duration: '約 45 秒',
  pitch: '不耽誤同堂學生，也不遺漏已上的課。',
  route: '點名 → 工作台待補扣 → 續購收款 → 自動補扣',
  setup: db => ({
    ...db,
    students: db.students.map(s => s.id === 's1' ? {
      ...s,
      balance: 0
    } : s)
  }),
  steps: [step('零餘額也如實記錄', '梓晴課時用完，但今天已經上課。凱琳同堂，兩人的記錄都應保留。', show('attendance', db => ({
    type: 'attendance',
    session: lesson(db, 'b2')
  }))), step('確認兩人出席', '凱琳正常扣課；梓晴保留出勤，新增待補扣。', submit, db => lesson(db, 'b2').status === 'completed' && db.ledger.some(l => l.type === '待補扣')), step('待辦不會消失', '管理員在工作台看到梓晴需要續費，老師不必處理款項。', show('home')), step('續購十堂', '先開帳單，不會提前增加課時。', show('billing', () => ({
    type: 'bill',
    studentId: 's1',
    source: 'package'
  }))), step('開出帳單', '保留待收款和待補扣兩項記錄。', submit, db => db.invoices.length === 1), step('收到續費', '登記款項，系統會自動補扣最早的待處理課堂。', show('billing', db => ({
    type: 'payment',
    invoice: db.invoices[0]
  }))), step('十堂入帳，補扣一堂', '餘額為九堂，待補扣已完成，流水保留完整過程。', submit, db => db.students[0].balance === 9 && db.ledger.some(l => l.type === '待補扣' && l.settled)), step('查看處理結果', '工作台不再顯示這筆待補扣。', show('home'))]
}, {
  id: 'teacher-off',
  group: '異常與跟進',
  title: '老師臨時請假，安排代課',
  duration: '約 45 秒',
  pitch: '登記不能上課的時段，受影響課堂逐項處理。',
  route: '老師不能上課 → 工作台異常 → 更換老師',
  steps: [step('李老師下午不能到校', '只停今天 14:00–15:00，不改以後每週的正常時間。', show('teachers', db => ({
    type: 'teacherOff',
    teacher: db.teachers[0]
  }))), step('填停課時段及原因', '畫面即時列出受影響課堂。', fill(() => ({
    date: today(),
    start: '14:00',
    end: '15:00',
    reason: '臨時身體不適'
  }))), step('留下停課記錄', '課堂沒有被自動刪除，工作台新增需處理事項。', submit, db => db.teachers[0].unavailable?.length === 1), step('處理受影響課堂', '演示改到 17:00 由黃老師代課，已經線下與兩位家長確認。', show('schedule', db => ({
    type: 'schedule',
    session: lesson(db, 'b2')
  }))), step('換老師及時間', '保留原有學生和課程。', fill(() => ({
    start: '17:00',
    end: '18:00',
    teachers: {
      0: 't3'
    },
    teacherId: 't3'
  }))), step('確認新安排', '課堂從異常待辦移除，老師停課記錄仍保留。', submit, db => lesson(db, 'b2').teacherId === 't3'), step('回到工作台', '只需繼續處理剩餘事項。', show('home'))]
}, {
  id: 'proposal-confirm',
  group: '異常與跟進',
  title: '換一個時間，先讓家長確認',
  duration: '約 40 秒',
  pitch: '管理員提出的時間，不等於家長已同意。',
  route: '安排需求 → 新時間方案 → 家長確認 → 課表',
  steps: [step('原時間不合適', '浩然希望下午三點，管理員提出四點的三日方案。', show('requests', db => ({
    type: 'schedule',
    request: db.requests[0]
  }))), step('改成四點', '選擇發給家長確認，暫不佔用時段。', fill(() => ({
    start: '16:00',
    end: '17:00',
    teacherId: 't1',
    confirmation: 'propose'
  }))), step('方案待確認', '此時尚未產生新的正式課堂。', submit, db => db.requests[0].status === 'awaiting' && db.sessions.length === 5), step('管理員記錄線下確認', '家長已經電話同意，也可以由管理員代為確認。', show('requests', db => ({
    type: 'proposal',
    request: db.requests[0]
  }))), step('重新檢查並安排', '確認時再次檢查空檔，避免等待期間撞課。', submit, db => db.requests[0].status === 'accepted' && db.sessions.length === 8)]
}, {
  id: 'leave-makeup',
  group: '異常與跟進',
  title: '小組一人請假，留下另約待辦',
  duration: '約 40 秒',
  pitch: '同堂其他學生照常上課，另約需求不靠記憶。',
  route: '課堂詳情 → 學生請假 → 需要另約 → 安排新課',
  steps: [step('只處理梓晴', '梓晴有學校活動，凱琳仍按原時間上課。', show('schedule', db => ({
    type: 'studentLeave',
    session: lesson(db, 'b2'),
    studentId: 's1'
  }))), step('需要另約', '請假不扣課，也不贈送新課時；後續安排仍按原課包扣課。', fill(() => ({
    reason: '學校活動',
    makeup: true
  }))), step('保留同學原課堂', '凱琳留在原班次，梓晴產生獨立待安排需求。', submit, db => lesson(db, 'b2').studentIds.length === 1 && db.requests.some(r => r.makeupFor === 'b2')), step('直接安排另約需求', '管理員已確認明天五點可上課。', show('requests', db => ({
    type: 'schedule',
    request: db.requests.find(r => r.makeupFor === 'b2')
  }))), step('確認時間', '選擇已線下確認，不需要家長重複操作。', fill(() => ({
    start: '17:00',
    end: '18:00',
    teacherId: 't1',
    confirmation: 'phone'
  }))), step('另約需求完成', '待辦完成，原課堂仍可追溯請假原因。', submit, db => db.requests.find(r => r.makeupFor === 'b2').status === 'accepted')]
}, {
  id: 'invoice-fix',
  group: '異常與跟進',
  title: '誤登收款，撤銷後作廢帳單',
  duration: '約 40 秒',
  pitch: '更正有原因、有記錄，不直接刪除帳務。',
  route: '帳單 → 撤銷誤收款 → 作廢帳單 → 按需重開',
  steps: [step('開一筆課包帳單', '示範先建立浩然的十堂課包。', show('billing', () => ({
    type: 'bill',
    studentId: 's2',
    source: 'package'
  }))), step('選擇已收到款', '這一步模擬誤登收款。', fill(() => ({
    kind: 'both'
  }))), step('產生單據及課時', '餘額先變成十二堂。', submit, db => db.students.find(s => s.id === 's2').balance === 12), step('撤銷錯誤記錄', '填寫原因後扣回這筆課包，恢復待收款；這不是退款。', show('billing', db => ({
    type: 'invoiceFix',
    invoice: db.invoices[0]
  }))), step('記錄更正原因', '說明實際尚未收到款項。', fill(() => ({
    reason: '未收到款，誤選已收款'
  }))), step('課時退回兩堂', '保留原帳單和更正記錄。', submit, db => !db.invoices[0].paid && db.students.find(s => s.id === 's2').balance === 2), step('這筆購課也取消', '未收款帳單可作廢，資料仍保留。', show('billing', db => ({
    type: 'invoiceFix',
    invoice: db.invoices[0]
  }))), step('寫明取消原因', '家長取消本次購課。', fill(() => ({
    reason: '本次購課取消'
  }))), step('完成作廢', '作廢單據不再出現在待收款中。', submit, db => db.invoices[0].voided)]
}, {
  id: 'partial-days',
  group: '異常與跟進',
  title: '三天先排兩天，剩下一天繼續跟進',
  duration: '約 30 秒',
  pitch: '一個日期有困難，不耽誤其他已確定安排。',
  route: '多日需求 → 選擇本次安排 → 剩餘日期回待辦',
  steps: [step('收到三日需求', '先確認其中兩天，第三天繼續與老師協調。', show('requests', db => ({
    type: 'schedule',
    request: db.requests[0]
  }))), step('只選前兩天', '保留第三天待安排，不會把整個需求當成全部完成。', fill(() => ({
    skipped: [2],
    teachers: {
      0: 't3',
      1: 't3'
    }
  }))), step('確認部分安排', '兩堂進入課表，剩餘一天成為獨立待辦。', submit, db => db.sessions.length === 7 && db.requests.some(r => r.status === 'pending' && r.studentId === 's2' && r.days === 1)), step('回工作台跟進', '尚未安排的日期清楚保留。', show('home'))]
});
