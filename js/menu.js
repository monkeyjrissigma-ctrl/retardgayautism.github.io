// ===============================
// MENU SYSTEM FOR F1 LEGENDS
// ===============================

// HTML elements
const trackSelect = document.getElementById("track-select");
const teamSelect = document.getElementById("team-select");
const contractBox = document.getElementById("contract-box");
const contractText = document.getElementById("contract-text");
const startBtn = document.getElementById("start-btn");

// Loaded data
let tracksData = null;
let teamsData = null;

// ===============================
// LOAD TRACKS + TEAMS
// ===============================

async function loadTracks() {
    const res = await fetch("data/tracks.json");
    const json = await res.json();
    tracksData = json.tracks;

    tracksData.forEach(track => {
        const opt = document.createElement("option");
        opt.value = track.id;
        opt.textContent = track.name;
        trackSelect.appendChild(opt);
    });

    // Load saved track
    trackSelect.value = save.chosenTrack;
}

async function loadTeams() {
    const res = await fetch("data/teams.json");
    const json = await res.json();
    teamsData = json.teams;

    teamsData.forEach(team => {
        const opt = document.createElement("option");
        opt.value = team.id;

        // Mark locked teams
        if (!isTeamUnlocked(team.id)) {
            opt.textContent = `${team.name} (LOCKED)`;
            opt.disabled = true;
        } else {
            opt.textContent = team.name;
        }

        teamSelect.appendChild(opt);
    });

    // Load saved team
    if (isTeamUnlocked(save.chosenTeam)) {
        teamSelect.value = save.chosenTeam;
    }
}

// ===============================
// TEAM SELECTION + CONTRACT
// ===============================

teamSelect.addEventListener("change", () => {
    const teamId = teamSelect.value;
    const team = teamsData.find(t => t.id === teamId);

    if (!team) return;

    // Show contract
    contractBox.style.display = "block";
    contractText.textContent = team.contract;

    // Save chosen team
    setChosenTeam(teamId);
});

// ===============================
// TRACK SELECTION
// ===============================

trackSelect.addEventListener("change", () => {
    setChosenTrack(trackSelect.value);
});

// ===============================
// START RACE
// ===============================

startBtn.addEventListener("click", () => {
    const teamId = teamSelect.value;

    // If team is locked, block start
    if (!isTeamUnlocked(teamId)) {
        alert("This team is locked! Win more races to unlock it.");
        return;
    }

    // Sign contract if not signed
    signContract(teamId);

    // Go to race
    window.location.href = "game.html";
});

// ===============================
// INITIALIZE MENU
// ===============================

loadTracks();
loadTeams();
