const bx1 = document.getElementById('bx1');
const tt   = document.getElementById('tt');
const bx2  = document.getElementById('bx2');
const qText = document.getElementById('question-text');
const answersDiv = document.getElementById('answers');

// Prevent iPhone screen zoom on double tap
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (this.lastTouch && (now - this.lastTouch) < 350) {
        e.preventDefault();
    }
    this.lastTouch = now;
}, { passive: false });

// Remove any previously existing right-side / duplicate score containers
['#right-score', '#score-panel', '#score-ui', '.side-score', '#side-score', '#scoreBox', '#scoreDisplay']
.forEach(sel => {
  const el = document.querySelector(sel);
  if (el && el.parentNode) el.parentNode.removeChild(el);
});

// Remove previous HUD displays
['hud-total', 'hud-pts', 'hud-multi'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.remove();
});

// ---------------- HUD ----------------
const hud = document.createElement('div');
hud.id = 'game-hud';
hud.style.position = 'absolute';
hud.style.left = '50%';
hud.style.top = '4%';
hud.style.transform = 'translateX(-50%)';
hud.style.width = '90%';
hud.style.pointerEvents = 'none';
bx2.appendChild(hud);

const hudTotal = document.createElement('div');
hudTotal.id = 'hud-total';
hudTotal.className = 'outline-text';
hudTotal.style.textAlign = 'center';
hudTotal.style.pointerEvents = 'auto';
hudTotal.innerHTML = `TOTAL: <span id="hud-total-num">0</span>`;
hud.appendChild(hudTotal);

const hudBottom = document.createElement('div');
hudBottom.id = 'hud-bottom';
hudBottom.style.position = 'absolute';
hudBottom.style.left = '50%';
hudBottom.style.bottom = '6%';
hudBottom.style.transform = 'translateX(-50%)';
hudBottom.style.width = '90%';
hudBottom.style.display = 'flex';
hudBottom.style.justifyContent = 'center';
hudBottom.style.alignItems = 'center';
hudBottom.style.pointerEvents = 'auto';
bx2.appendChild(hudBottom);

const hudPts = document.createElement('div');
hudPts.id = 'hud-pts';
hudPts.className = 'outline-text';
hudPts.style.marginRight = '18px';
hudPts.style.display = 'flex';
hudPts.style.alignItems = 'center';
hudPts.innerHTML = `PTS: <span id="hud-pts-num">0</span>`;
hudBottom.appendChild(hudPts);

const hudMulti = document.createElement('div');
hudMulti.id = 'hud-multi';
hudMulti.className = 'outline-text';
hudMulti.style.display = 'flex';
hudMulti.style.alignItems = 'center';
hudMulti.innerHTML = `<span id="hud-multi-label">X</span>&nbsp;<span id="hud-multi-num">1</span>&nbsp;MULTI`;
hudBottom.appendChild(hudMulti);

// Audio
const clickSound = document.getElementById('clickSound');
const upSound    = document.getElementById('upSound');
const downSound  = document.getElementById('downSound');
const ptsSound   = document.getElementById('ptsSound');
const hundredSound = document.getElementById('hundredSound');
const badSound   = document.getElementById('badSound');
const okSound    = document.getElementById('okSound');
const newSound   = document.getElementById('newSound');

// ---------------- Game state ----------------
let quizStarted = false;
let clickTimes = [];
const CLICK_WINDOW_MS = 2000;

let pts = 1;           // points bank for current run/batch (accumulates on correct)
let multi = 1;         // running multiplier for current run/batch
let total = 0;         // accumulated total score
let batchCount = 0;    // how many batches completed (you used earlier - kept)
let consecutiveCorrect = 1; // NEW: consecutive correct answers (for pick trigger)

let askedIndices = [];
const CYCLE_SIZE = Math.min(100, (typeof questions !== 'undefined') ? questions.length : 100);
let currentQIndex = null;
let isCycleLast = false;

// ---------------- TT drag ----------------
let isDragging = false;
let pointerId = null;
let offsetX = 0, offsetY = 0;

function safePlay(audio) {
  try { audio.currentTime = 0; audio.play(); } catch(e) {}
}

function animateOnce(el, className, duration = 360) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration + 20);
}

tt.addEventListener('pointerdown', (ev) => {
  safePlay(clickSound);

  const now = Date.now();
  clickTimes = clickTimes.filter(t => now - t < CLICK_WINDOW_MS);
  clickTimes.push(now);

  if (clickTimes.length >= 3 && !quizStarted) triggerStartSequence();
  animateOnce(tt, 'tt-pop', 360);

  isDragging = true;
  pointerId = ev.pointerId;
  tt.setPointerCapture(pointerId);
  tt.classList.add('dragging');

  const rect = tt.getBoundingClientRect();
  offsetX = ev.clientX - rect.left;
  offsetY = ev.clientY - rect.top;

  ev.preventDefault();
});

document.addEventListener('pointermove', (ev) => {
  if (!isDragging || ev.pointerId !== pointerId) return;
  const bxRect = bx1.getBoundingClientRect();
  let newLeft = ev.clientX - bxRect.left - offsetX;
  let newTop  = ev.clientY - bxRect.top - offsetY;
  tt.style.position = 'absolute';
  tt.style.left = `${newLeft}px`;
  tt.style.top  = `${newTop}px`;
});

document.addEventListener('pointerup', (ev) => {
  if (!isDragging || ev.pointerId !== pointerId) return;
  isDragging = false;
  try { tt.releasePointerCapture(pointerId); } catch(e){}
  pointerId = null;
  tt.classList.remove('dragging');

  tt.style.transition = 'transform 700ms cubic-bezier(.22,1.25,.32,1), left 700ms cubic-bezier(.22,1.25,.32,1), top 700ms cubic-bezier(.22,1.25,.32,1)';
  tt.style.left = '50%';
  tt.style.top  = '50%';
  tt.style.transform = 'translate(-50%, -50%)';
  const cleanup = () => { tt.style.transition = ''; tt.removeEventListener('transitionend', cleanup); };
  tt.addEventListener('transitionend', cleanup);
});
tt.addEventListener('dragstart', e => e.preventDefault());

// ----------------- Start quiz ----------------
function triggerStartSequence() {
  if (quizStarted) return;
  quizStarted = true;
  animateOnce(tt, 'tt-pop', 360);
  bx1.classList.add('bx-shrink');

  bx1.addEventListener('animationend', onBx1Shrunk);
  function onBx1Shrunk() {
    bx1.removeEventListener('animationend', onBx1Shrunk);
    bx1.parentNode && bx1.parentNode.removeChild(bx1);
    bx2.classList.remove('hidden');
    bx2.classList.add('bx-grow');

    bx2.addEventListener('animationend', function onGrow() {
      bx2.removeEventListener('animationend', onGrow);
      showNextQuestion(true);
    });
  }
}

// ----------------- Shuffle helper ----------------
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ----------------- Show question ----------------
function showNextQuestion(isFirst = false) {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    qText.textContent = "No questions found.";
    answersDiv.innerHTML = '';
    return;
  }

  if (askedIndices.length >= CYCLE_SIZE) askedIndices = [];

  let idx;
  let attempts = 0;
  do {
    idx = Math.floor(Math.random() * questions.length);
    attempts++;
    if (attempts > 1000) break;
  } while (askedIndices.includes(idx) && askedIndices.length < questions.length);

  askedIndices.push(idx);
  currentQIndex = idx;
  isCycleLast = (askedIndices.length === CYCLE_SIZE);

  const qObj = questions[idx];
  if (!qObj) { qText.textContent = "Invalid question."; answersDiv.innerHTML=''; return; }

  if (isCycleLast) qText.innerHTML = `<span class="rainbow">${escapeHtml(qObj.question)}</span>`;
  else qText.textContent = qObj.question;

  answersDiv.innerHTML = '';
  shuffleArray(qObj.answers).forEach(ansObj => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = ansObj.text;
    btn.addEventListener('click', () => handleAnswer(ansObj.correct, btn, qObj));
    answersDiv.appendChild(btn);
  });

  qText.classList.remove('fade-in');
  void qText.offsetWidth;
  qText.classList.add('fade-in');

  safePlay(newSound);
  updateScoreDisplays();
}

// ----------------- Helper: animate amd activations ----------------
function animateActivatedAmendments(activatedSlotIndexes = []) {
  if (!activatedSlotIndexes || activatedSlotIndexes.length === 0) return;
  const container = document.getElementById('amendment-slots');
  if (!container) return;

  activatedSlotIndexes.forEach(idx => {
    const slot = container.children[idx];
    if (!slot) return;
    const card = slot.querySelector('.amd-active-card');
    if (!card) return;
    // re-trigger animation class
    card.classList.remove('amd-pop');
    void card.offsetWidth;
    card.classList.add('amd-pop');
  });
}

// ----------------- Handle answer ----------------
function handleAnswer(correct, btnClicked, qObj) {
  // Defensive: qObj may be undefined
  const qId = (qObj && typeof qObj.id !== 'undefined') ? qObj.id : currentQIndex;

  if (correct) {
    // Correct answer flow
    safePlay(upSound);

    // base reward for a correct answer (you previously used +10 and +1)
    // Add them first to running banks
    pts += 10;
    multi += 1;

    // Track consecutive correct answers
    consecutiveCorrect += 1;

    // Apply amendments (pass current running pts & multi — amd.js expected signature)
    // If applyAmendments exists, call it. It should return an object { pts, multi, activated } or at least { pts, multi }.
    // Apply amendments
let amdResult = null;
if (typeof applyAmendments === 'function') {
  try {
    amdResult = applyAmendments(
      typeof qId !== 'undefined' ? qId : currentQIndex,
      pts,
      multi
    ) || null;
  } catch (e) {
    console.warn('applyAmendments threw:', e);
    amdResult = null;
  }
}

    // If applyAmendments returned new pts/multi, adopt them.
    if (amdResult && typeof amdResult.pts === 'number') pts = amdResult.pts;
    if (amdResult && typeof amdResult.multi === 'number') multi = amdResult.multi;

    // Determine which amendment slots activated.
    // Prefer explicit list from amdResult.activated (array of slot indexes)
    // Otherwise, infer by checking playerAmendments (left-to-right),
    // and using their questionIds array to see if it contains qId.
    let activatedSlots = [];
    if (amdResult && Array.isArray(amdResult.activated) && amdResult.activated.length > 0) {
      activatedSlots = amdResult.activated.slice();
    } else {
      // If playerAmendments exists globally (likely in amd.js), check them left-to-right
      if (typeof playerAmendments !== 'undefined' && Array.isArray(playerAmendments)) {
        for (let i = 0; i < playerAmendments.length; i++) {
          const amd = playerAmendments[i];
          if (!amd || !Array.isArray(amd.questionIds)) continue;
          if (amd.questionIds.includes(qId)) {
            activatedSlots.push(i);
          }
        }
      }
    }

    // If any activated, play hundredSound and animate those cards
    if (activatedSlots.length > 0) {
      if (hundredSound) safePlay(hundredSound);
      animateActivatedAmendments(activatedSlots);
    }

    // If we've reached the consecutive-correct trigger (every 5 correct in a row), open pick screen
    if (consecutiveCorrect > 0 && consecutiveCorrect % 5 === 0) {
      // Try to call openAmendmentPick() if it exists
      if (typeof openAmendmentPick === 'function') {
        try { openAmendmentPick(); } catch (e) { console.warn('openAmendmentPick threw', e); }
      } else {
        // fallback: if amd.js exported a trigger function name 'triggerAmendmentPick'
        if (typeof triggerAmendmentPick === 'function') {
          try { triggerAmendmentPick(); } catch (e) { console.warn('triggerAmendmentPick threw', e); }
        }
      }
    }

    // update UI
    updateScoreDisplays();

    // continue to next question shortly
    setTimeout(() => showNextQuestion(), 300);

  } else {
    // Incorrect sequence
    safePlay(downSound);

    // Show clicked wrong answer red and play bad sound
    btnClicked.style.backgroundColor = 'red';
    safePlay(badSound);

    // After 0.2s highlight correct answer green and play ok sound
    const correctBtn = Array.from(answersDiv.children)
                           .find(b => qObj.answers.find(a => a.text === b.textContent)?.correct);
    if (correctBtn) {
      setTimeout(() => {
        correctBtn.style.backgroundColor = 'green';
        safePlay(okSound);

        // Update total and reset batch and streak
        total += pts * multi;
        pts = 1;
        multi = 1;
        batchCount += 1;
        safePlay(ptsSound);

        // Reset consecutive correct streak because user failed
        consecutiveCorrect = 1;

        // legacy check (you had this earlier) — if you still want to keep batch-based pick triggers, leave it; I left it but it won't conflict:
        // if (batchCount % 3 === 0) setTimeout(() => triggerAmendmentPick(), 120);

        updateScoreDisplays();
        setTimeout(() => showNextQuestion(), 400);
      }, 200);
    }
  }
}

// ----------------- Score HUD ----------------
function updateScoreDisplays() {
  const totalNum = document.getElementById('hud-total-num');
  const ptsNum = document.getElementById('hud-pts-num');
  const multiNum = document.getElementById('hud-multi-num');

  if (totalNum) totalNum.textContent = total;
  if (ptsNum) ptsNum.textContent = pts;
  if (multiNum) multiNum.textContent = multi;

  applyNumberFlash(totalNum, 'flash-white', 'number-pop');
  applyNumberFlash(ptsNum, 'flash-blue', 'number-pop');
  applyNumberFlash(multiNum, 'flash-red', 'number-pop');

  // Keep small score sound but don't spam — only play when elements actually exist
  if (ptsSound) safePlay(ptsSound);
}

function applyNumberFlash(el, flashClass, popClass) {
  if (!el) return;
  el.classList.remove(flashClass);
  el.classList.remove(popClass);
  void el.offsetWidth;
  el.classList.add(popClass);
  el.classList.add(flashClass);
  setTimeout(() => { el.classList.remove(popClass); el.classList.remove(flashClass); }, 420);
}

// ---------------- Amendments card container (kept for compatibility) ----------------
const cardContainer = document.createElement('div');
cardContainer.id = 'card-container';
bx2.appendChild(cardContainer);

// ---------------- Initialize ----------------
updateScoreDisplays();