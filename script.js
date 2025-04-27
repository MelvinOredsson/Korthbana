const numHoles = 6;
let players = [];

// Lägg till spelare
function addPlayer() {
  const name = document.getElementById('playerNameInput').value.trim();
  if (!name) return alert('Ange ett namn!');
  players.push({ name, scores: Array(numHoles).fill(''), totalScore: 0 });
  savePlayersToLocalStorage();
  document.getElementById('playerNameInput').value = '';
  updatePlayerList();
}

// Uppdatera lista och visa hål-input när minst en spelare finns
function updatePlayerList() {
  const list = document.getElementById('playerList');
  list.innerHTML = '';
  players.forEach((p, i) => {
    const div = document.createElement('div');
    div.textContent = `${i + 1}. ${p.name}`;
    list.appendChild(div);
  });
  if (players.length) {
    document.querySelector('.holes-section').classList.remove('hidden');
    generateHoleForms();
  } else {
    document.querySelector('.holes-section').classList.add('hidden');
  }
}

// Skapa input-fält för varje hål per spelare
function generateHoleForms() {
  const container = document.getElementById('holesForms');
  container.innerHTML = '';
  players.forEach((p, i) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<h3>${p.name}</h3>`;
    for (let h = 1; h <= numHoles; h++) {
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.min = '1';
      inp.placeholder = `Hål ${h}`;
      inp.value = p.scores[h - 1] || '';
      inp.id = `player-${i}-hole-${h}`;

      inp.addEventListener('input', (e) => {
        players[i].scores[h - 1] = parseInt(e.target.value) || '';
        savePlayersToLocalStorage();
      });

      wrap.appendChild(inp);
    }
    container.appendChild(wrap);
  });
}

// Läs in poäng, spara runda till Firestore och visa sammanfattning
async function submitScores() {
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    let sum = 0;
    for (let h = 1; h <= numHoles; h++) {
      const v = document.getElementById(`player-${i}-hole-${h}`).value;
      if (!v) return alert('Alla hål måste fyllas i!');
      const n = parseInt(v);
      p.scores[h - 1] = n;
      sum += n;
    }
    p.totalScore = sum;
  }

  const roundData = {
    date: new Date().toISOString(),
    players
  };
  try {
    await fsAddDoc(fsCollection(firestoreDB, 'rounds'), roundData);
  } catch (err) {
    console.error('Fel vid spara i Firestore:', err);
  }

  clearPlayersLocalStorage();
  showRoundSummary();
}

// Visa sammanfattning av senaste runda
function showRoundSummary() {
  document.getElementById('playSection').classList.add('hidden');
  document.getElementById('roundSummarySection').classList.remove('hidden');
  const out = document.getElementById('roundSummary');
  out.innerHTML = '';

  const minScore = Math.min(...players.map(p => p.totalScore));
  players.forEach(p => {
    const crown = p.totalScore === minScore ? ' 👑' : '';
    const bestHole = Math.min(...p.scores);
    const avg = (p.totalScore / p.scores.length).toFixed(2);
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${p.name}${crown}</h3>
      <p>Totalt: ${p.totalScore} slag</p>
      <p>Snitt: ${avg} slag/hål</p>
      <p>Bästa hål: ${bestHole}</p>
    `;
    out.appendChild(div);
  });

  players = [];
  updatePlayerList();
}

// Gå till resultatvyn
function showResults() {
  document.getElementById('playSection').classList.add('hidden');
  document.getElementById('roundSummarySection').classList.add('hidden');
  document.getElementById('resultSection').classList.remove('hidden');
}

// Rendera alla sparade rundor
function renderRounds(rounds) {
  const container = document.getElementById('resultContainer');
  container.innerHTML = '';
  rounds.forEach((r, idx) => {
    const minScore = Math.min(...r.players.map(p => p.totalScore));
    let html = `
      <div class="round-summary" style="margin-bottom:1rem; padding:1rem; border:1px solid #ccc; border-radius:8px;">
        <h3>Runda ${idx + 1} – ${new Date(r.date).toLocaleString('sv-SE')}</h3>
        <ul style="list-style:none; padding:0;">`;
    r.players.forEach(p => {
      const crown = p.totalScore === minScore ? ' 👑' : '';
      const bestHole = Math.min(...p.scores);
      const avg = (p.totalScore / p.scores.length).toFixed(2);
      html += `
        <li style="margin-bottom:0.5rem;">
          <strong>${p.name}${crown}</strong>: 
          ${p.totalScore} slag 
          (snitt ${avg}, bästa hål ${bestHole})
        </li>`;
    });
    html += `
        </ul>
        <button onclick="deleteRound('${r.id}')">Ta bort runda</button>
      </div>`;
    container.innerHTML += html;
  });
}

// Ta bort en specifik runda
async function deleteRound(id) {
  await fsDeleteDoc(fsDoc(firestoreDB, 'rounds', id));
}

// Rensa alla rundor
async function resetResults() {
  if (!confirm('Ta bort alla rundor?')) return;
  const roundsRef = fsCollection(firestoreDB, 'rounds');
  const snap = await fsQuery(roundsRef, fsOrderBy('date', 'asc'));
  snap.forEach(docSnap => {
    fsDeleteDoc(fsDoc(firestoreDB, 'rounds', docSnap.id));
  });
}

// Gå tillbaka till spela-vyn
function showPlay() {
  document.getElementById('playSection').classList.remove('hidden');
  document.getElementById('roundSummarySection').classList.add('hidden');
  document.getElementById('resultSection').classList.add('hidden');
}

// LocalStorage-hantering
function savePlayersToLocalStorage() {
  localStorage.setItem('golfPlayers', JSON.stringify(players));
}

function loadPlayersFromLocalStorage() {
  const saved = localStorage.getItem('golfPlayers');
  if (saved) {
    players = JSON.parse(saved);
    updatePlayerList();
  }
}

function clearPlayersLocalStorage() {
  localStorage.removeItem('golfPlayers');
}

// Ladda vid start
document.addEventListener('DOMContentLoaded', () => {
  loadPlayersFromLocalStorage();

  const roundsRef = fsCollection(firestoreDB, 'rounds');
  const q = fsQuery(roundsRef, fsOrderBy('date', 'desc'));
  fsOnSnap(q, snapshot => {
    const rounds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderRounds(rounds);
  });
});
