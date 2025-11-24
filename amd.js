const amendments = [
  {
    name: "Mr President",
    png: "president.png",
    description: "Every right answer on this card’s question IDs grants +5 multi.",
    questionIds: [0,6,10,16,19,27,34,39,45,48,53,72,93]
  },
  {
    name: "International Affairs",
    png: "intaff.png",
    description: "+50 pts +2 multi when this card’s IDs match.",
    questionIds: [1,11,21,31,57,78,79,84]
  },
  {
    name: "Tax Exempt",
    png: "taxes.png",
    description: "1.5x pts and 1.5x multi on ANY correct answer.",
    questionIds: [...Array(100).keys()]
  },
  {
    name: "Living the Dream",
    png: "livdr.png",
    description: "+10 multi on its matching question IDs.",
    questionIds: [67,72]
  },
  {
    name: "Real State Genius",
    png: "realst.png",
    description: "+4 multi when question ID matches.",
    questionIds: [1,21,47,55,78,79,85,90]
  },
  {
    name: "The Champ",
    png: "champ.png",
    description: "If multi > 10, multi doubles.",
    questionIds: [] // Ignored for Champ
  }
];

// ------------------------------------------------------
//                  PLAYER AMENDMENTS
// ------------------------------------------------------
let playerAmendments = [];

// ------------------------------------------------------
//               RENDER ACTIVE AMENDMENTS
// ------------------------------------------------------
function renderActiveAmendments() {
  const container = document.getElementById('amendment-slots');
  if (!container) return;

  container.innerHTML = '';

  for (let i = 0; i < 4; i++) {
    const slot = document.createElement('div');
    slot.className = 'amd-slot';

    const bg = document.createElement('img');
    bg.src = 'cards/slot.png';
    bg.className = 'amd-slot-bg';
    slot.appendChild(bg);

    if (playerAmendments[i]) {
      slot.innerHTML = "";

      const card = document.createElement('img');
      card.src = `cards/${playerAmendments[i].png}`;
      card.alt = playerAmendments[i].name;
      card.title = playerAmendments[i].description;
      card.className = 'amd-active-card';
      slot.appendChild(card);
    }

    container.appendChild(slot);
  }
}

// ------------------------------------------------------
//                    ADD AMENDMENT
// ------------------------------------------------------
function assignAmendment(name) {
  const amd = amendments.find(a => a.name === name);
  if (!amd) return;

  if (playerAmendments.length < 4) {
    playerAmendments.push(amd);
  } else {
    playerAmendments.shift();
    playerAmendments.push(amd);
  }

  renderActiveAmendments();
}

function assignRandomAmendment() {
  const available = amendments.filter(a => !playerAmendments.includes(a));
  if (available.length === 0) return alert("All amendment slots filled!");

  const pick = available[Math.floor(Math.random() * available.length)];
  assignAmendment(pick.name);
}

// ------------------------------------------------------
//      APPLY AMENDMENTS — ACTIVATION AFTER ANSWER
// ------------------------------------------------------
function applyAmendments(questionId, pts, multi) {
  let newPts = Number(pts || 0);
  let newMulti = Number(multi || 1);

  let activatedSlots = [];

  playerAmendments.forEach((amd, index) => {
    let activated = false;

    switch (amd.name) {

      case "Mr President":
        if (amd.questionIds.includes(questionId)) {
          newMulti += 5;
          activated = true;
        }
        break;

      case "International Affairs":
        if (amd.questionIds.includes(questionId)) {
          newPts += 50;
          newMulti += 2;
          activated = true;
        }
        break;

      case "Tax Exempt":
        newPts *= 1.5;
        newMulti *= 1.5;
        activated = true;
        break;

      case "Living the Dream":
        if (amd.questionIds.includes(questionId)) {
          newMulti += 10;
          activated = true;
        }
        break;

      case "Real State Genius":
        if (amd.questionIds.includes(questionId)) {
          newMulti += 4;
          activated = true;
        }
        break;

      case "The Champ":
        // Champ ONLY activates if final multi >= 10
        if (newMulti >= 10) {
          newMulti *= 2;
          activated = true;
        }
        break;
    }

    if (activated) activatedSlots.push(index);
  });

  // --------- FORCE WHOLE NUMBERS ---------
  newPts = Math.round(newPts);
  newMulti = Math.round(newMulti);
  // ---------------------------------------

  return { pts: newPts, multi: newMulti, activated: activatedSlots };
}

// ------------------------------------------------------
//          AMENDMENT PICK OVERLAY
// ------------------------------------------------------
function openAmendmentPick() {
  const overlay = document.getElementById("amd-pick-overlay");
  const options = document.getElementById("amd-pick-options");
  options.innerHTML = "";

  const available = amendments.filter(a => !playerAmendments.includes(a));
  if (available.length < 2) return;

  const picks = [];
  while (picks.length < 2) {
    let r = available[Math.floor(Math.random() * available.length)];
    if (!picks.includes(r)) picks.push(r);
  }

  picks.forEach(amd => {
    const card = document.createElement("img");
    card.src = `cards/${amd.png}`;
    card.className = "amd-pick-card";
    card.onclick = () => {
      assignAmendment(amd.name);
      closeAmendmentPick();
    };
    options.appendChild(card);
  });

  overlay.classList.remove("hidden");
}

function closeAmendmentPick() {
  const overlay = document.getElementById("amd-pick-overlay");
  overlay.classList.add("hidden");
}

// ------------------------------------------------------
renderActiveAmendments();
const btn = document.getElementById("add-amd-btn");
if (btn) btn.addEventListener("click", assignRandomAmendment);
