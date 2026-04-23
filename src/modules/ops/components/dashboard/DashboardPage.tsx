import React, { useState, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────
type Priority = 'urgent' | 'today';
type BadgeColor = 'red' | 'amber' | 'blue' | 'green' | 'purple';
type SourceType = 'inbound' | 'marketing';

interface Profile {
  dob: string;
  birthTime: string;
  job: string;
  goal: string;
  pain: string;
}

interface TimelineItem {
  icon?: string;
  action?: string;
  date?: string;
  who?: string;
  note?: string;
  isDivider?: boolean;
  label?: string;
}

interface Note {
  text: string;
  date: string;
  who: string;
}

interface Todo {
  id: number;
  priority: Priority;
  action: string;
  name: string;
  badge: string;
  badgeColor: BadgeColor;
  desc: string;
  stage: number;
  phone: string;
  email: string;
  sourceType: SourceType;
  sourceCh: string;
  color: string;
  days: number;
  testScore: number;
  testDesc: string;
  note: string;
  profile: Profile;
  courses: string[];
  timeline: TimelineItem[];
  notes: Note[];
  done: boolean;
}

// ─── Constants ────────────────────────────────────────
const S_NAMES = ['Awareness', 'Interest', 'Consideration', 'Intent', 'Enrolled', 'Retention'];
const S_ICONS = ['👁', '💡', '🤔', '🔥', '✅', '🎓'];

const FUNNEL_LAYERS = [
  { id: 'attract', label: 'Attract Visitors', color: '#6B7280', stages: [] as number[] },
  { id: 'convert', label: 'Convert Visitors', color: '#3B82F6', stages: [] as number[] },
  { id: 'nurture', label: 'Nurture Leads', color: '#8B5CF6', stages: [1, 2, 3] },
  { id: 'close', label: 'Close Customers', color: '#F59E0B', stages: [4, 5] },
  { id: 'delight', label: 'Delight Customers', color: '#059669', stages: [6] },
];

const NEXT_LABELS: Record<number, string> = {
  1: 'Đã liên hệ → Interest',
  2: 'Đang quan tâm → Consideration',
  3: 'Gần quyết định → Intent',
  4: '✅ Mark Enrolled',
  5: '→ Retention',
};

const BACK_REASONS = [
  { icon: '🤔', label: 'Cần tư vấn thêm — chưa đủ thông tin' },
  { icon: '💰', label: 'Chưa sẵn sàng tài chính' },
  { icon: '⏳', label: 'Khách cần thêm thời gian suy nghĩ' },
  { icon: '📵', label: 'Mất liên lạc tạm thời' },
  { icon: '❌', label: 'Khách đổi ý hoặc không quan tâm nữa' },
  { icon: '📝', label: 'Lý do khác (ghi chú bên dưới)' },
];

const GUIDES: Record<number, { eyebrow: string; color: string; title: string; script: string; steps: string[] }> = {
  1: { eyebrow: 'LIÊN HỆ LẦN ĐẦU', color: '#EF4444', title: 'Gọi điện — đọc hồ sơ trước',
    script: '"Dạ em là Linh từ Nedu ạ. Anh/chị có tiện nghe không ạ?"',
    steps: ['Bấm "📞 Gọi & xem hồ sơ" để đọc thông tin', 'Giới thiệu bản thân + mục đích (30 giây)', 'Hỏi về vấn đề, chưa chào hàng', 'Ghi chú trong cuộc gọi', 'Đặt lịch call tiếp'] },
  2: { eyebrow: 'NURTURING', color: '#3B82F6', title: 'Follow up cá nhân hóa',
    script: '"Em chia sẻ thêm nội dung liên quan điều anh/chị đề cập hôm trước..."',
    steps: ['Ôn lại note lần trước', 'Gửi nội dung phù hợp', 'Hỏi sâu về nhu cầu', 'Share câu chuyện học viên tương tự', 'Đề xuất tư vấn 30 phút'] },
  3: { eyebrow: 'TƯ VẤN SÂU', color: '#8B5CF6', title: 'Giải quyết băn khoăn cuối',
    script: '"Điều gì đang khiến anh/chị chưa quyết định? Em muốn giúp có đủ thông tin."',
    steps: ['Xác định băn khoăn chính', 'Share testimonial phù hợp', 'Giải thích ROI', 'Mời live preview', 'Set deadline quyết định'] },
  4: { eyebrow: 'SẮP CHỐT', color: '#D97706', title: 'Xác nhận và chốt deal',
    script: '"Anh/chị đã sẵn sàng chưa? Em giữ chỗ nha."',
    steps: ['Tóm tắt những gì đã đồng ý', 'Xác nhận thông tin thanh toán', 'Gửi số tài khoản', 'Hẹn thời điểm chuyển khoản', 'Mark Enrolled ngay khi nhận tiền'] },
  5: { eyebrow: 'RETENTION', color: '#059669', title: 'Theo dõi trải nghiệm học',
    script: '"Chào anh/chị, em muốn hỏi thăm trải nghiệm tuần đầu. Có gì cần hỗ trợ không ạ?"',
    steps: ['Check-in sau 3 ngày đầu', 'Hỏi về trải nghiệm module đầu tiên', 'Xem họ có kết nối với cộng đồng không', 'Mời tham gia hoạt động group', 'Xin testimonial nếu họ hài lòng'] },
  6: { eyebrow: 'ALUMNI', color: '#06B6D4', title: 'Kết nối vào alumni network',
    script: '"Chúc mừng anh/chị hoàn thành khóa học! Em muốn mời tham gia cộng đồng alumni."',
    steps: ['Gửi link alumni.nedu.vn', 'Giới thiệu các hoạt động cộng đồng', 'Hỏi về referral — ai trong gia đình/bạn bè cần', 'Ghi nhận testimonial', 'Theo dõi dài hạn'] },
};

const COURSES = [
  { id: 'lcm', name: 'Là Chính Mình', emoji: '🌱' },
  { id: 'adult', name: 'Adult Learning', emoji: '📚' },
  { id: 'exec', name: 'Executive Track', emoji: '🎯' },
  { id: 'short', name: 'Short Course', emoji: '⚡' },
  { id: 'corp', name: 'Corporate', emoji: '🏢' },
];

const TEAM = [
  { id: 'minh-leader', name: 'Minh Trần · Leader', role: 'leader' },
  { id: 'hoa-leader', name: 'Hoa Lê · Leader', role: 'leader' },
  { id: 'huong', name: 'Hương Nguyễn · Consultant', role: 'consultant' },
  { id: 'lan', name: 'Lan Phạm · Consultant', role: 'consultant' },
  { id: 'duc', name: 'Đức Võ · Consultant', role: 'consultant' },
];

const INITIAL_TODOS: Todo[] = [
  { id: 6, priority: 'urgent', action: 'GỌI NGAY', name: 'Lê Minh Phúc',
    badge: '🔄 Khách cũ 3 năm', badgeColor: 'amber',
    desc: 'Từng hỏi 2022 rồi lặn. Đọc lịch sử trước khi gọi!',
    stage: 1, phone: '0908 777 123', email: 'phuc.lm@gmail.com',
    sourceType: 'inbound', sourceCh: 'nedu.vn/test', color: '#8B5CF6', days: 0,
    testScore: 68, testDesc: 'Điểm tăng 51→68 (2022→2026). Sẵn sàng hơn rồi.',
    note: '', profile: { dob: '19/07/1987', birthTime: '', job: 'Giáo viên THPT', goal: '', pain: '' },
    courses: ['lcm'],
    timeline: [
      { icon: '☑️', action: 'Tick "cho tư vấn" — lần 2', date: '06/04/2026 08:15', who: 'System', note: '' },
      { icon: '🧩', action: 'Bài test lần 2 — điểm 68', date: '06/04/2026 08:10', who: 'System', note: 'Tăng từ 51 lên 68 sau 3 năm' },
      { isDivider: true, label: '── 3 năm trước · 2022 ──' },
      { icon: '📞', action: 'Tư vấn lần 1 — 2022', date: '15/03/2022 10:00', who: 'Hương Nguyễn', note: 'Nói "chưa sẵn sàng tài chính, để sau". Giọng có áp lực gia đình.' },
      { icon: '🧩', action: 'Bài test lần 1 — điểm 51', date: '12/03/2022', who: 'System', note: '' },
    ],
    notes: [{ text: 'Khách cũ — lần đầu do áp lực gia đình. Lần này TỰ quay lại. Hỏi ngay: "Điều gì thay đổi trong 3 năm?" trước khi pitch.', date: '06/04/2026', who: 'Hương Nguyễn (2022)' }],
    done: false },

  { id: 1, priority: 'urgent', action: 'GỌI NGAY', name: 'Nguyễn Văn Hùng',
    badge: '⚠ Quá hạn 26h', badgeColor: 'red',
    desc: 'Chưa được liên hệ từ hôm qua.',
    stage: 1, phone: '0987 654 321', email: 'hung.nv@hotmail.com',
    sourceType: 'inbound', sourceCh: 'nedu.vn/test', color: '#EF4444', days: 1,
    testScore: 61, testDesc: 'Áp lực công việc cao, muốn thay đổi.',
    note: '', profile: { dob: '', birthTime: '', job: '', goal: '', pain: '' },
    courses: [],
    timeline: [
      { icon: '☑️', action: 'Tick "cho tư vấn"', date: '05/04/2026 07:30', who: 'System', note: '' },
      { icon: '🧩', action: 'Hoàn thành bài test', date: '05/04/2026 07:25', who: 'System', note: '' },
    ],
    notes: [], done: false },

  { id: 7, priority: 'urgent', action: 'GỌI NGAY', name: 'Vũ Thị Phương',
    badge: '📢 Marketing campaign', badgeColor: 'blue',
    desc: 'Từ Facebook Ads Tháng 4. Marketing team đã thu thập email.',
    stage: 1, phone: '0976 543 210', email: 'phuong.vt@gmail.com',
    sourceType: 'marketing', sourceCh: 'Facebook Ads · Campaign T4/2026', color: '#3B82F6', days: 0,
    testScore: 0, testDesc: 'Chưa làm bài test — đến từ Marketing trực tiếp.',
    note: 'Lead từ Marketing team. Chưa làm test. Cần thu thập thêm thông tin cơ bản.',
    profile: { dob: '', birthTime: '', job: '', goal: '', pain: '' },
    courses: [],
    timeline: [
      { icon: '📢', action: 'Lead từ Facebook Ads Campaign', date: '06/04/2026 06:00', who: 'Marketing Team', note: 'UTM: fb_ads_lcm_t4_2026. Điền form landing page quảng cáo.' },
    ],
    notes: [], done: false },

  { id: 4, priority: 'today', action: 'TƯ VẤN', name: 'Hoàng Văn Nam',
    badge: '💬 Objection giá', badgeColor: 'amber',
    desc: 'Dùng Personal Profile để xử lý đúng góc độ CEO.',
    stage: 3, phone: '0945 321 098', email: 'nam.hv@company.com',
    sourceType: 'inbound', sourceCh: 'nedu.vn/test', color: '#06B6D4', days: 8,
    testScore: 74, testDesc: 'Thành đạt tài chính nhưng trống rỗng bên trong.',
    note: 'Đọc Personal Profile trước khi gọi — có profile đầy đủ.',
    profile: { dob: '10/03/1985', birthTime: '14:30', job: 'CEO Startup', goal: 'Tìm lại ý nghĩa', pain: 'Cô đơn trong vai trò CEO' },
    courses: ['lcm', 'exec'],
    timeline: [
      { icon: '📞', action: 'Tư vấn lần 2 — objection giá', date: '04/04/2026 14:20', who: 'Linh Nguyễn', note: 'Nói 70M nhiều. Giải thích community + 1-on-1 NhiLe. "Sẽ suy nghĩ". → Dùng góc ROI lần sau.' },
      { icon: '📞', action: 'Tư vấn lần 1', date: '01/04/2026 10:00', who: 'Linh Nguyễn', note: '45 phút. Nhiệt tình. Quan tâm leadership mindset.' },
    ],
    notes: [{ text: 'Đừng dùng góc "cảm xúc" với anh này — anh là CEO phân tích ROI. Lần sau mở bằng: "Anh muốn đội nhóm nói thật với anh không?"', date: '04/04/2026', who: 'Linh Nguyễn' }],
    done: false },

  { id: 5, priority: 'today', action: 'CHỐT DEAL', name: 'Đặng Thị Thu',
    badge: '💳 Chờ chuyển khoản', badgeColor: 'green',
    desc: 'Lương về ngày 15. Nhắn hỏi thăm nhẹ.',
    stage: 4, phone: '0977 543 210', email: 'thu.dang@gmail.com',
    sourceType: 'inbound', sourceCh: 'nedu.vn/test', color: '#8B5CF6', days: 11,
    testScore: 77, testDesc: 'Burnout nặng sau 5 năm.',
    note: 'Chị đã quyết định. Chờ lương.',
    profile: { dob: '07/11/1992', birthTime: '08:15', job: 'Marketing Manager', goal: 'Thoát burnout', pain: 'Mất niềm vui sống' },
    courses: ['lcm'],
    timeline: [
      { icon: '💬', action: 'Confirm ngày thanh toán', date: '06/04/2026 08:00', who: 'Linh Nguyễn', note: 'Lương về 15/4, chuyển liền.' },
      { icon: '📞', action: 'Call chốt', date: '04/04/2026 19:30', who: 'Linh Nguyễn', note: '45 phút. Rất quyết tâm.' },
    ],
    notes: [{ text: 'Chị ĐÃ quyết định — KHÔNG tư vấn thêm. Chỉ nhắn hỏi thăm nhẹ nhàng, tránh tạo áp lực. Đợi 15/4.', date: '04/04/2026', who: 'Linh Nguyễn' }],
    done: false },
];

const KPI_TEAM = [
  { rank: '🥇', name: 'Minh Trần', role: 'Leader · Team Alpha', enrolled: 5, target: 8, rev: '350M', pct: 62.5, color: '#F59E0B', isMe: false, needsHelp: false, badge: null },
  { rank: '🥈', name: 'Linh Nguyễn', role: 'Consultant · Team Alpha', enrolled: 3, target: 6, rev: '210M', pct: 50, color: '#059669', isMe: true, needsHelp: false, badge: '⭐ Đang tăng tốc' },
  { rank: '🥉', name: 'Hà Phạm', role: 'Consultant · Team Beta', enrolled: 1, target: 5, rev: '70M', pct: 20, color: '#DC2626', isMe: false, needsHelp: true, badge: '🆘 Cần hỗ trợ' },
];

function nowStr() {
  return new Date().toLocaleString('vi-VN');
}

function getFunnelLayer(stage: number) {
  return FUNNEL_LAYERS.find(l => l.stages.includes(stage)) || FUNNEL_LAYERS[2];
}

// ─── Main Component ───────────────────────────────────
export const DashboardPage: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [activeId, setActiveId] = useState<number | null>(6);
  const [guideChecks, setGuideChecks] = useState<Record<number, Record<number, boolean>>>({});
  const [showBack, setShowBack] = useState(false);
  const [backReasonIdx, setBackReasonIdx] = useState<number | null>(null);
  const [showCall, setShowCall] = useState(false);
  const [callId, setCallId] = useState<number | null>(null);
  const [callTab, setCallTab] = useState<'info' | 'profile'>('info');
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollId, setEnrollId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<'transfer' | 'card' | 'wallet'>('transfer');
  const [showXfer, setShowXfer] = useState(false);
  const [xferTab, setXferTab] = useState<'transfer' | 'codeal'>('transfer');
  const [splitMe, setSplitMe] = useState(70);
  const [showKpi, setShowKpi] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [winLead, setWinLead] = useState<Todo | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [bcOther, setBcOther] = useState('');
  const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const activeTodo = todos.find(t => t.id === activeId) ?? null;
  const urgent = todos.filter(t => t.priority === 'urgent');
  const today = todos.filter(t => t.priority === 'today');
  const urgentActive = urgent.filter(t => !t.done).length;
  const todayActive = today.filter(t => !t.done).length;
  const loadPct = Math.round((todos.filter(t => t.done).length / todos.length) * 100);

  // Effects
  useEffect(() => { setActiveId(6); }, []);

  function selectTodo(id: number) { setActiveId(id); }

  function toggleDone(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function toggleGuide(todoId: number, stepIdx: number) {
    setGuideChecks(prev => ({
      ...prev,
      [todoId]: { ...(prev[todoId] || {}), [stepIdx]: !prev[todoId]?.[stepIdx] },
    }));
  }

  function doNext() {
    const t = todos.find(x => x.id === activeId);
    if (!t || t.stage >= 6) return;
    if (t.stage === 4) { setEnrollId(t.id); setShowEnroll(true); return; }
    const newStage = t.stage + 1;
    setTodos(prev => prev.map(x => x.id === activeId
      ? { ...x, stage: newStage, timeline: [{ icon: S_ICONS[newStage - 1], action: `Chuyển sang ${S_NAMES[newStage - 1]}`, date: nowStr(), who: 'Linh Nguyễn', note: '' }, ...x.timeline] }
      : x));
  }

  function confirmBack() { if (!activeTodo || activeTodo.stage <= 1) return; setBackReasonIdx(null); setBcOther(''); setShowBack(true); }
  function closeBack() { setShowBack(false); setBackReasonIdx(null); setBcOther(''); }

  function executeBack() {
    const t = todos.find(x => x.id === activeId);
    if (!t || t.stage <= 1) { closeBack(); return; }
    let reason = backReasonIdx !== null ? BACK_REASONS[backReasonIdx].label : 'Không rõ lý do';
    if (backReasonIdx === 5 && bcOther.trim()) reason = bcOther.trim();
    const newStage = t.stage - 1;
    setTodos(prev => prev.map(x => x.id === activeId
      ? { ...x, stage: newStage, timeline: [{ icon: '↩️', action: `Lùi về ${S_NAMES[newStage - 1]}`, date: nowStr(), who: 'Linh Nguyễn', note: `Lý do: ${reason}` }, ...x.timeline] }
      : x));
    closeBack();
  }

  function confirmEnroll() {
    const t = todos.find(x => x.id === (enrollId || activeId));
    if (!t) return;
    setTodos(prev => prev.map(x => x.id === t.id
      ? { ...x, stage: 5, done: true, timeline: [{ icon: '✅', action: 'Enrolled!', date: nowStr(), who: 'Linh Nguyễn', note: 'Đã xác nhận enrolled thành công.' }, ...x.timeline] }
      : x));
    setShowEnroll(false);
    setWinLead(t);
    setShowWin(true);
  }

  function sendNote(todoId: number) {
    const text = (noteInputs[todoId] || '').trim();
    if (!text) return;
    setTodos(prev => prev.map(x => x.id === todoId
      ? { ...x, notes: [{ text, date: new Date().toLocaleDateString('vi-VN'), who: 'Linh Nguyễn' }, ...x.notes] }
      : x));
    setNoteInputs(prev => ({ ...prev, [todoId]: '' }));
  }

  // ─── Left Panel Item ──────────────────────────────
  function renderItem(t: Todo) {
    const isA = t.id === activeId;
    const uc = t.priority === 'urgent' ? 'urgent' : t.badgeColor === 'amber' ? 'warn' : '';
    const bbMap: Record<BadgeColor, string> = { red: 'var(--red-b)', amber: 'var(--amber-b)', blue: 'var(--blue-b)', green: 'var(--green-b)', purple: 'var(--purple-b)' };
    const bcMap: Record<BadgeColor, string> = { red: 'var(--red)', amber: 'var(--amber)', blue: 'var(--blue)', green: 'var(--green)', purple: 'var(--purple)' };
    const isMarketing = t.sourceType === 'marketing';
    return (
      <div key={t.id} className={`action-item ${uc} ${isA ? 'active' : ''} ${t.done ? 'done' : ''}`} onClick={() => selectTodo(t.id)}>
        <div className={`ai-check ${t.done ? 'checked' : ''}`} onClick={e => toggleDone(e, t.id)} />
        <div className="ai-body">
          <div className="ai-action">{t.action}</div>
          <div className="ai-name">{t.name}</div>
          <div className="ai-desc">{t.desc}</div>
          <div className="ai-badges">
            <span className="ai-badge" style={{ background: bbMap[t.badgeColor], color: bcMap[t.badgeColor] }}>{t.badge}</span>
            <span className="ai-badge" style={{ background: isMarketing ? 'var(--blue-b)' : 'var(--stone)', color: isMarketing ? 'var(--blue)' : 'var(--t3)' }}>
              {isMarketing ? '📢 Marketing' : '🌐 Inbound'}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 14, opacity: .3, flexShrink: 0, marginTop: 2 }}>›</div>
      </div>
    );
  }

  // ─── Stage Nav ────────────────────────────────────
  function renderStageNav(t: Todo) {
    const btnNextClass = t.stage === 4 ? 'sn-next enroll-stage' : t.stage === 3 ? 'sn-next close-stage' : 'sn-next';
    const btnNextLabel = t.stage >= 6 ? 'Cuối funnel ✓' : t.stage === 4 ? '✅ Mark Enrolled' : (NEXT_LABELS[t.stage] || '→');
    const btnBackLabel = t.stage <= 1 ? '← Đầu funnel' : `← ${S_NAMES[t.stage - 2]}`;
    return (
      <div className="stage-nav">
        <button className="sn-back" disabled={t.stage <= 1} onClick={confirmBack}>{btnBackLabel}</button>
        <div className="sn-stages">
          {S_NAMES.map((s, i) => {
            const n = i + 1;
            const done = n < t.stage;
            const cur = n === t.stage;
            return (
              <div key={n} className={`sn-step ${done ? 'done' : ''} ${cur ? 'current' : ''}`}>
                <div className="sn-dot">{done ? '✓' : cur ? S_ICONS[i] : n}</div>
                <div className="sn-label">{s}</div>
              </div>
            );
          })}
        </div>
        <button className={btnNextClass} disabled={t.stage >= 6} onClick={doNext}>{btnNextLabel}</button>
      </div>
    );
  }

  // ─── Funnel Bar ───────────────────────────────────
  function renderFunnelBar(t: Todo) {
    return (
      <div className="funnel-bar">
        {FUNNEL_LAYERS.map((l, i) => {
          const isCur = l.stages.includes(t.stage);
          const isPast = l.id === 'attract' || l.id === 'convert';
          const style = isCur ? { color: l.color, borderBottomColor: l.color } : undefined;
          const cls = `fb-layer${isCur ? ' active' : ''}${isPast ? ' past' : ''}`;
          const dotColor = isCur ? l.color : isPast ? 'var(--green)' : 'var(--stone2)';
          const tag = l.id === 'attract'
            ? <span style={{ fontSize: 8, background: 'rgba(107,114,128,.1)', padding: '1px 5px', borderRadius: 4, color: 'var(--t3)', marginLeft: 3 }}>future</span>
            : l.id === 'convert'
            ? <span style={{ fontSize: 8, background: 'var(--blue-s)', padding: '1px 5px', borderRadius: 4, color: 'var(--blue)', marginLeft: 3 }}>nedu.vn</span>
            : null;
          return (
            <React.Fragment key={l.id}>
              {i > 0 && <span className="fb-arr">›</span>}
              <div className={cls} style={style}>
                <span className="fb-dot" style={{ background: dotColor }} />
                {l.label}{tag}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // ─── Hero ─────────────────────────────────────────
  function renderHero(t: Todo) {
    const isMarketing = t.sourceType === 'marketing';
    const srcBg = isMarketing ? 'var(--blue-s)' : 'var(--green-s)';
    const srcBr = isMarketing ? 'var(--blue-b)' : 'var(--green-b)';
    const srcCl = isMarketing ? 'var(--blue)' : 'var(--green)';
    const srcLbl = isMarketing ? `📢 Marketing · ${t.sourceCh}` : `🌐 Inbound · ${t.sourceCh}`;
    const courseBadges = (t.courses || []).map(cid => {
      const c = COURSES.find(x => x.id === cid);
      return c ? <div key={cid} className="course-badge">{c.emoji} {c.name}</div> : null;
    });
    return (
      <div className="lead-hero">
        <div className="lh-row">
          <div className="lh-avatar" style={{ background: t.color }}>{t.name.split(' ').pop()![0]}</div>
          <div className="lh-meta">
            <div className="lh-name">{t.name}</div>
            <div className="lh-contact">
              <span>📞 {t.phone}</span><span>📧 {t.email}</span>
            </div>
            <div className="lh-tags">
              <span className="lh-tag" style={{ background: srcBg, border: `1px solid ${srcBr}`, color: srcCl }}>{srcLbl}</span>
              <span className="lh-tag" style={{ background: 'var(--stone)', border: '1px solid var(--stone2)', color: 'var(--t2)' }}>{t.days === 0 ? 'Hôm nay' : `${t.days} ngày trước`}</span>
              {t.testScore > 0
                ? <span className="lh-tag" style={{ background: 'var(--green-s)', border: '1px solid var(--green-b)', color: 'var(--nedu)' }}>Test: {t.testScore}/100</span>
                : <span className="lh-tag" style={{ background: 'var(--amber-s)', border: '1px solid var(--amber-b)', color: 'var(--amber)' }}>⚠ Chưa làm test</span>}
            </div>
            {courseBadges.length > 0 && <div className="course-badges">{courseBadges}</div>}
          </div>
          <div className="lh-actions">
            {t.stage <= 5 && <button className="btn btn-call btn-sm" onClick={() => { setCallId(t.id); setShowCall(true); setCallTab('info'); }}>📞 Gọi & Hồ sơ</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowXfer(true); setXferTab('transfer'); }}>↔ Co-deal</button>
            {t.stage === 4 && <button className="btn btn-primary btn-sm" onClick={() => { setEnrollId(t.id); setShowEnroll(true); }}>✅ Mark Enrolled</button>}
          </div>
        </div>
      </div>
    );
  }

  // ─── Body ─────────────────────────────────────────
  function renderBody(t: Todo) {
    const guide = GUIDES[t.stage];
    const profileFilled = Object.values(t.profile).filter(Boolean).length;
    const profilePct = Math.round((profileFilled / 5) * 100);
    const checks = guideChecks[t.id] || {};

    const phHtml = profilePct >= 60
      ? <div className="profile-hint"><div className="ph-label" style={{ color: 'var(--purple)' }}>✨ Hồ sơ {profilePct}% — xem trong "Gọi &amp; Hồ sơ"</div><div className="ph-text">Điền đầy đủ ngày sinh + giờ sinh để <strong>tạo Personal Profile AI</strong>.</div></div>
      : <div className="profile-hint"><div className="ph-label">🧩 Hồ sơ {profilePct}%</div><div className="ph-text">Điền thêm khi gọi → nhấn <strong>✨ Tạo Personal Profile</strong> để AI tổng hợp cách tư vấn.</div></div>;

    const mktNote = t.sourceType === 'marketing'
      ? <div style={{ background: 'var(--blue-s)', border: '1.5px solid var(--blue-b)', borderRadius: 'var(--rads)', padding: '11px 13px', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--blue)', fontFamily: 'var(--mono)', letterSpacing: '.1em', marginBottom: 5 }}>📢 Lead từ Marketing Team</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>Lead này được Marketing team tạo từ <strong>{t.sourceCh}</strong>. Họ <strong>chưa qua bài test nedu.vn</strong> — cần thu thập thêm thông tin cơ bản.</div>
        </div>
      : null;

    const noteInput = noteInputs[t.id] ?? '';

    return (
      <div className="center-body">
        {t.testScore > 0 && (
          <div className="test-pill">
            <div className="tp-score">{t.testScore}</div>
            <div><div className="tp-label">🧩 Điểm bài test</div><div className="tp-text">{t.testDesc}</div></div>
          </div>
        )}
        {mktNote}
        {phHtml}
        {guide && (
          <div className="guide-card" style={{ borderColor: guide.color + '30', borderLeft: `4px solid ${guide.color}` }}>
            <div className="gc-eyebrow" style={{ color: guide.color }}>
              <span style={{ display: 'block', width: 3, height: 11, background: guide.color, borderRadius: 2 }} />
              {guide.eyebrow}
            </div>
            <div className="gc-title">{guide.title}</div>
            <div className="gc-script" dangerouslySetInnerHTML={{ __html: guide.script }} />
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', fontFamily: 'var(--mono)', marginBottom: 6 }}>📋 Checklist</div>
            <div className="guide-list">
              {guide.steps.map((s, i) => (
                <div key={i} className={`guide-item ${checks[i] ? 'checked' : ''}`} onClick={() => toggleGuide(t.id, i)}>
                  <div className="gi-box" />
                  <div className="gi-text">{s}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="history-card">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)', marginBottom: 10 }}>🕐 Lịch sử liên hệ</div>
          {t.timeline.map((tl, i) => {
            if (tl.isDivider) return <div key={i} className="tl-divider">{tl.label}</div>;
            return (
              <div key={i} className="tl-item">
                <div className="tl-icon">{tl.icon}</div>
                <div className="tl-main">
                  <div className="tl-top">
                    <div className="tl-action">{tl.action}</div>
                    {tl.who && tl.who !== 'System' && <div className="tl-who">✍ {tl.who}</div>}
                  </div>
                  <div className="tl-date">{tl.date}</div>
                  {tl.note && <div className="tl-note">{tl.note}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Messenger Notes */}
        <div className="nm-box">
          <div className="nm-header">
            <div className="nm-pulse" />
            <div className="nm-hdr-text">
              <div className="nm-title">Ghi chú tư vấn</div>
              <div className="nm-sub">Chỉ team mới thấy — dùng để truyền context</div>
            </div>
            <div className="nm-count">{t.notes.length}</div>
          </div>
          <div className="nm-list">
            {t.notes.length === 0
              ? <div className="nm-empty">Chưa có ghi chú nào — thêm ngay sau cuộc gọi</div>
              : t.notes.map((n, i) => (
                <div key={i} className="nm-bubble">
                  <div className="nm-btext">{n.text}</div>
                  <div className="nm-bmeta">
                    <div className="nm-bwho">✍ {n.who}</div>
                    <div className="nm-btime">{n.date}</div>
                  </div>
                </div>
              ))}
          </div>
          <div className="nm-input-bar">
            <textarea
              ref={noteInputRef}
              className="nm-input"
              rows={1}
              placeholder="Ghi chú sau cuộc gọi... (Enter để gửi)"
              value={noteInput}
              onChange={e => setNoteInputs(prev => ({ ...prev, [t.id]: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNote(t.id); } }}
            />
            <button className="nm-send" onClick={() => sendNote(t.id)}>➤</button>
          </div>
        </div>
        <div style={{ height: 12 }} />
      </div>
    );
  }

  // ─── Call Screen ──────────────────────────────────
  const callTodo = todos.find(t => t.id === callId);

  // ─── KPI Content ─────────────────────────────────
  function renderKpi() {
    return (
      <div className="kpi-body">
        <div className="kpi-month-bar">
          <div className="kmb-row"><div className="kmb-label">Tháng 4/2026 · Team Nedu</div><div className="kmb-pct">42%</div></div>
          <div className="kmb-track"><div className="kmb-fill" style={{ width: '42%' }} /></div>
          <div className="kmb-details"><span>3/8 enrolled</span><span>Còn 5 để đạt target</span></div>
        </div>
        <div className="kpi-stats-row">
          {[
            { n: '7', l: 'Leads đang xử lý' },
            { n: '3', l: 'Enrolled tháng này' },
            { n: '42%', l: 'Tỷ lệ chuyển đổi' },
            { n: '210M', l: 'Doanh thu (₫)' },
          ].map((s, i) => (
            <div key={i} className="kpi-stat">
              <div className="ks-n" style={{ color: i === 1 ? 'var(--nedu)' : i === 3 ? 'var(--blue)' : 'var(--t1)' }}>{s.n}</div>
              <div className="ks-l">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="kpi-board">
          {KPI_TEAM.map((m, i) => (
            <div key={i} className={`kb-row ${m.isMe ? 'me' : ''} ${m.needsHelp ? 'help' : ''}`}>
              <div className="kb-rank">{m.rank}</div>
              <div className="kb-avatar" style={{ background: m.color }}>{m.name[0]}</div>
              <div className="kb-info">
                <div className="kb-name">{m.name} {m.isMe && <span style={{ fontSize: 10, background: 'var(--green-b)', color: 'var(--nedu)', padding: '1px 6px', borderRadius: 8 }}>Bạn</span>}</div>
                <div className="kb-role">{m.role}</div>
                <div className="kb-bar"><div className="kb-bar-fill" style={{ width: `${m.pct}%`, background: m.color }} /></div>
                <div className="kb-bar-lbl"><span>{m.enrolled} enrolled</span><span>{m.pct}%</span></div>
                {m.badge && <div className="kb-badge-row"><span className="kbadge" style={{ background: m.isMe ? 'var(--green-b)' : 'var(--red-s)', color: m.isMe ? 'var(--nedu)' : 'var(--red)' }}>{m.badge}</span></div>}
              </div>
              <div className="kb-right">
                <div className="kb-enrolled">{m.enrolled}</div>
                <div className="kb-target-lbl">/ {m.target} target</div>
                <div className="kb-rev">{m.rev} ₫</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Funnel Mini update ───────────────────────────
  function funnelMiniStep(layerId: string) {
    if (!activeTodo) return false;
    return getFunnelLayer(activeTodo.stage).id === layerId;
  }

  // ─── Render ───────────────────────────────────────
  return (
    <>
      {/* TOPBAR */}
      <div className="topbar">
        <div className="logo">Nedu<span>ops</span></div>
        <div className="tb-spacer" />
        <div className="funnel-mini">
          {FUNNEL_LAYERS.map(l => {
            const isActive = funnelMiniStep(l.id);
            return (
              <div key={l.id} className={`fm-step ${isActive ? 'active' : ''}`} style={isActive ? { background: l.color } : undefined}>
                {l.id.toUpperCase()}
              </div>
            );
          })}
        </div>
        <div style={{ width: 8 }} />
        <div className="tb-greeting">Chào sáng, <em>Linh</em> ☀️</div>
        <div style={{ width: 8 }} />
        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setShowKpi(true)}>📊 Team KPI</button>
        <div style={{ width: 6 }} />
        <div className="tb-avatar">L</div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="layout">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="lp-header">
            <div className="lp-date">{todayStr}</div>
            <div className="lp-title">Hôm nay cần làm</div>
            <div className="load-bar-wrap">
              <div className="lb-row">
                <span className="lb-label">Tải công việc</span>
                <span className="lb-num" style={{ color: 'var(--amber)' }}>{todos.filter(t => t.done).length}<span style={{ fontSize: 10, color: 'var(--t3)' }}>/{todos.length}</span></span>
              </div>
              <div className="lb-track"><div className="lb-fill" style={{ width: `${loadPct}%` }} /></div>
            </div>
          </div>
          <div className="section-label">
            <div className="sl-dot" style={{ background: 'var(--red)' }} />
            Khẩn cấp
            <div className="sl-count" style={{ background: 'var(--red-s)', color: 'var(--red)' }}>{urgentActive}</div>
          </div>
          <div className="action-list">
            {urgent.map(t => renderItem(t))}
            <div className="section-label">
              <div className="sl-dot" style={{ background: 'var(--amber)' }} />
              Hôm nay
              <div className="sl-count">{todayActive}</div>
            </div>
            {today.map(t => renderItem(t))}
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="center-panel">
          {!activeTodo ? (
            <div className="empty-state">
              <div className="es-icon">👆</div>
              <div className="es-title">Chọn một công việc</div>
              <div className="es-sub">Click vào lead để xem hướng dẫn từng bước</div>
            </div>
          ) : (
            <div className="lead-view">
              {renderHero(activeTodo)}
              {renderFunnelBar(activeTodo)}
              {renderStageNav(activeTodo)}
              {renderBody(activeTodo)}
            </div>
          )}
        </div>
      </div>

      {/* ── BACK REASON POPOVER ── */}
      <div className={`back-popover ${showBack ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) closeBack(); }}>
        <div className="back-card">
          <div className="bc-icon">↩️</div>
          <div className="bc-title">Lùi về {activeTodo && activeTodo.stage > 1 ? S_NAMES[activeTodo.stage - 2] : ''}?</div>
          <div className="bc-sub">Chọn lý do — người kế tiếp sẽ đọc được điều này</div>
          <div className="bc-reasons">
            {BACK_REASONS.map((r, i) => (
              <div key={i} className={`bc-reason ${backReasonIdx === i ? 'selected' : ''}`} onClick={() => setBackReasonIdx(i)}>
                <span style={{ fontSize: 16 }}>{r.icon}</span><span>{r.label}</span>
              </div>
            ))}
          </div>
          {backReasonIdx === 5 && (
            <textarea className="bc-other show" placeholder="Mô tả lý do cụ thể..." value={bcOther} onChange={e => setBcOther(e.target.value)} />
          )}
          <div className="bc-btns">
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={closeBack}>Hủy</button>
            <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={executeBack}>↩ Xác nhận lùi</button>
          </div>
        </div>
      </div>

      {/* ── CALL SCREEN ── */}
      <div className={`call-overlay ${showCall ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowCall(false); }}>
        <div className="call-screen">
          {callTodo && (
            <>
              <div className="cs-header">
                <button className="cs-back-btn" onClick={() => setShowCall(false)}>←</button>
                <div className="cs-av" style={{ background: callTodo.color + '44' }}>{callTodo.name.split(' ').pop()![0]}</div>
                <div>
                  <div className="cs-nm">{callTodo.name}</div>
                  <div className="cs-info">{callTodo.sourceCh} · {callTodo.days === 0 ? 'hôm nay' : callTodo.days + 'ng'}</div>
                </div>
                <div className="cs-phone"><div className="cs-dot" /><div className="cs-pnum">{callTodo.phone}</div></div>
              </div>
              <div className="cs-tabs">
                <div className={`cs-tab ${callTab === 'info' ? 'on' : ''}`} onClick={() => setCallTab('info')}>📋 Hồ Sơ</div>
                <div className={`cs-tab ${callTab === 'profile' ? 'on' : ''}`} onClick={() => setCallTab('profile')}>✨ Personal Profile</div>
              </div>
              <div className="cs-prog">
                <div className="csp-lbl">Hồ sơ</div>
                <div className="csp-bar">
                  <div className="csp-fill" style={{ width: `${Math.round((Object.values(callTodo.profile).filter(Boolean).length / 5) * 100)}%` }} />
                </div>
                <div className="csp-pct">{Math.round((Object.values(callTodo.profile).filter(Boolean).length / 5) * 100)}%</div>
              </div>
              <div className={`cs-body ${callTab === 'info' ? 'on' : ''}`}>
                <div className="cs-prof-col">
                  {callTodo.name.trim().split(/\s+/).length < 3 && (
                    <div className="name-warn">⚠️ <span>Nhắc hỏi <strong>họ tên đầy đủ</strong> để tính Thần số học</span></div>
                  )}
                  <div className="ps-sec">
                    <div className="ps-title filled">📋 Thông tin cơ bản</div>
                    {[
                      { label: 'Họ và tên', icon: '👤', val: callTodo.name },
                      { label: 'Điện thoại', icon: '📞', val: callTodo.phone },
                      { label: 'Email', icon: '📧', val: callTodo.email },
                    ].map((f, i) => (
                      <div key={i} className="pf-item filled">
                        <div className="pf-icon">{f.icon}</div>
                        <div className="pf-content"><div className="pf-lbl">{f.label}</div><div className="pf-val">{f.val}</div></div>
                        <div className={`pf-tick y`}>✓</div>
                      </div>
                    ))}
                  </div>
                  <div className="ps-sec">
                    <div className={`ps-title ${Object.values(callTodo.profile).every(Boolean) ? 'filled' : ''}`}>🧩 Hồ sơ cá nhân — điền khi gọi</div>
                    {[
                      { key: 'dob' as keyof Profile, label: 'Ngày sinh', icon: '🎂' },
                      { key: 'birthTime' as keyof Profile, label: 'Giờ sinh', icon: '🕐' },
                      { key: 'job' as keyof Profile, label: 'Nghề nghiệp', icon: '💼' },
                      { key: 'goal' as keyof Profile, label: 'Mục tiêu', icon: '🎯' },
                      { key: 'pain' as keyof Profile, label: 'Vấn đề chính', icon: '💬' },
                    ].map(f => {
                      const val = callTodo.profile[f.key];
                      return (
                        <div key={f.key} className={`pf-item ${val ? 'filled' : ''}`}>
                          <div className="pf-icon">{f.icon}</div>
                          <div className="pf-content">
                            <div className="pf-lbl">{f.label}</div>
                            <div className="pf-val">{val || <span style={{ color: 'var(--t4)', fontWeight: 400 }}>Chưa có</span>}</div>
                          </div>
                          <div className={`pf-tick ${val ? 'y' : 'n'}`}>{val ? '✓' : '?'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="cs-hist-col">
                  <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--t2)', marginBottom: 10 }}>🕐 Lịch sử</div>
                  {callTodo.timeline.map((tl, i) => {
                    if (tl.isDivider) return <div key={i} className="tl-divider">{tl.label}</div>;
                    return (
                      <div key={i} className="tl-item">
                        <div className="tl-icon">{tl.icon}</div>
                        <div className="tl-main">
                          <div className="tl-top"><div className="tl-action">{tl.action}</div>{tl.who && tl.who !== 'System' && <div className="tl-who">✍ {tl.who}</div>}</div>
                          <div className="tl-date">{tl.date}</div>
                          {tl.note && <div className="tl-note">{tl.note}</div>}
                        </div>
                      </div>
                    );
                  })}
                  <div className="qn-box">
                    <div className="qn-lbl">Ghi chú nhanh</div>
                    <textarea className="qn-ta" placeholder="Ghi chú trong cuộc gọi..." rows={3} />
                    <div className="qn-foot">
                      <button className="btn btn-primary btn-sm">💾 Lưu ghi chú</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`cs-body ${callTab === 'profile' ? 'on' : ''}`} style={{ display: callTab === 'profile' ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
                <div style={{ fontSize: 40, filter: 'grayscale(1)', opacity: .25 }}>✨</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t2)' }}>Personal Profile chưa có</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', maxWidth: 220, lineHeight: 1.6 }}>Điền đầy đủ ngày sinh + giờ sinh để AI tạo profile tư vấn</div>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', background: 'var(--stone)', borderRadius: 7, padding: '6px 11px', color: 'var(--t2)' }}>Cần: ngày sinh + giờ sinh</div>
              </div>
              <div className="cs-foot">
                <div className="cf-tip">💡 Điền ngày sinh + giờ sinh → <strong>Tạo Personal Profile tự động</strong></div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCall(false)}>Đóng</button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCall(false)}>💾 Lưu & Đóng</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TRANSFER / CO-DEAL ── */}
      <div className={`xfer-ov ${showXfer ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowXfer(false); }}>
        <div className="xfer-modal">
          <div style={{ fontSize: 26, marginBottom: 8 }}>↔️</div>
          <div className="xm-title">Chuyển case / Co-deal</div>
          <div className="xm-sub">{activeTodo?.name || 'Đang xử lý lead này'}</div>
          <div className="xm-tabs">
            <div className={`xm-tab ${xferTab === 'transfer' ? 'on' : ''}`} onClick={() => setXferTab('transfer')}>↔ Chuyển case</div>
            <div className={`xm-tab ${xferTab === 'codeal' ? 'on' : ''}`} onClick={() => setXferTab('codeal')}>🤝 Co-deal</div>
          </div>
          {xferTab === 'transfer' && (
            <div className="xm-section on">
              <div className="xm-label">Chuyển cho ai?</div>
              <select className="xm-select">
                <optgroup label="Leaders">
                  {TEAM.filter(t => t.role === 'leader').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </optgroup>
                <optgroup label="Consultants">
                  {TEAM.filter(t => t.role === 'consultant').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </optgroup>
              </select>
              <div className="xm-label">Lý do chuyển</div>
              <textarea className="xm-textarea" placeholder="VD: Lead này cần tư vấn về khóa Executive — em chưa đủ kinh nghiệm xử lý..." />
            </div>
          )}
          {xferTab === 'codeal' && (
            <div className="xm-section on">
              <div className="codeal-info">💡 <strong>Co-deal</strong> = bạn và 1 người khác cùng chốt deal này. Hoa hồng chia theo tỷ lệ bạn đặt.</div>
              <div className="xm-label">Thêm người đồng hành</div>
              <select className="xm-select">
                <option value="">-- Chọn --</option>
                {TEAM.filter(t => t.role !== 'leader' || true).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <div className="xm-label">Tỷ lệ chia hoa hồng</div>
              <div className="split-row">
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>Bạn (Linh)</div>
                  <input type="number" value={splitMe} min={10} max={90} onChange={e => setSplitMe(parseInt(e.target.value) || 70)} />
                </div>
                <span>+</span>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>Co-dealer</div>
                  <input type="number" value={100 - splitMe} readOnly style={{ background: 'var(--stone)' }} />
                </div>
                <span>= 100%</span>
              </div>
              <div className="xm-label">Ghi chú</div>
              <textarea className="xm-textarea" placeholder="VD: Em nhờ chị Hương hỗ trợ vì chị có kinh nghiệm với CEO nhiều hơn..." />
            </div>
          )}
          <div style={{ display: 'flex', gap: 7 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowXfer(false)}>Hủy</button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => setShowXfer(false)}>✅ Xác nhận</button>
          </div>
        </div>
      </div>

      {/* ── ENROLL MODAL ── */}
      <div className={`enroll-ov ${showEnroll ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowEnroll(false); }}>
        <div className="enroll-m">
          <div className="em-icon">🎉</div>
          <div className="em-title">Xác nhận Enrolled!</div>
          <div className="em-sub">Hệ thống sẽ tự động tạo tài khoản và gửi email kích hoạt.</div>
          <div className="em-info">
            {enrollId !== null && (() => {
              const t = todos.find(x => x.id === enrollId);
              if (!t) return null;
              return <>
                <div className="er-row"><div className="er-key">Học viên</div><div className="er-val">{t.name}</div></div>
                <div className="er-row"><div className="er-key">Điện thoại</div><div className="er-val">{t.phone}</div></div>
                <div className="er-row"><div className="er-key">Email</div><div className="er-val">{t.email}</div></div>
                <div className="er-row"><div className="er-key">Stage hiện tại</div><div className="er-val">{S_NAMES[t.stage - 1]}</div></div>
              </>;
            })()}
          </div>
          <div className="pay-block">
            <div className="pay-blk-title">💳 Thông tin thanh toán</div>
            <div className="pay-field">
              <label>Khóa học đã đăng ký</label>
              <select className="pay-select">
                <option value="lcm">🌱 Là Chính Mình · 70,000,000 ₫</option>
                <option value="adult">📚 Adult Learning Core · 70,000,000 ₫</option>
                <option value="exec">🎯 Executive Track · 120,000,000 ₫</option>
                <option value="short">⚡ Short Course · 15,000,000 ₫</option>
                <option value="corp">🏢 Corporate · Theo hợp đồng</option>
              </select>
            </div>
            <div className="pay-field">
              <label>Số tiền đã nhận (₫)</label>
              <input type="number" className="pay-inp" defaultValue={70000000} />
            </div>
            <div className="pay-field">
              <label>Hình thức thanh toán</label>
              <div className="pm-row">
                {(['transfer', 'card', 'wallet'] as const).map((m, i) => (
                  <div key={m} className={`pm-chip ${payMethod === m ? 'sel' : ''}`} onClick={() => setPayMethod(m)}>
                    {['🏦 Chuyển khoản', '💳 Thẻ tín dụng', '📱 Ví điện tử'][i]}
                  </div>
                ))}
              </div>
            </div>
            <div className="pay-field">
              <label>Mã giao dịch (nếu có)</label>
              <input type="text" className="pay-inp" placeholder="VD: FT26040612345 hoặc để trống" />
            </div>
          </div>
          <div className="em-btns">
            <button className="btn btn-ghost" onClick={() => setShowEnroll(false)}>Hủy</button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={confirmEnroll}>✅ Xác nhận & Tạo tài khoản</button>
          </div>
        </div>
      </div>

      {/* ── KPI PANEL ── */}
      <div className={`kpi-ov ${showKpi ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowKpi(false); }}>
        <div className="kpi-panel">
          <div className="kpi-hdr">
            <div>
              <div className="kpi-hdr-title">📊 Team KPI · Tháng 4/2026</div>
              <div className="kpi-hdr-sub">Nedu Sales Team · Adult Learning Program</div>
            </div>
            <button className="kpi-close" onClick={() => setShowKpi(false)}>✕</button>
          </div>
          {renderKpi()}
        </div>
      </div>

      {/* ── WIN CELEBRATION ── */}
      <div className={`win-overlay ${showWin ? 'open' : ''}`}>
        <div className="win-card">
          <div className="wc-icon">🎉</div>
          <div className="wc-title">CHỐT DEAL!</div>
          <div className="wc-who">{winLead?.name} · {winLead?.phone}</div>
          <div className="wc-amount">70,000,000 ₫</div>
          <div className="wc-course">🌱 Là Chính Mình</div>
          <div className="wc-team">📢 Cả team Nedu đều nhận được thông báo này</div>
          <button className="wc-close" onClick={() => setShowWin(false)}>🔥 Tuyệt vời! Tiếp tục nào</button>
        </div>
      </div>
    </>
  );
};
