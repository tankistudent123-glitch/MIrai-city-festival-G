import * as THREE from "three";

const UNIT = 0.025;
const WORLD_LENGTH = 4100 * UNIT;

function material(color, extras = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.24, ...extras });
}

function box(parent, width, height, depth, color, x, y, z, extras = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color, extras));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function sphere(parent, radius, color, x, y, z, scale = [1, 1, 1], extras = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material(color, extras));
  mesh.position.set(x, y, z);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

function registerLandmarkCollision(solidRects, cameraBlockers, x, z, halfWidth, halfDepth, object) {
  solidRects.push({ x, z, halfWidth, halfDepth });
  cameraBlockers.push(object);
}

function createHeroModel() {
  const root = new THREE.Group();
  const skin = material(0xffd0bb, { roughness: 0.78 });
  const hair = material(0xf45eb5, { roughness: 0.4, metalness: 0.05, emissive: 0x5c0d45, emissiveIntensity: 0.16 });
  const orange = material(0xff913d, { roughness: 0.48 });
  const dark = material(0x17213c, { roughness: 0.7 });
  const gold = material(0xffd477, { metalness: 0.55, roughness: 0.32 });
  const cyan = material(0x8bf9ff, { emissive: 0x27deff, emissiveIntensity: 1.9, metalness: 0.45 });
  const eye = material(0x192039, { roughness: 0.3 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 4, 10), orange);
  body.position.y = 1.08;
  root.add(body);
  const jacketFront = box(root, 0.08, 0.65, 0.035, 0xffd775, 0, 1.07, 0.224);
  jacketFront.rotation.z = -0.04;

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.31, 0.42, 7, 1), dark);
  skirt.position.y = 0.62;
  skirt.rotation.y = Math.PI / 8;
  root.add(skirt);
  box(root, 0.35, 0.4, 0.22, 0x253b70, -0.28, 1.12, -0.16);
  box(root, 0.38, 0.065, 0.26, 0x53e9f0, -0.28, 1.31, -0.1, { emissive: 0x2cd9ee, emissiveIntensity: 0.6 });

  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.13, 0.48, 0);
    const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.29, 3, 8), dark);
    legMesh.position.y = -0.2;
    leg.add(legMesh);
    const boot = box(leg, 0.19, 0.12, 0.3, 0xffc966, 0.025, -0.4, 0.055);
    boot.rotation.y = -0.08;
    root.add(leg);
    legs.push(leg);
  }

  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.26, 1.3, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.3, 3, 8), orange);
    sleeve.position.y = -0.18;
    sleeve.rotation.z = side * -0.18;
    arm.add(sleeve);
    const glove = sphere(arm, 0.09, 0xf6c8b7, 0, -0.4, 0.045, [1, 1, 0.9]);
    glove.castShadow = true;
    root.add(arm);
    arms.push(arm);
  }

  const head = sphere(root, 0.255, skin, 0.035, 1.65, 0.015, [0.87, 1.05, 0.86]);
  head.castShadow = true;
  sphere(root, 0.29, hair, -0.025, 1.78, -0.005, [1.12, 0.78, 1.02]);
  sphere(root, 0.14, hair, -0.23, 1.55, -0.035, [0.8, 1.65, 0.88]);
  sphere(root, 0.13, hair, 0.19, 1.54, -0.07, [0.86, 1.5, 0.84]);
  sphere(root, 0.155, hair, -0.23, 1.22, -0.08, [0.55, 1.45, 0.55]);
  sphere(root, 0.12, hair, 0.2, 1.26, -0.1, [0.6, 1.4, 0.55]);
  sphere(root, 0.13, 0xff8bce, -0.16, 1.84, 0.18, [1.05, 0.34, 0.62]);
  sphere(root, 0.09, 0xff9bd8, 0.05, 1.91, 0.16, [1.25, 0.38, 0.52]);
  sphere(root, 0.033, eye.color, -0.08, 1.65, 0.226, [0.75, 1.25, 0.7]);
  sphere(root, 0.033, eye.color, 0.12, 1.65, 0.226, [0.75, 1.25, 0.7]);
  sphere(root, 0.035, gold, 0.27, 1.94, 0.01, [1.15, 0.5, 1.15], { emissive: 0xf49343, emissiveIntensity: 0.4 });

  const sword = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.075, 0.82, 8), cyan);
  blade.position.y = 0.48;
  blade.rotation.z = -0.35;
  sword.add(blade);
  const guard = box(sword, 0.24, 0.055, 0.09, gold, 0, 0.08, 0, { emissive: 0x7d5517, emissiveIntensity: 0.4 });
  guard.rotation.z = -0.35;
  const grip = box(sword, 0.07, 0.22, 0.07, 0x532b56, 0, -0.07, 0);
  grip.rotation.z = -0.35;
  sword.position.set(0.28, 0.88, 0.25);
  sword.rotation.z = -0.25;
  root.add(sword);

  const slash = new THREE.Mesh(
    new THREE.TorusGeometry(0.6, 0.035, 6, 32, Math.PI * 1.15),
    new THREE.MeshBasicMaterial({ color: 0x9bffff, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending })
  );
  slash.position.set(0.45, 1.02, 0.33);
  slash.rotation.z = -0.45;
  slash.visible = false;
  root.add(slash);
  root.userData = { legs, arms, sword, slash, body };
  return root;
}

function createShadow() {
  const root = new THREE.Group();
  const armor = material(0x15162c, { roughness: 0.37, metalness: 0.55 });
  const red = material(0xff304f, { emissive: 0xe5002e, emissiveIntensity: 2.3, roughness: 0.25 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.6, 4, 9), armor);
  body.position.y = 0.96;
  root.add(body);
  sphere(root, 0.25, armor, 0.02, 1.6, 0, [0.95, 1.1, 0.9]);
  box(root, 0.5, 0.16, 0.29, 0x24223b, 0, 1.22, 0.02);
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.43, 5), armor);
    horn.position.set(side * 0.21, 1.89, -0.01);
    horn.rotation.z = side * -0.42;
    root.add(horn);
    sphere(root, 0.052, red, side * 0.105, 1.63, 0.221, [1.3, 0.54, 0.7]);
  }
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.68, 5), red);
  blade.position.set(0.39, 0.89, 0.13);
  blade.rotation.z = -0.45;
  root.add(blade);
  root.userData.body = body;
  return root;
}

function createTree(parent, x, z, index) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, 2, 7), material(0x53314f));
  trunk.position.y = 1;
  tree.add(trunk);
  const blossom = material(index % 2 ? 0xff89c7 : 0xf36fb7, { roughness: 0.88, emissive: 0x631842, emissiveIntensity: 0.3 });
  const foliage = new THREE.SphereGeometry(0.82, 10, 8);
  for (const [offsetX, offsetY, offsetZ, size] of [[0, 2.15, 0, 1], [-0.55, 1.95, 0, 0.72], [0.5, 1.95, 0.08, 0.72], [0.02, 2.55, -0.05, 0.67]]) {
    const cluster = new THREE.Mesh(foliage, blossom);
    cluster.position.set(offsetX, offsetY, offsetZ);
    cluster.scale.setScalar(size);
    tree.add(cluster);
  }
  tree.position.set(x, 0, z);
  parent.add(tree);
  return tree;
}

function createBuilding(parent, x, z, width, height, depth, index) {
  const building = new THREE.Group();
  const colors = [0x222449, 0x252642, 0x1a2b49, 0x292340, 0x1c3150];
  const bodyColor = colors[index % colors.length];
  box(building, width, height, depth, bodyColor, 0, height / 2, 0, { roughness: 0.72, metalness: 0.24 });
  box(building, width + 0.14, 0.14, depth + 0.14, index % 3 ? 0x4fe2ef : 0xff6fba, 0, height - 0.06, 0, { emissive: index % 3 ? 0x147a9b : 0x76204b, emissiveIntensity: 1.4, metalness: 0.46 });
  const windowCyan = material(0x60e9f5, { emissive: 0x18a9e2, emissiveIntensity: 1.1, roughness: 0.25 });
  const windowPink = material(0xff81ca, { emissive: 0xc42e88, emissiveIntensity: 1.15, roughness: 0.25 });
  const floorCount = Math.floor(height / 0.64);
  const columnCount = Math.max(2, Math.floor(width / 0.62));
  for (let floor = 0; floor < floorCount; floor += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      if ((floor * 5 + column * 3 + index) % 5 === 0) continue;
      const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.035), (floor + column + index) % 4 === 0 ? windowPink : windowCyan);
      windowMesh.position.set((column - (columnCount - 1) / 2) * 0.48, 0.38 + floor * 0.58, depth / 2 + 0.025);
      building.add(windowMesh);
    }
  }
  const sign = box(building, width * 0.76, 0.16, 0.08, index % 2 ? 0xff5cbc : 0x5df5ff, 0, Math.min(height - 0.5, 2.4), depth / 2 + 0.055, { emissive: index % 2 ? 0xd52498 : 0x1598d0, emissiveIntensity: 2.1 });
  sign.rotation.z = 0.015;
  building.position.set(x, 0, z);
  parent.add(building);
  return building;
}

function createBridge(parent, x, z) {
  const water = new THREE.Mesh(new THREE.PlaneGeometry(13, 2.2), new THREE.MeshStandardMaterial({ color: 0x16456b, emissive: 0x07304b, emissiveIntensity: 0.8, roughness: 0.22, metalness: 0.64 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(x, -0.055, z);
  parent.add(water);
  const wood = material(0x735b67, { roughness: 0.74, metalness: 0.08 });
  box(parent, 4.8, 0.16, 5.5, wood.color, x, 0.04, z, { roughness: 0.74, metalness: 0.08 });
  for (let plank = -2; plank <= 2; plank += 1) {
    box(parent, 4.65, 0.035, 0.055, 0xb19c9d, x, 0.135, z + plank * 0.9, { roughness: 0.8 });
  }
  for (const side of [-1, 1]) {
    for (const support of [-1.9, 1.9]) box(parent, 0.12, 0.9, 0.12, 0x3d4e6a, x + side * 2.18, 0.48, z + support);
    box(parent, 0.12, 0.12, 5.25, 0xff85cb, x + side * 2.18, 0.9, z, { emissive: 0x982d68, emissiveIntensity: 0.75 });
  }
}

function createPark(parent, x, z) {
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(13, 9), material(0x245947, { roughness: 0.92, emissive: 0x102c32, emissiveIntensity: 0.35 }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(x, -0.035, z);
  grass.receiveShadow = true;
  parent.add(grass);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 8.4), material(0x887783, { roughness: 0.86 }));
  path.rotation.x = -Math.PI / 2;
  path.position.set(x, -0.012, z - 0.1);
  parent.add(path);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1.45, 24), new THREE.MeshStandardMaterial({ color: 0x3185a0, emissive: 0x075374, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.6 }));
  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(1.35, 0.62, 1);
  pond.position.set(x + 3.5, -0.005, z + 1.2);
  parent.add(pond);
  for (let index = 0; index < 5; index += 1) createTree(parent, x - 5 + index * 2.5, z + (index % 2 ? -3.3 : 3.1), index + 10);
  for (const side of [-1, 1]) {
    const bench = new THREE.Group();
    box(bench, 1.05, 0.12, 0.32, 0xa77477, 0, 0.55, 0);
    box(bench, 1.05, 0.44, 0.1, 0x745763, 0, 0.82, -0.12);
    for (const foot of [-0.38, 0.38]) box(bench, 0.09, 0.52, 0.1, 0x4e536d, foot, 0.3, 0);
    bench.position.set(x + side * 3.9, 0, z - 1.2);
    parent.add(bench);
  }
}

function createLantern(parent, x, z, color = 0xffa65b) {
  const lantern = new THREE.Group();
  const frame = material(0x46304d, { metalness: 0.42, roughness: 0.5 });
  const glow = material(color, { emissive: color, emissiveIntensity: 2.2, roughness: 0.42 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 1.25, 6), frame);
  stem.position.y = 0.63;
  lantern.add(stem);
  box(lantern, 0.42, 0.1, 0.34, frame.color, 0, 1.28, 0);
  const glass = box(lantern, 0.3, 0.42, 0.24, glow.color, 0, 1.05, 0, { emissive: color, emissiveIntensity: 2.4, transparent: true, opacity: 0.88 });
  lantern.userData.glass = glass.material;
  box(lantern, 0.42, 0.08, 0.34, frame.color, 0, 0.82, 0);
  box(lantern, 0.48, 0.08, 0.39, frame.color, 0, 1.48, 0);
  lantern.position.set(x, 0, z);
  parent.add(lantern);
  return lantern;
}

function createShoppingStreet(parent, registerCollision) {
  const lanterns = [];
  const wood = material(0x4a3046, { roughness: 0.76 });
  const paper = material(0xff557f, { emissive: 0xc31c56, emissiveIntensity: 1.15, roughness: 0.7 });
  for (let index = 0; index < 3; index += 1) {
    const x = 17 + index * 2.75;
    const shop = new THREE.Group();
    box(shop, 2.35, 1.8, 1.55, index % 2 ? 0x9d645c : 0x927258, 0, 0.9, 0, { roughness: 0.83 });
    box(shop, 2.6, 0.15, 1.85, wood.color, 0, 1.86, 0);
    box(shop, 2.82, 0.14, 2.05, 0x28284a, 0, 2.02, 0, { metalness: 0.3 });
    box(shop, 1.92, 0.8, 0.08, 0x342b45, 0, 0.76, 0.8, { roughness: 0.74 });
    for (const side of [-1, 1]) box(shop, 0.08, 0.78, 0.1, 0xf1c47e, side * 0.94, 0.77, 0.87);
    box(shop, 1.18, 0.35, 0.08, index % 2 ? 0x42dbea : 0xff527e, 0, 1.55, 0.89, { emissive: index % 2 ? 0x15909c : 0x94173f, emissiveIntensity: 1.3 });
    box(shop, 0.78, 0.46, 0.08, paper.color, 0, 2.28, 0.83, { emissive: 0x921d4a, emissiveIntensity: 1.15 });
    shop.position.set(x, 0, -7.8);
    parent.add(shop);
    registerCollision(x, -7.8, 1.3, 1.12, shop);
    lanterns.push(createLantern(parent, x - 0.9, -5.55, index % 2 ? 0xffa65b : 0xff668e));
  }
  return lanterns;
}

function createShrine(parent, x, z, registerCollision) {
  const shrine = new THREE.Group();
  const vermilion = material(0xc84b4e, { roughness: 0.52, metalness: 0.18 });
  const roof = material(0x293549, { roughness: 0.44, metalness: 0.38 });
  box(shrine, 1.72, 1.22, 1.3, 0xb76b53, 0, 0.68, 0.1, { roughness: 0.78 });
  box(shrine, 1.05, 0.78, 0.12, 0x37273e, 0, 0.47, 0.78);
  box(shrine, 2.18, 0.16, 1.7, roof.color, 0, 1.35, 0.05, { metalness: 0.45 });
  box(shrine, 2.52, 0.18, 1.9, vermilion.color, 0, 1.48, 0.03, { emissive: 0x401318, emissiveIntensity: 0.42 });
  for (const side of [-1, 1]) {
    const post = box(parent, 0.23, 3.3, 0.24, vermilion.color, x + side * 1.55, 1.65, z + 1.45, { emissive: 0x51191d, emissiveIntensity: 0.42 });
    post.castShadow = true;
    registerCollision(x + side * 1.55, z + 1.45, 0.2, 0.2, post);
  }
  box(parent, 3.8, 0.28, 0.34, vermilion.color, x, 3.18, z + 1.45, { emissive: 0x51191d, emissiveIntensity: 0.42 });
  box(parent, 4.3, 0.24, 0.4, vermilion.color, x, 3.5, z + 1.45, { emissive: 0x51191d, emissiveIntensity: 0.42 });
  box(parent, 0.5, 0.28, 0.42, 0xe9be79, x, 3.19, z + 1.45, { emissive: 0x70471b, emissiveIntensity: 0.36 });
  shrine.position.set(x, 0, z - 2.2);
  parent.add(shrine);
  registerCollision(x, z - 2.2, 1.25, 0.95, shrine);
  const lanterns = [createLantern(parent, x - 2.6, z - 0.4, 0xffca7a), createLantern(parent, x + 2.6, z - 0.4, 0xffca7a)];
  const garden = new THREE.Mesh(new THREE.CircleGeometry(2.35, 18), material(0x435c50, { roughness: 0.92 }));
  garden.rotation.x = -Math.PI / 2;
  garden.position.set(x, -0.015, z + 0.2);
  parent.add(garden);
  return { shrine, lanterns };
}

function createTemple(parent, x, z) {
  const group = new THREE.Group();
  const warm = material(0xffd17c, { roughness: 0.48, metalness: 0.25 });
  const roof = material(0x33264f, { roughness: 0.36, metalness: 0.5, emissive: 0x180b32, emissiveIntensity: 0.5 });
  box(group, 2.35, 0.24, 1.45, 0xf2bd70, 0, 0.77, 0);
  box(group, 1.9, 0.7, 1.15, 0xa95861, 0, 0.36, 0);
  box(group, 0.42, 0.55, 0.1, 0x563355, 0, 0.33, 0.59);
  for (let level = 0; level < 3; level += 1) {
    const y = 1.02 + level * 0.61;
    const roofWidth = 3.1 - level * 0.61;
    const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(roofWidth * 0.64, 0.64, 4, 1), roof);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.position.y = y;
    roofMesh.scale.z = 0.72;
    group.add(roofMesh);
    box(group, 0.16, 0.47, 0.17, warm, -0.7 + level * 0.14, y - 0.48, 0.08);
    box(group, 0.16, 0.47, 0.17, warm, 0.7 - level * 0.14, y - 0.48, 0.08);
  }
  group.position.set(x, 0, z);
  group.scale.setScalar(0.74);
  parent.add(group);
  return group;
}

function createTower(parent, x, z) {
  const group = new THREE.Group();
  const ivory = material(0xf3d6d2, { roughness: 0.35, metalness: 0.36, emissive: 0x783256, emissiveIntensity: 0.28 });
  const coral = material(0xe96585, { roughness: 0.38, metalness: 0.3 });
  for (let level = 0; level < 5; level += 1) {
    const y = 1 + level * 1.2;
    const radius = 0.55 - level * 0.065;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.53, radius, 1.16, 7), ivory);
    shaft.position.y = y + 0.55;
    group.add(shaft);
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.45, radius * 1.3, 0.12, 8), coral);
    deck.position.y = y;
    group.add(deck);
    const light = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 6), material(0x72f3ff, { emissive: 0x31e4ff, emissiveIntensity: 2 }));
    light.position.set(0, y + 0.55, radius * 0.49);
    group.add(light);
  }
  group.position.set(x, 0, z);
  group.scale.setScalar(0.85);
  parent.add(group);
  return group;
}

function createCastle(parent, x, z) {
  const castle = new THREE.Group();
  const plaster = material(0xe5e7e8, { roughness: 0.72 });
  const roof = material(0x28546a, { roughness: 0.34, metalness: 0.52, emissive: 0x0c293b, emissiveIntensity: 0.48 });
  const stone = material(0x535c72, { roughness: 0.86 });
  const gold = material(0xffd47b, { metalness: 0.58, emissive: 0x9c681d, emissiveIntensity: 0.55 });
  box(castle, 4.1, 0.42, 3.2, stone, 0, 0.21, 0);
  box(castle, 3.55, 0.3, 2.8, stone, 0, 0.54, 0);

  for (let floor = 0; floor < 4; floor += 1) {
    const width = 3.25 - floor * 0.48;
    const depth = 2.35 - floor * 0.34;
    const wallHeight = floor === 3 ? 0.72 : 0.82;
    const baseY = 0.7 + floor * 0.9;
    box(castle, width, wallHeight, depth, plaster, 0, baseY + wallHeight / 2, 0);
    for (const side of [-1, 1]) {
      const window = box(castle, 0.2, 0.34, 0.045, 0x182947, side * width * 0.24, baseY + wallHeight * 0.53, depth / 2 + 0.03, { emissive: 0x162e55, emissiveIntensity: 0.4 });
      window.rotation.z = side * 0.04;
    }
    const eaves = box(castle, width + 0.62, 0.12, depth + 0.62, roof.color, 0, baseY + wallHeight + 0.1, 0, { emissive: 0x0d3341, emissiveIntensity: 0.5, metalness: 0.55 });
    eaves.rotation.y = Math.PI / 4;
    const roofPeak = new THREE.Mesh(new THREE.ConeGeometry(width * 0.77, 0.7, 4), roof);
    roofPeak.rotation.y = Math.PI / 4;
    roofPeak.scale.z = depth / width;
    roofPeak.position.set(0, baseY + wallHeight + 0.45, 0);
    castle.add(roofPeak);
    if (floor < 3) {
      box(castle, 0.17, 0.32, 0.18, gold, -width * 0.37, baseY + wallHeight + 0.38, depth * 0.34);
      box(castle, 0.17, 0.32, 0.18, gold, width * 0.37, baseY + wallHeight + 0.38, depth * 0.34);
    }
  }

  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.58, 6), gold);
  finial.position.set(0, 4.95, 0);
  castle.add(finial);
  const beacon = new THREE.PointLight(0xffc978, 34, 8, 2);
  beacon.position.set(0, 3.2, 2.7);
  castle.add(beacon);
  castle.position.set(x, 0, z);
  castle.scale.setScalar(0.88);
  parent.add(castle);
  return castle;
}

function createHeroBillboard(parent, x, z) {
  const billboard = new THREE.Group();
  const frame = material(0x152949, { metalness: 0.7, roughness: 0.3 });
  const neon = material(0x52eaf4, { emissive: 0x1e9bc9, emissiveIntensity: 1.5, metalness: 0.3 });
  box(billboard, 2.42, 3.22, 0.18, frame, 0, 2.48, 0);
  box(billboard, 2.26, 3.05, 0.045, 0x131c39, 0, 2.5, 0.115);
  const screen = box(billboard, 2.08, 2.83, 0.025, 0x24275f, 0, 2.51, 0.15, { emissive: 0x24275f, emissiveIntensity: 0.55, roughness: 0.42 });
  const sunset = sphere(billboard, 0.67, 0xf16484, 0.52, 3.29, 0.2, [1, 1, 0.4], { emissive: 0x7e244e, emissiveIntensity: 0.8 });
  sunset.material.transparent = true;
  sunset.material.opacity = 0.88;
  for (let index = 0; index < 5; index += 1) {
    box(billboard, 0.12 + index % 2 * 0.12, 0.5 + index % 3 * 0.18, 0.04, index % 2 ? 0x276386 : 0x34386c, -0.76 + index * 0.32, 1.54 + index % 3 * 0.08, 0.18, { emissive: 0x123554, emissiveIntensity: 0.6 });
  }
  box(billboard, 1.95, 0.035, 0.05, 0x52eaf4, 0, 1.13, 0.21, { emissive: 0x1c9fc0, emissiveIntensity: 1.4 });
  const billboardHero = createHeroModel();
  billboardHero.position.set(-0.28, 0.68, 0.36);
  billboardHero.scale.setScalar(0.91);
  billboardHero.rotation.y = -0.1;
  billboardHero.traverse((object) => {
    if (object.isMesh) object.castShadow = true;
  });
  billboard.add(billboardHero);
  box(billboard, 2.5, 0.055, 0.06, neon.color, 0, 4.13, 0.12, { emissive: 0x167da5, emissiveIntensity: 1.6 });
  box(billboard, 0.08, 3.05, 0.09, neon.color, -1.2, 2.48, 0.12, { emissive: 0x167da5, emissiveIntensity: 1.2 });
  box(billboard, 0.08, 3.05, 0.09, 0xff62bd, 1.2, 2.48, 0.12, { emissive: 0x942466, emissiveIntensity: 1.3 });
  for (const side of [-0.72, 0.72]) box(billboard, 0.08, 2.1, 0.09, frame.color, side, -0.55, 0);
  box(billboard, 2.8, 0.17, 0.52, frame.color, 0, -0.68, 0);
  const glow = new THREE.PointLight(0x4deaf4, 18, 6, 2);
  glow.position.set(0, 3, 1.1);
  billboard.add(glow);
  billboard.position.set(x, 0.65, z);
  parent.add(billboard);
  return billboard;
}

function createGate(parent, x) {
  const gate = new THREE.Group();
  const vermilion = material(0xff398f, { emissive: 0xb31f76, emissiveIntensity: 1.8, metalness: 0.3, roughness: 0.35 });
  const pearl = material(0xffd7fa, { emissive: 0x8e3c9e, emissiveIntensity: 0.55 });
  box(gate, 0.28, 3.8, 0.3, vermilion, -1.55, 1.9, 0);
  box(gate, 0.28, 3.8, 0.3, vermilion, 1.55, 1.9, 0);
  box(gate, 4.1, 0.32, 0.44, vermilion, 0, 3.72, 0);
  box(gate, 4.65, 0.32, 0.56, vermilion, 0, 4.13, 0);
  box(gate, 0.46, 0.2, 0.6, pearl, 0, 3.47, 0);
  const aura = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.4), new THREE.MeshBasicMaterial({ color: 0xff45cb, transparent: true, opacity: 0.16, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  aura.position.set(0, 1.82, -0.07);
  gate.add(aura);
  const label = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), material(0xffb6e9, { emissive: 0xff3fc3, emissiveIntensity: 2 }));
  label.position.set(0, 3.2, 0.28);
  gate.add(label);
  gate.position.set(x, 0, 0);
  parent.add(gate);
  return gate;
}

function addStars(scene) {
  const positions = [];
  for (let index = 0; index < 260; index += 1) {
    const x = (index * 37 % 130) - 14;
    const y = 3 + (index * 19 % 23);
    const z = -24 - (index * 13 % 35);
    positions.push(x, y, z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xd7ddff, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.78 }));
  scene.add(stars);
}

function addBackdrop(scene) {
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(180, 48), new THREE.MeshBasicMaterial({ color: 0x161d50 }));
  sky.position.set(42, 16, -39);
  scene.add(sky);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4.4, 40, 32), new THREE.MeshBasicMaterial({ color: 0xf35483 }));
  moon.position.set(22, 12, -33);
  scene.add(moon);
  const moonRings = new THREE.Mesh(new THREE.TorusGeometry(5.1, 0.045, 7, 80), new THREE.MeshBasicMaterial({ color: 0xff8eb9, transparent: true, opacity: 0.8 }));
  moonRings.position.set(22, 12, -32.9);
  scene.add(moonRings);
  for (let index = 0; index < 5; index += 1) {
    const ridge = new THREE.Mesh(new THREE.ConeGeometry(8 + index * 1.5, 7 + index * 1.1, 5), material(index % 2 ? 0x34335f : 0x273358, { roughness: 1, metalness: 0 }));
    ridge.position.set(index * 15 - 5, 1.3, -23 - index * 2.2);
    ridge.rotation.y = Math.PI / 5;
    scene.add(ridge);
  }
  addStars(scene);
}

function makeRenderer(canvas, options = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: options.antialias ?? true, alpha: options.alpha ?? false, powerPreference: "high-performance", preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.pixelRatio || 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  return renderer;
}

export function createScene(canvas, previewCanvas) {
  const renderer = makeRenderer(canvas);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161a4c);
  scene.fog = new THREE.Fog(0x1a194a, 37, 105);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 140);
  const solidRects = [];
  const cameraBlockers = [];
  const cameraRaycaster = new THREE.Raycaster();
  let cameraInitialized = false;
  scene.add(new THREE.HemisphereLight(0xbecaff, 0x241b42, 2.05));
  const keyLight = new THREE.DirectionalLight(0xffd3e2, 3.2);
  keyLight.position.set(-5, 15, 11);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -18;
  keyLight.shadow.camera.right = 18;
  keyLight.shadow.camera.top = 16;
  keyLight.shadow.camera.bottom = -12;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);
  const neonFill = new THREE.PointLight(0x4bddff, 90, 28, 2);
  neonFill.position.set(9, 5, 5);
  scene.add(neonFill);
  const pinkFill = new THREE.PointLight(0xf346a6, 115, 34, 2);
  pinkFill.position.set(33, 5, -2);
  scene.add(pinkFill);
  const gateFill = new THREE.PointLight(0xff42cf, 135, 17, 2);
  gateFill.position.set(WORLD_LENGTH - 5.1, 2.3, 0);
  scene.add(gateFill);
  addBackdrop(scene);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_LENGTH + 8, 54), material(0x171d38, { roughness: 0.44, metalness: 0.38 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(WORLD_LENGTH / 2, -0.12, -8.5);
  floor.receiveShadow = true;
  scene.add(floor);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_LENGTH + 2, 10), material(0x11152f, { roughness: 0.31, metalness: 0.56 }));
  street.rotation.x = -Math.PI / 2;
  street.position.set(WORLD_LENGTH / 2, -0.08, 0);
  street.receiveShadow = true;
  scene.add(street);
  const laneMaterial = material(0x56e8f3, { emissive: 0x138ea9, emissiveIntensity: 0.68, roughness: 0.36 });
  for (const z of [-4.25, 4.25]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(WORLD_LENGTH, 0.035, 0.045), laneMaterial);
    line.position.set(WORLD_LENGTH / 2, -0.035, z);
    scene.add(line);
  }
  for (let x = 0; x < WORLD_LENGTH; x += 2.3) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.025, 0.055), material(0xffb2ca, { emissive: 0xa83260, emissiveIntensity: 0.45 }));
    dash.position.set(x, -0.026, 0);
    scene.add(dash);
  }
  const sidewalkMat = material(0x2d2850, { roughness: 0.8, metalness: 0.13 });
  for (const z of [-6, 6]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(WORLD_LENGTH, 0.25, 1.7), sidewalkMat);
    curb.position.set(WORLD_LENGTH / 2, 0.03, z);
    curb.receiveShadow = true;
    scene.add(curb);
  }

  const addCityBuilding = (x, z, width, height, depth, index) => {
    const building = createBuilding(scene, x, z, width, height, depth, index);
    solidRects.push({ x, z, halfWidth: width / 2 + 0.16, halfDepth: depth / 2 + 0.16 });
    cameraBlockers.push(building.children[0]);
  };
  const hasStreetEntrance = (x) => (x >= 3.3 && x <= 6.8) || (x >= 9 && x <= 14.5) || (x >= 25 && x <= 30);
  for (let index = 0, x = -4; x < WORLD_LENGTH + 5; index += 1, x += 3.85 + (index % 3) * 0.3) {
    const width = 1.8 + (index * 7 % 9) * 0.13;
    const height = 4.2 + (index * 11 % 22) * 0.32;
    if (!hasStreetEntrance(x)) addCityBuilding(x, -10.5, width, height, 2.2, index);
    if (index % 2 === 0 && !hasStreetEntrance(x + 1.25)) addCityBuilding(x + 1.25, -18.5, width * 1.12, height * 0.76, 2.5, index + 2);
    if (index % 4 === 0 && !hasStreetEntrance(x - 1)) addCityBuilding(x - 1, -27, width * 0.82, height * 1.08, 2.4, index + 3);
  }
  for (let index = 0; index < 17; index += 1) {
    if (index === 6) continue;
    const x = index * 6.1 + 1.5;
    const z = index % 2 ? -6.1 : 6.3;
    const tree = createTree(scene, x, z, index);
    solidRects.push({ x, z, halfWidth: 0.46, halfDepth: 0.46 });
    cameraBlockers.push(tree.children[0]);
  }
  const temple = createTemple(scene, 11, -7.5);
  registerLandmarkCollision(solidRects, cameraBlockers, 11, -7.5, 1.7, 1.15, temple);
  for (let step = 0; step < 3; step += 1) {
    box(scene, 2.6 - step * 0.22, 0.16, 0.42, 0x81717a, 11, 0.08 + step * 0.15, -5.95 - step * 0.42, { roughness: 0.86 });
  }
  createLantern(scene, 8.65, -5.7, 0xffc477);
  createLantern(scene, 13.35, -5.7, 0xffc477);
  const castle = createCastle(scene, 7.5, -13.8);
  registerLandmarkCollision(solidRects, cameraBlockers, 7.5, -13.8, 2.1, 1.75, castle);
  for (let step = 0; step < 4; step += 1) {
    box(scene, 3.5 - step * 0.28, 0.16, 0.42, 0x68707e, 7.5, 0.08 + step * 0.13, -10.95 - step * 0.44, { roughness: 0.87 });
  }
  createLantern(scene, 5.1, -10.8, 0xffd178);
  createLantern(scene, 9.9, -10.8, 0xffd178);
  const tower = createTower(scene, 19.5, -10.1);
  registerLandmarkCollision(solidRects, cameraBlockers, 19.5, -10.1, 0.6, 0.6, tower);
  const shoppingLanterns = createShoppingStreet(scene, (x, z, halfWidth, halfDepth, object) => registerLandmarkCollision(solidRects, cameraBlockers, x, z, halfWidth, halfDepth, object));
  const shrine = createShrine(scene, 91, -2.2, (x, z, halfWidth, halfDepth, object) => registerLandmarkCollision(solidRects, cameraBlockers, x, z, halfWidth, halfDepth, object));
  cameraBlockers.push(...shrine.lanterns);
  const billboard = createHeroBillboard(scene, 15, 3.7);
  registerLandmarkCollision(solidRects, cameraBlockers, 15, 3.7, 1.5, 0.55, billboard);
  createBridge(scene, 38, 9.4);
  createPark(scene, 38, 14.1);
  for (const [x, z] of [[33, 14.1], [43, 14.1], [38, 17.7]]) solidRects.push({ x, z, halfWidth: 0.46, halfDepth: 0.46 });

  const locations = [
    { id: "castle", name: "Ancient Castle", x: 5, z: -11.7, radius: 3.2, description: "A lantern-lit stronghold watching over old Nagoya.", objective: "Explore the castle entrance." },
    { id: "temple", name: "Ancient Temple", x: 11, z: -4, radius: 2.7, description: "A peaceful wooden hall shelters a quiet, mysterious energy.", objective: "Investigate the temple grounds." },
    { id: "shopping", name: "Traditional Shopping Street", x: 20.5, z: -4.3, radius: 2.8, description: "Paper lanterns glow over the lively heart of the old city.", objective: "Find someone who knows about the strange signal." },
    { id: "modern", name: "Future District", x: 27, z: -14.1, radius: 3.1, description: "Blue-lit towers and neon signs mark modern Nagoya.", objective: "Investigate the signal near the towers." },
    { id: "park", name: "Cherry Blossom Park", x: 38, z: 12.2, radius: 3.1, description: "A quiet garden, pond and blossom trees sit beyond the riverside bridge.", objective: "Search the park for clues." },
    { id: "shrine", name: "Old Shrine", x: 91, z: 1.05, radius: 3.2, description: "Beyond the torii, an old shrine hums with an unfamiliar energy.", objective: "Search the shrine grounds." }
  ];
  const lanterns = [
    ...shoppingLanterns,
    createLantern(scene, 8.65, -5.7, 0xffc477),
    createLantern(scene, 13.35, -5.7, 0xffc477),
    createLantern(scene, 5.1, -10.8, 0xffd178),
    createLantern(scene, 9.9, -10.8, 0xffd178),
    ...shrine.lanterns
  ];

  const hero = createHeroModel();
  hero.position.set(115 * UNIT, 0, 0);
  hero.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  scene.add(hero);

  const petalPositions = new Float32Array(27 * 3);
  for (let index = 0; index < 27; index += 1) {
    petalPositions[index * 3] = Math.sin(index * 12.17) * 9;
    petalPositions[index * 3 + 1] = 0.4 + (index * 7 % 41) / 8;
    petalPositions[index * 3 + 2] = Math.cos(index * 8.23) * 7;
  }
  const petalOffsets = petalPositions.slice();
  const petalGeometry = new THREE.BufferGeometry();
  petalGeometry.setAttribute("position", new THREE.BufferAttribute(petalPositions, 3));
  const petals = new THREE.Points(petalGeometry, new THREE.PointsMaterial({ color: 0xffa8d4, size: 0.105, transparent: true, opacity: 0.72, depthWrite: false, sizeAttenuation: true }));
  scene.add(petals);

  const shardMap = new Map();
  const enemyMap = new Map();
  const bursts = [];
  let currentShards = [];
  let currentEnemies = [];
  let lastPreviewRender = 0;

  const previewRenderer = makeRenderer(previewCanvas, { antialias: false, alpha: false, pixelRatio: 1 });
  const previewScene = new THREE.Scene();
  previewScene.background = new THREE.Color(0x762d70);
  previewScene.fog = new THREE.Fog(0x762d70, 7, 20);
  const previewCamera = new THREE.PerspectiveCamera(33, 1, 0.1, 30);
  previewCamera.position.set(0.24, 1.7, 5.5);
  previewCamera.lookAt(0, 0.95, 0);
  previewScene.add(new THREE.HemisphereLight(0xffddf0, 0x2d2154, 2.5));
  const previewKey = new THREE.DirectionalLight(0xffd4e6, 3.8);
  previewKey.position.set(-3, 6, 5);
  previewScene.add(previewKey);
  const previewRim = new THREE.PointLight(0x50edff, 60, 10, 2);
  previewRim.position.set(2.5, 2.7, -1);
  previewScene.add(previewRim);
  const previewMoon = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 18), new THREE.MeshBasicMaterial({ color: 0xf66c98 }));
  previewMoon.position.set(1.05, 2.15, -2.3);
  previewScene.add(previewMoon);
  const previewGround = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), material(0x221d49));
  previewGround.rotation.x = -Math.PI / 2;
  previewGround.position.y = -0.05;
  previewScene.add(previewGround);
  for (let index = 0; index < 8; index += 1) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.35 + index % 3 * 0.14, 0.7 + index % 4 * 0.34, 0.32), material(index % 2 ? 0x252b66 : 0x31264e, { emissive: index % 2 ? 0x164b82 : 0x691c4c, emissiveIntensity: 0.55 }));
    block.position.set(-2.25 + index * 0.64, block.geometry.parameters.height / 2, -1.6 - index % 2 * 0.25);
    previewScene.add(block);
  }
  const previewHero = createHeroModel();
  previewHero.position.z = 0.25;
  previewHero.traverse((object) => {
    if (object.isMesh) object.castShadow = true;
  });
  previewScene.add(previewHero);

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const previewBounds = previewCanvas.getBoundingClientRect();
    previewRenderer.setSize(Math.max(1, previewBounds.width), Math.max(1, previewBounds.height), false);
    previewCamera.aspect = Math.max(1, previewBounds.width) / Math.max(1, previewBounds.height);
    previewCamera.updateProjectionMatrix();
  }

  function makeShard(shard, index) {
    const group = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshStandardMaterial({ color: 0xff76d2, emissive: 0xff39b5, emissiveIntensity: 2.2, metalness: 0.45, roughness: 0.18 }));
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: 0xffe9ff }));
    group.add(outer, core);
    group.position.set(shard.x * UNIT, 0.8 + index % 2 * 0.55, shard.z ?? (index % 3 === 0 ? -0.35 : 0.25));
    scene.add(group);
    shardMap.set(shard, group);
    return group;
  }

  function makeEnemy(enemy) {
    const group = createShadow();
    group.position.set(enemy.x * UNIT, 0, enemy.z ?? (enemy.homeX % 2 ? -0.48 : 0.42));
    scene.add(group);
    enemyMap.set(enemy, group);
    return group;
  }

  function removeMissing(map, active) {
    for (const [key, group] of map) {
      if (active.includes(key)) continue;
      scene.remove(group);
      map.delete(key);
    }
  }

  function syncObjects(shards, enemies) {
    currentShards = shards;
    currentEnemies = enemies;
    removeMissing(shardMap, shards);
    removeMissing(enemyMap, enemies);
    shards.forEach((shard, index) => {
      const group = shardMap.get(shard) || makeShard(shard, index);
      group.visible = !shard.taken;
    });
    enemies.forEach((enemy) => {
      const group = enemyMap.get(enemy) || makeEnemy(enemy);
      group.visible = enemy.alive;
    });
  }

  function resolveMovement(player, deltaX, deltaZ) {
    const radius = 0.38;
    let x = player.x * UNIT;
    let z = player.z || 0;
    const startX = x;
    const startZ = z;
    const blocked = (candidateX, candidateZ) => {
      if (candidateX < radius || candidateX > WORLD_LENGTH - radius || candidateZ < -33 || candidateZ > 18) return true;
      if (candidateZ > 8.25 && candidateZ < 10.55 && Math.abs(candidateX - 38) > 2.1) return true;
      return solidRects.some((rect) => Math.abs(candidateX - rect.x) < rect.halfWidth + radius && Math.abs(candidateZ - rect.z) < rect.halfDepth + radius);
    };
    if (!blocked(x + deltaX, z)) x += deltaX;
    if (!blocked(x, z + deltaZ)) z += deltaZ;
    player.x = x / UNIT;
    player.z = z;
    return { x: x - startX, z: z - startZ };
  }

  function getNearbyLocation(player) {
    const playerX = player.x * UNIT;
    const playerZ = player.z || 0;
    let closest = null;
    for (const location of locations) {
      const distance = Math.hypot(playerX - location.x, playerZ - location.z);
      if (distance <= location.radius && (!closest || distance < closest.distance)) closest = { ...location, distance };
    }
    return closest;
  }

  function getLocationById(id) {
    return locations.find((location) => location.id === id) || null;
  }

  function spawnBurst(x, y, color, count) {
    const tint = new THREE.Color(color);
    for (let index = 0; index < count; index += 1) {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.055 + Math.random() * 0.045, 0), new THREE.MeshBasicMaterial({ color: tint, transparent: true, blending: THREE.AdditiveBlending }));
      mesh.position.set(x * UNIT, y * UNIT, (Math.random() - 0.5) * 0.45);
      const angle = Math.PI * 2 * index / count;
      mesh.userData.velocity = new THREE.Vector3(Math.cos(angle) * (0.6 + Math.random() * 0.6), 0.8 + Math.random() * 0.8, Math.sin(angle) * 0.85);
      mesh.userData.life = 0.72;
      scene.add(mesh);
      bursts.push(mesh);
    }
  }

  function render(state) {
    const elapsed = Math.min(state.delta || 16, 40) / 1000;
    const time = state.time || 0;
    syncObjects(state.shards, state.enemies);
    const heroElevation = Math.max(0, (470 - (state.player.y + state.player.height)) * UNIT);
    const heroX = (state.player.x + state.player.width / 2) * UNIT;
    const heroZ = state.player.z || 0;
    hero.position.set(heroX, heroElevation + Math.sin(time / 175) * (state.player.onGround ? 0.025 : 0), heroZ);
    hero.rotation.y = state.player.heading ?? Math.PI;
    hero.userData.body.rotation.z = Math.sin(time / 420) * 0.025;
    const movement = Math.hypot(state.player.velocityX || 0, state.player.velocityZ || 0);
    const stride = Math.sin(time / (state.player.running ? 48 : 78)) * Math.min(1, movement / 2.5) * 0.7;
    hero.userData.legs[0].rotation.z = stride;
    hero.userData.legs[1].rotation.z = -stride;
    hero.userData.arms[0].rotation.z = -stride * 0.6;
    hero.userData.arms[1].rotation.z = stride * 0.6;
    hero.userData.slash.visible = state.player.attackTime > 0;
    hero.userData.slash.scale.setScalar(0.75 + state.player.attackTime / 650);
    hero.userData.slash.material.opacity = Math.min(1, state.player.attackTime / 90);
    hero.visible = !(state.player.invulnerable > 0 && Math.floor(time / 90) % 2 === 0);

    state.shards.forEach((shard, index) => {
      const group = shardMap.get(shard);
      if (!group) return;
      group.position.y = 0.8 + index % 2 * 0.55 + Math.sin(time / 270 + index * 1.6) * 0.12;
      group.rotation.y = time / 520 + index;
      group.rotation.x = Math.sin(time / 620 + index) * 0.18;
    });
    state.enemies.forEach((enemy) => {
      const group = enemyMap.get(enemy);
      if (!group || !enemy.alive) return;
      group.position.x = enemy.x * UNIT;
      group.position.z = enemy.z ?? (enemy.homeX % 2 ? -0.48 : 0.42);
      group.position.y = Math.sin(time / 210 + enemy.phase) * 0.035;
      group.rotation.y = Math.sin(time / 500 + enemy.phase) * 0.08;
      group.userData.body.material.emissive.setHex(enemy.hitFlash > 0 ? 0x55203e : 0x000000);
    });
    lanterns.forEach((lantern, index) => {
      lantern.userData.glass.emissiveIntensity = 1.9 + Math.sin(time / 310 + index * 1.7) * 0.4;
    });
    const petalAttribute = petalGeometry.getAttribute("position");
    for (let index = 0; index < petalAttribute.count; index += 1) {
      const baseY = petalOffsets[index * 3 + 1];
      petalAttribute.setXYZ(
        index,
        heroX + petalOffsets[index * 3] + Math.sin(time / 1000 + index) * 0.35,
        0.2 + (baseY - time / 1700 * (0.55 + index % 4 * 0.08) + 7.5) % 7.5,
        heroZ + petalOffsets[index * 3 + 2] + Math.cos(time / 1300 + index * 0.7) * 0.24
      );
    }
    petalAttribute.needsUpdate = true;
    for (let index = bursts.length - 1; index >= 0; index -= 1) {
      const particle = bursts[index];
      particle.userData.life -= elapsed;
      particle.position.addScaledVector(particle.userData.velocity, elapsed);
      particle.userData.velocity.y -= 1.8 * elapsed;
      particle.material.opacity = Math.max(0, particle.userData.life / 0.72);
      if (particle.userData.life <= 0) {
        scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
        bursts.splice(index, 1);
      }
    }

    const orbitYaw = state.cameraOrbit || 0;
    const focus = new THREE.Vector3(heroX, heroElevation + 1.12, heroZ);
    const desiredCamera = new THREE.Vector3(
      heroX + Math.sin(orbitYaw) * 6.2,
      Math.max(1.85, focus.y + 3.05),
      heroZ + Math.cos(orbitYaw) * 6.2
    );
    const cameraDirection = desiredCamera.clone().sub(focus);
    const cameraDistance = cameraDirection.length();
    cameraDirection.normalize();
    cameraRaycaster.set(focus, cameraDirection);
    cameraRaycaster.far = cameraDistance;
    const obstruction = cameraRaycaster.intersectObjects(cameraBlockers, true)[0];
    if (obstruction) desiredCamera.copy(focus).addScaledVector(cameraDirection, Math.max(2.4, obstruction.distance - 0.45));
    desiredCamera.y = Math.max(1.85, desiredCamera.y);
    if (!cameraInitialized) {
      camera.position.copy(desiredCamera);
      cameraInitialized = true;
    } else {
      camera.position.lerp(desiredCamera, 1 - Math.exp(-elapsed * 7));
    }
    camera.lookAt(focus.x - Math.sin(orbitYaw) * 1.25, focus.y + 0.2, focus.z - Math.cos(orbitYaw) * 1.25);
    renderer.render(scene, camera);
    previewHero.rotation.y = Math.sin(time / 1800) * 0.18;
    if (time - lastPreviewRender > 32) {
      previewRenderer.render(previewScene, previewCamera);
      lastPreviewRender = time;
    }
  }

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resizeObserver.observe(previewCanvas);

  return {
    resize,
    render,
    syncObjects,
    resolveMovement,
    getNearbyLocation,
    getLocationById,
    spawnBurst,
    dispose() {
      resizeObserver.disconnect();
      renderer.dispose();
      previewRenderer.dispose();
    }
  };
}
