// ===== Utilities =====
const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

function fmt(n){
  const s = (typeof n === 'number') ? n : parseFloat(String(n || 0));
  const sign = s < 0 ? '-' : '';
  return sign + '$' + Math.abs(s).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToast(message, type = 'info'){
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;top:84px;right:20px;background:var(--panel);border:1px solid var(--stroke);
    border-radius:12px;padding:12px 16px;color:var(--ink);box-shadow:var(--shadow);z-index:1000;
    max-width:300px;
  `;
  if(type === 'success') toast.style.borderColor = 'var(--success)';
  if(type === 'danger') toast.style.borderColor = 'var(--danger)';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== Theme =====
const THEME_KEY = 'td_theme';
function setTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  try { localStorage.setItem(THEME_KEY, mode); } catch(e){}
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(cur === 'dark' ? 'light' : 'dark');
}
function initTheme(){
  const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) || 'dark';
  setTheme(saved);
  $('#themeBtn')?.addEventListener('click', toggleTheme);
}

// ===== Navigation (static pages) =====
function initNavActive(){
  const path = location.pathname.split('/').pop() || 'overview.html';
  $$('.navbtn').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href && href.endsWith(path));
  });

  // overlay click closes mobile nav
  const navCheckbox = $('#nav');
  const overlay = $('.overlay');
  const main = document.querySelector('main');
  const closeNav = () => { if(navCheckbox) navCheckbox.checked = false; };
  overlay?.addEventListener('click', closeNav);
  main?.addEventListener('click', closeNav);
}

// ===== Modals =====
window.openModal = function(modalId){
  const backdrop = document.querySelector(modalId + 'Backdrop');
  const modal = document.querySelector(modalId);
  backdrop?.classList.add('open');
  modal?.classList.add('open');
};
window.closeModal = function(modalId){
  const backdrop = document.querySelector(modalId + 'Backdrop');
  const modal = document.querySelector(modalId);
  backdrop?.classList.remove('open');
  modal?.classList.remove('open');
};
function bindModalBackdrops(){
  $$('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', () => {
      const modalId = '#' + backdrop.id.replace('Backdrop', '');
      window.closeModal(modalId);
    });
  });
}

// ===== Copy Trading functions (copy.html) =====
window.toggleLeaderGroup = function(groupId){
  const group = document.getElementById(groupId);
  group?.classList.toggle('collapsed');
};

let selectedFollower = null;
window.editFollower = function(accountId){
  selectedFollower = accountId;
  $('#editFollowerTitle')?.textContent = `Edit Follower: ${accountId}`;
  $('#editCopyRatio') && ($('#editCopyRatio').value = '1.0');
  $('#editStatus') && ($('#editStatus').value = 'Active');
  $('#editMaxPosition') && ($('#editMaxPosition').value = '$50,000');
  $('#editDailyLimit') && ($('#editDailyLimit').value = '$500');
  openModal('#editFollowerModal');
};
window.saveFollowerEdit = function(){
  if(selectedFollower){
    showToast(`Follower ${selectedFollower} updated successfully`, 'success');
    closeModal('#editFollowerModal');
    selectedFollower = null;
  }
};
window.pauseAccount = function(accountId){ showToast(`Account ${accountId} paused`, 'info'); };
window.removeAccount = function(accountId){
  if(confirm(`Are you sure you want to remove account ${accountId}?`)){
    showToast(`Account ${accountId} removed`, 'success');
  }
};

// Add account modal controls
window.toggleAccountFields = function(){
  const accountType = $('#accountType');
  const leaderSelectGroup = $('#leaderSelectGroup');
  const ratioGroup = $('#ratioGroup');
  if(!accountType || !leaderSelectGroup || !ratioGroup) return;
  const isFollower = accountType.value === 'Follower Account';
  leaderSelectGroup.style.display = isFollower ? 'block' : 'none';
  ratioGroup.style.display = isFollower ? 'block' : 'none';
};
window.saveAccount = function(){
  const type = $('#accountType')?.value;
  const id = $('#accountId')?.value;
  if(!id){ showToast('Please enter an account ID', 'danger'); return; }
  showToast(`${type} added successfully: ${id}`, 'success');
  closeModal('#addAccountModal');
  if($('#accountId')) $('#accountId').value = '';
};

// ===== Positions / risk (overview.html) =====
window.reducePosition = function(symbol){
  showToast(`Reduced ${symbol} position by 1 lot`, 'success');
  closeModal('#correlationModal');
};
window.closePosition = function(symbol){
  showToast(`Closed ${symbol} position`, 'success');
  closeModal('#correlationModal');
};

function updateLossStatus(){
  const lossStatus = $('#lossStatus');
  if(!lossStatus) return;

  // Using Total P&L value if present; falls back to fixed number
  const valEl = $('#totalPnL');
  let totalPnL = 581.06;
  if(valEl){
    const parsed = parseFloat(valEl.textContent.replace(/[^0-9.-]/g, ''));
    if(!Number.isNaN(parsed)) totalPnL = parsed;
  }

  const dailyLimit = 1500;
  const lossProgressBar = $('.loss-progress-bar');
  const lossProgressText = $('.loss-progress-text');
  const lossStatusValue = $('.loss-status-value');

  if(totalPnL >= 0){
    lossStatus.className = 'loss-status profitable';
    if(lossStatusValue) lossStatusValue.innerHTML = `PROFITABLE: <span class="positive">${fmt(totalPnL)}</span>`;
    if(lossProgressBar){
      lossProgressBar.style.width = '0%';
      lossProgressBar.style.background = 'linear-gradient(90deg, var(--success), #10b981)';
    }
    if(lossProgressText) lossProgressText.textContent = 'Above Daily Limit - All Good!';
  }else{
    const lossAmount = Math.abs(totalPnL);
    const percentage = Math.min((lossAmount / dailyLimit) * 100, 100);

    if(percentage < 75){
      lossStatus.className = 'loss-status profitable';
      if(lossStatusValue) lossStatusValue.innerHTML = `WITHIN LIMITS: <span class="negative">${fmt(totalPnL)}</span>`;
      if(lossProgressBar) lossProgressBar.style.background = 'linear-gradient(90deg, var(--success), var(--warning))';
    }else if(percentage < 100){
      lossStatus.className = 'loss-status approaching';
      if(lossStatusValue) lossStatusValue.innerHTML = `APPROACHING LIMIT: <span class="negative">${fmt(totalPnL)}</span>`;
      if(lossProgressBar) lossProgressBar.style.background = 'linear-gradient(90deg, var(--warning), var(--danger))';
    }else{
      lossStatus.className = 'loss-status exceeded';
      if(lossStatusValue) lossStatusValue.innerHTML = `LIMIT EXCEEDED: <span class="negative">${fmt(totalPnL)}</span>`;
      if(lossProgressBar) lossProgressBar.style.background = 'linear-gradient(90deg, var(--danger), #dc2626)';
    }
    if(lossProgressBar) lossProgressBar.style.width = percentage + '%';
    if(lossProgressText) lossProgressText.textContent = `${percentage.toFixed(1)}% of daily limit used`;
  }
}

// ===== Journal (journal.html): calendar + trade note =====
let currentCalendarMonth = new Date();

function generateCalendarData(){
  const calendarData = {};
  const today = new Date();
  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for(let day = 1; day <= daysInMonth; day++){
    const date = new Date(year, month, day);
    if(date <= today){
      const pnl = (Math.random() - 0.3) * 400; // slight positive bias
      calendarData[day] = {
        pnl: Math.round(pnl * 100) / 100,
        trades: Math.floor(Math.random() * 5) + 1
      };
    }
  }
  return calendarData;
}

function renderCalendar(){
  const calendar = $('#performanceCalendar');
  const monthLabel = $('#calendarMonth');
  if(!calendar || !monthLabel) return;

  const data = generateCalendarData();
  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  monthLabel.textContent = currentCalendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  calendar.innerHTML = '';

  for(let i = 0; i < firstDay; i++){
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendar.appendChild(emptyDay);
  }
  for(let day = 1; day <= daysInMonth; day++){
    const dayData = data[day];
    const el = document.createElement('div');
    el.className = `calendar-day ${dayData ? (dayData.pnl >= 0 ? 'win' : 'loss') : ''}`;
    el.onclick = () => showCalendarDay(day, dayData);
    el.innerHTML = `
      <div class="calendar-day-number">${day}</div>
      ${dayData ? `<div class="calendar-day-pnl">${fmt(dayData.pnl)}</div>` : ''}
    `;
    calendar.appendChild(el);
  }
}

window.changeCalendarMonth = function(direction){
  currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + direction);
  renderCalendar();
};

window.showCalendarDay = function(day, data){
  if(!data) return;
  const title = $('#calendarDayTitle');
  const content = $('#calendarDayContent');
  if(!title || !content) return;

  const monthName = currentCalendarMonth.toLocaleString('default', { month: 'long' });
  const year = currentCalendarMonth.getFullYear();
  title.textContent = `${monthName} ${day}, ${year}`;
  content.innerHTML = `
    <div style="display:grid;gap:16px;">
      <div style="text-align:center;padding:16px;background:var(--glass);border-radius:8px;">
        <div style="font-size:24px;font-weight:800;color:${data.pnl >= 0 ? 'var(--success)' : 'var(--danger)'};">
          ${fmt(data.pnl)}
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px;">
          ${data.trades} trades executed
        </div>
      </div>
      <div>
        <h4>Day Summary</h4>
        <div style="font-size:13px;line-height:1.5;">
          ${data.pnl >= 0 ? 'Profitable trading day with consistent execution.' : 'Challenging day with some setbacks, but within risk parameters.'}
          Average trade size was moderate with good risk management.
        </div>
      </div>
    </div>
  `;
  openModal('#calendarDayModal');
};

window.addNewStrategy = function(){
  const name = prompt('Enter strategy name:');
  if(name) showToast(`Strategy "${name}" added`, 'success');
};

window.viewStrategyDetails = function(name){
  showToast(`Viewing details for ${name}`, 'info');
};

window.saveTradeNote = function(){
  const symbol = $('#tradeSymbol')?.value;
  const qty = $('#tradeQty')?.value;
  if(!symbol || !qty){ showToast('Please fill in symbol and quantity', 'danger'); return; }
  showToast(`Trade note saved for ${symbol}`, 'success');
  closeModal('#addTradeModal');

  if($('#tradeSymbol')) $('#tradeSymbol').value = '';
  if($('#tradeQty')) $('#tradeQty').value = '';
  if($('#tradeEntry')) $('#tradeEntry').value = '';
  if($('#tradePnL')) $('#tradePnL').value = '';
  if($('#tradeReason')) $('#tradeReason').value = '';
};

// ===== Quick actions (global) =====
window.emergencyStopAll = function(){ showToast('EMERGENCY STOP: All trading systems halted', 'danger'); };
window.addPosition = function(){ showToast('Add position functionality', 'info'); };
window.exportData = function(){ showToast('Data export started', 'success'); };

// ===== Page-specific wiring =====
function initActionHandlers(){
  // Overview only
  $('#reviewCorrelation')?.addEventListener('click', () => openModal('#correlationModal'));

  // Emergency/close/cancel buttons in sidebar
  $('#emergencyStop')?.addEventListener('click', () => showToast('EMERGENCY STOP activated - All trading halted', 'danger'));
  $('#closeAllPositions')?.addEventListener('click', () => showToast('All positions closed successfully', 'success'));
  $('#cancelAllOrders')?.addEventListener('click', () => showToast('All pending orders cancelled', 'success'));

  // Overview: Risk settings
  $('#saveRiskSettings')?.addEventListener('click', () => showToast('Risk settings saved successfully', 'success'));
  $('#resetRiskSettings')?.addEventListener('click', () => {
    const rcLoss = $('#rcLoss'); const rcTrades = $('#rcTrades'); const rcPos = $('#rcPos');
    if(rcLoss) rcLoss.value = '$1,500';
    if(rcTrades) rcTrades.value = '40';
    if(rcPos) rcPos.value = '12';
    showToast('Risk settings reset to defaults', 'info');
  });

  // Overview: position close “×” buttons
  $$('.position-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chip = btn.closest('.position-chip');
      const badge = chip?.querySelector('.badge');
      const symbol = badge?.textContent.split(' ')[0] || 'Position';
      showToast(`Position ${symbol} closed successfully`, 'success');
      chip?.remove();
    });
  });

  // Copy trading controls
  $('#pauseCopyTrading')?.addEventListener('click', () => showToast('Copy trading paused', 'info'));
  $('#syncHealthCheck')?.addEventListener('click', () => showToast('Sync health check completed - All connections healthy', 'success'));

  $('#addFollower')?.addEventListener('click', () => {
    const type = $('#accountType'); if(type) type.value = 'Follower Account';
    window.toggleAccountFields();
    const title = $('#addAccountTitle'); if(title) title.textContent = 'Add Follower Account';
    openModal('#addAccountModal');
  });

  $('#addLeaderBtn')?.addEventListener('click', () => {
    const type = $('#accountType'); if(type) type.value = 'Leader Account';
    window.toggleAccountFields();
    const title = $('#addAccountTitle'); if(title) title.textContent = 'Add Leader Account';
    openModal('#addAccountModal');
  });

  $('#addFollowerBtn')?.addEventListener('click', () => {
    const type = $('#accountType'); if(type) type.value = 'Follower Account';
    window.toggleAccountFields();
    const title = $('#addAccountTitle'); if(title) title.textContent = 'Add Follower Account';
    openModal('#addAccountModal');
  });

  $('#exportDailyReport')?.addEventListener('click', () => showToast('Daily report exported successfully', 'success'));

  // Journal buttons
  $('#addTradeNote')?.addEventListener('click', () => openModal('#addTradeModal'));
  $('#filterTrades')?.addEventListener('click', () => showToast('Trade filtering functionality', 'info'));
  $('#loadMoreTrades')?.addEventListener('click', () => showToast('Loading more trades...', 'info'));

  // Modal backdrops (all pages)
  bindModalBackdrops();
}

// Real-time P&L updater (overview only)
let realtimeTimers = [];
function startRealTimeIfNeeded(){
  // Clear previous (if navigating without reload in some setups)
  realtimeTimers.forEach(t => clearInterval(t));
  realtimeTimers = [];

  const totalPnL = $('#totalPnL');
  if(!totalPnL) return;

  updateLossStatus();

  // Simulate realtime P&L
  const t1 = setInterval(() => {
    const current = parseFloat(totalPnL.textContent.replace(/[^0-9.-]/g, ''));
    const change = (Math.random() - 0.5) * 10;
    const newValue = (Number.isNaN(current) ? 0 : current) + change;
    totalPnL.textContent = fmt(newValue);
    totalPnL.className = `kpi large ${newValue >= 0 ? 'positive' : 'negative'}`;
    updateLossStatus();
  }, 8000);
  realtimeTimers.push(t1);

  // Sync dot animation
  const t2 = setInterval(() => {
    $$('.sync-dot').forEach(dot => {
      if(Math.random() > 0.95){
        dot.className = 'sync-dot delayed';
        const text = dot.nextElementSibling;
        if(text){
          text.textContent = 'Delayed ' + Math.floor(Math.random() * 5 + 1) + 's';
          setTimeout(() => {
            dot.className = 'sync-dot healthy';
            text.textContent = 'Synced';
          }, 3000);
        }
      }
    });
  }, 12000);
  realtimeTimers.push(t2);
}

// ===== Init =====
function init(){
  initTheme();
  initNavActive();
  initActionHandlers();

  // Page-specific setups
  // Overview:
  if($('#overview')){
    startRealTimeIfNeeded();
    updateLossStatus();
  }
  // Journal:
  if($('#performanceCalendar')){
    renderCalendar();
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
}else{
  init();
}