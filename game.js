const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const woodDisplay = document.getElementById("woodDisplay");

let gamePaused = true;
let gameStarted = false;
let gameOver = false;
let gameWon = false;
let inBuildMenu = false;

const player = {
  health: 100,
  maxHealth: 100,
  x: 100,
  y: 100,
  width: 32,
  height: 32,
  speed: 3,
  dx: 0,
  dy: 0,
  direction: "down", // 'up', 'down', 'left', 'right'
  animFrame: 0,
  animSpeed: 10,
  animCounter: 0,
  isMoving: false
};

const playerSprites = {
  idle: new Image(),
  walk: new Image()
};

const buildingSprites ={
  health : new Image(),
  attack : new Image()
};

buildingSprites.health.src = "Assets/Images/health.png";
buildingSprites.attack.src = "Assets/Images/attack.png";

playerSprites.idle.src = "Assets/Images/Idle.png";
playerSprites.walk.src = "Assets/Images/Walk.png";

const enemySprites = {
  wolf: new Image(),
  golem: new Image(),
  boss: new Image()
};

enemySprites.wolf.src = "Assets/Images/wolfsheet1.png";
enemySprites.golem.src = "Assets/Images/golem-walk.png";
enemySprites.boss.src = "Assets/Images/attack - sword.png";


const images ={
  wood: new Image(),
  background: new Image(),
  arka : new Image()
};

images.wood.src = "Assets/Images/wood.png";
images.background.src = "Assets/Images/Background.png";
images.arka.src = "Assets/Images/arka_plan.png";

const sounds = {
  bg: new Audio("Assets/Sounds/bg.mp3"),
  building: new Audio("Assets/Sounds/building.mp3"),
  collectWood: new Audio("Assets/Sounds/collectwood.mp3"),
  damage: new Audio("Assets/Sounds/damage.mp3"),
  boss: new Audio("Assets/Sounds/boss.mp3")
};

sounds.bg.loop = true;
sounds.boss.loop = true;

const buildings = [];
const resources = [];
const enemies = [];
const strongEnemies = [];
let boss = null;

let collectedWood = 0;
const requiredWood = 5;
const targetBuildingCount = 5;

function drawHealthBar() {
  const barWidth = 200;
  const barHeight = 20;
  const x = 20;
  const y = 20;
  ctx.fillStyle = "black";
  ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
  ctx.fillStyle = "red";
  ctx.fillRect(x, y, barWidth, barHeight);
  ctx.fillStyle = "lime";
  const currentWidth = (player.health / player.maxHealth) * barWidth;
  ctx.fillRect(x, y, currentWidth, barHeight);
}

function drawWoodCounter() {
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText(`Odun: ${collectedWood}`, 20, 60);
}

function drawPlayer() {
  let spriteSheet = player.isMoving ? playerSprites.walk : playerSprites.idle;
  let frameCount = player.isMoving ? 4 : 3;
  let directionRow = {
    down: 0,
    left: 2,
    right: 2,
    up: 1
  }[player.direction];

  // Animasyon sayacı
  if (player.isMoving) {
    player.animCounter++;
    if (player.animCounter >= player.animSpeed) {
      player.animFrame = (player.animFrame + 1) % frameCount;
      player.animCounter = 0;
    }
  } else {
    player.animFrame = 1; // Orta frame (durağan görünüm)
  }

  ctx.drawImage(
    spriteSheet,
    player.animFrame * 32, directionRow * 32, // kaynağın x ve y'si
    32, 32, // kaynak genişlik-yükseklik
    player.x, player.y, // canvas hedefi
    player.width, player.height
  );
}

function movePlayer() {
  player.x += player.dx;
  player.y += player.dy;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function generateResources(count = 1) {
  for (let i = 0; i < count; i++) {
    resources.push({
      x: Math.random() * (canvas.width - 20),
      y: Math.random() * (canvas.height - 20),
      width: 20,
      height: 20,
      
    });
  }
}

function drawResources() {
  for (let r of resources) {
    ctx.drawImage(images.wood, r.x, r.y, r.width, r.height);
  }
}

function checkResourceCollision() {
  for (let i = resources.length - 1; i >= 0; i--) {
    let r = resources[i];
    if (isColliding(player, r)) {
      resources.splice(i, 1);
      collectedWood++;
      sounds.collectWood.play();
      generateResources(1);
    }
  }
}

function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function drawBuildings() {
    for (let b of buildings) {
    let img = b.type === 'heal' ? buildingSprites.health : buildingSprites.attack;
    ctx.drawImage(img, b.x, b.y, b.width, b.height);
  }
}

function buildStructure(type) {
  if (collectedWood < requiredWood) {
    alert(`Bu yapıyı inşa etmek için en az ${requiredWood} odun gerekli. Şu anki odununuz: ${collectedWood}`);
    gamePaused = false;
    inBuildMenu = false;
    return;
  }
  const building = {
    x: player.x,
    y: player.y,
    width: 50,
    height: 50,
    color: type === 'heal' ? 'lightgreen' : 'crimson',
    type: type
  };
  buildings.push(building);
  collectedWood -= requiredWood;

  sounds.building.play();

  inBuildMenu = false;
  gamePaused = false;

  if (buildings.length >= targetBuildingCount && !boss) {
    spawnBoss();
  }
}

function openBuildMenu() {
  inBuildMenu = true;
  gamePaused = true;
  const choice = prompt("Yapı tipi seçin: (1) Can veren (2) Düşmana ateş eden");
  if (choice === "1") buildStructure('heal');
  else if (choice === "2") buildStructure('attack');
  else {
    gamePaused = false;
    inBuildMenu = false;
  }
}

function applyBuildingEffects() {
  for (let b of buildings) {
    if (b.type === 'heal' && isColliding(player, b)) {
      player.health = Math.min(player.maxHealth, player.health + 0.1);
    } else if (b.type === 'attack') {
      enemies.forEach((e, i) => {
        if (Math.abs(e.x - b.x) < 100 && Math.abs(e.y - b.y) < 100) {
          enemies.splice(i, 1);
        }
      });
      strongEnemies.forEach(e => {
        if (Math.abs(e.x - b.x) < 100 && Math.abs(e.y - b.y) < 100) {
          e.health -= 0.5;
        }
      });
      if (boss && Math.abs(boss.x - b.x) < 100 && Math.abs(boss.y - b.y) < 100) {
        boss.health -= 0.3;
      }
    }
  }
  strongEnemies.forEach((e, i) => {
    if (e.health <= 0) strongEnemies.splice(i, 1);
  });
}

function spawnEnemy(strong = false) {
  const enemy = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    width: 30,
    height: 30,
    speed: strong ? 1 : 2.5,
    color: strong ? "darkred" : "purple",
    damage: strong ? 30 : 10,
    health: strong ? 500 : 3,
    animFrame: 0,
    animCounter: 0,
    animSpeed: 8,
    type: strong ? "golem" : "wolf"
  };
  (strong ? strongEnemies : enemies).push(enemy);
}

function drawEnemies()  {
  [...enemies, ...strongEnemies].forEach(e => {
    let sprite;
    let frameWidth = 64;
    let frameHeight = 64;
    let maxFrames = 4; // Düşmanın toplam animasyon çerçeve sayısı

    if (e.type === "wolf") {
      sprite = enemySprites.wolf;
      frameWidth = 64;
      frameHeight = 64;
      maxFrames = 6; // Wolf için animasyon çerçeve sayısı
    } else if (e.type === "golem") {
      sprite = enemySprites.golem;
      frameWidth = 64;
      frameHeight = 64;
      maxFrames = 6; // Golem için animasyon çerçeve sayısı
    }

    // Animasyon güncelleme
    e.animCounter++;
    if (e.animCounter >= e.animSpeed) {
      e.animFrame = (e.animFrame + 1) % maxFrames; // Çerçeve sayısına göre döngü
      e.animCounter = 0;
    }

    // Çerçeve çizme
    ctx.drawImage(
      sprite,
      e.animFrame * frameWidth, 0, // Animasyonun hangi çerçevesini çizeceğiz
      frameWidth, frameHeight,    // Çerçeve boyutları
      e.x, e.y,                   // Düşmanın ekrandaki koordinatları
      e.width, e.height            // Düşmanın boyutları
    );
  });
}

function moveEnemies() {
  [...enemies, ...strongEnemies].forEach(e => {
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.hypot(dx, dy);
    e.x += (dx / dist) * e.speed;
    e.y += (dy / dist) * e.speed;

    if (isColliding(player, e)) {
      const prevHealth = player.health;
      player.health -= e.damage * 0.01;
      if (player.health < prevHealth) {
        sounds.damage.play(); // 🔊 Hasar sesi
      }
    }
  });
}

function spawnBoss() {
  boss = {
    x: 400,
    y: 0,
    width: 80,
    height: 80,
    color: "black",
    speed: 2,
    health: 1000,
    animFrame: 0,
    animCounter: 0 
  };
  sounds.bg.pause();      // Arka plan müziğini durdur
  sounds.boss.play();     // 🔊 Boss müziği başlasın
}

function drawBoss()  {
  if (!boss) return;

  const sprite = enemySprites.boss;
  const frameWidth = 64;
  const frameHeight = 64;
  const maxFrames = 6; // Boss için animasyon çerçeve sayısı

  boss.animCounter = (boss.animCounter || 0) + 1;
  if (boss.animCounter >= 8) {
    boss.animFrame = ((boss.animFrame || 0) + 1) % maxFrames;
    boss.animCounter = 0;
  }

  ctx.drawImage(
    sprite,
    (boss.animFrame || 0) * frameWidth, 0, // Animasyon çerçevesi
    frameWidth, frameHeight,              // Çerçeve boyutları
    boss.x, boss.y,                       // Boss'un ekrandaki koordinatları
    boss.width, boss.height               // Boss'un boyutları
  );
}

function moveBoss() {
  if (!boss) return;
  let dx = player.x - boss.x;
  let dy = player.y - boss.y;
  let dist = Math.hypot(dx, dy);
  boss.x += (dx / dist) * boss.speed;
  boss.y += (dy / dist) * boss.speed;

   if (isColliding(player, boss)) {
    const prevHealth = player.health;
    player.health -= 0.5;
    if (player.health < prevHealth) {
      sounds.damage.play(); // 🔊 Boss hasar sesi
    }
  }

  if (boss.health <= 0) {
    gameWon = true;
    gamePaused = true;
    menuOverlay.style.display = "flex";
    menuOverlay.innerHTML = `<h1>Tebrikler! Oyunu Kazandınız</h1><button onclick=\"location.reload()\">Yeniden Başla</button>`;
  }
}

function updateGame() {
  if (gamePaused || gameOver || gameWon) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(images.arka, 0, 0, canvas.width, canvas.height);
  drawHealthBar();
  drawWoodCounter();
  drawResources();
  drawBuildings();
  drawPlayer();
  drawEnemies();
  drawBoss();
  movePlayer();
  moveEnemies();
  moveBoss();
  checkResourceCollision();
  applyBuildingEffects();

  if (player.health <= 0) {
    gameOver = true;
    gamePaused = true;
    menuOverlay.style.display = "flex";
    menuOverlay.innerHTML = `<h1>Oyun Bitti</h1><button onclick=\"location.reload()\">Yeniden Başla</button>`;
    return;
  }
  requestAnimationFrame(updateGame);
}

document.addEventListener("click", () => {
  if (sounds.bg.paused) {
    sounds.bg.play();
  }
}, { once: true }); // sadece ilk tıklamada çalışsın

document.addEventListener("keyup", (e) => {
  if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
    player.dx = 0;
  }
  if (["ArrowUp", "ArrowDown"].includes(e.key)) {
    player.dy = 0;
  }

  // Hareket bitince kontrol et
  if (player.dx === 0 && player.dy === 0) {
    player.isMoving = false;
  }
});

document.addEventListener("keydown", (e) => {
  if (gamePaused) return;

  player.isMoving = true;

  if (e.key === "ArrowRight") {
    player.dx = player.speed;
    player.direction = "right";
  }
  if (e.key === "ArrowLeft") {
    player.dx = -player.speed;
    player.direction = "left";
  }
  if (e.key === "ArrowUp") {
    player.dy = -player.speed;
    player.direction = "up";
  }
  if (e.key === "ArrowDown") {
    player.dy = player.speed;
    player.direction = "down";
  }

  if (e.key === "b" || e.key === "B") openBuildMenu();
});

generateResources(5);
setInterval(() => spawnEnemy(), 3000);
setInterval(() => spawnEnemy(true), 10000);