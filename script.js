const BUILDINGS = { residential: { label: "RESIDENCE", symbol: "▦", cost: 120, population: 400, happiness: 1, satisfaction: 1 }, school: { label: "SCHOOL", symbol: "⌂", cost: 180, population: 80, education: 500, happiness: 10, satisfaction: 4 }, park: { label: "PARK", symbol: "✦", cost: 80, population: 100, happiness: 10, satisfaction: 2 }, hospital: { label: "HOSPITAL", symbol: "+", cost: 220, population: 120, happiness: 3, satisfaction: 3 }, station: { label: "STATION", symbol: "◇", cost: 240, population: 180, happiness: 2, satisfaction: 5 }, road: { label: "ROAD", symbol: "═", cost: 70, population: 0, happiness: 0, satisfaction: 1 } };
const state = { population: 5000, baseEducationCapacity: 5000, educationCapacity: 5000, baseHealthCapacity: 6000, healthCapacity: 6000, hospitals: 0, healthEmergencyActive: false, schools: 0, happiness: 72, satisfaction: 68, credits: 1000, cycle: 1, selectedBuilding: null, shortageActive: false, shortageSolved: false, buildings: [] };
const startOverlay = document.querySelector("#startOverlay");
const startGameButton = document.querySelector("#startGame");
const levelValue = document.querySelector("#cityLevel");
const scoreValue = document.querySelector("#cityScore");
const goalValue = document.querySelector("#nextGoal");
const cityTip = document.querySelector("#cityTip");
const cityStatus = document.querySelector("#cityStatus");

const battleState = {
  threat: 45,
  defense: 32,
  morale: 74,
  raids: 0,
  missions: [
    { id: 1, title: "Defend the Core", description: "Keep happiness above 70 and safety above 60.", complete: false },
    { id: 2, title: "Build Strong Housing", description: "Reach population above 8,000.", complete: false },
    { id: 3, title: "Support the City", description: "Construct at least 2 schools and 1 hospital.", complete: false },
    { id: 4, title: "Clean and Secure", description: "Reduce pollution below 30% and crime below 25.", complete: false }
  ]
};

function getGoalTarget() {
  return 1500 + (Number(levelValue.textContent || 1) - 1) * 500;
}

function updateBattleHUD() {
  const threatBar = document.querySelector("#threatBar");
  const threatLabel = document.querySelector("#threatLabel");
  const defenseValue = document.querySelector("#defenseValue");
  const moraleValue = document.querySelector("#moraleValue");
  const raidValue = document.querySelector("#raidValue");

  battleState.threat = Math.max(0, Math.min(100, Math.round(45 + (state.population - 5000) / 150 - state.happiness / 4 + battleState.raids * 10)));
  battleState.defense = Math.max(10, Math.min(100, 20 + state.schools * 6 + state.hospitals * 8 + (state.buildings.filter((building) => building === "road") || []).length * 2));
  battleState.morale = Math.max(0, Math.min(100, state.happiness + state.satisfaction - battleState.threat / 2));

  threatBar.style.width = `${battleState.threat}%`;
  threatLabel.textContent = `THREAT ${battleState.threat}%`;
  defenseValue.textContent = battleState.defense;
  moraleValue.textContent = Math.round(battleState.morale);
  raidValue.textContent = battleState.raids;
}

function renderMissionList() {
  const missionList = document.querySelector("#missionList");
  const missionProgressText = document.querySelector("#missionProgressText");
  missionList.innerHTML = "";

  let completedCount = 0;
  battleState.missions.forEach((mission) => {
    const isComplete = checkMissionStatus(mission);
    mission.complete = isComplete;
    if (isComplete) completedCount += 1;

    const item = document.createElement("div");
    item.className = `mission-item${isComplete ? " completed" : ""}`;
    item.innerHTML = `
      <div>
        <strong>${mission.title}</strong>
        <small>${mission.description}</small>
      </div>
      <span class="mission-status">${isComplete ? "DONE" : "LIVE"}</span>
    `;
    missionList.appendChild(item);
  });

  missionProgressText.textContent = `${completedCount} / ${battleState.missions.length}`;
}

function checkMissionStatus(mission) {
  if (mission.id === 1) return state.happiness >= 70 && state.satisfaction >= 60;
  if (mission.id === 2) return state.population >= 8000;
  if (mission.id === 3) return state.schools >= 2 && state.hospitals >= 1;
  if (mission.id === 4) return state.population >= 5000 && document.querySelector("#pollutionValue")?.textContent <= 30 && document.querySelector("#crimeValue")?.textContent <= 25;
  return false;
}

function updateProgressHUD() {
  const level = Math.max(1, Math.floor(state.population / 2500));
  const score = Math.round(state.happiness * 8 + state.satisfaction * 9 + state.population / 18 + state.credits / 10);
  levelValue.textContent = level;
  scoreValue.textContent = formatNumber(score);
  goalValue.textContent = formatNumber(getGoalTarget());
  cityStatus.textContent = state.population >= 12000 ? "CITY THRIVING" : "CITY ONLINE";

  const stages = [...document.querySelectorAll(".stage-step")];
  let currentStage = 1;
  if (state.population >= 9000) currentStage = 5;
  else if (state.population >= 7000) currentStage = 4;
  else if (state.population >= 4500) currentStage = 3;
  else if (state.population >= 2000) currentStage = 2;

  stages.forEach((stage) => {
    const stageNumber = Number(stage.dataset.stage);
    stage.classList.toggle("active", stageNumber === currentStage);
    stage.classList.toggle("complete", stageNumber < currentStage);
  });

  const tips = [
    "Plan roads before housing.",
    "School access unlocks faster growth.",
    "Parks reduce stress and boost happiness.",
    "Hospital coverage supports stronger resilience.",
    "Keep traffic below 75% for stable growth."
  ];
  const tipIndex = (state.cycle + state.schools + state.hospitals) % tips.length;
  cityTip.textContent = tips[tipIndex];

  updateBattleHUD();
  renderMissionList();
}

startGameButton.addEventListener("click", () => {
  startOverlay.classList.add("hidden");
  showToast("City launch successful. Begin expansion.");
  updateProgressHUD();
});

function triggerRaid() {
  battleState.raids += 1;
  state.happiness = Math.max(0, state.happiness - 5);
  state.satisfaction = Math.max(0, state.satisfaction - 4);
  showToast("Enemy raid detected. Increase defense and morale.");
  updateHud();
  updateProgressHUD();
}

document.querySelector("#deployDefense").addEventListener("click", () => {
  const defenseBoost = Math.min(100, battleState.defense + 12);
  battleState.defense = defenseBoost;
  battleState.threat = Math.max(0, battleState.threat - 15);
  state.credits -= 60;
  showToast("Defense deployed. Threat reduced.");
  updateHud();
  updateProgressHUD();
});

document.querySelector("#callAid").addEventListener("click", () => {
  state.credits += 120;
  battleState.morale = Math.min(100, battleState.morale + 10);
  state.happiness = Math.min(100, state.happiness + 7);
  showToast("Aid received. Morale and resources improved.");
  updateHud();
  updateProgressHUD();
});

setInterval(() => {
  if (Math.random() < 0.25) triggerRaid();
}, 9000);
const grid = document.querySelector("#cityGrid"); const buildOptions = document.querySelector("#buildOptions"); const eventPanel = document.querySelector("#eventPanel"); const eventContent = document.querySelector("#eventContent"); const eventAction = document.querySelector("#eventAction"); const healthEvent = document.querySelector("#healthEvent"); const healthStats = document.querySelector("#healthStats"); const healthAction = document.querySelector("#healthAction"); const toast = document.querySelector("#toast");
function formatNumber(value) { return value.toLocaleString("en-US"); }
function renderGrid() { grid.innerHTML = ""; for (let index = 0; index < 20; index += 1) { const plot = document.createElement("button"); const building = state.buildings[index]; plot.className = `plot${building ? " occupied" : ""}`; plot.setAttribute("aria-label", building ? `${BUILDINGS[building].label} plot` : "Empty buildable plot"); if (building) { const definition = BUILDINGS[building]; plot.innerHTML = `<span class="building ${building}">${definition.symbol}<span class="building-label">${definition.label}</span></span>`; plot.disabled = true; } else plot.addEventListener("click", () => placeBuilding(index)); grid.append(plot); } }
function getTraffic() { const roads = state.buildings.filter((building) => building === "road").length; const stations = state.buildings.filter((building) => building === "station").length; return Math.min(100, Math.max(0, Math.round(20 + state.population / 100 - roads * 15 - stations * 8))); }
function updateHud() { const traffic = getTraffic(); document.querySelector("#populationValue").textContent = formatNumber(state.population); document.querySelector("#educationValue").textContent = formatNumber(state.educationCapacity); document.querySelector("#schoolsValue").textContent = state.schools; document.querySelector("#schoolCapacityLabel").textContent = `+${formatNumber(state.schools * 500)} capacity`; document.querySelector("#happinessValue").textContent = state.happiness; document.querySelector("#satisfactionValue").textContent = state.satisfaction; document.querySelector("#trafficValue").textContent = traffic; document.querySelector("#trafficBar").style.width = `${traffic}%`; document.querySelector("#trafficBar").classList.toggle("critical", traffic >= 75); document.querySelector("#creditsValue").textContent = formatNumber(state.credits); document.querySelector("#cycleLabel").textContent = `CYCLE ${String(state.cycle).padStart(2, "0")}`; document.querySelector("#populationProgress").style.width = `${Math.min(100, Math.max(10, state.population / (state.educationCapacity + 1500) * 100))}%`; document.querySelector("#populationTrend").textContent = state.shortageActive ? "Education capacity exceeded · action required" : state.healthEmergencyActive ? "Health demand exceeded · action required" : traffic >= 75 ? "Traffic congestion high · build roads or a station" : "Healthy city growth · next growth cycle in 8s"; const shortageStats = document.querySelector("#shortageStats"); if (shortageStats) shortageStats.textContent = `Education capacity: ${formatNumber(state.educationCapacity)} · Population: ${formatNumber(state.population)}`; if (healthStats) healthStats.textContent = `Hospital capacity: ${formatNumber(state.healthCapacity)} · Population: ${formatNumber(state.population)}`; updateProgressHUD(); }
function selectBuilding(type) { state.selectedBuilding = type; document.querySelectorAll(".build-option").forEach((button) => button.classList.toggle("active", button.dataset.building === type)); document.querySelector("#selectedBuilding").textContent = `PLACING ${BUILDINGS[type].label}`; document.querySelector("#placementHint").textContent = `Choose an open plot to place your ${BUILDINGS[type].label.toLowerCase()}.`; grid.querySelectorAll(".plot:not(.occupied)").forEach((plot) => plot.classList.add("selected")); }
function placeBuilding(index) { if (!state.selectedBuilding) { showToast("Select a facility from City Development first."); return; } const type = state.selectedBuilding; const definition = BUILDINGS[type]; if (state.credits < definition.cost) { showToast("Not enough development credits for this facility."); return; } const wasShortage = state.shortageActive; const wasHealthEmergency = state.healthEmergencyActive; state.credits -= definition.cost; state.buildings[index] = type; state.population += definition.population; state.happiness = Math.min(100, state.happiness + definition.happiness); state.satisfaction = Math.min(100, state.satisfaction + definition.satisfaction); if (type === "school") state.schools += 1; if (type === "hospital") { state.hospitals += 1; state.healthCapacity = state.baseHealthCapacity + state.hospitals * 1000; } state.educationCapacity = state.baseEducationCapacity + state.schools * 500; state.selectedBuilding = null; renderGrid(); updateHud(); document.querySelector("#selectedBuilding").textContent = "SELECT A FACILITY"; document.querySelector("#placementHint").textContent = "Select a facility, then choose an open plot."; document.querySelectorAll(".build-option").forEach((button) => button.classList.remove("active")); showToast(type === "school" ? "学校を建設しました！ · School constructed!" : type === "hospital" ? "Hospital opened · नागरिकहरूको उपचार सुरु भयो!" : `${definition.label} integrated into the city.`); if (type === "school" && wasShortage && state.population <= state.educationCapacity) solveShortage(); if (type === "hospital" && wasHealthEmergency && state.population <= state.healthCapacity) solveHealthEmergency(); checkShortage(); checkHealthEmergency(); }
function checkShortage() { if (state.population > state.educationCapacity && !state.shortageActive) { state.shortageActive = true; state.shortageSolved = false; eventPanel.hidden = false; eventPanel.classList.remove("solved"); document.querySelector("#eventLabel").textContent = "CITY PROBLEM"; eventContent.innerHTML = `<div class="event-copy"><p class="jp">「人口が増えました！学校が足りません。」</p><p class="en">Population increased! There aren't enough schools.</p><p class="en" id="shortageStats"></p></div>`; eventAction.hidden = false; updateHud(); playAlertTone(); } }
function checkHealthEmergency() { if (state.population >= 6000 && state.population > state.healthCapacity && !state.healthEmergencyActive) { state.healthEmergencyActive = true; healthEvent.hidden = false; healthEvent.classList.remove("solved"); updateHud(); playAlertTone(); } }
function solveHealthEmergency() { state.healthEmergencyActive = false; healthEvent.classList.add("solved"); healthEvent.querySelector(".event-topline span:nth-child(2)").textContent = "HEALTH EMERGENCY SOLVED"; healthEvent.querySelector(".health-icon").textContent = "✓"; healthEvent.querySelector(".event-copy").innerHTML = `<p class="jp">「病院を建設しました！」</p><p class="en">Hospital constructed! Citizens can receive care.</p><p class="en">❤️ Health capacity +1,000 · 😊 Happiness +8 · 🏙 Satisfaction +5</p>`; healthAction.hidden = true; state.happiness = Math.min(100, state.happiness + 8); state.satisfaction = Math.min(100, state.satisfaction + 5); updateHud(); setTimeout(() => { healthEvent.hidden = true; }, 5000); }
function solveShortage() { state.shortageActive = false; state.shortageSolved = true; eventPanel.classList.add("solved"); document.querySelector("#eventLabel").textContent = "PROBLEM SOLVED"; eventContent.innerHTML = `<div class="event-copy"><p class="jp">🎉 Problem Solved!</p><p class="en">学校を建設しました！ School constructed!</p><p class="en">😊 Happiness +10 · 👥 Education capacity +500<br>🏙 City satisfaction increases</p></div>`; eventAction.hidden = true; state.satisfaction = Math.min(100, state.satisfaction + 5); updateHud(); setTimeout(() => { eventPanel.hidden = true; }, 5000); }
function growPopulation() { const usefulBuildings = state.buildings.filter(Boolean).length; if (usefulBuildings === 0) return; const growthBoost = Math.max(0, state.happiness - 60) + Math.max(0, state.satisfaction - 55) + Math.max(0, state.educationCapacity - state.population) / 80; state.population += Math.round(40 + usefulBuildings * 20 + growthBoost / 6); state.cycle += 1; state.credits += 20 + Math.min(35, Math.floor(state.happiness / 8)); updateHud(); checkShortage(); checkHealthEmergency(); }
function showToast(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timeout); showToast.timeout = setTimeout(() => toast.classList.remove("show"), 3600); }
function playAlertTone() { if (!window.AudioContext && !window.webkitAudioContext) return; const audio = new (window.AudioContext || window.webkitAudioContext)(); const oscillator = audio.createOscillator(); const gain = audio.createGain(); oscillator.frequency.value = 520; gain.gain.setValueAtTime(.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .22); oscillator.connect(gain).connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .22); }
buildOptions.addEventListener("click", (event) => { const button = event.target.closest("[data-building]"); if (button) selectBuilding(button.dataset.building); }); eventAction.addEventListener("click", () => selectBuilding("school")); healthAction.addEventListener("click", () => selectBuilding("hospital")); document.querySelector("#closeEvent").addEventListener("click", () => { eventPanel.hidden = true; }); document.querySelector("#closeHealthEvent").addEventListener("click", () => { healthEvent.hidden = true; }); renderGrid(); updateHud(); setInterval(growPopulation, 8000);
const taskItems = document.querySelectorAll(".task-item"); const evacuationModal = document.querySelector("#evacuationModal"); const closeEvacuation = document.querySelector("#closeEvacuation"); const scenarioButtons = document.querySelectorAll(".scenario-button"); const emergencyItems = document.querySelectorAll(".emergency-item"); const destinationButtons = document.querySelectorAll(".destination-button"); const routeMap = document.querySelector("#routeMap"); const destinationLabel = document.querySelector("#destinationLabel"); const routeInstructions = document.querySelector("#routeInstructions"); const peopleInstruction = document.querySelector("#peopleInstruction"); const peopleStatus = document.querySelector("#peopleStatus"); const personButtons = document.querySelectorAll(".evac-person"); const safePlaceButton = document.querySelector("#safePlaceButton"); const evacuationStatus = document.querySelector("#evacuationStatus"); const gameOverPanel = document.querySelector("#gameOverPanel"); const gameOverTitle = document.querySelector("#gameOverTitle"); const gameOverReason = document.querySelector("#gameOverReason"); const retryEvacuation = document.querySelector("#retryEvacuation"); let selectedScenario = null; let selectedDestination = null; let evacuationStarted = false; let gameOverTimer = null;
function updateEvacuationReadiness() { const selectedItems = document.querySelectorAll(".emergency-item.selected").length; safePlaceButton.disabled = !selectedScenario || selectedItems !== emergencyItems.length || !selectedDestination || evacuationStarted; if (!selectedScenario) evacuationStatus.textContent = "पहिले आपतकालीन अवस्था छान्नुहोस्।"; else if (selectedItems < emergencyItems.length) evacuationStatus.textContent = `${selectedItems}/${emergencyItems.length} important सामान तयार भयो।`; else if (!selectedDestination) evacuationStatus.textContent = "अब सुरक्षित ठाउँ छान्नुहोस्।"; else if (!evacuationStarted) evacuationStatus.textContent = "सामान तयार भयो। EVACUATION START गरेर मानिसहरूलाई guide गर्नुहोस्।"; }
const disasterAlert = document.querySelector("#disasterAlert"); const disasterTitle = document.querySelector("#disasterTitle"); const disasterMessage = document.querySelector("#disasterMessage"); const disasterCountdown = document.querySelector("#disasterCountdown"); let disasterInterval = null;
function startRealDisaster(scenario) { selectedScenario = scenario; disasterAlert.hidden = false; disasterTitle.textContent = scenario === "tsunami" ? "津波 WARNING / TSUNAMI" : "地震 ALERT / EARTHQUAKE"; disasterMessage.textContent = scenario === "tsunami" ? "समुद्रबाट टाढा, उचाइ भएको ठाउँतिर तुरुन्त जानुहोस्।" : "भवनबाट टाढा, खुला ठाउँतिर मानिसहरूलाई लैजानुहोस्।"; let seconds = 15; disasterCountdown.textContent = `${seconds}s TO SAFETY`; clearInterval(disasterInterval); disasterInterval = setInterval(() => { seconds -= 1; disasterCountdown.textContent = seconds > 0 ? `${seconds}s TO SAFETY` : "MOVE NOW"; if (seconds <= 0) clearInterval(disasterInterval); }, 1000); updateEvacuationReadiness(); playAlertTone(); }
scenarioButtons.forEach((button) => button.addEventListener("click", () => startRealDisaster(button.dataset.scenario)));
function chooseDestination(button) { selectedDestination = button.dataset.destination; destinationButtons.forEach((option) => option.classList.toggle("active", option === button)); routeMap.hidden = false; destinationLabel.textContent = selectedDestination === "hill-shelter" ? "HILL SHELTER" : "OPEN PLAZA"; routeInstructions.textContent = selectedScenario === "tsunami" ? "Tsunami मा समुद्रबाट टाढा, उचाइतिरको route follow गर्नुहोस्।" : "भूकम्पमा building बाट टाढा, खुला plaza को route follow गर्नुहोस्।"; updateEvacuationReadiness(); }
function resetEvacuation() { clearTimeout(gameOverTimer); evacuationStarted = false; personButtons.forEach((person) => { person.classList.remove("guided"); person.removeAttribute("style"); }); peopleStatus.textContent = "0 / 3 people safe"; routeMap.classList.remove("active"); gameOverPanel.hidden = true; safePlaceButton.textContent = "EVACUATION START गर्नुस्"; updateEvacuationReadiness(); }
function showEvacuationGameOver() { clearTimeout(gameOverTimer); evacuationStarted = false; routeMap.classList.remove("active"); safePlaceButton.disabled = true; gameOverPanel.hidden = false; gameOverTitle.textContent = "GAME OVER"; gameOverReason.textContent = selectedScenario === "tsunami" ? "तपाईंले सबैलाई उचाइको safe place मा पुर्‍याउन सक्नुभएन। Tsunami को पानीले शहर डुबायो।" : "तपाईंले सबैलाई खुला सुरक्षित ठाउँमा पुर्‍याउन सक्नुभएन। भूकम्पको debris ले बाटो रोक्यो।"; evacuationStatus.textContent = "समय सकियो। फेरि TRY AGAIN गरेर अभ्यास गर्नुहोस्।"; }
function guidePerson(person) { if (!evacuationStarted || person.classList.contains("guided")) return; person.classList.add("guided"); const guidedCount = document.querySelectorAll(".evac-person.guided").length; person.style.left = `${Math.max(70, 100 - guidedCount * 8)}%`; peopleStatus.textContent = `${guidedCount} / 3 people safe`; if (guidedCount === personButtons.length) { clearTimeout(gameOverTimer); evacuationStarted = false; routeMap.classList.remove("active"); safePlaceButton.textContent = "ALL PEOPLE SAFE"; safePlaceButton.disabled = true; evacuationStatus.textContent = "सबै मानिस safe place मा पुगे। अभ्यास सफल भयो!"; setTimeout(() => { evacuationModal.hidden = true; taskItems[0].classList.add("completed"); showToast("避難訓練 complete · सबैजना safe place मा पुग्नुभयो!"); }, 700); } }
taskItems[0].addEventListener("click", () => { evacuationModal.hidden = false; updateEvacuationReadiness(); }); taskItems[1].addEventListener("click", () => taskItems[1].classList.toggle("completed")); scenarioButtons.forEach((button) => button.addEventListener("click", () => { selectedScenario = button.dataset.scenario; scenarioButtons.forEach((option) => option.classList.toggle("active", option === button)); if (selectedDestination) chooseDestination(document.querySelector(`.destination-button[data-destination="${selectedDestination}"]`)); updateEvacuationReadiness(); })); emergencyItems.forEach((item) => item.addEventListener("click", () => { if (evacuationStarted) return; item.classList.toggle("selected"); item.querySelector(".item-check").textContent = item.classList.contains("selected") ? "✓" : "○"; updateEvacuationReadiness(); })); destinationButtons.forEach((button) => button.addEventListener("click", () => { if (!evacuationStarted) chooseDestination(button); })); personButtons.forEach((person) => person.addEventListener("click", () => guidePerson(person))); safePlaceButton.addEventListener("click", () => { if (evacuationStarted) return; evacuationStarted = true; routeMap.classList.add("active"); safePlaceButton.disabled = true; safePlaceButton.textContent = "GUIDE PEOPLE TO SAFETY"; peopleInstruction.textContent = "अब route मा भएका मानिसहरूलाई एक-एक गरेर click गरेर safe place पुर्‍याउनुहोस्।"; evacuationStatus.textContent = "खतरा सुरु भयो! सबै 3 जना लाई समयभित्र guide गर्नुहोस्।"; gameOverTimer = setTimeout(showEvacuationGameOver, 15000); }); retryEvacuation.addEventListener("click", resetEvacuation); closeEvacuation.addEventListener("click", () => { clearTimeout(gameOverTimer); evacuationModal.hidden = true; });

const systemState = { water: 100, power: 100, crime: 10, patrols: 0, trees: 0, weatherIndex: 0, missionComplete: false };
const weatherStates = [{ label: "CLEAR SKY", pollution: 0 }, { label: "HEAT WAVE", pollution: 8 }, { label: "HEAVY RAIN", pollution: -5 }];
const systemActions = document.querySelectorAll("[data-system-action]"); const missionAction = document.querySelector("#missionAction"); const qrLaunch = document.querySelector("#qrLaunch"); const qrPanel = document.querySelector("#qrPanel"); const qrImage = document.querySelector("#qrImage");
function updateCitySystems() { const parks = state.buildings.filter((building) => building === "park").length; const roads = state.buildings.filter((building) => building === "road").length; const weather = weatherStates[systemState.weatherIndex]; const pollution = Math.min(100, Math.max(0, Math.round(18 + state.population / 125 - parks * 8 - roads * 2 - systemState.trees * 8 + weather.pollution))); const water = Math.min(100, Math.max(0, systemState.water - Math.max(0, state.population - 5000) / 80)); const power = Math.min(100, Math.max(0, systemState.power - Math.max(0, state.population - 5000) / 90)); const crime = Math.min(100, Math.max(0, Math.round(systemState.crime + pollution / 8 - systemState.patrols * 10))); document.querySelector("#pollutionValue").textContent = pollution; document.querySelector("#waterValue").textContent = Math.round(water); document.querySelector("#powerValue").textContent = Math.round(power); document.querySelector("#crimeValue").textContent = crime; document.querySelector("#weatherLabel").textContent = weather.label; document.querySelector("#missionText").textContent = systemState.missionComplete ? "Mission complete. Citizens feel the difference." : `Reduce pollution below 30% (now ${pollution}%).`; document.querySelector("#missionAction").textContent = systemState.missionComplete ? "DONE" : "CHECK"; return { pollution, water, power, crime }; }
function runSystemAction(action) { if (action === "trees") { systemState.trees += 1; state.satisfaction = Math.min(100, state.satisfaction + 1); showToast("Tree planted · pollution pressure reduced."); } if (action === "water") { if (state.credits < 100) { showToast("Not enough credits for a water plant."); return; } state.credits -= 100; systemState.water = Math.min(100, systemState.water + 20); showToast("Water plant online · supply improved."); } if (action === "police") { if (state.credits < 60) { showToast("Not enough credits for a police patrol."); return; } state.credits -= 60; systemState.patrols += 1; state.satisfaction = Math.min(100, state.satisfaction + 1); showToast("Police patrol deployed · crime risk reduced."); } if (action === "tax") { state.credits += 120; showToast("City tax collected · budget +¥120."); } updateHud(); updateCitySystems(); }
systemActions.forEach((button) => button.addEventListener("click", () => runSystemAction(button.dataset.systemAction))); missionAction.addEventListener("click", () => { const systems = updateCitySystems(); if (systems.pollution < 30) { systemState.missionComplete = true; state.happiness = Math.min(100, state.happiness + 5); state.satisfaction = Math.min(100, state.satisfaction + 3); updateHud(); updateCitySystems(); showToast("Mission complete · Cleaner city, happier citizens!"); } else showToast("Mission incomplete · reduce pollution below 30% first."); }); qrLaunch.addEventListener("click", () => { const launchUrl = window.location.href; qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(launchUrl)}`; qrPanel.hidden = !qrPanel.hidden; }); document.querySelector("#boostGrowthButton").addEventListener("click", () => { state.credits += 180; state.happiness = Math.min(100, state.happiness + 5); state.satisfaction = Math.min(100, state.satisfaction + 5); state.population += 250; updateHud(); showToast("Growth boost activated · extra residents added."); }); document.querySelector("#advisorButton").addEventListener("click", () => { const advice = [
    "Add roads for better commute flow.",
    "Balance schools and parks to keep happiness high.",
    "Build a hospital before urban density spikes.",
    "Plant more trees if pollution exceeds 35%.",
    "A station improves growth and travel efficiency."
  ]; const message = advice[(state.cycle + state.schools) % advice.length]; cityTip.textContent = message; showToast(message); }); setInterval(() => { systemState.weatherIndex = (systemState.weatherIndex + 1) % weatherStates.length; updateCitySystems(); }, 12000); updateCitySystems();


const plannerPieces = { road: { icon: "═", label: "ROAD" }, house: { icon: "▦", label: "HOUSE" }, school: { icon: "⌂", label: "SCHOOL" }, toilet: { icon: "♧", label: "TOILET" }, park: { icon: "✦", label: "PARK" }, hospital: { icon: "+", label: "HOSPITAL" } }; let selectedPlanPiece = null; let draggedPlanPiece = null; const planningLand = document.querySelector("#planningLand"); const plannerSelected = document.querySelector("#plannerSelected"); const plannerScore = document.querySelector("#plannerScore"); const plannerRank = document.querySelector("#plannerRank"); const plannerFeedback = document.querySelector("#plannerFeedback"); const evaluateCity = document.querySelector("#evaluateCity"); const clearPlan = document.querySelector("#clearPlan");
function renderPlanningLand() { planningLand.innerHTML = ""; for (let index = 0; index < 48; index += 1) { const cell = document.createElement("button"); cell.type = "button"; cell.className = "land-cell"; cell.dataset.index = index; cell.setAttribute("aria-label", "Empty city planning land"); cell.addEventListener("click", () => placePlanPiece(cell, selectedPlanPiece)); cell.addEventListener("dragover", (event) => { event.preventDefault(); cell.classList.add("drop-target"); }); cell.addEventListener("dragleave", () => cell.classList.remove("drop-target")); cell.addEventListener("drop", (event) => { event.preventDefault(); cell.classList.remove("drop-target"); placePlanPiece(cell, draggedPlanPiece); }); planningLand.append(cell); } }
function placePlanPiece(cell, type) { if (!type || cell.classList.contains("occupied")) return; const piece = plannerPieces[type]; cell.classList.add("occupied"); cell.dataset.type = type; cell.setAttribute("aria-label", `${piece.label} placed`); cell.innerHTML = `<span class="plan-piece plan-${type}">${piece.icon}<small>${piece.label}</small></span>`; plannerSelected.textContent = `${piece.label} SELECTED`; plannerFeedback.textContent = `${piece.label} placed. Add another, or choose a different structure.`; }
function getCellPoint(cell) { return { x: Number(cell.dataset.index) % 8, y: Math.floor(Number(cell.dataset.index) / 8) }; }
function distanceBetween(first, second) { return Math.abs(first.x - second.x) + Math.abs(first.y - second.y); }
function evaluatePlan() { const cells = [...planningLand.querySelectorAll(".land-cell.occupied")]; const pieces = cells.map((cell) => ({ type: cell.dataset.type, point: getCellPoint(cell) })); const count = (type) => pieces.filter((piece) => piece.type === type).length; const homes = pieces.filter((piece) => piece.type === "house"); const roads = pieces.filter((piece) => piece.type === "road"); const schools = pieces.filter((piece) => piece.type === "school"); const toilets = pieces.filter((piece) => piece.type === "toilet"); const parks = count("park"); const hospitals = pieces.filter((piece) => piece.type === "hospital"); let score = 0; const notes = []; const nearestDistance = (sources, targets) => sources.length && targets.length ? Math.min(...sources.map((source) => Math.min(...targets.map((target) => distanceBetween(source.point, target.point))))) : Infinity; if (roads.length >= 6) { score += 20; notes.push("road network connected"); } else notes.push("add at least 6 roads"); if (homes.length >= 4) score += 10; else notes.push("add 4 or more houses"); if (nearestDistance(homes, schools) <= 4) { score += 20; notes.push("school is close to homes"); } else notes.push("place school within 4 cells of homes"); if (nearestDistance(homes, toilets) <= 3) { score += 15; notes.push("toilet access is good"); } else notes.push("place a public toilet near homes"); if (parks >= 2) score += 15; else notes.push("add 2 green spaces"); if (hospitals.length && roads.length) score += 10; else notes.push("add hospital beside a road"); if (pieces.length >= 12) score += 10; else notes.push("use more of the available land"); const rank = score >= 90 ? "S" : score >= 75 ? "A" : score >= 55 ? "B" : score >= 35 ? "C" : "D"; plannerScore.textContent = score; plannerRank.textContent = `RANK ${rank}`; plannerFeedback.textContent = `${score >= 75 ? "Excellent city structure. " : "Keep improving the plan. "}${notes.join(" · ")}.`; }
document.querySelectorAll(".palette-item").forEach((button) => { button.addEventListener("click", () => { selectedPlanPiece = button.dataset.plan; document.querySelectorAll(".palette-item").forEach((option) => option.classList.toggle("active", option === button)); plannerSelected.textContent = plannerPieces[selectedPlanPiece].label; }); button.addEventListener("dragstart", () => { draggedPlanPiece = button.dataset.plan; selectedPlanPiece = draggedPlanPiece; }); }); evaluateCity.addEventListener("click", evaluatePlan); clearPlan.addEventListener("click", () => { renderPlanningLand(); plannerScore.textContent = "--"; plannerRank.textContent = "NOT EVALUATED"; plannerFeedback.textContent = "Plan a city with roads, homes, services and public space."; }); renderPlanningLand();
