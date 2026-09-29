import { createScene } from "./scene3d.js";

const canvas = document.querySelector("#gameCanvas");
const startScreen = document.querySelector("#startScreen");
const endScreen = document.querySelector("#endScreen");
const startButton = document.querySelector("#startButton");
const playAgainButton = document.querySelector("#playAgainButton");
const interactionPrompt = document.querySelector("#interactionPrompt");
const touchInteract = document.querySelector("#touchInteract");
const locationModal = document.querySelector("#locationModal");
const scene3D = createScene(canvas, document.querySelector("#heroPreview"));
const worldWidth = 4100;
const groundY = 470;
const player = { x: 115, z: 0, y: groundY - 66, width: 38, height: 66, velocityX: 0, velocityZ: 0, velocityY: 0, heading: Math.PI, running: false, health: 100, invulnerable: 0, attackTime: 0, attackCooldown: 0, onGround: true };
const shardSpots = [390, 720, 1060, 1450, 1810, 2160, 2540, 2910, 3290, 3650];
const enemySpots = [600, 1240, 2280, 3230];
const input = { forward: false, backward: false, left: false, right: false, run: false };
const mainQuests = [
  { id: 1, title: "Mysterious Signal", description: "A strange energy is stirring somewhere in Nagoya.", objective: "Investigate the strange signal in the city.", targetLocation: null, story: "Something strange is happening in the city...", completed: false, state: "NOT_STARTED" },
  { id: 2, title: "Visit the Temple", description: "The old wooden hall may know more about the energy.", objective: "Go to the ancient temple and investigate the mysterious energy.", targetLocation: "temple", story: "The temple is reacting to an unknown energy.", completed: false, state: "NOT_STARTED" },
  { id: 3, title: "Search the Shrine", description: "A faint clue is hidden beyond the old torii.", objective: "Search the old shrine for a clue.", targetLocation: "shrine", story: "Someone has been watching the city from the shadows.", completed: false, state: "NOT_STARTED" },
  { id: 4, title: "Ask Along the Shopping Street", description: "The shopkeepers have watched the signal move through town.", objective: "Find information about the strange signal.", targetLocation: "shopping", story: "A shopkeeper whispers: “The signal drifted toward the park.”", completed: false, state: "NOT_STARTED" },
  { id: 5, title: "Explore the Park", description: "Look beneath the blossoms for the source of the energy.", objective: "Search the cherry blossom park for the hidden energy source.", targetLocation: "park", story: "A hidden pulse points toward the Future District.", completed: false, state: "NOT_STARTED" },
  { id: 6, title: "Follow the Signal", description: "The signal grows stronger among the blue-lit towers.", objective: "Follow the mysterious signal to the Future District.", targetLocation: "modern", story: "Someone has been watching from the shadows. The signal leads to the castle.", completed: false, state: "NOT_STARTED" },
  { id: 7, title: "Reach the Castle", description: "The source of the signal waits near the old castle.", objective: "Go to the castle and prepare for the final challenge.", targetLocation: "castle", story: "The mystery leads to the castle...", completed: false, state: "NOT_STARTED" }
];
let shards = [];
let enemies = [];
let running = false;
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
let locationModalOpen = false;
let lastQuestStory = "Explore the city to trace the signal.";
let gameState = "CITY_EXPLORATION";
window.miraiGameState = gameState;
window.miraiQuests = mainQuests;

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
  ended = false;
  cameraX = 0;
  cameraOrbit = 0;
  nearbyLocation = null;
  locationModalOpen = false;
  locationModal.hidden = true;
  locationModal.classList.remove("open");
  mainQuests.forEach((quest) => {
    quest.completed = false;
    quest.state = "NOT_STARTED";
  });
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
  scene3D.render({ time: 0, delta: 16, cameraX, cameraOrbit, player, shards, enemies });
}

function resizeCanvas() {
  scene3D.resize();
  scene3D.render({ time: performance.now(), delta: 16, cameraX, cameraOrbit, player, shards, enemies });
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
  const displayedStep = activeQuest?.id ?? completedCount;
  document.querySelector("#missionText").textContent = nextQuest?.title || "Final Challenge Ready";
  document.querySelector("#questTitle").textContent = nextQuest?.title || "Final Challenge Ready";
  document.querySelector("#questObjective").textContent = nextQuest?.objective || "The city is ready for its final challenge.";
  document.querySelector("#questProgressText").textContent = `${displayedStep} / ${mainQuests.length}`;
  document.querySelector("#questProgressFill").style.width = `${completedCount / mainQuests.length * 100}%`;
  document.querySelector("#questLocation").textContent = nearbyLocation?.name || getLocationName();
  document.querySelector("#questStory").textContent = lastQuestStory;
  document.querySelector("#questFinalState").hidden = gameState !== "FINAL_CHALLENGE_READY";
  const stateLabel = document.querySelector("#questStateLabel");
  const stateName = gameState === "FINAL_CHALLENGE_READY" ? "READY" : activeQuest ? "ACTIVE" : completedCount ? "COMPLETE" : "NOT STARTED";
  stateLabel.lastChild.textContent = ` ${stateName}`;
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

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function updateInteractionPrompt() {
  const visible = Boolean(running && !ended && nearbyLocation && !locationModalOpen);
  interactionPrompt.hidden = !visible;
  touchInteract.hidden = !visible;
  if (!visible) return;
  const mobile = window.matchMedia("(max-width: 950px)").matches || navigator.maxTouchPoints > 0;
  document.querySelector("#interactionKey").textContent = mobile ? "⌖" : "E";
  document.querySelector("#interactionText").textContent = mobile ? "Tap to Explore" : "Press to Explore";
  document.querySelector("#touchInteractText").textContent = "Tap to Explore";
}

function openLocationPanel(location = nearbyLocation) {
  if (!location || !running || ended) return;
  nearbyLocation = location;
  locationModalOpen = true;
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
  locationModalOpen = false;
  locationModal.classList.remove("open");
  setTimeout(() => {
    if (!locationModalOpen) locationModal.hidden = true;
  }, 220);
  updateInteractionPrompt();
  if (nearbyLocation) {
    const focusTarget = window.matchMedia("(max-width: 950px)").matches ? touchInteract : interactionPrompt;
    focusTarget.focus();
  }
}

function interactWithNearbyLocation() {
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
  showToast(`QUEST COMPLETE · ${activeQuest.title}`);
  window.dispatchEvent(new CustomEvent("mirai:quest-complete", {
    detail: { quest: { ...activeQuest }, nextQuest: nextQuest ? { ...nextQuest } : null, gameState }
  }));
}

function addBurst(x, y, color, amount) {
  scene3D.spawnBurst(x, y, color, amount);
}

function attack() {
  if (!running || ended || player.attackCooldown > 0) return;
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
  if (!running || ended || !player.onGround) return;
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
  document.querySelector("#gameStatus").textContent = won ? "GATE RESTORED · DISTRICT SAFE" : "QUEST FAILED · TRY AGAIN";
  document.querySelector("#endEyebrow").textContent = won ? "QUEST COMPLETE" : "QUEST FAILED";
  document.querySelector("#endTitle").innerHTML = won ? "NAGOYA<br><em>IS YOURS.</em>" : "RISE<br><em>AGAIN.</em>";
  document.querySelector("#endMessage").textContent = won ? "Every shadow is gone. The sakura gate is open again." : "The shadows overwhelmed the district. Ready for another run?";
  endScreen.hidden = false;
}

function update(delta, time) {
  if (!running || ended || locationModalOpen) {
    scene3D.render({ time, delta, cameraX, cameraOrbit, player, shards, enemies });
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
  cameraX = Math.max(0, Math.min(worldWidth - 1000, player.x - 350));
  if (player.x > worldWidth - 330 && (defeatedEnemies < 4 || collectedShards < 5)) {
    document.querySelector("#gameStatus").textContent = `GATE SEALED · ${Math.max(0, 4 - defeatedEnemies)} SHADOWS · ${Math.max(0, 5 - collectedShards)} SHARDS`;
  } else {
    document.querySelector("#gameStatus").textContent = `EXPLORE · ${getLocationName()}`;
  }
  nearbyLocation = scene3D.getNearbyLocation(player);
  document.querySelector("#locationName").textContent = getLocationName();
  document.querySelector("#questLocation").textContent = getLocationName();
  updateInteractionPrompt();
  if (player.x > worldWidth - 280 && defeatedEnemies >= 4 && collectedShards >= 5) finishQuest(true);
  scene3D.render({ time, delta: step, cameraX, cameraOrbit, player, shards, enemies });
}

function frame(timestamp) {
  const delta = lastFrame ? timestamp - lastFrame : 16.67;
  lastFrame = timestamp;
  update(delta, timestamp);
  requestAnimationFrame(frame);
}


function startQuest() {
  if (ended) resetQuest();
  if (gameState === "CITY_EXPLORATION") {
    mainQuests[0].state = "ACTIVE";
    gameState = "QUEST_ACTIVE";
    window.miraiGameState = gameState;
    updateQuestHud();
    window.dispatchEvent(new CustomEvent("mirai:game-state-change", { detail: { gameState } }));
  }
  running = true;
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
document.querySelector("#closeLocation").addEventListener("click", closeLocationPanel);
document.querySelector("#locationScrim").addEventListener("click", closeLocationPanel);
window.addEventListener("mirai:location-interact", handleMainQuestInteraction);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const movementKeys = { w: "forward", arrowup: "forward", s: "backward", arrowdown: "backward", a: "left", arrowleft: "left", d: "right", arrowright: "right", shift: "run" };
  if (key === "escape" && locationModalOpen) {
    event.preventDefault();
    closeLocationPanel();
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
