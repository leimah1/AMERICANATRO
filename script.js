// Sounds
const clickSound = new Audio("click.mp3");
const upSound = new Audio("up.mp3");
const downSound = new Audio("down.mp3");
const ptsSound = new Audio("pts.mp3");
const hundredSound = new Audio("100.mp3");

// Quiz State
let availableQuestions = [...questions];
let currentQuestion = null;
let score = 0;
let multi = 0;
let totalScore = 0;
let combo = 0;

// DOM Elements
const startBtn = document.getElementById("start-btn");
const questionBox = document.getElementById("question-box");
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const scoreEl = document.getElementById("score");
const multiEl = document.getElementById("multi");
const totalEl = document.getElementById("total");

// Start Quiz
startBtn.addEventListener("click", () => {
  startBtn.style.display = "none";
  questionBox.style.display = "block";
  nextQuestion();
});

// Select Answer
function selectAnswer(selected) {
  clickSound.play();

  if (selected.correct) {
    combo++;
    multi++;
    score += 10 * multi;
    upSound.play();
  } else {
    downSound.play();
    totalScore += score;
    score = 0;
    multi = 0;
    combo = 0;
  }

  updateScoreUI();
  nextQuestion();
}

// Update Score UI
function updateScoreUI() {
  scoreEl.textContent = score;
  multiEl.textContent = multi;
  totalEl.textContent = totalScore;

  scoreEl.classList.add("bounce-flash");
  multiEl.classList.add("bounce-flash");
  totalEl.classList.add("bounce-flash");

  setTimeout(() => {
    scoreEl.classList.remove("bounce-flash");
    multiEl.classList.remove("bounce-flash");
    totalEl.classList.remove("bounce-flash");
  }, 500);

  ptsSound.play();
}

// Get Next Question
function nextQuestion() {
  if (availableQuestions.length === 0) {
    questionEl.textContent = "YOU ROCK DAD!";
    answersEl.innerHTML = "";
    return;
  }

  // Pick random question
  const index = Math.floor(Math.random() * availableQuestions.length);
  currentQuestion = availableQuestions.splice(index, 1)[0];

  questionEl.textContent = currentQuestion.question;
  answersEl.innerHTML = "";

  // Show answers
  const options = [...currentQuestion.answers];
  shuffleArray(options);

  options.forEach(ans => {
    const btn = document.createElement("button");
    btn.textContent = ans.text;
    btn.classList.add("answer-btn");
    btn.addEventListener("click", () => selectAnswer(ans));
    answersEl.appendChild(btn);
  });
}

// Shuffle helper
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// DRAGGABLE TITLE
const titleContainer = document.getElementById("title-container");
let isDragging = false;
let startX, startY;
let origX = titleContainer.offsetLeft;
let origY = titleContainer.offsetTop;

function startDrag(e) {
  isDragging = true;
  startX = e.clientX - titleContainer.offsetLeft;
  startY = e.clientY - titleContainer.offsetTop;
  titleContainer.style.cursor = "grabbing";
}

function drag(e) {
  if (!isDragging) return;
  let x = e.clientX - startX;
  let y = e.clientY - startY;
  titleContainer.style.left = x + "px";
  titleContainer.style.top = y + "px";
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  titleContainer.style.cursor = "grab";
  titleContainer.style.transition = "all 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
  titleContainer.style.left = origX + "px";
  titleContainer.style.top = origY + "px";
  setTimeout(() => { titleContainer.style.transition = ""; }, 800);
}

titleContainer.addEventListener("mousedown", startDrag);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", endDrag);

// Touch events
titleContainer.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  startX = touch.clientX - titleContainer.offsetLeft;
  startY = touch.clientY - titleContainer.offsetTop;
  isDragging = true;
});

document.addEventListener("touchmove", e => {
  if (!isDragging) return;
  const touch = e.touches[0];
  let x = touch.clientX - startX;
  let y = touch.clientY - startY;
  titleContainer.style.left = x + "px";
  titleContainer.style.top = y + "px";
});

document.addEventListener("touchend", endDrag);
