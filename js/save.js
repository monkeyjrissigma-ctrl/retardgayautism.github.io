// ===============================
// SAVE SYSTEM FOR F1 LEGENDS
// ===============================

// All saved data is stored under this key
const SAVE_KEY = "F1_LEGENDS_SAVE_DATA";

// Default save data
const defaultSave = {
    unlockedTeams: ["red_falcon"], // starter team
    wins: 0,
    bestLaps: {},
    chosenTeam: "red_falcon",
    chosenTrack: "sunset_circuit",
    contractsSigned: [],
    difficulty: "normal"
};

// Load save data or create new one
function loadSave() {
    let data = localStorage.getItem(SAVE_KEY);
    if (!data) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(defaultSave));
        return JSON.parse(JSON.stringify(defaultSave));
    }
    return JSON.parse(data);
}

// Save data back to localStorage
function saveData() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

// Reset save (for debugging or menu option)
function resetSave() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(defaultSave));
    location.reload();
}

// Global save object
let save = loadSave();

// ===============================
// TEAM UNLOCKING
// ===============================

function unlockTeam(teamId) {
    if (!save.unlockedTeams.includes(teamId)) {
        save.unlockedTeams.push(teamId);
        saveData();
    }
}

function isTeamUnlocked(teamId) {
    return save.unlockedTeams.includes(teamId);
}

// ===============================
// CONTRACT SYSTEM
// ===============================

function signContract(teamId) {
    if (!save.contractsSigned.includes(teamId)) {
        save.contractsSigned.push(teamId);
        save.chosenTeam = teamId;
        saveData();
    }
}

// ===============================
// TRACK + TEAM SELECTION
// ===============================

function setChosenTrack(trackId) {
    save.chosenTrack = trackId;
    saveData();
}

function setChosenTeam(teamId) {
    save.chosenTeam = teamId;
    saveData();
}

// ===============================
// RACE RESULTS
// ===============================

function recordWin() {
    save.wins++;
    saveData();
}

function recordBestLap(trackId, time) {
    if (!save.bestLaps[trackId] || time < save.bestLaps[trackId]) {
        save.bestLaps[trackId] = time;
        saveData();
    }
}

// ===============================
// DIFFICULTY
// ===============================

function setDifficulty(level) {
    save.difficulty = level;
    saveData();
}

function getDifficulty() {
    return save.difficulty || "normal";
}
