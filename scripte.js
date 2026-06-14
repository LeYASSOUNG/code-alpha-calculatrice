// ── STATE ──
let current = '0';
let prev = '';
let operator = null;
let justCalculated = false;
let expressionStr = '';

const resultEl = document.getElementById('result');
const exprEl   = document.getElementById('expression');

// ── HISTORY STATE ──
let historyArr = JSON.parse(localStorage.getItem('task2_history') || '[]');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const btnHistory = document.getElementById('btn-history');
const btnSci = document.getElementById('btn-sci');
const grid = document.querySelector('.grid');
const displayEl = document.querySelector('.display');

if (btnHistory) {
  btnHistory.addEventListener('click', () => {
    historyPanel.classList.toggle('open');
  });
}

if (btnSci) {
  btnSci.addEventListener('click', () => {
    grid.classList.toggle('sci-mode');
    btnSci.classList.toggle('active');
  });
}

function addToHistory(expr, res) {
  historyArr.push({ expr, res });
  if (historyArr.length > 20) historyArr.shift(); // keep last 20
  localStorage.setItem('task2_history', JSON.stringify(historyArr));
  renderHistory();
}

function renderHistory() {
  if (historyArr.length === 0) {
    historyList.innerHTML = '<div class="empty-hist">Aucun calcul récent</div>';
    return;
  }
  historyList.innerHTML = '';
  // Show newest at top
  [...historyArr].reverse().forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `<div>${item.expr}</div><div style="color: var(--accent); font-size: 1.2em; text-align: right; margin-top: 4px;">${item.res}</div>`;
    historyList.appendChild(div);
  });
}

// ── RENDER ──
function render() {
  resultEl.textContent = current;
  exprEl.textContent   = expressionStr;
  resultEl.className = 'result' + (current.length > 9 ? ' small' : '');
}

// ── FLASH ANIMATION ──
function flash() {
  resultEl.classList.add('flash');
  setTimeout(() => resultEl.classList.remove('flash'), 300);
}

// ── SAFE EVALUATE ──
function calculate(a, op, b) {
  const x = parseFloat(a);
  const y = parseFloat(b);
  if (op === '+') return x + y;
  if (op === '−') return x - y;
  if (op === '×') return x * y;
  if (op === '÷') {
    if (y === 0) return 'Erreur';
    return x / y;
  }
  if (op === '^') return Math.pow(x, y);
  return b;
}

function formatNum(n) {
  if (n === 'Erreur') return 'Erreur';
  // Avoid floating-point junk
  let s = parseFloat(n.toPrecision(12)).toString();
  return s;
}

// ── ACTIONS ──
function handleAction(action, value) {
  switch (action) {

    case 'digit':
      if (justCalculated) { current = value; expressionStr = ''; justCalculated = false; }
      else if (current === '0') current = value;
      else if (current.length < 16)  current += value;
      break;

    case 'decimal':
      if (justCalculated) { current = '0.'; expressionStr = ''; justCalculated = false; break; }
      if (!current.includes('.')) current += '.';
      break;

    case 'op':
      if (operator && !justCalculated) {
        // chain: calculate first
        const res = calculate(prev, operator, current);
        if (res === 'Erreur') { current = 'Erreur'; operator = null; prev = ''; expressionStr = ''; break; }
        const fmt = formatNum(res);
        expressionStr = fmt + ' ' + value;
        current = fmt;
        prev    = fmt;
      } else {
        prev = current;
        expressionStr = current + ' ' + value;
      }
      operator = value;
      justCalculated = true; // next digit replaces
      break;

    case 'equals':
      if (!operator) break;
      const rightOp = current;
      const res = calculate(prev, operator, rightOp);
      expressionStr = prev + ' ' + operator + ' ' + rightOp + ' =';
      if (res === 'Erreur') { current = 'Erreur'; }
      else { 
        current = formatNum(res); 
        addToHistory(`${prev} ${operator} ${rightOp} =`, current);
      }
      operator = null;
      prev = '';
      justCalculated = true;
      flash();
      break;

    case 'clear':
      current = '0'; prev = ''; operator = null;
      justCalculated = false; expressionStr = '';
      break;

    case 'sign':
      if (current !== '0' && current !== 'Erreur')
        current = (parseFloat(current) * -1).toString();
      break;

    case 'percent':
      if (current !== 'Erreur')
        current = (parseFloat(current) / 100).toString();
      break;

    case 'constant':
      let valC = 0;
      if (value === 'Math.PI') valC = Math.PI;
      if (justCalculated || current === '0') {
        current = valC.toString();
      } else {
        current += valC.toString();
      }
      justCalculated = true;
      break;

    case 'sci':
      if (current !== 'Erreur') {
        const valX = parseFloat(current);
        let resSci = valX;
        if (value === 'sin') resSci = Math.sin(valX);
        else if (value === 'cos') resSci = Math.cos(valX);
        else if (value === 'tan') resSci = Math.tan(valX);
        else if (value === 'log') resSci = Math.log10(valX);
        else if (value === 'ln') resSci = Math.log(valX);
        else if (value === 'sqrt') resSci = Math.sqrt(valX);

        if (isNaN(resSci)) current = 'Erreur';
        else current = formatNum(resSci);
        justCalculated = true;
        addToHistory(`${value}(${valX}) =`, current);
      }
      break;
  }
  render();
}

// ── CLICK EVENTS ──
// ── VISUAL EFFECTS ──
function createRipple(event, button) {
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  const rect = button.getBoundingClientRect();
  const x = event.clientX ? event.clientX - rect.left : button.clientWidth / 2;
  const y = event.clientY ? event.clientY - rect.top : button.clientHeight / 2;
  
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${x - radius}px`;
  circle.style.top = `${y - radius}px`;
  circle.classList.add("ripple");
  
  const ripple = button.querySelector(".ripple");
  if (ripple) ripple.remove();
  button.appendChild(circle);
}

function triggerGlow() {
  displayEl.classList.remove('glow');
  void displayEl.offsetWidth; // trigger reflow
  displayEl.classList.add('glow');
  setTimeout(() => displayEl.classList.remove('glow'), 200);
}

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    createRipple(e, btn);
    triggerGlow();
    const action = btn.dataset.action;
    const value = btn.dataset.value;
    handleAction(action, value);
  });
});

// ── KEYBOARD SUPPORT ──
const keyMap = {
  '0':'digit','1':'digit','2':'digit','3':'digit','4':'digit',
  '5':'digit','6':'digit','7':'digit','8':'digit','9':'digit',
  '+': ['op','+'], '-': ['op','−'], '*': ['op','×'], '/': ['op','÷'],
  'Enter': 'equals', '=': 'equals',
  'Backspace': null,
  '.': 'decimal', ',': 'decimal',
  'Escape': 'clear', 'Delete': 'clear',
  '%': 'percent'
};

document.addEventListener('keydown', e => {
  if (e.key === 'Backspace') {
    if (current.length > 1 && !justCalculated) current = current.slice(0,-1);
    else current = '0';
    render(); return;
  }
  const map = keyMap[e.key];
  if (!map) return;
  e.preventDefault();
  
  const btnSearch = document.querySelector(`.btn[data-value="${map}"]`) || 
                    document.querySelector(`.btn[data-action="${map === 'equals' ? 'equals' : map === 'clear' ? 'clear' : ''}"]`) ||
                    document.querySelector(`.btn-num[data-value="${map}"]`);
                    
  if (btnSearch) {
    createRipple({}, btnSearch);
    triggerGlow();
  }

  if (Array.isArray(map)) handleAction(map[0], map[1]);
  else if (/\d/.test(e.key)) handleAction('digit', e.key);
  else handleAction(map, e.key);
});

renderHistory();
render();
