import { createScene } from "./scene3d.js";

const canvas = document.querySelector("#gameCanvas");
const startScreen = document.querySelector("#startScreen");
const endScreen = document.querySelector("#endScreen");
const startButton = document.querySelector("#startButton");
const playAgainButton = document.querySelector("#playAgainButton");
const pauseButton = document.querySelector("#pauseButton");
const pauseOverlay = document.querySelector("#pauseOverlay");
const interactionPrompt = document.querySelector("#interactionPrompt");
const touchInteract = document.querySelector("#touchInteract");
const locationModal = document.querySelector("#locationModal");
const scene3D = createScene(canvas, document.querySelector("#heroPreview"));
const worldWidth = 4100;
const groundY = 470;
const player = { x: 115, z: 0, y: groundY - 66, width: 38, height: 66, velocityX: 0, velocityZ: 0, velocityY: 0, heading: Math.PI, running: false, health: 100, invulnerable: 0, attackTime: 0, attackCooldown: 0, onGround: true };
const shardSpots = [390, 720, 1060, 1450, 1810, 2160, 2540, 2910, 3290, 3650];
const enemySpots = [600, 1240, 2280, 3230];
const finalChallenge = {
  villainState: "IDLE",
  points: [
    { id: 1, x: 14, z: -16.5, interactionRadius: 2.35, activated: false },
    { id: 2, x: 14, z: -7, interactionRadius: 2.35, activated: false },
    { id: 3, x: 4.3, z: -7.7, interactionRadius: 2.2, activated: false }
  ],
  waves: [],
  barriers: [],
  nextWaveId: 1,
  nextBarrierId: 1,
  elapsed: 0,
  nextWaveAt: 0,
  nextBarrierAt: 0,
  nextTeleportAt: 0,
  hitCooldown: 0,
  reactionUntil: 0,
  playerEnergy: 100,
  lastSafePosition: { x: 115, z: 0 },
  villainPosition: { x: 9.7, z: -16.2 },
  introStartedAt: 0,
  restorationProgress: 0,
  restorationStartProgress: 0,
  restorationElapsed: 0
};
const input = { forward: false, backward: false, left: false, right: false, run: false };
const mainQuests = [
  { id: 1, title: "Mysterious Signal", description: "A strange energy is stirring somewhere in Nagoya.", objective: "Investigate the strange signal in the city.", targetLocation: null, story: "Something strange is happening in the city...", completed: false, state: "NOT_STARTED" },
  { id: 2, title: "Visit the Temple", description: "The old wooden hall may know more about the energy.", objective: "Go to the ancient temple and investigate the mysterious energy.", targetLocation: "temple", story: "The temple is reacting to an unknown energy.", completed: false, state: "NOT_STARTED" },
  { id: 3, title: "Search the Shrine", description: "A faint clue is hidden beyond the old torii.", objective: "Search the old shrine for a clue.", targetLocation: "shrine", story: "Someone has been watching the city from the shadows.", completed: false, state: "NOT_STARTED" },
  { id: 4, title: "Ask Along the Shopping Street", description: "The shopkeepers have watched the signal move through town.", objective: "Find information about the strange signal.", targetLocation: "shopping", story: "A shopkeeper whispers: “The signal drifted toward the park.”", completed: false, state: "NOT_STARTED" },
  { id: 5, title: "Explore the Park", description: "Look beneath the blossoms for the source of the energy.", objective: "Search the cherry blossom park for the hidden energy source.", targetLocation: "park", story: "A hidden pulse points toward the Future District.", completed: false, state: "NOT_STARTED" },
  { id: 6, title: "Follow the Signal", description: "The signal grows stronger among the blue-lit towers.", objective: "Follow the mysterious signal to the Future District.", targetLocation: "modern", story: "The signal carries the villain's mark. It leads to the castle.", completed: false, state: "NOT_STARTED" },
  { id: 7, title: "Reach the Castle", description: "The source of the signal waits near the old castle.", objective: "Go to the castle and prepare for the final challenge.", targetLocation: "castle", story: "The mystery leads to the castle...", completed: false, state: "NOT_STARTED" }
];
let shards = [];
let enemies = [];
let running = false;
let paused = false;
let ended = false;
let lastFrame = 0;
let cameraX = 0;
let collectedShards = 0;
let defeatedEnemies = 0;
let experience = 0;
let level = 1;
let toastTimer;
let cameraOrbit = 0;
let cameraDragPointer = null;
let lastCameraPointerX = 0;
let nearbyLocation = null;
let nearbyEnergyPoint = null;
let locationModalOpen = false;
let lastQuestStory = "Explore the city to trace the signal.";
let lastRestorationDisplayedPercent = -1;
let gameState = "CITY_EXPLORATION";
window.miraiGameState = gameState;
window.miraiQuests = mainQuests;
window.miraiFinalChallenge = finalChallenge;

function resetQuest() {
  player.x = 115;
  player.z = 0;
  player.y = groundY - player.height;
  player.velocityX = 0;
  player.velocityZ = 0;
  player.velocityY = 0;
  player.heading = Math.PI;
  player.running = false;
  player.health = 100;
  player.invulnerable = 0;
  player.attackTime = 0;
  player.attackCooldown = 0;
  player.onGround = true;
  shards = shardSpots.map((x, index) => ({ x, z: index % 3 === 0 ? -0.35 : 0.25, y: groundY - 62 - (index % 2) * 30, taken: false, phase: index * 1.6 }));
  enemies = enemySpots.map((x, index) => ({ x, z: index % 2 ? -0.48 : 0.42, homeX: x, y: groundY - 58, health: 1, phase: index * 2.2, alive: true, hitFlash: 0 }));
  running = false;
  paused = false;
  ended = false;
  cameraX = 0;
  cameraOrbit = 0;
  nearbyLocation = null;
  nearbyEnergyPoint = null;
  locationModalOpen = false;
  locationModal.hidden = true;
  locationModal.classList.remove("open");
  locationModal.classList.remove("villain-intro");
  document.querySelector("#challengeStartButton").hidden = true;
  pauseOverlay.hidden = true;
  pauseButton.hidden = true;
  document.querySelector("#pauseQuestSummary").hidden = true;
  mainQuests.forEach((quest) => {
    quest.completed = false;
    quest.state = "NOT_STARTED";
  });
  finalChallenge.villainState = "IDLE";
  finalChallenge.points.forEach((point) => { point.activated = false; });
  finalChallenge.waves.length = 0;
  finalChallenge.barriers.length = 0;
  finalChallenge.nextWaveId = 1;
  finalChallenge.nextBarrierId = 1;
  finalChallenge.elapsed = 0;
  finalChallenge.nextWaveAt = 0;
  finalChallenge.nextBarrierAt = 0;
  finalChallenge.nextTeleportAt = 0;
  finalChallenge.hitCooldown = 0;
  finalChallenge.reactionUntil = 0;
  finalChallenge.playerEnergy = 100;
  finalChallenge.lastSafePosition = { x: 115, z: 0 };
  finalChallenge.villainPosition = { x: 9.7, z: -16.2 };
  finalChallenge.introStartedAt = 0;
  finalChallenge.restorationProgress = 0;
  finalChallenge.restorationStartProgress = 0;
  finalChallenge.restorationElapsed = 0;
  finalChallenge.endingProgress = 0;
  lastQuestStory = "Explore the city to trace the signal.";
  gameState = "CITY_EXPLORATION";
  window.miraiGameState = gameState;
  collectedShards = 0;
  defeatedEnemies = 0;
  experience = 0;
  level = 1;
  startScreen.hidden = false;
  endScreen.hidden = true;
  document.querySelector("#endEyebrow").textContent = "QUEST COMPLETE";
  document.querySelector("#endTitle").innerHTML = "NAGOYA<br><em>IS YOURS.</em>";
  document.querySelector("#endMessage").textContent = "The sakura gate is open again.";
  document.querySelector("#gameStatus").textContent = "READY TO PLAY";
  updateInteractionPrompt();
  updateHud();
  scene3D.syncObjects(shards, enemies);
  scene3D.render({ time: 0, delta: 16, cameraX, cameraOrbit, player, shards, enemies, challenge: finalChallenge, nearbyLocation });
}

function resizeCanvas() {
  scene3D.resize();
  scene3D.render({ time: performance.now(), delta: 16, cameraX, cameraOrbit, player, shards, enemies, challenge: finalChallenge, nearbyLocation });
}

function updateHud() {
  document.querySelector("#shardCount").textContent = String(collectedShards).padStart(2, "0");
  document.querySelector("#enemyCount").textContent = String(Math.max(0, 4 - defeatedEnemies)).padStart(2, "0");
  document.querySelector("#healthFill").style.width = `${player.health}%`;
  document.querySelector("#healthValue").textContent = player.health;
  document.querySelector("#missionText").textContent = `Find the gate · ${collectedShards} / 5 shards`;
  document.querySelector("#locationName").textContent = getLocationName();
  document.querySelector("#xpValue").textContent = `${experience % 100} / 100`;
  document.querySelector("#xpFill").style.width = `${experience % 100}%`;
  document.querySelector("#levelValue").textContent = String(level).padStart(2, "0");
  updateQuestHud();
}

function updateQuestHud() {
  const activeQuest = mainQuests.find((quest) => quest.state === "ACTIVE");
  const nextQuest = activeQuest || mainQuests.find((quest) => quest.state === "NOT_STARTED");
  const completedCount = mainQuests.filter((quest) => quest.completed).length;
  const activatedPoints = finalChallenge.points.filter((point) => point.activated).length;
  const challengeActive = gameState === "FINAL_CHALLENGE_ACTIVE";
  const cityRestored = gameState === "CITY_RESTORED";
  const challengeVisible = challengeActive || cityRestored;
  const energyMode = challengeVisible;
  const displayedStep = activeQuest?.id ?? completedCount;
  const questTitle = challengeActive ? "Final Challenge" : cityRestored ? "City Restored" : nextQuest?.title || "Final Challenge Ready";
  const questObjective = challengeActive ? "Restore the 3 city energy points." : cityRestored ? "The future of the city has changed." : nextQuest?.objective || "The city is ready for its final challenge.";
  document.querySelector("#missionText").textContent = challengeActive ? `Energy Points · ${activatedPoints} / 3` : cityRestored ? "City Restored" : nextQuest?.title || "Final Challenge Ready";
  document.querySelector("#questTitle").textContent = questTitle;
  document.querySelector("#questObjective").textContent = questObjective;
  document.querySelector("#questProgressText").textContent = challengeVisible ? `${activatedPoints} / 3` : `${displayedStep} / ${mainQuests.length}`;
  document.querySelector("#questProgressFill").style.width = `${challengeVisible ? activatedPoints / 3 * 100 : completedCount / mainQuests.length * 100}%`;
  document.querySelector("#questLocation").textContent = nearbyLocation?.name || getLocationName();
  document.querySelector("#questStory").textContent = cityRestored ? "The future of the city has changed." : lastQuestStory;
  document.querySelector("#questFinalState").hidden = gameState !== "FINAL_CHALLENGE_READY";
  document.querySelector("#challengePanel").hidden = !challengeVisible;
  document.querySelector(".challenge-heading").textContent = cityRestored ? "CITY RESTORED" : "FINAL CHALLENGE";
  document.querySelector("#challengeObjective").textContent = cityRestored ? "The city energy has been restored." : "Restore the 3 city energy points.";
  document.querySelector("#energyPointsProgress").textContent = `${activatedPoints} / 3`;
  document.querySelector("#energyPointsFill").style.width = `${activatedPoints / 3 * 100}%`;
  document.querySelector("#playerEnergyValue").textContent = `${Math.round(finalChallenge.playerEnergy)}%`;
  document.querySelector("#playerEnergyFill").style.width = `${finalChallenge.playerEnergy}%`;
  document.querySelector("#challengeHint").textContent = cityRestored ? "The energy waves have faded." : "Avoid the energy waves and activate each point.";
  const playerStatus = energyMode ? finalChallenge.playerEnergy : player.health;
  document.querySelector("#healthLabel").textContent = energyMode ? "ENERGY" : "HP";
  document.querySelector(".health-display").dataset.status = energyMode ? "energy" : "health";
  document.querySelector(".health-display").setAttribute("aria-label", energyMode ? "Player energy" : "Player health");
  document.querySelector("#healthFill").style.width = `${playerStatus}%`;
  document.querySelector("#healthValue").textContent = Math.round(playerStatus);
  updateQuestChecklist();
  updatePauseQuestSummary();
  updateRestorationHud();
  const stateLabel = document.querySelector("#questStateLabel");
  const stateName = challengeActive ? "CHALLENGE" : cityRestored ? "RESTORED" : gameState === "FINAL_CHALLENGE_READY" ? "READY" : activeQuest ? "ACTIVE" : completedCount ? "COMPLETE" : "NOT STARTED";
  stateLabel.lastChild.textContent = ` ${stateName}`;
}

function updateQuestChecklist() {
  const objectives = {
    city: { complete: mainQuests[0].completed, label: "Explore the city" },
    temple: { complete: mainQuests[1].completed, label: "Visit the temple" },
    source: { complete: gameState === "CITY_RESTORED", label: "Find the energy source" }
  };
  document.querySelectorAll("#questChecklist [data-objective]").forEach((item) => {
    const objective = objectives[item.dataset.objective];
    if (!objective) return;
    item.classList.toggle("is-complete", objective.complete);
    item.setAttribute("aria-label", `${objective.label}, ${objective.complete ? "complete" : "not complete"}`);
    item.querySelector("span").textContent = objective.complete ? "✓" : "○";
  });
}

function updatePauseQuestSummary() {
  const activeQuest = mainQuests.find((quest) => quest.state === "ACTIVE");
  const completedCount = mainQuests.filter((quest) => quest.completed).length;
  const activatedPoints = finalChallenge.points.filter((point) => point.activated).length;
  const challengeActive = gameState === "FINAL_CHALLENGE_ACTIVE";
  const cityRestored = gameState === "CITY_RESTORED";
  document.querySelector("#pauseQuestTitle").textContent = challengeActive ? "Final Challenge" : cityRestored ? "City Restored" : activeQuest?.title || "Final Challenge Ready";
  document.querySelector("#pauseQuestObjective").textContent = challengeActive ? "Restore the 3 city energy points." : cityRestored ? "The future of the city has changed." : activeQuest?.objective || "The city is ready for its final challenge.";
  document.querySelector("#pauseQuestProgress").textContent = challengeActive ? `${activatedPoints} / 3 ENERGY POINTS` : `${completedCount} / ${mainQuests.length} QUESTS COMPLETE`;
}

function setPaused(nextPaused) {
  if (!running || ended || locationModalOpen) return;
  paused = nextPaused;
  Object.keys(input).forEach((key) => { input[key] = false; });
  pauseOverlay.hidden = !paused;
  pauseButton.setAttribute("aria-label", paused ? "Resume game" : "Pause game");
  pauseButton.title = paused ? "Resume game" : "Pause game";
  if (paused) {
    updatePauseQuestSummary();
    document.querySelector("#pauseQuestSummary").hidden = true;
    document.querySelector("#resumeButton").focus();
  } else {
    pauseButton.focus();
  }
}

function updatePauseMenuQuestView() {
  updatePauseQuestSummary();
  const summary = document.querySelector("#pauseQuestSummary");
  summary.hidden = !summary.hidden;
  if (!summary.hidden) document.querySelector("#continueButton").focus();
  else document.querySelector("#questsButton").focus();
}

function updateRestorationHud() {
  const restorationPercent = Math.round(finalChallenge.restorationProgress * 100);
  if (restorationPercent === lastRestorationDisplayedPercent) return;
  lastRestorationDisplayedPercent = restorationPercent;
  const restorationStage = restorationPercent >= 100 ? 4 : restorationPercent <= 33 ? 1 : restorationPercent <= 66 ? 2 : 3;
  const stageLabels = ["", "SIGNAL AWAKENING", "OLD DISTRICT LIGHTS", "CITY ENERGY RETURNING", "CITY RESTORED"];
  document.querySelector("#restorationProgressValue").textContent = `${restorationPercent}%`;
  document.querySelector("#restorationProgressFill").style.width = `${restorationPercent}%`;
  document.querySelector(".restoration-track").setAttribute("aria-valuenow", String(restorationPercent));
  document.querySelector(".restoration-meter").dataset.stage = String(restorationStage);
  document.querySelector("#restorationStageLabel").textContent = `STAGE ${restorationStage} · ${stageLabels[restorationStage]}`;
  window.miraiRestorationProgress = restorationPercent;
  window.miraiRestorationStage = restorationStage;
}

function updateRestorationProgress(completedCount) {
  if (gameState === "CITY_RESTORED") return;
  finalChallenge.restorationProgress = Math.min(0.9, completedCount / mainQuests.length * 0.9);
  window.dispatchEvent(new CustomEvent("mirai:restoration-progress", {
    detail: { progress: finalChallenge.restorationProgress, completedQuests: completedCount, totalQuests: mainQuests.length }
  }));
}

function getLocationName() {
  if (nearbyLocation) return nearbyLocation.name.toUpperCase();
  const x = player.x * 0.025;
  if (player.z > 11) return "BLOSSOM PARK";
  if (player.z > 6.5) return "RIVERSIDE BRIDGE";
  if (player.z > 4.5) return "PARK APPROACH";
  if (player.z < -21) return "MODERN DISTRICT";
  if (player.z < -12 && x < 15) return "CASTLE WARD";
  if (player.z < -17 || (x > 16 && player.z < -7)) return "MODERN DISTRICT";
  if (Math.abs(x - 11) < 4 && player.z < -5) return "TEMPLE GROUNDS";
  if (player.z < -3) return "SHOPPING STREET";
  return "SAKURA STREET";
}

function showToast(message, detail = "") {
  const toast = document.querySelector("#toast");
  if (detail) {
    const title = document.createElement("strong");
    const description = document.createElement("span");
    title.textContent = message;
    description.textContent = detail;
    toast.replaceChildren(title, description);
    toast.classList.add("toast-quest");
  } else {
    toast.classList.remove("toast-quest");
    toast.textContent = message;
  }
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), detail ? 2400 : 1800);
}

function updateInteractionPrompt() {
  const challengeActive = gameState === "FINAL_CHALLENGE_ACTIVE";
  const hasTarget = challengeActive ? nearbyEnergyPoint : nearbyLocation;
  const visible = Boolean(running && !paused && !ended && hasTarget && !locationModalOpen);
  interactionPrompt.hidden = !visible;
  touchInteract.hidden = !visible;
  if (!visible) return;
  const mobile = window.matchMedia("(max-width: 950px)").matches;
  document.querySelector("#interactionKey").hidden = true;
  document.querySelector("#interactionText").textContent = challengeActive
    ? mobile ? "Tap to activate point" : "Press E to activate point"
    : mobile ? "Tap to interact" : "Press E to interact";
  document.querySelector("#touchInteractText").textContent = challengeActive ? "Activate point" : "Tap to interact";
}

function openLocationPanel(location = nearbyLocation) {
  if (!location || !running || paused || ended || gameState === "FINAL_CHALLENGE_ACTIVE") return;
  nearbyLocation = location;
  locationModalOpen = true;
  locationModal.classList.remove("villain-intro");
  document.querySelector("#challengeStartButton").hidden = true;
  document.querySelector("#locationTitle").textContent = location.name;
  document.querySelector("#locationDescription").textContent = location.description;
  document.querySelector("#locationObjective").textContent = location.objective;
  document.querySelector("#locationDistrict").textContent = `${getLocationName()} / FIELD GUIDE`;
  document.querySelector("#locationMarker").textContent = location.id === "park" ? "桜" : location.id === "castle" ? "城" : location.id === "temple" ? "寺" : location.id === "shrine" ? "鳥居" : location.id === "modern" ? "光" : "灯";
  locationModal.hidden = false;
  updateInteractionPrompt();
  requestAnimationFrame(() => {
    locationModal.classList.add("open");
    document.querySelector("#closeLocation").focus();
  });
  window.dispatchEvent(new CustomEvent("mirai:location-interact", { detail: { ...location } }));
}

function closeLocationPanel() {
  if (!locationModalOpen) return;
  if (finalChallenge.villainState === "INTRO") {
    beginFinalChallenge();
    return;
  }
  locationModalOpen = false;
  locationModal.classList.remove("open");
  setTimeout(() => {
    if (!locationModalOpen) locationModal.hidden = true;
  }, 220);
  updateInteractionPrompt();
  if (gameState === "FINAL_CHALLENGE_ACTIVE") {
    const focusTarget = window.matchMedia("(max-width: 950px)").matches ? touchInteract : interactionPrompt;
    if (nearbyEnergyPoint && !focusTarget.hidden) focusTarget.focus();
    else document.activeElement?.blur();
  } else if (nearbyLocation) {
    const focusTarget = window.matchMedia("(max-width: 950px)").matches ? touchInteract : interactionPrompt;
    focusTarget.focus();
  }
}

function interactWithNearbyLocation() {
  if (paused) return;
  if (gameState === "FINAL_CHALLENGE_ACTIVE") {
    activateNearbyEnergyPoint();
    return;
  }
  if (nearbyLocation && !locationModalOpen) openLocationPanel(nearbyLocation);
}

function handleMainQuestInteraction(event) {
  const location = event.detail;
  const activeQuest = mainQuests.find((quest) => quest.state === "ACTIVE");
  if (!activeQuest) return;

  if (activeQuest.targetLocation && activeQuest.targetLocation !== location.id) {
    const target = scene3D.getLocationById(activeQuest.targetLocation);
    document.querySelector("#locationDistrict").textContent = `CURRENT TARGET · ${target?.name.toUpperCase() || "UNKNOWN"}`;
    document.querySelector("#locationObjective").textContent = `Current quest: ${activeQuest.objective}`;
    showToast(`Current quest: ${activeQuest.title}`);
    return;
  }

  activeQuest.state = "COMPLETED";
  activeQuest.completed = true;
  lastQuestStory = activeQuest.story;
  scene3D.spawnBurst(player.x + player.width / 2, groundY - 42, "#64f3ed", 16);
  scene3D.spawnBurst(player.x + player.width / 2, groundY - 42, "#ff8bcd", 9);

  const nextQuest = mainQuests.find((quest) => quest.state === "NOT_STARTED");
  if (nextQuest) {
    nextQuest.state = "ACTIVE";
  } else {
    gameState = "FINAL_CHALLENGE_READY";
    window.miraiGameState = gameState;
    window.dispatchEvent(new CustomEvent("mirai:game-state-change", { detail: { gameState } }));
  }

  const completedCount = mainQuests.filter((quest) => quest.completed).length;
  updateRestorationProgress(completedCount);
  document.querySelector("#locationDistrict").textContent = `QUEST COMPLETE · ${completedCount} / ${mainQuests.length}`;
  document.querySelector("#locationDescription").textContent = activeQuest.story;
  document.querySelector("#locationObjective").textContent = nextQuest
    ? `NEXT OBJECTIVE · ${nextQuest.objective}`
    : "FINAL CHALLENGE UNLOCKED · The mystery leads to the castle...";
  const questCard = document.querySelector(".quest-card");
  questCard.classList.remove("quest-complete");
  void questCard.offsetWidth;
  questCard.classList.add("quest-complete");
  setTimeout(() => questCard.classList.remove("quest-complete"), 850);
  updateQuestHud();
  showToast("QUEST COMPLETE!", `City restoration increased to ${window.miraiRestorationProgress}% · ${activeQuest.title}`);
  window.dispatchEvent(new CustomEvent("mirai:quest-complete", {
    detail: { quest: { ...activeQuest }, nextQuest: nextQuest ? { ...nextQuest } : null, gameState }
  }));
  if (gameState === "FINAL_CHALLENGE_READY") startVillainIntroduction();
}

function startVillainIntroduction() {
  if (gameState !== "FINAL_CHALLENGE_READY" || finalChallenge.villainState !== "IDLE") return;
  finalChallenge.villainState = "INTRO";
  finalChallenge.introStartedAt = performance.now();
  finalChallenge.villainPosition = { x: 9.7, z: -16.2 };
  locationModal.classList.add("villain-intro");
  document.querySelector("#locationDistrict").textContent = "SIGNAL SOURCE / CASTLE WARD";
  document.querySelector("#locationMarker").textContent = "影";
  document.querySelector("#locationTitle").textContent = "The Signal Keeper";
  document.querySelector("#locationDescription").textContent = "At last... you found the source of the signal.\n\nThe city has forgotten its true power.\n\nOnly someone who understands the city can restore it.";
  document.querySelector("#locationObjective").textContent = "FINAL CHALLENGE UNLOCKED · Restore the 3 city energy points.";
  document.querySelector("#challengeStartButton").hidden = false;
  document.querySelector("#closeLocation").setAttribute("aria-label", "Close dialogue and begin final challenge");
  scene3D.spawnBurst(finalChallenge.villainPosition.x / 0.025, groundY - 24, "#8b53ff", 30);
  updateQuestHud();
  window.dispatchEvent(new CustomEvent("mirai:villain-intro", { detail: { gameState } }));
}

function beginFinalChallenge() {
  if (gameState !== "FINAL_CHALLENGE_READY" || finalChallenge.villainState !== "INTRO") return;
  finalChallenge.villainState = "CHALLENGE";
  finalChallenge.elapsed = 0;
  finalChallenge.nextWaveAt = 3200;
  finalChallenge.nextBarrierAt = 8200;
  finalChallenge.nextTeleportAt = 10500;
  finalChallenge.hitCooldown = 0;
  finalChallenge.playerEnergy = 100;
  finalChallenge.lastSafePosition = { x: player.x, z: player.z };
  gameState = "FINAL_CHALLENGE_ACTIVE";
  window.miraiGameState = gameState;
  document.querySelector("#challengeStartButton").hidden = true;
  document.querySelector("#closeLocation").setAttribute("aria-label", "Close location details");
  locationModal.classList.remove("villain-intro");
  closeLocationPanel();
  updateHud();
  updateInteractionPrompt();
  document.querySelector("#gameStatus").textContent = "FINAL CHALLENGE · RESTORE 3 ENERGY POINTS";
  showToast("Final challenge started · find an energy point");
  window.dispatchEvent(new CustomEvent("mirai:game-state-change", { detail: { gameState } }));
}

function activateNearbyEnergyPoint() {
  if (gameState !== "FINAL_CHALLENGE_ACTIVE" || !nearbyEnergyPoint) return;
  const point = finalChallenge.points.find((entry) => entry.id === nearbyEnergyPoint.id && !entry.activated);
  if (!point) return;
  point.activated = true;
  finalChallenge.reactionUntil = performance.now() + 900;
  finalChallenge.lastSafePosition = { x: player.x, z: player.z };
  finalChallenge.playerEnergy = Math.min(100, finalChallenge.playerEnergy + 12);
  scene3D.spawnBurst(point.x / 0.025, groundY - 18, "#61fff0", 24);
  const activatedCount = finalChallenge.points.filter((entry) => entry.activated).length;
  lastQuestStory = `Energy point ${activatedCount} of 3 restored.`;
  updateHud();
  showToast(`ENERGY POINT ${activatedCount} / 3 RESTORED`);
  if (activatedCount === finalChallenge.points.length) restoreCity();
}

function restoreCity() {
  if (gameState !== "FINAL_CHALLENGE_ACTIVE") return;
  finalChallenge.villainState = "DEFEATED";
  finalChallenge.waves.length = 0;
  finalChallenge.barriers.length = 0;
  finalChallenge.playerEnergy = 100;
  finalChallenge.restorationStartProgress = finalChallenge.restorationProgress;
  finalChallenge.restorationElapsed = 0;
  finalChallenge.endingProgress = 0;
  gameState = "CITY_RESTORED";
  window.miraiGameState = gameState;
  nearbyEnergyPoint = null;
  lastQuestStory = "The future of the city has changed.";
  ended = true;
  running = false;
  paused = false;
  pauseOverlay.hidden = true;
  pauseButton.hidden = true;
  document.querySelector("#gameStatus").textContent = "CITY RESTORED";
  document.querySelector("#endEyebrow").textContent = "CITY RESTORED";
  document.querySelector("#endTitle").innerHTML = "CITY<br><em>RESTORED.</em>";
  document.querySelector("#endMessage").textContent = "「未来の街がよみがえった！」\nThe city of the future has been restored.";
  endScreen.hidden = false;
  updateInteractionPrompt();
  for (let index = 0; index < 6; index += 1) {
    const x = worldWidth / 5 * index;
    scene3D.spawnBurst(x, groundY - 18, "#75f4ff", 18);
  }
  updateHud();
  showToast("CITY RESTORED!", "未来の街がよみがえった！ · The city of the future has been restored.");
  window.dispatchEvent(new CustomEvent("mirai:game-state-change", { detail: { gameState } }));
  window.dispatchEvent(new CustomEvent("mirai:city-restored", { detail: { gameState } }));
}

function updateFinalChallenge(step) {
  finalChallenge.elapsed += step;
  finalChallenge.hitCooldown = Math.max(0, finalChallenge.hitCooldown - step);
  finalChallenge.playerEnergy = Math.min(100, finalChallenge.playerEnergy + step * 0.004);
  finalChallenge.villainPosition = {
    x: 9.7 + Math.sin(finalChallenge.elapsed / 2100) * 2.2,
    z: -16.2 + Math.cos(finalChallenge.elapsed / 2600) * 1.15
  };

  if (finalChallenge.elapsed >= finalChallenge.nextTeleportAt) {
    const oldPosition = finalChallenge.villainPosition;
    const destinations = [{ x: 5.8, z: -17 }, { x: 12.5, z: -15.6 }, { x: 8.7, z: -12.3 }];
    const destination = destinations[Math.floor(finalChallenge.elapsed / 10500) % destinations.length];
    finalChallenge.villainPosition = { ...destination };
    finalChallenge.nextTeleportAt = finalChallenge.elapsed + 10500;
    scene3D.spawnBurst(oldPosition.x / 0.025, groundY - 22, "#8957ff", 14);
    scene3D.spawnBurst(destination.x / 0.025, groundY - 22, "#8957ff", 18);
    showToast("The Signal Keeper teleported");
  }

  if (finalChallenge.elapsed >= finalChallenge.nextWaveAt && finalChallenge.waves.length < 2) {
    const { x, z } = finalChallenge.villainPosition;
    finalChallenge.waves.push({ id: finalChallenge.nextWaveId++, x, z, radius: 0.15, warning: 1000, hit: false });
    finalChallenge.nextWaveAt = finalChallenge.elapsed + 5600;
  }

  if (finalChallenge.elapsed >= finalChallenge.nextBarrierAt && finalChallenge.barriers.length === 0) {
    finalChallenge.barriers.push({
      id: finalChallenge.nextBarrierId++,
      x: finalChallenge.villainPosition.x,
      z: finalChallenge.villainPosition.z + 1.8,
      life: 4600,
      hit: false
    });
    finalChallenge.nextBarrierAt = finalChallenge.elapsed + 11800;
  }

  for (let index = finalChallenge.waves.length - 1; index >= 0; index -= 1) {
    const wave = finalChallenge.waves[index];
    if (wave.warning > 0) {
      wave.warning = Math.max(0, wave.warning - step);
      continue;
    }
    wave.radius += step * 0.0032;
    const distance = Math.hypot(player.x * 0.025 - wave.x, player.z - wave.z);
    if (!wave.hit && finalChallenge.hitCooldown <= 0 && Math.abs(distance - wave.radius) < 0.34) {
      wave.hit = true;
      finalChallenge.hitCooldown = 1600;
      finalChallenge.playerEnergy = Math.max(0, finalChallenge.playerEnergy - 20);
      const directionX = player.x * 0.025 - wave.x;
      const directionZ = player.z - wave.z;
      const distanceSafe = Math.max(0.01, Math.hypot(directionX, directionZ));
      scene3D.resolveMovement(player, directionX / distanceSafe * 0.48, directionZ / distanceSafe * 0.48);
      scene3D.spawnBurst(player.x + player.width / 2, groundY - 30, "#ff9cc9", 10);
      showToast("Energy wave! Your shield absorbed the pulse.");
      if (finalChallenge.playerEnergy <= 0) {
        player.x = finalChallenge.lastSafePosition.x;
        player.z = finalChallenge.lastSafePosition.z;
        player.velocityX = 0;
        player.velocityZ = 0;
        finalChallenge.playerEnergy = 60;
        finalChallenge.hitCooldown = 1600;
        finalChallenge.waves.length = 0;
        showToast("Shield restored at the last safe point.");
        break;
      }
    }
    if (wave.radius > 10.5) finalChallenge.waves.splice(index, 1);
  }
  for (let index = finalChallenge.barriers.length - 1; index >= 0; index -= 1) {
    const barrier = finalChallenge.barriers[index];
    barrier.life -= step;
    const distance = Math.hypot(player.x * 0.025 - barrier.x, player.z - barrier.z);
    if (!barrier.hit && finalChallenge.hitCooldown <= 0 && distance < 1.35) {
      barrier.hit = true;
      barrier.life = 0;
      finalChallenge.playerEnergy = Math.max(0, finalChallenge.playerEnergy - 10);
      finalChallenge.hitCooldown = 1200;
      const directionX = player.x * 0.025 - barrier.x;
      const directionZ = player.z - barrier.z;
      const distanceSafe = Math.max(0.01, Math.hypot(directionX, directionZ));
      scene3D.resolveMovement(player, directionX / distanceSafe * 0.42, directionZ / distanceSafe * 0.42);
      scene3D.spawnBurst(player.x + player.width / 2, groundY - 30, "#b58aff", 8);
      showToast("Barrier pulse! Move around the gate.");
      if (finalChallenge.playerEnergy <= 0) {
        player.x = finalChallenge.lastSafePosition.x;
        player.z = finalChallenge.lastSafePosition.z;
        player.velocityX = 0;
        player.velocityZ = 0;
        finalChallenge.playerEnergy = 60;
        finalChallenge.hitCooldown = 1600;
        finalChallenge.waves.length = 0;
        finalChallenge.barriers.length = 0;
        showToast("Shield restored at the last safe point.");
        break;
      }
    }
    if (barrier.life <= 0) finalChallenge.barriers.splice(index, 1);
  }
  updateQuestHud();
}

function addBurst(x, y, color, amount) {
  scene3D.spawnBurst(x, y, color, amount);
}

function attack() {
  if (!running || paused || ended || player.attackCooldown > 0) return;
  player.attackTime = 190;
  player.attackCooldown = 420;
  const forwardX = Math.sin(player.heading);
  const forwardZ = Math.cos(player.heading);
  const target = enemies.find((enemy) => {
    if (!enemy.alive) return false;
    const offsetX = (enemy.x - player.x) * 0.025;
    const offsetZ = enemy.z - player.z;
    const distance = Math.hypot(offsetX, offsetZ);
    return distance < 2.2 && offsetX * forwardX + offsetZ * forwardZ > 0.15;
  });
  if (target) {
    target.alive = false;
    defeatedEnemies += 1;
    experience += 30;
    addBurst(target.x, groundY - 34, "#ff4e81", 13);
    awardLevels();
    showToast("Shadow banished · +30 XP");
    updateHud();
    scene3D.syncObjects(shards, enemies);
    checkQuest();
  }
}

function awardLevels() {
  level = Math.floor(experience / 100) + 1;
}

function jump() {
  if (!running || paused || ended || !player.onGround) return;
  player.velocityY = -10.4;
  player.onGround = false;
}

function checkQuest() {
  if (defeatedEnemies >= 4 && collectedShards >= 5 && player.x > worldWidth - 340) finishQuest(true);
}

function finishQuest(won) {
  if (ended) return;
  ended = true;
  running = false;
  paused = false;
  pauseOverlay.hidden = true;
  pauseButton.hidden = true;
  document.querySelector("#gameStatus").textContent = won ? "GATE RESTORED · DISTRICT SAFE" : "QUEST FAILED · TRY AGAIN";
  document.querySelector("#endEyebrow").textContent = won ? "QUEST COMPLETE" : "QUEST FAILED";
  document.querySelector("#endTitle").innerHTML = won ? "NAGOYA<br><em>IS YOURS.</em>" : "RISE<br><em>AGAIN.</em>";
  document.querySelector("#endMessage").textContent = won ? "Every shadow is gone. The sakura gate is open again." : "The shadows overwhelmed the district. Ready for another run?";
  endScreen.hidden = false;
}

function update(delta, time) {
  if (paused) return;
  if (gameState === "CITY_RESTORED") {
    const step = Math.min(delta, 32);
    finalChallenge.restorationElapsed += step;
    const restorationBlend = Math.min(1, finalChallenge.restorationElapsed / 5200);
    finalChallenge.restorationProgress = finalChallenge.restorationStartProgress + (1 - finalChallenge.restorationStartProgress) * restorationBlend;
    finalChallenge.endingProgress = Math.min(1, finalChallenge.endingProgress + step / 1500);
    if (finalChallenge.endingProgress >= 1) finalChallenge.villainState = "ENDING";
    updateRestorationHud();
    scene3D.render({ time, delta: step, cameraX, cameraOrbit, player, shards, enemies, challenge: finalChallenge, nearbyLocation });
    return;
  }
  if (!running || ended || locationModalOpen) {
    scene3D.render({ time, delta, cameraX, cameraOrbit, player, shards, enemies, challenge: finalChallenge, nearbyLocation });
    return;
  }
  const step = Math.min(delta, 32);
  const forward = Number(input.forward) - Number(input.backward);
  const strafe = Number(input.right) - Number(input.left);
  const inputLength = Math.hypot(forward, strafe);
  const cameraYaw = cameraOrbit;
  let moved = { x: 0, z: 0 };
  if (inputLength > 0) {
    const forwardX = -Math.sin(cameraYaw);
    const forwardZ = -Math.cos(cameraYaw);
    const rightX = Math.cos(cameraYaw);
    const rightZ = -Math.sin(cameraYaw);
    const runSpeed = input.run ? 8.3 : 5.1;
    const travelDistance = runSpeed * step / 1000;
    const moveX = (forward * forwardX + strafe * rightX) / inputLength * travelDistance;
    const moveZ = (forward * forwardZ + strafe * rightZ) / inputLength * travelDistance;
    moved = scene3D.resolveMovement(player, moveX, moveZ);
  }
  player.velocityX = moved.x / Math.max(0.001, step / 1000);
  player.velocityZ = moved.z / Math.max(0.001, step / 1000);
  player.running = input.run && inputLength > 0 && Math.hypot(moved.x, moved.z) > 0.01;
  if (Math.hypot(moved.x, moved.z) > 0.001) player.heading = Math.atan2(moved.x, moved.z);
  player.velocityY += 0.48 * step / 16.67;
  player.y += player.velocityY * step / 16.67;
  if (player.y >= groundY - player.height) {
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.onGround = true;
  }
  player.invulnerable = Math.max(0, player.invulnerable - step);
  player.attackTime = Math.max(0, player.attackTime - step);
  player.attackCooldown = Math.max(0, player.attackCooldown - step);
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x = enemy.homeX + Math.sin(time / 700 + enemy.phase) * 24;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - step);
    const enemyDistance = Math.hypot((player.x - enemy.x) * 0.025, player.z - enemy.z);
    if (player.invulnerable <= 0 && enemyDistance < 0.88 && Math.abs(player.y - enemy.y) < 56) {
      player.health = Math.max(0, player.health - 18);
      player.invulnerable = 1000;
      addBurst(player.x + 18, groundY - 30, "#ff9a7d", 7);
      updateHud();
      showToast("Hit! Watch your health.");
      if (player.health <= 0) finishQuest(false);
    }
  }
  for (const shard of shards) {
    if (shard.taken || Math.abs(player.x + player.width / 2 - shard.x) > 28 || Math.abs(player.z - shard.z) > 0.9) continue;
    if (Math.abs(player.y + player.height / 2 - shard.y) < 45) {
      shard.taken = true;
      collectedShards += 1;
      experience += 12;
      awardLevels();
      addBurst(shard.x, shard.y, "#ff8cdb", 9);
      updateHud();
      showToast("Sakura shard found · +12 XP");
      scene3D.syncObjects(shards, enemies);
      checkQuest();
    }
  }
  if (gameState === "FINAL_CHALLENGE_ACTIVE") updateFinalChallenge(step);
  cameraX = Math.max(0, Math.min(worldWidth - 1000, player.x - 350));
  if (player.x > worldWidth - 330 && (defeatedEnemies < 4 || collectedShards < 5)) {
    document.querySelector("#gameStatus").textContent = `GATE SEALED · ${Math.max(0, 4 - defeatedEnemies)} SHADOWS · ${Math.max(0, 5 - collectedShards)} SHARDS`;
  } else {
    document.querySelector("#gameStatus").textContent = `EXPLORE · ${getLocationName()}`;
  }
  nearbyLocation = scene3D.getNearbyLocation(player);
  nearbyEnergyPoint = gameState === "FINAL_CHALLENGE_ACTIVE"
    ? scene3D.getNearbyEnergyPoint(player, finalChallenge.points)
    : null;
  document.querySelector("#locationName").textContent = getLocationName();
  document.querySelector("#questLocation").textContent = getLocationName();
  updateInteractionPrompt();
  if (gameState !== "FINAL_CHALLENGE_ACTIVE" && player.x > worldWidth - 280 && defeatedEnemies >= 4 && collectedShards >= 5) finishQuest(true);
  scene3D.render({ time, delta: step, cameraX, cameraOrbit, player, shards, enemies, challenge: finalChallenge, nearbyLocation });
}

function frame(timestamp) {
  const delta = lastFrame ? timestamp - lastFrame : 16.67;
  lastFrame = timestamp;
  update(delta, timestamp);
  requestAnimationFrame(frame);
}


function startQuest() {
  if (ended) resetQuest();
  const startsFirstQuest = gameState === "CITY_EXPLORATION";
  if (startsFirstQuest) {
    mainQuests[0].state = "ACTIVE";
    gameState = "QUEST_ACTIVE";
    window.miraiGameState = gameState;
    updateQuestHud();
    window.dispatchEvent(new CustomEvent("mirai:game-state-change", { detail: { gameState } }));
    showToast("QUEST STARTED", mainQuests[0].objective);
  }
  running = true;
  paused = false;
  pauseButton.hidden = false;
  startScreen.hidden = true;
  endScreen.hidden = true;
  document.querySelector("#gameStatus").textContent = "EXPLORE THE DISTRICT · FIND THE GATE";
}

startButton.addEventListener("click", startQuest);
playAgainButton.addEventListener("click", () => {
  resetQuest();
  startQuest();
});
document.querySelector("#restartButton").addEventListener("click", () => {
  resetQuest();
  showToast("Quest restarted");
});
document.querySelector("#mapButton").addEventListener("click", () => {
  showToast("Sakura Gate is at the far end of the district.");
});
interactionPrompt.addEventListener("click", interactWithNearbyLocation);
touchInteract.addEventListener("click", interactWithNearbyLocation);
pauseButton.addEventListener("click", () => setPaused(!paused));
document.querySelector("#resumeButton").addEventListener("click", () => setPaused(false));
document.querySelector("#continueButton").addEventListener("click", () => setPaused(false));
document.querySelector("#questsButton").addEventListener("click", updatePauseMenuQuestView);
document.querySelector("#closeLocation").addEventListener("click", closeLocationPanel);
document.querySelector("#locationScrim").addEventListener("click", closeLocationPanel);
document.querySelector("#challengeStartButton").addEventListener("click", beginFinalChallenge);
window.addEventListener("mirai:location-interact", handleMainQuestInteraction);
window.addEventListener("resize", updateInteractionPrompt);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const movementKeys = { w: "forward", arrowup: "forward", s: "backward", arrowdown: "backward", a: "left", arrowleft: "left", d: "right", arrowright: "right", shift: "run" };
  if (key === "escape" && paused) {
    event.preventDefault();
    setPaused(false);
    return;
  }
  if (key === "escape" && locationModalOpen) {
    event.preventDefault();
    closeLocationPanel();
    return;
  }
  if (key === "escape" && running && !ended) {
    event.preventDefault();
    setPaused(true);
    return;
  }
  if (paused) {
    if (key === "tab") {
      const buttons = [...pauseOverlay.querySelectorAll("button:not([hidden])")].filter((button) => !button.disabled);
      const activeIndex = buttons.indexOf(document.activeElement);
      if (event.shiftKey && activeIndex <= 0) {
        event.preventDefault();
        buttons.at(-1)?.focus();
      } else if (!event.shiftKey && activeIndex === buttons.length - 1) {
        event.preventDefault();
        buttons[0]?.focus();
      }
    }
    return;
  }
  if (key === "p" && running && !ended && !event.repeat) {
    event.preventDefault();
    setPaused(true);
    return;
  }
  if (key === "e" && !event.repeat) {
    event.preventDefault();
    interactWithNearbyLocation();
  }
  if (movementKeys[key] || key === " ") event.preventDefault();
  if (movementKeys[key]) input[movementKeys[key]] = true;
  if (key === " " && !event.repeat) jump();
  if ((key === "x" || key === "j") && !event.repeat) attack();
  if ((key === "enter" || key === " ") && !running && !ended) startQuest();
});
window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  const movementKeys = { w: "forward", arrowup: "forward", s: "backward", arrowdown: "backward", a: "left", arrowleft: "left", d: "right", arrowright: "right", shift: "run" };
  if (movementKeys[key]) input[movementKeys[key]] = false;
});
window.addEventListener("blur", () => {
  Object.keys(input).forEach((key) => { input[key] = false; });
});

canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("pointerdown", (event) => {
  if (!running || ended || (event.pointerType === "mouse" && event.button === 1)) return;
  cameraDragPointer = event.pointerId;
  lastCameraPointerX = event.clientX;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== cameraDragPointer) return;
  cameraOrbit -= (event.clientX - lastCameraPointerX) * 0.006;
  lastCameraPointerX = event.clientX;
});
const releaseCameraDrag = (event) => {
  if (event.pointerId === cameraDragPointer) cameraDragPointer = null;
};
canvas.addEventListener("pointerup", releaseCameraDrag);
canvas.addEventListener("pointercancel", releaseCameraDrag);

document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (paused) return;
    button.setPointerCapture(event.pointerId);
    if (control in input) input[control] = true;
    if (control === "jump") jump();
    if (control === "attack") attack();
  });
  const release = () => {
    if (control in input) input[control] = false;
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

window.addEventListener("beforeunload", () => scene3D.dispose());
resetQuest();
requestAnimationFrame(frame);
