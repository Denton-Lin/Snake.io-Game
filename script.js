// --- Firebase SDK Imports and Initialization for Realtime Database ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, query, orderByChild, limitToLast, get, serverTimestamp as rtdbServerTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLGSAluWGeB92CsD-5mNlsQxt7-zz_hAY",
  authDomain: "snake1-cbb66.firebaseapp.com",
  databaseURL: "https://snake1-cbb66-default-rtdb.firebaseio.com",
  projectId: "snake1-cbb66",
  storageBucket: "snake1-cbb66.firebasestorage.app",
  messagingSenderId: "126279439476",
  appId: "1:126279439476:web:8a3fba55b9238b53a0ed21",
  measurementId: "G-K78GJK86Y5"
};

let firebaseAppInstance;
let db;

try {
  firebaseAppInstance = initializeApp(firebaseConfig);
  db = getDatabase(firebaseAppInstance);
  console.log("Firebase Realtime Database initialized successfully. Project ID used:", firebaseConfig.projectId);
} catch (e) {
  console.error("Firebase Realtime Database initialization failed:", e);
  alert("Firebase 初始化失敗，排行榜功能將無法使用。\n請檢查 firebaseConfig 及 databaseURL 是否正確。\n錯誤：" + e.message);
}

// --- Constants and Global Variables ---
const GRID_SIZE = 20;
let CANVAS_WIDTH, CANVAS_HEIGHT;
const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 100;
const TICK_RATE = 30;
const BASE_MOVE_TICKS = 5;

// ... (其他常量和全域變數與上一版本相同) ...
const PLAYER_SNAKE_COLOR = '#0D47A1';
const PLAYER_SNAKE_BORDER = '#002171';
const AI_COLORS = [
    { color: '#C62828', border: '#8E0000' }, { color: '#6A1B9A', border: '#4A148C' },
    { color: '#2E7D32', border: '#1B5E20' }, { color: '#FF8F00', border: '#FF6F00' },
    { color: '#455A64', border: '#263238' }, { color: '#00838F', border: '#006064' }
];
let aiColorIndex = 0;
const BACKGROUND_COLOR = '#EEEEEE';
const GRID_LINE_COLOR = '#BDBDBD';
const INITIAL_FOOD_COUNT = 60;
const FOOD_TYPES = [
    { level: 1, size: 0.8, lengthValue: 1, scoreValue: 10, color: '#FFEB3B', borderColor: '#FBC02D' },
    { level: 2, size: 1.2, lengthValue: 3, scoreValue: 30, color: '#4CAF50', borderColor: '#2E7D32' },
    { level: 3, size: 1.5, lengthValue: 5, scoreValue: 50, color: '#F44336', borderColor: '#C62828' }
];
const MAX_FOOD_ITEMS = INITIAL_FOOD_COUNT * 2;
const NUM_AI_SNAKES = 5;
const RESPAWN_CHECK_INTERVAL_TICKS = Math.round(15000 / TICK_RATE);
let respawnCheckCounter = 0;
const mapZones = [
    { x: 10, y: 40, width: 80, height: 20, type: 'speed', speedMultiplier: 1.5, backgroundColor: 'rgba(173, 216, 230, 0.4)', backgroundImageURL: 'https://media.istockphoto.com/id/506692747/zh/%E7%85%A7%E7%89%87/artificial-grass.jpg?s=1024x1024&w=is&k=20&c=ITTSUA4kqzxQpg2dZfcZa1zMF1yQlIfpuHlVLMqpZkY=', backgroundImageObject: null },
    { x: 5, y: 5, width: 20, height: 20, type: 'slow', speedMultiplier: 0.7, backgroundColor: 'rgba(255, 255, 204, 0.5)', backgroundImageURL: 'https://photo.16pic.com/00/37/69/16pic_3769237_b.jpg', backgroundImageObject: null },
    { x: 75, y: 5, width: 20, height: 20, type: 'slow', speedMultiplier: 0.7, backgroundColor: 'rgba(255, 255, 204, 0.5)', backgroundImageURL: 'https://photo.16pic.com/00/37/69/16pic_3769237_b.jpg', backgroundImageObject: null },
    { x: 5, y: 75, width: 20, height: 20, type: 'slow', speedMultiplier: 0.7, backgroundColor: 'rgba(255, 255, 204, 0.5)', backgroundImageURL: 'https://photo.16pic.com/00/37/69/16pic_3769237_b.jpg', backgroundImageObject: null  },
    { x: 75, y: 75, width: 20, height: 20, type: 'slow', speedMultiplier: 0.7, backgroundColor: 'rgba(255, 255, 204, 0.5)', backgroundImageURL: 'https://photo.16pic.com/00/37/69/16pic_3769237_b.jpg', backgroundImageObject: null },
    { x: 45, y: 10, width: 10, height: 15, type: 'no_turn', backgroundColor: 'rgba(255, 182, 193, 0.4)', backgroundImageURL: 'https://img.pikbest.com/wp/202343/glacier-textured-backdrop-with-a-stunning-blue-theme_9941583.jpg!w700wp', backgroundImageObject: null },
    { x: 45, y: 75, width: 10, height: 15, type: 'no_turn', backgroundColor: 'rgba(255, 182, 193, 0.4)', backgroundImageURL: 'https://img.pikbest.com/wp/202343/glacier-textured-backdrop-with-a-stunning-blue-theme_9941583.jpg!w700wp', backgroundImageObject: null },
    { x: 15, y: 45, width: 15, height: 10, type: 'no_turn', backgroundColor: 'rgba(255, 182, 193, 0.4)', backgroundImageURL: 'https://img.pikbest.com/wp/202343/glacier-textured-backdrop-with-a-stunning-blue-theme_9941583.jpg!w700wp', backgroundImageObject: null },
    { x: 70, y: 45, width: 15, height: 10, type: 'no_turn', backgroundColor: 'rgba(255, 182, 193, 0.4)', backgroundImageURL: 'https://img.pikbest.com/wp/202343/glacier-textured-backdrop-with-a-stunning-blue-theme_9941583.jpg!w700wpD', backgroundImageObject: null },
];


let playerSnake;
let aiSnakes = [];
let foods = [];
let changingDirection = false;
let gameRunning = false;
let gameInterval = null;
let viewport = { x: 0, y: 0 };

let gameStartTime = 0; // <--- 新增：追蹤遊戲開始時間
let lastPlayedSeconds = 0; // <--- 新增：儲存最後一局的遊玩秒數

// DOM Elements
let canvas, ctx, scoreDisplay, gameOverMessage, instructionsDiv, startButton;
let leaderboardContainer, leaderboardTitle, playerNameEntry, finalScoreMessage,
    playerNameInput, submitScoreButton, leaderboardList, returnToStartButton;


// --- Snake Class ---
// ... (與上一版本相同，請確保它是完整的) ...
class Snake {
    constructor(x, y, color, borderColor, initialLength = 3, dx = 1, dy = 0, isPlayer = false) {
        this.body = [];
        this.color = color;
        this.borderColor = borderColor;
        this.dx = dx;
        this.dy = dy;
        this.isPlayer = isPlayer;
        this.length = initialLength;
        this.score = 0;
        this.id = Math.random().toString(36).substring(2, 9);
        this.isAlive = true;
        this.baseMoveIntervalTicks = BASE_MOVE_TICKS;
        this.currentMoveIntervalTicks = BASE_MOVE_TICKS;
        this.ticksUntilMove = BASE_MOVE_TICKS;
        for (let i = 0; i < initialLength; i++) {
            let segX = x - i * dx;
            let segY = y - i * dy;
            segX = Math.max(0, Math.min(segX, WORLD_WIDTH - 1));
            segY = Math.max(0, Math.min(segY, WORLD_HEIGHT - 1));
            this.body.push({ x: segX, y: segY });
        }
        if (this.body.length === 0 && initialLength > 0) {
             for (let i = 0; i < initialLength; i++) {
                this.body.push({ x: Math.max(0, x - i), y: y });
            }
        }
        this.length = this.body.length;
    }
    updateSpeed() {
        if (!this.isAlive) return;
        const head = this.getHead();
        if (!head) return;
        const zone = getZoneInfo(head.x, head.y);
        let multiplier = 1.0;
        if (zone && typeof zone.speedMultiplier !== 'undefined') {
            multiplier = zone.speedMultiplier;
        }
        this.currentMoveIntervalTicks = Math.max(1, Math.round(this.baseMoveIntervalTicks / multiplier));
    }
    move() {
        if (!this.isAlive || !this.body.length) return null;
        const currentHead = this.body[0];
        const newHead = {
            x: currentHead.x + this.dx,
            y: currentHead.y + this.dy
        };
        this.body.unshift(newHead);
        let eatenFood = null;
        for (let i = foods.length - 1; i >= 0; i--) {
            if (foods[i] && newHead.x === foods[i].x && newHead.y === foods[i].y) {
                eatenFood = foods[i];
                this.length += eatenFood.lengthValue;
                this.score += eatenFood.scoreValue;
                foods.splice(i, 1);
                spawnFood();
                break;
            }
        }
        while (this.body.length > this.length) {
            this.body.pop();
        }
        if (this.isPlayer && scoreDisplay) {
            scoreDisplay.textContent = `你的分數: ${this.score}`;
        }
        return eatenFood;
    }
    draw(viewX, viewY) {
        if (!this.isAlive) return;
        this.body.forEach(segment => {
            drawWorldRect(segment.x, segment.y, this.color, this.borderColor, viewX, viewY);
        });
    }
    changeDirection(newDx, newDy) {
        if (!this.isAlive) return;
        if (this.dx === -newDx && newDx !== 0) return;
        if (this.dy === -newDy && newDy !== 0) return;
        this.dx = newDx;
        this.dy = newDy;
    }
    getHead() {
        return this.body.length > 0 ? this.body[0] : null;
    }
    getBody() {
        return this.body.slice(1);
    }
    die(killer = null) {
        if (!this.isAlive) return;
        this.isAlive = false;
        console.log(`Snake ${this.id} (Player: ${this.isPlayer}) died.`);

        if (this.isPlayer) {
            lastPlayedSeconds = Math.round((Date.now() - gameStartTime) / 1000); // <--- 計算遊玩秒數
            console.log(`Player survived for ${lastPlayedSeconds} seconds.`);
        }

        if (!this.isPlayer) {
            let scoreToDrop = this.score;
            const bodySegments = [...this.body];
            while (scoreToDrop > 0 && foods.length < MAX_FOOD_ITEMS) {
                const foodType = chooseFoodTypeToDrop(scoreToDrop);
                if (!foodType) break;
                let segment;
                if (bodySegments.length > 0) {
                    segment = bodySegments.splice(Math.floor(Math.random() * bodySegments.length), 1)[0];
                } else {
                    segment = this.getHead() || { x: Math.floor(WORLD_WIDTH/2), y: Math.floor(WORLD_HEIGHT/2) };
                }
                let foodX = segment.x + Math.floor(Math.random() * 3) - 1;
                let foodY = segment.y + Math.floor(Math.random() * 3) - 1;
                foodX = Math.max(0, Math.min(foodX, WORLD_WIDTH - 1));
                foodY = Math.max(0, Math.min(foodY, WORLD_HEIGHT - 1));
                if (!isOccupiedBySnake(foodX, foodY, [this.id])) {
                    foods.push({ x: foodX, y: foodY, ...foodType });
                }
                scoreToDrop -= foodType.scoreValue;
                if (scoreToDrop < 0) scoreToDrop = 0;
            }
            console.log("Finished dropping food for AI snake " + this.id);
        } else {
            gameRunning = false;
            if (gameInterval) clearInterval(gameInterval);
            gameInterval = null;
            if (scoreDisplay) scoreDisplay.style.display = 'none';
            if (instructionsDiv) instructionsDiv.style.display = 'none';
            if (canvas) canvas.classList.add('game-hidden');
            if (gameOverMessage) gameOverMessage.style.display = 'none';
            if (!db) {
                console.warn("Realtime Database not available. Leaderboard features disabled.");
                if (gameOverMessage) {
                    gameOverMessage.innerHTML = `遊戲結束！ 你的分數: ${this.score}<br>遊玩時間: ${lastPlayedSeconds} 秒<br>排行榜無法使用<br>按空白鍵重新開始`;
                    gameOverMessage.style.display = 'block';
                    if (canvas) canvas.classList.add('game-hidden');
                }
                return;
            }
            if (leaderboardContainer && leaderboardTitle && playerNameEntry && finalScoreMessage && playerNameInput && submitScoreButton && leaderboardList && returnToStartButton) {
                leaderboardContainer.style.display = 'flex';
                leaderboardTitle.textContent = "遊戲結束";
                playerNameEntry.style.display = 'flex';
                finalScoreMessage.textContent = `你的最終分數: ${this.score} (遊玩 ${lastPlayedSeconds} 秒)`; // <--- 顯示秒數
                playerNameInput.value = '';
                playerNameInput.focus();
                submitScoreButton.disabled = false;
                submitScoreButton.textContent = "提交分數";
                leaderboardList.style.display = 'none';
                returnToStartButton.style.display = 'none';
            } else {
                console.error("Leaderboard UI elements missing, cannot show name entry.");
                 if (gameOverMessage) {
                    gameOverMessage.innerHTML = `遊戲結束！ 你的分數: ${this.score}<br>遊玩時間: ${lastPlayedSeconds} 秒<br>UI錯誤，無法提交分數<br>按空白鍵重新開始`;
                    gameOverMessage.style.display = 'block';
                }
            }
        }
    }
}

// --- Leaderboard Functions (Modified for Realtime Database & new fields) ---
async function handleScoreSubmission() {
    if (!playerSnake || !playerNameInput || !submitScoreButton) {
        console.error("handleScoreSubmission: Critical UI elements missing.");
        await fetchAndDisplayLeaderboard();
        return;
    }

    if (!db) {
        console.error("handleScoreSubmission: Realtime Database not available. Cannot submit score.");
        alert("錯誤：無法連接到排行榜服務。");
        if (playerNameEntry) playerNameEntry.style.display = 'none';
        await fetchAndDisplayLeaderboard();
        return;
    }

    const playerName = playerNameInput.value.trim();
    const playerScore = playerSnake.score;
    const playedSeconds = lastPlayedSeconds; // 從全域變數獲取

    if (!playerName) {
        alert("請輸入你的名字！");
        return;
    }
    if (playerName.length > 20) {
        alert("名字太長了！ (最多20個字)");
        return;
    }

    submitScoreButton.disabled = true;
    submitScoreButton.textContent = "提交中...";

    const scoresRef = ref(db, 'scores');
    const newScore = {
        name: playerName,
        score: playerScore,
        seconds: playedSeconds, // <--- 新增：儲存遊玩秒數
        timestamp: rtdbServerTimestamp()
    };

    try {
        await push(scoresRef, newScore);
        console.log("Score submitted successfully to Realtime Database:", newScore);
        if (playerNameEntry) playerNameEntry.style.display = 'none';
        await fetchAndDisplayLeaderboard();
    } catch (error) {
        console.error("Error submitting score to Realtime Database: ", error);
        alert(`提交分數失敗：${error.message}\n請檢查你的網路連線及 Realtime Database 安全性規則。`);
        if (playerNameEntry) playerNameEntry.style.display = 'none';
        await fetchAndDisplayLeaderboard();
    }
}

async function fetchAndDisplayLeaderboard() {
    // ... (此函數與上一 Realtime Database 版本相同，但可以考慮是否顯示秒數) ...
    // 如果要在排行榜上顯示秒數，可以在創建 listItem.innerHTML 時加入 data.seconds
    // 例如：
    // listItem.innerHTML = `<span class="rank">${rank}.</span><span class="name">${name}</span><span class="score">${score} (${entry.seconds || 0}s)</span>`;
    if (!leaderboardContainer || !leaderboardList || !leaderboardTitle || !returnToStartButton) {
         console.error("fetchAndDisplayLeaderboard: Leaderboard UI elements are missing.");
         return;
    }
    leaderboardContainer.style.display = 'flex';
    leaderboardTitle.textContent = "排行榜";
    leaderboardList.innerHTML = '<li><span class="name">載入中...</span></li>';
    leaderboardList.style.display = 'block';
    returnToStartButton.style.display = 'block';
    if (playerNameEntry) playerNameEntry.style.display = 'none';

    if (!db) {
        console.error("fetchAndDisplayLeaderboard: Realtime Database not available.");
        leaderboardList.innerHTML = '<li><span class="name">排行榜功能目前無法使用。</span></li>';
        return;
    }
    const scoresRef = ref(db, 'scores');
    const topScoresQuery = query(scoresRef, orderByChild('score'), limitToLast(5));

    try {
        const snapshot = await get(topScoresQuery);
        leaderboardList.innerHTML = '';
        if (snapshot.exists()) {
            const scores = [];
            snapshot.forEach(childSnapshot => {
                scores.push({ key: childSnapshot.key, ...childSnapshot.val() });
            });
            scores.reverse();
            let rank = 1;
            scores.forEach(entry => {
                const listItem = document.createElement('li');
                const name = entry.name ? String(entry.name).substring(0, 20) : '匿名';
                const score = typeof entry.score === 'number' ? entry.score : 0;
                const seconds = typeof entry.seconds === 'number' ? entry.seconds : 0; // 獲取秒數
                // 修改此處以顯示秒數
                listItem.innerHTML = `<span class="rank">${rank}.</span><span class="name">${name}</span><span class="score">${score} (${seconds}秒)</span>`;
                leaderboardList.appendChild(listItem);
                rank++;
            });
        } else {
            leaderboardList.innerHTML = '<li><span class="name">目前尚無紀錄</span></li>';
        }
        console.log("Leaderboard displayed from Realtime Database.");
    } catch (error) {
        console.error("Error fetching leaderboard from Realtime Database: ", error);
        leaderboardList.innerHTML = `<li><span class="name">讀取排行榜失敗：${error.message}</span></li>`;
    }
}


// --- startGame Function ---
function startGame() {
    console.log("startGame: Button clicked!");
    if (gameRunning && gameInterval) {
        console.warn("startGame called while game is already running. Clearing old interval.");
        clearInterval(gameInterval);
        gameInterval = null;
    }
    if (startButton) startButton.style.display = 'none';
    if (gameOverMessage) gameOverMessage.style.display = 'none';
    if (leaderboardContainer) leaderboardContainer.style.display = 'none';

    gameStartTime = Date.now(); // <--- 初始化遊戲開始時間
    lastPlayedSeconds = 0; // 重置上一局的秒數

    console.log("startGame: Calling initGame...");
    initGame();
    if (playerSnake) {
        console.log("startGame: Calling startGameLoop...");
        startGameLoop();
        console.log("startGame: Finished.");
    } else {
        console.error("startGame: Player snake not initialized, game cannot start.");
        if(startButton) startButton.style.display = 'block';
        if(gameOverMessage){
            gameOverMessage.textContent = "遊戲啟動失敗，請重試。";
            gameOverMessage.style.display = 'block';
        }
    }
}


// --- (其餘的遊戲邏輯函數，如 initGame, gameTick, drawing, collisions, AI, etc. 與上一 Realtime Database 版本相同) ---
// --- 請從上一 Realtime Database 版本複製完整的這些函數到這裡，確保它們都存在。 ---
// initGame, createAISnake, startGameLoop, gameTick, updateViewport, drawGameWorld, drawWorldRect, spawnFood,
// checkAllCollisions, updateAISnakeLogic, isOccupiedBySnake, chooseFoodTypeToDrop, findAndMoveTowardsFood,
// isColliding, getZoneInfo, handleReturnToStartScreen, handleKeyDown,
// preloadZoneImages, imageLoadFinished, drawInitialScreen.

// (補全所有遊戲邏輯函數，與上一版本相同)
function initGame() {
    console.log("initGame: Started.");
    try {
        changingDirection = false;
        if (gameOverMessage) gameOverMessage.style.display = 'none';
        if (startButton) startButton.style.display = 'none';
        if (scoreDisplay) {
            scoreDisplay.style.display = 'block';
        }
        if (instructionsDiv) instructionsDiv.style.display = 'block';
        if (canvas) canvas.classList.remove('game-hidden');
        if (leaderboardContainer) leaderboardContainer.style.display = 'none';
        if (playerNameInput) playerNameInput.value = '';
        if (submitScoreButton) {
            submitScoreButton.disabled = false;
            submitScoreButton.textContent = "提交分數";
        }
        foods = [];
        aiSnakes = [];
        aiColorIndex = 0;
        respawnCheckCounter = 0;
        playerSnake = new Snake(
            Math.floor(WORLD_WIDTH / 2),
            Math.floor(WORLD_HEIGHT / 2),
            PLAYER_SNAKE_COLOR, PLAYER_SNAKE_BORDER, 5, 1, 0, true
        );
        if (playerSnake) {
            playerSnake.updateSpeed();
            if (scoreDisplay) scoreDisplay.textContent = `你的分數: ${playerSnake.score}`;
        } else {
            console.error("Failed to create player snake!");
            if (gameOverMessage) {
                gameOverMessage.textContent = "創建玩家失敗！";
                gameOverMessage.style.display = 'block';
            }
            return;
        }
        for (let i = 0; i < NUM_AI_SNAKES; i++) {
            createAISnake();
        }
        for (let i = 0; i < INITIAL_FOOD_COUNT; i++) {
            spawnFood();
        }
        viewport = { x: 0, y: 0 };
        updateViewport();
        console.log("initGame: Finished successfully.");
    } catch (error) {
        console.error("Error during initGame:", error);
        gameRunning = false;
        if (gameOverMessage) {
            gameOverMessage.textContent = "遊戲初始化失敗！請檢查控制台。";
            gameOverMessage.style.display = 'block';
        }
        if (scoreDisplay) scoreDisplay.style.display = 'none';
    }
}
function createAISnake() {
    try {
        const initialLength = Math.floor(Math.random() * 5) + 3;
        const aiColor = AI_COLORS[aiColorIndex % AI_COLORS.length];
        aiColorIndex++;
        let startX, startY, isSafeLocation;
        const allSnakesForSpawnCheck = [playerSnake, ...aiSnakes].filter(s => s && s.isAlive);
        let attempts = 0;
        const maxAttempts = 50;
        do {
            isSafeLocation = true;
            startX = Math.floor(Math.random() * WORLD_WIDTH);
            startY = Math.floor(Math.random() * WORLD_HEIGHT);
            for (const existingSnake of allSnakesForSpawnCheck) {
                 if (!existingSnake || !existingSnake.getHead()) continue;
                if (existingSnake.body.some(seg => seg.x === startX && seg.y === startY)) {
                    isSafeLocation = false;
                    break;
                }
                const distSq = Math.pow(startX - existingSnake.getHead().x, 2) + Math.pow(startY - existingSnake.getHead().y, 2);
                if (distSq < 100) {
                    isSafeLocation = false;
                    break;
                }
            }
            attempts++;
            if (attempts > maxAttempts) {
                console.warn("AI Spawn retry limit exceeded. Placing randomly.");
                startX = Math.floor(Math.random() * WORLD_WIDTH);
                startY = Math.floor(Math.random() * WORLD_HEIGHT);
                break;
            }
        } while (!isSafeLocation);
        const randomDx = Math.random() > 0.5 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const randomDy = randomDx === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const ai = new Snake(startX, startY, aiColor.color, aiColor.border, initialLength, randomDx, randomDy);
        ai.updateSpeed();
        aiSnakes.push(ai);
    } catch (error) {
        console.error("Error creating AI snake:", error);
    }
}
function startGameLoop() {
    console.log("startGameLoop: Clearing existing interval if any...");
    if (gameInterval) clearInterval(gameInterval);
    gameRunning = true;
    console.log("startGameLoop: Setting new interval...");
    gameInterval = setInterval(gameTick, TICK_RATE);
    console.log(`startGameLoop: Interval set with ID ${gameInterval}, gameRunning: ${gameRunning}`);
}
function gameTick() {
    if (!gameRunning) {
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
            console.log("gameTick: gameRunning is false, cleared interval.");
        }
        return;
    }
    try {
        changingDirection = false;
        const allLivingSnakes = [playerSnake, ...aiSnakes].filter(s => s && s.isAlive);
        allLivingSnakes.forEach(snake => {
            if (!snake.isAlive) return;
            snake.ticksUntilMove--;
            if (snake.ticksUntilMove <= 0) {
                if (snake.isPlayer) {
                    snake.move();
                } else {
                    updateAISnakeLogic(snake);
                    snake.move();
                }
                snake.updateSpeed();
                snake.ticksUntilMove = snake.currentMoveIntervalTicks;
            }
        });
        updateViewport();
        drawGameWorld();
        checkAllCollisions();
        respawnCheckCounter++;
        if (respawnCheckCounter >= RESPAWN_CHECK_INTERVAL_TICKS) {
            respawnCheckCounter = 0;
            const livingAICount = aiSnakes.filter(s => s.isAlive).length;
            const needed = NUM_AI_SNAKES - livingAICount;
            for (let i = 0; i < needed; i++) {
                createAISnake();
            }
        }
    } catch (error) {
        console.error("Error during gameTick:", error);
        gameRunning = false;
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = null;
        if (gameOverMessage) {
            gameOverMessage.textContent = "遊戲運行時發生錯誤！請檢查控制台。";
            gameOverMessage.style.display = 'block';
        }
        if (scoreDisplay) scoreDisplay.style.display = 'none';
    }
}
function updateViewport() {
    try {
        if (!playerSnake || !playerSnake.isAlive || typeof viewport === 'undefined' || viewport === null || !playerSnake.getHead()) {
            return;
        }
        const head = playerSnake.getHead();
        const viewWidthGrids = CANVAS_WIDTH / GRID_SIZE;
        const viewHeightGrids = CANVAS_HEIGHT / GRID_SIZE;
        let targetViewportX = head.x - Math.floor(viewWidthGrids / 2);
        let targetViewportY = head.y - Math.floor(viewHeightGrids / 2);
        viewport.x = Math.max(0, Math.min(targetViewportX, WORLD_WIDTH - viewWidthGrids));
        viewport.y = Math.max(0, Math.min(targetViewportY, WORLD_HEIGHT - viewHeightGrids));
    } catch (error) {
        console.error("Error in updateViewport:", error);
    }
}
function drawGameWorld() {
    try {
        if (!ctx) return;
        if (typeof viewport === 'undefined' || viewport === null) {
            viewport = { x: 0, y: 0 };
        }
        const viewX = viewport.x;
        const viewY = viewport.y;
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        mapZones.forEach(zone => {
            const zoneCanvasX = (zone.x - viewX) * GRID_SIZE;
            const zoneCanvasY = (zone.y - viewY) * GRID_SIZE;
            const zoneCanvasWidth = zone.width * GRID_SIZE;
            const zoneCanvasHeight = zone.height * GRID_SIZE;
            if (zoneCanvasX < CANVAS_WIDTH && zoneCanvasX + zoneCanvasWidth > 0 &&
                zoneCanvasY < CANVAS_HEIGHT && zoneCanvasY + zoneCanvasHeight > 0) {
                const drawX = Math.max(0, zoneCanvasX);
                const drawY = Math.max(0, zoneCanvasY);
                const drawWidth = Math.min(CANVAS_WIDTH, zoneCanvasX + zoneCanvasWidth) - drawX;
                const drawHeight = Math.min(CANVAS_HEIGHT, zoneCanvasY + zoneCanvasHeight) - drawY;
                if (drawWidth > 0 && drawHeight > 0) {
                    if (zone.backgroundImageObject && zone.backgroundImageObject.complete) {
                        const pattern = ctx.createPattern(zone.backgroundImageObject, 'repeat');
                        if (pattern) {
                            ctx.fillStyle = pattern;
                             ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
                        } else {
                            ctx.fillStyle = zone.backgroundColor;
                            ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
                        }
                    } else {
                        ctx.fillStyle = zone.backgroundColor;
                        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
                    }
                }
            }
        });
        ctx.strokeStyle = GRID_LINE_COLOR;
        ctx.lineWidth = 0.5;
        const startGridX = -(viewX % 1);
        const startGridY = -(viewY % 1);
        ctx.beginPath();
        for (let x = startGridX; x < CANVAS_WIDTH / GRID_SIZE; x++) {
            ctx.moveTo(x * GRID_SIZE, 0);
            ctx.lineTo(x * GRID_SIZE, CANVAS_HEIGHT);
        }
        ctx.stroke();
        ctx.beginPath();
        for (let y = startGridY; y < CANVAS_HEIGHT / GRID_SIZE; y++) {
            ctx.moveTo(0, y * GRID_SIZE);
            ctx.lineTo(CANVAS_WIDTH, y * GRID_SIZE);
        }
        ctx.stroke();
        const viewportEndX = viewX + CANVAS_WIDTH / GRID_SIZE;
        const viewportEndY = viewY + CANVAS_HEIGHT / GRID_SIZE;
        foods.forEach(food => {
            if (food.x >= viewX - 1 && food.x < viewportEndX + 1 &&
                food.y >= viewY - 1 && food.y < viewportEndY + 1) {
                drawWorldRect(food.x, food.y, food.color, food.borderColor, viewX, viewY, food.size);
            }
        });
        aiSnakes.forEach(ai => {
            if (ai.isAlive) ai.draw(viewX, viewY);
        });
        if (playerSnake && playerSnake.isAlive) {
            playerSnake.draw(viewX, viewY);
        }
    } catch (error) {
        console.error("Error in drawGameWorld:", error);
        gameRunning = false;
    }
}
function drawWorldRect(worldX, worldY, fillColor, borderColor, viewX, viewY, sizeScale = 1) {
    try {
        const canvasX = (worldX - viewX) * GRID_SIZE;
        const canvasY = (worldY - viewY) * GRID_SIZE;
        const actualSize = GRID_SIZE * sizeScale;
        const offset = (GRID_SIZE - actualSize) / 2;
        if (canvasX + actualSize > 0 && canvasX < CANVAS_WIDTH &&
            canvasY + actualSize > 0 && canvasY < CANVAS_HEIGHT) {
            ctx.fillStyle = fillColor;
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.fillRect(canvasX + offset, canvasY + offset, actualSize, actualSize);
            ctx.strokeRect(canvasX + offset, canvasY + offset, actualSize, actualSize);
        }
    } catch (error) {
        console.error("Error in drawWorldRect:", error);
    }
}
function spawnFood(count = 1) {
    for (let i = 0; i < count; i++) {
        if (foods.length >= MAX_FOOD_ITEMS) return;
        let foodX, foodY, isOccupied;
        const foodType = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
        let attempts = 0;
        const maxAttempts = 50;
        do {
            isOccupied = false;
            foodX = Math.floor(Math.random() * WORLD_WIDTH);
            foodY = Math.floor(Math.random() * WORLD_HEIGHT);
            if (isOccupiedBySnake(foodX, foodY)) {
                isOccupied = true;
            } else if (foods.some(f => f.x === foodX && f.y === foodY)) {
                isOccupied = true;
            }
            attempts++;
            if (attempts > maxAttempts) {
                console.warn("Max attempts to spawn food reached. World might be too full.");
                return;
            }
        } while (isOccupied);
        foods.push({ x: foodX, y: foodY, ...foodType });
    }
}
function checkAllCollisions() {
    try {
        const livingSnakes = [playerSnake, ...aiSnakes].filter(s => s && s.isAlive && s.getHead());
        if (!playerSnake || !playerSnake.isAlive || !playerSnake.getHead()) return;
        for (let i = 0; i < livingSnakes.length; i++) {
            const snakeA = livingSnakes[i];
            if (!snakeA.isAlive || !snakeA.getHead()) continue;
            const headA = snakeA.getHead();
            if (headA.x < 0 || headA.x >= WORLD_WIDTH || headA.y < 0 || headA.y >= WORLD_HEIGHT) {
                snakeA.die("wall");
                continue;
            }
            const bodyA = snakeA.getBody();
            for (let j = 0; j < bodyA.length; j++) {
                if (headA.x === bodyA[j].x && headA.y === bodyA[j].y) {
                    snakeA.die("self");
                    break;
                }
            }
            if (!snakeA.isAlive) continue;
            for (let k = i + 1; k < livingSnakes.length; k++) {
                const snakeB = livingSnakes[k];
                if (!snakeB.isAlive || !snakeB.getHead()) continue;
                const headB = snakeB.getHead();
                const bodyB = snakeB.getBody();
                for (let j = 0; j < bodyB.length; j++) {
                    if (headA.x === bodyB[j].x && headA.y === bodyB[j].y) {
                        snakeA.die(snakeB);
                        break;
                    }
                }
                if (!snakeA.isAlive) break;
                const currentBodyA = snakeA.getBody();
                for (let j = 0; j < currentBodyA.length; j++) {
                    if (headB.x === currentBodyA[j].x && headB.y === currentBodyA[j].y) {
                        snakeB.die(snakeA);
                        break;
                    }
                }
                if (!snakeB.isAlive) continue;
                if (headA.x === headB.x && headA.y === headB.y) {
                    if (snakeA.length > snakeB.length) {
                        snakeB.die(snakeA);
                    } else if (snakeB.length > snakeA.length) {
                        snakeA.die(snakeB);
                    } else {
                        snakeA.die("head-on with " + snakeB.id);
                        snakeB.die("head-on with " + snakeA.id);
                    }
                    if (!snakeA.isAlive) break;
                }
            }
        }
    } catch (error) {
        console.error("Error during checkAllCollisions:", error);
    }
}
function updateAISnakeLogic(aiSnake) {
    try {
        if (!aiSnake.isAlive || !aiSnake.getHead()) return;
        const head = aiSnake.getHead();
        const currentZone = getZoneInfo(head.x, head.y);
        if (currentZone && currentZone.type === 'no_turn') {
            return;
        }
        const nextX = head.x + aiSnake.dx;
        const nextY = head.y + aiSnake.dy;
        let immediateDanger = false;
        if (nextX < 0 || nextX >= WORLD_WIDTH || nextY < 0 || nextY >= WORLD_HEIGHT) {
            immediateDanger = true;
        }
        if (!immediateDanger) {
            const allSnakes = [playerSnake, ...aiSnakes].filter(s => s && s.isAlive);
            for (const otherSnake of allSnakes) {
                if (!otherSnake || !otherSnake.isAlive) continue;
                const bodyToCheck = (otherSnake.id === aiSnake.id) ? otherSnake.getBody() : otherSnake.body;
                if (bodyToCheck.some(segment => segment.x === nextX && segment.y === nextY)) {
                    immediateDanger = true;
                    break;
                }
            }
        }
        if (immediateDanger) {
            const possibleTurns = [];
            const leftDx = aiSnake.dy;
            const leftDy = -aiSnake.dx;
            if (!isColliding(head.x + leftDx, head.y + leftDy, aiSnake.id)) {
                possibleTurns.push({ dx: leftDx, dy: leftDy });
            }
            const rightDx = -aiSnake.dy;
            const rightDy = aiSnake.dx;
            if (!isColliding(head.x + rightDx, head.y + rightDy, aiSnake.id)) {
                possibleTurns.push({ dx: rightDx, dy: rightDy });
            }
            if (possibleTurns.length > 0) {
                const turn = possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
                aiSnake.changeDirection(turn.dx, turn.dy);
            }
            return;
        }
        if (foods.length > 0 && Math.random() < 0.1) {
            findAndMoveTowardsFood(aiSnake);
            return;
        }
        if (Math.random() < 0.05) {
            const turns = [{ dx: aiSnake.dy, dy: -aiSnake.dx }, { dx: -aiSnake.dy, dy: aiSnake.dx }];
            const turn = turns[Math.floor(Math.random() * turns.length)];
            if (!isColliding(head.x + turn.dx, head.y + turn.dy, aiSnake.id)) {
                aiSnake.changeDirection(turn.dx, turn.dy);
            }
        }
    } catch (error) {
        console.error(`Error updating AI logic for ${aiSnake.id}:`, error);
    }
}
function isOccupiedBySnake(x, y, excludedSnakeIds = []) {
    const allSnakes = [playerSnake, ...aiSnakes];
    for (const snake of allSnakes) {
        if (snake && snake.isAlive && !excludedSnakeIds.includes(snake.id)) {
            if (snake.body.some(segment => segment.x === x && segment.y === y)) {
                return true;
            }
        }
    }
    return false;
}
function chooseFoodTypeToDrop(remainingScore) {
    const affordableTypes = FOOD_TYPES.filter(type => type.scoreValue <= remainingScore && type.scoreValue > 0);
    if (affordableTypes.length === 0) {
        const smallest = FOOD_TYPES.reduce((min, t) => t.scoreValue < min.scoreValue ? t : min, FOOD_TYPES[0]);
        return (smallest.scoreValue <= remainingScore && smallest.scoreValue > 0) ? smallest : null;
    }
    const rand = Math.random();
    if (rand < 0.7 && affordableTypes.some(t => t.level === 1)) {
        const level1Foods = affordableTypes.filter(t => t.level === 1);
        return level1Foods[Math.floor(Math.random() * level1Foods.length)];
    } else if (rand < 0.95 && affordableTypes.some(t => t.level === 2)) {
        const level2Foods = affordableTypes.filter(t => t.level === 2);
        return level2Foods[Math.floor(Math.random() * level2Foods.length)];
    } else {
        const level3Foods = affordableTypes.filter(t => t.level === 3);
        if (level3Foods.length > 0) return level3Foods[Math.floor(Math.random() * level3Foods.length)];
        return affordableTypes[Math.floor(Math.random() * affordableTypes.length)];
    }
}
function findAndMoveTowardsFood(aiSnake) {
    if (foods.length === 0 || !aiSnake.getHead()) return;
    let closestFood = null;
    let minDistanceSq = Infinity;
    const head = aiSnake.getHead();
    foods.forEach(food => {
        const distSq = Math.pow(head.x - food.x, 2) + Math.pow(head.y - food.y, 2);
        if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestFood = food;
        }
    });
    if (!closestFood) return;
    const deltaX = closestFood.x - head.x;
    const deltaY = closestFood.y - head.y;
    let preferredDx = aiSnake.dx;
    let preferredDy = aiSnake.dy;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && aiSnake.dx !== -1) { preferredDx = 1; preferredDy = 0; }
        else if (deltaX < 0 && aiSnake.dx !== 1) { preferredDx = -1; preferredDy = 0; }
        else if (deltaY > 0 && aiSnake.dy !== -1) { preferredDx = 0; preferredDy = 1; }
        else if (deltaY < 0 && aiSnake.dy !== 1) { preferredDx = 0; preferredDy = -1; }
    } else {
        if (deltaY > 0 && aiSnake.dy !== -1) { preferredDx = 0; preferredDy = 1; }
        else if (deltaY < 0 && aiSnake.dy !== 1) { preferredDx = 0; preferredDy = -1; }
        else if (deltaX > 0 && aiSnake.dx !== -1) { preferredDx = 1; preferredDy = 0; }
        else if (deltaX < 0 && aiSnake.dx !== 1) { preferredDx = -1; preferredDy = 0; }
    }
    if (!isColliding(head.x + preferredDx, head.y + preferredDy, aiSnake.id)) {
        aiSnake.changeDirection(preferredDx, preferredDy);
    }
}
function isColliding(x, y, selfId) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return true;
    const allSnakes = [playerSnake, ...aiSnakes].filter(s => s && s.isAlive);
    for (const snake of allSnakes) {
        if (!snake || !snake.isAlive) continue;
        const segmentsToCheck = (snake.id === selfId) ? snake.getBody() : snake.body;
        if (segmentsToCheck.some(segment => segment.x === x && segment.y === y)) {
            return true;
        }
    }
    return false;
}
function getZoneInfo(x, y) {
    for (const zone of mapZones) {
        if (x >= zone.x && x < zone.x + zone.width &&
            y >= zone.y && y < zone.y + zone.height) {
            return zone;
        }
    }
    return null;
}
function handleReturnToStartScreen() {
    if (leaderboardContainer) leaderboardContainer.style.display = 'none';
    if (startButton) startButton.style.display = 'block';
    if (instructionsDiv) instructionsDiv.style.display = 'block';
    if (canvas) canvas.classList.remove('game-hidden');
    if (playerNameInput) playerNameInput.value = '';
     if (submitScoreButton) {
        submitScoreButton.disabled = false;
        submitScoreButton.textContent = "提交分數";
    }
    drawInitialScreen();
}
function handleKeyDown(event) {
    if (!gameRunning) {
        if (event.key === ' ' || event.key === 'Spacebar') {
            if (gameOverMessage && gameOverMessage.style.display !== 'none' &&
                gameOverMessage.innerHTML.includes("重新開始")) {
                if (playerNameEntry && playerNameEntry.style.display !== 'none') return;
                if (leaderboardContainer && leaderboardContainer.style.display !== 'none') return;
                console.log("Restart triggered by Spacebar (from explicit message).");
                initGame();
                startGameLoop();
            }
        }
        return;
    }
    if (!playerSnake || !playerSnake.isAlive || !playerSnake.getHead()) return;
    if (changingDirection) return;
    const head = playerSnake.getHead();
    const currentZone = getZoneInfo(head.x, head.y);
    if (currentZone && currentZone.type === 'no_turn') {
        return;
    }
    const keyPressed = event.key;
    let newDx = playerSnake.dx;
    let newDy = playerSnake.dy;
    switch (keyPressed.toLowerCase()) {
        case 'arrowup': case 'w':
            if (playerSnake.dy !== 1) { newDx = 0; newDy = -1; } break;
        case 'arrowdown': case 's':
            if (playerSnake.dy !== -1) { newDx = 0; newDy = 1; } break;
        case 'arrowleft': case 'a':
            if (playerSnake.dx !== 1) { newDx = -1; newDy = 0; } break;
        case 'arrowright': case 'd':
            if (playerSnake.dx !== -1) { newDx = 1; newDy = 0; } break;
        default: return;
    }
    if (newDx !== playerSnake.dx || newDy !== playerSnake.dy) {
        playerSnake.changeDirection(newDx, newDy);
        changingDirection = true;
    }
}
let imagesToLoad = 0;
let imagesLoaded = 0;
function preloadZoneImages(callback) {
    console.log("Preloading zone images...");
    imagesToLoad = 0;
    imagesLoaded = 0;
    const imageUrls = mapZones.map(z => z.backgroundImageURL).filter(url => url);
    if (imageUrls.length === 0) {
        console.log("No images to preload.");
        if (callback) callback();
        return;
    }
    imagesToLoad = imageUrls.length;
    mapZones.forEach(zone => {
        if (zone.backgroundImageURL) {
            const img = new Image();
            img.onload = () => {
                console.log(`Image loaded: ${zone.backgroundImageURL}`);
                zone.backgroundImageObject = img;
                imageLoadFinished(callback);
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${zone.backgroundImageURL}`);
                zone.backgroundImageObject = null;
                imageLoadFinished(callback);
            };
            img.src = zone.backgroundImageURL;
        }
    });
}
function imageLoadFinished(callback) {
    imagesLoaded++;
    console.log(`Image processed: ${imagesLoaded}/${imagesToLoad}`);
    if (imagesLoaded >= imagesToLoad) {
        console.log("All images preloading finished.");
        if (callback) callback();
    }
}
function drawInitialScreen() {
    try {
        if (!ctx) {
            console.warn("drawInitialScreen: Canvas context not available yet.");
            return;
        }
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = GRID_LINE_COLOR;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let x = 0; x < CANVAS_WIDTH; x += GRID_SIZE) {
            ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT);
        }
        ctx.stroke();
        ctx.beginPath();
        for (let y = 0; y < CANVAS_HEIGHT; y += GRID_SIZE) {
            ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y);
        }
        ctx.stroke();
        console.log("Initial screen drawn.");
    } catch (error) {
        console.error("Error in drawInitialScreen:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    canvas = document.getElementById('gameCanvas');
    scoreDisplay = document.getElementById('scoreDisplay');
    gameOverMessage = document.getElementById('gameOverMessage');
    instructionsDiv = document.getElementById('instructions');
    startButton = document.getElementById('startButton');
    leaderboardContainer = document.getElementById('leaderboardContainer');
    leaderboardTitle = document.getElementById('leaderboardTitle');
    playerNameEntry = document.getElementById('playerNameEntry');
    finalScoreMessage = document.getElementById('finalScoreMessage');
    playerNameInput = document.getElementById('playerNameInput');
    submitScoreButton = document.getElementById('submitScoreButton');
    leaderboardList = document.getElementById('leaderboardList');
    returnToStartButton = document.getElementById('returnToStartButton');

    const criticalElements = { canvas, scoreDisplay, gameOverMessage, instructionsDiv, startButton, leaderboardContainer, leaderboardTitle, playerNameEntry, finalScoreMessage, playerNameInput, submitScoreButton, leaderboardList, returnToStartButton };
    let allElementsFound = true;
    for (const key in criticalElements) {
        if (!criticalElements[key]) {
            console.error(`Fatal Error: DOM element with ID '${key}' not found! Game cannot start properly.`);
            allElementsFound = false;
            if (gameOverMessage) {
                 gameOverMessage.innerHTML = `頁面元素缺失 (${key})，<br>請檢查 HTML 或刷新頁面。`;
                 gameOverMessage.style.display = 'block';
            }
            break;
        }
    }
    if (!allElementsFound) {
        if (startButton) {
            startButton.textContent = "載入錯誤";
            startButton.disabled = true;
        }
        return;
    }

    ctx = canvas.getContext('2d');
    CANVAS_WIDTH = canvas.width;
    CANVAS_HEIGHT = canvas.height;

    if (!db) {
        console.warn("Firebase Realtime Database was not initialized correctly. Leaderboard features will be disabled.");
        if (submitScoreButton) submitScoreButton.disabled = true;
    } else {
        console.log("Firebase Realtime Database instance (db) is available to DOMContentLoaded.");
        if (submitScoreButton) submitScoreButton.addEventListener('click', handleScoreSubmission);
        if (returnToStartButton) returnToStartButton.addEventListener('click', handleReturnToStartScreen);
    }

    if (startButton) {
        startButton.disabled = true;
        startButton.textContent = "載入中...";
    }
    document.addEventListener('keydown', handleKeyDown);

    preloadZoneImages(() => {
        if (startButton) {
            startButton.disabled = false;
            startButton.textContent = "開始遊戲";
            startButton.removeEventListener('click', startGame);
            startButton.addEventListener('click', startGame);
            console.log("Start button enabled and click listener attached.");
        } else {
            console.error("Start button not found post-preload! Cannot attach listener or enable.");
        }
        drawInitialScreen();
    });
});
