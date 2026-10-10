/** @jsx localizedElement */
import React, { useEffect, useState } from 'react';
import { Button, Select, Tag, Alert } from 'antd';
import { PlayCircleOutlined, PauseOutlined, CloseOutlined, ReloadOutlined, ArrowRightOutlined, BookOutlined } from '@ant-design/icons';
import { localizedElement } from './language';
import { scenarios } from './scenarios';
export default function DemoPanel({
  api,
  onClose,
  onGuide
}) {
  const [id, setId] = useState(null),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [status, setStatus] = useState('idle'),
    [error, setError] = useState(''),
    [round, setRound] = useState(0),
    [speed, setSpeed] = useState(5500);
  const scenario = scenarios.find(s => s.id === id),
    step = scenario?.steps[index];
  const begin = s => {
    api.current.prepare(s);
    setId(s.id);
    setIndex(0);
    setRound(r => r + 1);
    setPlaying(true);
    setStatus('working');
    setError('');
  };
  useEffect(() => {
    if (!step) return;
    let cancelled = false;
    setStatus('working');
    setError('');
    api.current.run(step).then(() => {
      if (!cancelled) setStatus('ready');
    }).catch(e => {
      if (!cancelled) {
        setStatus('error');
        setPlaying(false);
        setError(e.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, index, round]);
  useEffect(() => {
    if (!playing || status !== 'ready' || !scenario) return;
    if (index === scenario.steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setIndex(i => i + 1), speed);
    return () => clearTimeout(timer);
  }, [playing, status, index, id, speed]);
  const leave = () => {
    setPlaying(false);
    setId(null);
    api.current.restore();
  };
  return <aside className="demo-panel" aria-label="業務場景演示面板"><div className="demo-panel-head"><div><span className="eyebrow">SHOW & TELL</span><h2>業務場景演示</h2></div><Button aria-label="退出演示面板" type="text" icon={<CloseOutlined />} onClick={() => {
        api.current.restore();
        onClose();
      }} /></div>{!scenario ? <><p className="demo-intro">一個場景一個按鈕。系統會打開真實頁面、填寫表單、確認操作，跟著右側講解即可介紹。</p><div className="sandbox-note">使用獨立臨時資料 · 不改動你原有的記錄<br />每次重播從當天的新資料開始</div><Button block icon={<BookOutlined />} onClick={onGuide}>查看操作手冊</Button><div className="demo-catalog">{['核心排課', '課消與收費', '基礎與家長', '異常與跟進'].map(group => <section key={group}><h3>{group}</h3>{scenarios.filter(s => s.group === group).map((s, i) => <button key={s.id} className="scenario-button" onClick={() => begin(s)}><span className="scenario-number">{String(scenarios.indexOf(s) + 1).padStart(2, '0')}</span><span><b>{s.title}</b><small>{s.pitch}</small><em>{s.duration} · {s.steps.length} 步</em></span><PlayCircleOutlined /></button>)}</section>)}</div><p className="demo-hint">首次介紹：先播「連續三天」，再播「課後扣課」及「續購十堂」，約兩分鐘說清核心價值。</p></> : <><div className="demo-running-title"><Tag color="green">獨立演示資料</Tag><h3>{scenario.title}</h3><p>{scenario.pitch}</p></div><div className="demo-progress"><span style={{
          width: `${(index + 1) / scenario.steps.length * 100}%`
        }} /></div><div className="demo-step-counter">步驟 {index + 1} / {scenario.steps.length}<span>{status === 'working' ? '正在操作…' : status === 'error' ? '已暫停' : playing ? '自動播放中' : index === scenario.steps.length - 1 ? '本場景已完成' : '已暫停'}</span></div><div className="demo-current-step"><h2>{step.title}</h2><p>{step.say}</p><div className="demo-route"><small>日常操作路徑</small>{scenario.route}</div></div>{error && <Alert type="error" showIcon title="操作未完成，已停止自動播放" description={error} />}<div className="demo-player"><Button icon={playing ? <PauseOutlined /> : <PlayCircleOutlined />} disabled={status === 'error' || index === scenario.steps.length - 1} onClick={() => setPlaying(x => !x)}>{playing ? '暫停講解' : '自動繼續'}</Button><Button type="primary" icon={<ArrowRightOutlined />} disabled={status === 'working' || status === 'error' || index === scenario.steps.length - 1} onClick={() => {
          setPlaying(false);
          setIndex(i => i + 1);
        }}>下一步</Button></div><div className="demo-speed"><small>每步停留</small><Select value={speed} onChange={setSpeed} options={[{
          value: 3000,
          label: '快速 · 3 秒'
        }, {
          value: 5500,
          label: '標準 · 5.5 秒'
        }, {
          value: 10000,
          label: '慢速 · 10 秒'
        }]} /></div><ol className="demo-step-list">{scenario.steps.map((s, i) => <li key={i} className={i === index ? 'active' : i < index ? 'done' : ''}><span>{i < index ? '✓' : i + 1}</span>{s.title}</li>)}</ol><div className="demo-bottom-controls"><Button icon={<ReloadOutlined />} onClick={() => begin(scenario)}>重播此場景</Button><Button onClick={leave}>返回場景列表</Button></div><small className="demo-hint">可以暫停後親自操作。若更改了流程所需資料，請重播恢復演示。</small></>}</aside>;
}
export function Handbook() {
  return <article className="demo-handbook">
    <p className="handbook-lead">第一次使用，按下面四步完成一輪教務工作。日常從「今日工作台 → 接下來要處理」查看待安排、待點名和待收款事項。</p>
    <h2>日常主線：建檔 → 排課 → 點名 → 收款</h2>
    <ol className="handbook-main">
      <li><h3>備好學生、課程和老師資料</h3><p>管理員在「學生與課時」新增學生，選擇課包扣課或按次付費；在「課程與收費」設定課程、單價及同堂人數。在「老師與可用時間」設定可教科目、年級，再填每週固定或指定日期的可用時段。已有資料可直接排課。</p></li>
      <li><h3>安排課堂，確認進入課表</h3><p>到「靈活排課 → 安排課堂」，選學生、課程、日期、時間、老師及課室，確認無衝突後儲存。可安排單次、連續多日或每週課堂；用日／週視圖核對結果。排課時不扣課時。</p><p>已有家長需求時，到「預約與調課」選擇「安排老師」。提交需求不等於預約成功，確認安排後才進入課表。</p></li>
      <li><h3>課後逐位點名，完成課堂</h3><p>老師或管理員到「考勤與課消 → 待記錄」，記錄每位學生出席、遲到、請假或缺席，再確認完成課堂。出席／遲到：課包扣 1 堂，按次付費進入待開單；請假／缺席不扣課、不產生課堂費用。</p><p>在「學生與課時 → 查看記錄」核對餘額與課消。</p></li>
      <li><h3>按計費方式收費，核對單據</h3><p><b>課包：</b>上課前可在「學生與課時 → 續購課包」購課，填堂數和價格；確認收到款項後才增加課時。課後扣課，不再重複收取該堂費用。</p><p><b>按次：</b>完成點名後，到「帳單與收款」選待開單課堂，核對金額。</p><p>未收到款，選「尚未收到，先開帳單」；實際收到全額後再「登記收款」。已收到款，可直接開帳單及收據。最後點「查看單據」，可列印或另存 PDF。</p></li>
    </ol>
    <h2>老師與家長怎麼用</h2>
    <div className="handbook-grid">
      <section><h3>老師</h3><p>「我的可用時間」維護可授課時段 →「課堂安排」查看自己的課堂 → 課後到「考勤與課消」點名。臨時不能授課，登記「這天不能上課」，由管理員跟進安排。</p></section>
      <section><h3>學生／家長</h3><p>在「孩子的學習」提出預約 → 等管理員安排 → 到「課堂安排」核對時間。改約方案需確認；課時看「孩子與課時」，帳單收據看「我的單據」。</p></section>
    </div>
    <h2>需要時再看：改約、請假與特殊處理</h2>
    <div className="handbook-branches">
      <details><summary>時間未定、多日只排部分，或出現衝突</summary><p>提出需求時可選「這段時間內都可以」，安排時使用時段推薦，再核對逐日安排。老師須符合科目、年級及可用時間，且老師、學生、課室都不能撞期。</p><p>多日需求可先確認部分日期，其餘回到待安排；直接新增課堂時，未選日期不會另建待辦。過期需求先聯絡家長確認新日期。</p></details>
      <details><summary>改時間、換老師，或調整後續系列課堂</summary><p>管理員打開「課堂詳情 → 調整時間 / 老師」。系列課堂可選「僅本次」或「本次及以後未上課的同系列」，確認影響範圍後儲存。</p><p>家長在課堂詳情點「申請調課」；小組中只移動申請的孩子。若安排與原需求不同，可發出待確認方案，或記錄已電話／線下確認。待確認方案不佔時段，確認時會再檢查空檔；時間不合適可退回重新安排。</p></details>
      <details><summary>學生請假、需要另約，或整堂取消</summary><p>管理員或家長在「課堂詳情 → 學生請假 / 另約」選學生、填原因。勾選需要另約後，管理員從待安排事項繼續排課；不額外贈送課時，同堂其他學生保持原安排。</p><p>整堂不上時，由管理員點「取消課堂」，不扣課時。只有一人請假時，使用學生請假入口。</p></details>
      <details><summary>老師臨時不能上課</summary><p>在老師的可用時間頁點「這天不能上課」，填日期、時段和原因。管理員回到「今日工作台 → 異常」，逐堂代課、改期或取消；登記停課不會自動取消課堂。</p><p>若取消停課，管理員可點「恢復」；該時段仍需符合老師原有可用時間。</p></details>
      <details><summary>課時不足，或需要改計費方式</summary><p>課時不足也先如實點名，系統記為「待補扣」。續購並收款後，會按上課日期由早至晚自動補扣；已有餘額時，也可從工作台點「補扣」。</p><p>在「學生與課時 → 計費方式」切換課包或按次，只影響新預約。已安排的課堂保留原計費方式和單價，修改課程價格也不會改動已有課堂約定。</p></details>
      <details><summary>點錯考勤、開錯帳單或誤登收款</summary><p><b>考勤：</b>管理員到已完成課堂的詳情點「更正考勤」，填原因，退回原課消後重新點名。已關聯有效帳單時，先處理帳單再更正。</p><p><b>帳單：</b>到「帳單與收款」，未收款可「作廢帳單」後重開；誤登收款先「撤銷誤收款」，再按需作廢。填寫原因，原單據和更正記錄會保留。</p><p>撤銷課包收款會扣回相應課時，餘額不足時不能直接撤銷。撤銷誤收款不代表實際退款；部分收款及真實退款暫不支援。</p></details>
      <details><summary>其他費用、折扣或附加費</summary><p>到「帳單與收款」登記收費，選「其他單項收費」並填項目、數量和單價。折扣、附加費、發行人及備註在「更多設定」中填寫，確認總額及收款狀態後再開立。</p></details>
    </div>
    <h2>此演示版的使用範圍</h2>
    <p>資料只保存在目前瀏覽器，不會跨裝置同步；角色切換供體驗使用。收款是人工記錄，不會實際扣款或發送通知；需要另外聯絡家長。</p>
    <p>目前使用通用課包，每次出席／遲到扣 1 堂，不按時長換算；不支援課包到期、凍結、轉讓和退款。</p>
    <p>想跟著操作，可開啟「場景演示」，選場景後暫停或逐步查看。演示使用臨時資料，退出會恢復原記錄；「演示與角色」中的重設資料則會清除本機新增記錄。</p>
  </article>;
}
