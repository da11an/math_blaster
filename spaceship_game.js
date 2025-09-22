// Math Blaster Spaceship Game
class SpaceshipGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameState = 'login'; // 'login', 'menu', 'playing', 'math', 'gameOver'
        this.currentUser = null;
        this.apiBaseUrl = 'http://localhost:8001/api';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // Player spaceship
        this.player = {
            x: this.width / 2,
            y: this.height - 60,
            width: 40,
            height: 30,
            speed: 5,
            color: '#00ff00'
        };
        
        // Ammunition system - 9 banks with different power levels
        this.ammunitionBanks = [];
        this.maxAmmoPerBank = 1000;
        this.ammoPerProblem = 10;
        
        // Initialize 10 ammunition banks with increasing power (0-9)
        this.ammoTypes = [
            { power: 0, color: '#666666', damage: 1, name: 'Pulse', infinite: true },    // Bank 0 - Infinite
            { power: 1, color: '#00ff00', damage: 2, name: 'Heavy Pulse' },   // Bank 1
            { power: 2, color: '#88ff00', damage: 3, name: 'Laser' },   // Bank 2
            { power: 3, color: '#ffff00', damage: 4, name: 'Heavy Laser' },   // Bank 3
            { power: 4, color: '#ffaa00', damage: 5, name: 'Blaster' },   // Bank 4
            { power: 5, color: '#ff8800', damage: 8, name: 'Heavy Blaster' },      // Bank 5
            { power: 6, color: '#ff4400', damage: 12, name: 'Cannon' },    // Bank 6
            { power: 7, color: '#ff0000', damage: 18, name: 'Heavy Cannon' }, // Bank 7
            { power: 8, color: '#ff00ff', damage: 25, name: 'Destroyer' },  // Bank 8
            { power: 9, color: '#ffffff', damage: 35, name: 'Heavy Destroyer' }     // Bank 9
        ];
        
        // Initialize ammunition banks (0-9, so 10 banks total)
        for (let i = 0; i < 10; i++) {
            this.ammunitionBanks.push([]);
        }
        
        // Current bank selection (start with basic infinite ammo)
        this.currentBank = 0;
        
        // Bullets
        this.bullets = [];
        
        // Enemy ships
        this.enemies = [];
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 120; // frames
        
        // Math mode
        this.mathMode = {
            active: false,
            currentProblem: null,
            correctAnswer: 0,
            correctCount: 0,
            totalCount: 0,
            targetBank: 1
        };
        
        // Visual effects
        this.particles = [];
        this.explosions = [];
        
        // Level progression
        this.enemiesDestroyed = 0;
        this.levelEnemyTarget = 5;
        
        // Input handling
        this.keys = {};
        this.setupEventListeners();
        
        // Start the game
        this.init();
    }
    
    init() {
        // Only clear ammo if no user is logged in
        if (!this.currentUser) {
            this.clearAllAmmunition();
        } else {
            this.updateAmmoDisplay();
        }
        this.updateUI();
        this.gameLoop();
    }
    
    async login(username, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = username;
                this.loadUserData(data.user_data);
                this.showLoginMessage('Login successful!', '#00ff00');
                this.showStartScreen();
                return true;
            } else {
                this.showLoginMessage(data.message, '#ff0000');
                return false;
            }
        } catch (error) {
            this.showLoginMessage('Connection error. Make sure API server is running.', '#ff0000');
            return false;
        }
    }
    
    async register(username, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = username;
                this.loadUserData(data.user_data);
                this.showLoginMessage('Account created successfully!', '#00ff00');
                this.showStartScreen();
                return true;
            } else {
                this.showLoginMessage(data.message, '#ff0000');
                return false;
            }
        } catch (error) {
            this.showLoginMessage('Connection error. Make sure API server is running.', '#ff0000');
            return false;
        }
    }
    
    loadUserData(userData) {
        // Load ammunition banks (convert counts back to arrays)
        if (userData.ammunition_banks) {
            for (let i = 0; i < 10; i++) {
                const count = userData.ammunition_banks[i.toString()] || 0;
                this.ammunitionBanks[i] = [];
                
                // Fill the bank with the appropriate ammo type
                if (i > 0 && count > 0) { // Bank 0 is infinite, so don't populate
                    const ammoType = this.ammoTypes[i];
                    for (let j = 0; j < count; j++) {
                        this.ammunitionBanks[i].push(ammoType);
                    }
                }
            }
        }
        
        // Load game stats
        if (userData.game_stats) {
            this.score = userData.game_stats.total_score || 0;
            this.level = userData.game_stats.highest_level || 1;
            this.mathMode.correctCount = userData.game_stats.correct_math_problems || 0;
            this.mathMode.totalCount = userData.game_stats.total_math_problems || 0;
        }
        
        this.updateAmmoDisplay();
        this.updateUI();
    }
    
    async saveUserData() {
        if (!this.currentUser) return;
        
        try {
            // Save ammunition banks (convert arrays to counts)
            const banks = {};
            for (let i = 0; i < 10; i++) {
                banks[i.toString()] = this.ammunitionBanks[i].length;
            }
            
            await fetch(`${this.apiBaseUrl}/save_ammunition`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: this.currentUser,
                    ammunition_banks: banks
                })
            });
            
            // Save game stats
            await fetch(`${this.apiBaseUrl}/save_stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: this.currentUser,
                    game_stats: {
                        total_score: this.score,
                        highest_level: this.level,
                        total_math_problems: this.mathMode.totalCount,
                        correct_math_problems: this.mathMode.correctCount,
                        total_enemies_destroyed: this.enemiesDestroyed
                    }
                })
            });
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }
    
    showLoginMessage(message, color) {
        const messageDiv = document.getElementById('loginMessage');
        messageDiv.textContent = message;
        messageDiv.style.color = color;
    }
    
    showStartScreen() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'block';
        document.getElementById('currentUser').textContent = this.currentUser;
    }
    
    logout() {
        this.currentUser = null;
        this.clearAllAmmunition(); // Reset to default
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.mathMode.correctCount = 0;
        this.mathMode.totalCount = 0;
        this.enemiesDestroyed = 0;
        
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        this.showLoginMessage('', '#ff0000');
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyM' && this.gameState !== 'login') {
                e.preventDefault();
                this.toggleMathMode();
            } else if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
                this.shoot();
            } else if (e.code >= 'Digit0' && e.code <= 'Digit9' && this.gameState === 'playing') {
                e.preventDefault();
                this.selectBank(parseInt(e.code.slice(-1)));
            } else if (e.code === 'KeyD' && this.gameState === 'playing') {
                e.preventDefault();
                this.downgradeAmmo();
            } else if (e.code === 'KeyF' && this.gameState === 'playing') {
                e.preventDefault();
                this.findUpgrade();
            } else if (e.code === 'KeyF' && this.gameState === 'math') {
                e.preventDefault();
                this.mathSelectNextBank();
            } else if (e.code === 'KeyD' && this.gameState === 'math') {
                e.preventDefault();
                this.mathSelectPrevBank();
            } else if (e.code === 'Enter' && this.gameState === 'login') {
                e.preventDefault();
                // Try login first, if that fails, try register
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                if (username && password) {
                    login();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Math mode input
        document.getElementById('mathAnswer').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });
    }
    
    generateAmmunition() {
        // This function should NOT clear existing ammo!
        // It's only for initializing empty banks on first load
        this.updateAmmoDisplay();
    }
    
    clearAllAmmunition() {
        // Clear all banks except bank 0 (infinite basic ammo)
        for (let i = 1; i < 10; i++) {
            this.ammunitionBanks[i] = [];
        }
        this.updateAmmoDisplay();
    }
    
    selectBank(bankNumber) {
        if (bankNumber >= 0 && bankNumber <= 9) {
            this.currentBank = bankNumber;
            this.showBankSelection(bankNumber);
        }
    }
    
    downgradeAmmo() {
        // Find the next available lower level ammo
        for (let i = this.currentBank - 1; i >= 0; i--) {
            if (i === 0 || this.ammunitionBanks[i].length > 0) {
                this.currentBank = i;
                this.showBankSelection(i);
                break;
            }
        }
    }
    
    findUpgrade() {
        // Find the next available higher level ammo
        for (let i = this.currentBank + 1; i <= 9; i++) {
            if (this.ammunitionBanks[i].length > 0) {
                this.currentBank = i;
                this.showBankSelection(i);
                break;
            }
        }
    }
    
    showBankSelection(bankNumber) {
        const ammoType = this.ammoTypes[bankNumber];
        const count = bankNumber === 0 ? '∞' : this.ammunitionBanks[bankNumber].length;
        const message = document.createElement('div');
        message.textContent = `BANK ${bankNumber} - ${ammoType.name} (${count} shots)`;
        message.style.position = 'absolute';
        message.style.top = '100px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.color = ammoType.color;
        message.style.fontSize = '16px';
        message.style.zIndex = '30';
        message.style.pointerEvents = 'none';
        message.style.textShadow = '0 0 10px currentColor';
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 1000);
    }
    
    updateAmmoDisplay() {
        const ammoDisplay = document.getElementById('ammoDisplay');
        ammoDisplay.innerHTML = '';
        
        // Show all 10 banks (0-9)
        for (let i = 0; i < 10; i++) {
            const bankContainer = document.createElement('div');
            bankContainer.style.display = 'flex';
            bankContainer.style.alignItems = 'center';
            bankContainer.style.marginBottom = '5px';
            bankContainer.style.border = this.currentBank === i ? '2px solid #ffffff' : '1px solid #444';
            bankContainer.style.padding = '2px';
            bankContainer.style.borderRadius = '3px';
            
            // Bank number
            const bankNumber = document.createElement('div');
            bankNumber.textContent = `${i}:`;
            bankNumber.style.color = '#00ff00';
            bankNumber.style.fontSize = '12px';
            bankNumber.style.marginRight = '5px';
            bankNumber.style.minWidth = '15px';
            bankContainer.appendChild(bankNumber);
            
            // Ammo count
            const count = document.createElement('div');
            count.textContent = i === 0 ? '∞' : this.ammunitionBanks[i].length;
            count.style.color = (i === 0 || this.ammunitionBanks[i].length > 0) ? '#ffffff' : '#ff0000';
            count.style.fontSize = '12px';
            count.style.marginRight = '5px';
            count.style.minWidth = '20px';
            bankContainer.appendChild(count);
            
            // Ammo type indicator
            const ammoIndicator = document.createElement('div');
            ammoIndicator.style.width = '20px';
            ammoIndicator.style.height = '10px';
            ammoIndicator.style.backgroundColor = this.ammoTypes[i].color;
            ammoIndicator.style.borderRadius = '2px';
            ammoIndicator.style.marginRight = '5px';
            bankContainer.appendChild(ammoIndicator);
            
            // Ammo name
            const ammoName = document.createElement('div');
            ammoName.textContent = this.ammoTypes[i].name;
            ammoName.style.color = this.ammoTypes[i].color;
            ammoName.style.fontSize = '10px';
            ammoName.style.textShadow = '0 0 5px currentColor';
            bankContainer.appendChild(ammoName);
            
            ammoDisplay.appendChild(bankContainer);
        }
        
        // Show current bank info
        const currentBankInfo = document.createElement('div');
        const count = this.currentBank === 0 ? '∞' : this.ammunitionBanks[this.currentBank].length;
        currentBankInfo.textContent = `Current: Bank ${this.currentBank} (${count} shots)`;
        currentBankInfo.style.color = this.ammoTypes[this.currentBank].color;
        currentBankInfo.style.fontSize = '14px';
        currentBankInfo.style.marginTop = '10px';
        currentBankInfo.style.textShadow = '0 0 5px currentColor';
        ammoDisplay.appendChild(currentBankInfo);
    }
    
    toggleMathMode() {
        if (this.gameState === 'playing') {
            this.gameState = 'math';
            this.mathMode.active = true;
            this.mathMode.targetBank = 1; // Default to bank 1
            this.updateMathBankDisplay();
            this.generateMathProblem();
            document.getElementById('mathMode').style.display = 'block';
            document.getElementById('mathAnswer').focus();
        } else if (this.gameState === 'math') {
            this.exitMathMode();
        }
    }
    
    exitMathMode() {
        this.gameState = 'playing';
        this.mathMode.active = false;
        document.getElementById('mathMode').style.display = 'none';
        document.getElementById('mathAnswer').value = '';
    }
    
    updateMathBankDisplay() {
        const mathBankDisplay = document.getElementById('mathBankDisplay');
        mathBankDisplay.innerHTML = '';
        
        // Show banks 1-9 (skip bank 0 since it's infinite)
        for (let i = 1; i < 10; i++) {
            const bankButton = document.createElement('div');
            bankButton.className = 'math-bank-button';
            bankButton.style.cssText = `
                padding: 8px 12px;
                margin: 2px;
                border: 2px solid ${this.mathMode.targetBank === i ? '#ffffff' : this.ammoTypes[i].color};
                background: ${this.mathMode.targetBank === i ? this.ammoTypes[i].color : 'rgba(0,0,0,0.7)'};
                color: ${this.mathMode.targetBank === i ? '#000000' : this.ammoTypes[i].color};
                cursor: pointer;
                border-radius: 5px;
                font-size: 12px;
                text-align: center;
                min-width: 80px;
                transition: all 0.2s;
            `;
            
            bankButton.innerHTML = `
                <div style="font-weight: bold;">Bank ${i}</div>
                <div style="font-size: 10px;">${this.ammoTypes[i].name}</div>
                <div style="font-size: 10px;">${this.ammunitionBanks[i].length}/${this.maxAmmoPerBank}</div>
            `;
            
            bankButton.onclick = () => this.selectMathBank(i);
            mathBankDisplay.appendChild(bankButton);
        }
        
        this.updateSelectedBankInfo();
    }
    
    selectMathBank(bankNumber) {
        this.mathMode.targetBank = bankNumber;
        this.updateMathBankDisplay();
        this.generateMathProblem();
    }
    
    mathSelectNextBank() {
        if (this.mathMode.targetBank < 9) {
            this.selectMathBank(this.mathMode.targetBank + 1);
        }
    }
    
    mathSelectPrevBank() {
        if (this.mathMode.targetBank > 1) {
            this.selectMathBank(this.mathMode.targetBank - 1);
        }
    }
    
    updateSelectedBankInfo() {
        const selectedBankInfo = document.getElementById('selectedBankInfo');
        const ammoType = this.ammoTypes[this.mathMode.targetBank];
        const difficulty = this.getMathDifficultyText(this.mathMode.targetBank);
        selectedBankInfo.textContent = `Filling Bank ${this.mathMode.targetBank} - ${ammoType.name} (${difficulty} Math)`;
    }
    
    getMathDifficultyText(bankNumber) {
        if (bankNumber <= 2) return 'Easy';
        if (bankNumber <= 4) return 'Medium';
        if (bankNumber <= 6) return 'Hard';
        return 'Expert';
    }
    
    generateMathProblem() {
        const operations = ['+', '-', '*', '/'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        let a, b, answer;
        const maxNum = this.getMaxNumberForBank(this.mathMode.targetBank);
        
        switch (operation) {
            case '+':
                a = Math.floor(Math.random() * maxNum) + 1;
                b = Math.floor(Math.random() * maxNum) + 1;
                answer = a + b;
                break;
            case '-':
                a = Math.floor(Math.random() * maxNum) + 1;
                b = Math.floor(Math.random() * a) + 1;
                answer = a - b;
                break;
            case '*':
                a = Math.floor(Math.random() * Math.min(12, maxNum)) + 1;
                b = Math.floor(Math.random() * Math.min(12, maxNum)) + 1;
                answer = a * b;
                break;
            case '/':
                b = Math.floor(Math.random() * Math.min(12, maxNum)) + 2;
                answer = Math.floor(Math.random() * Math.min(12, maxNum)) + 1;
                a = b * answer;
                break;
        }
        
        this.mathMode.currentProblem = `${a} ${operation} ${b}`;
        this.mathMode.correctAnswer = answer;
        
        document.getElementById('mathProblem').textContent = this.mathMode.currentProblem + ' = ?';
    }
    
    getMaxNumberForBank(bankNumber) {
        // Map bank numbers to math difficulty ranges
        if (bankNumber <= 2) {
            return 10;  // Easy math for banks 1-2
        } else if (bankNumber <= 4) {
            return 50;  // Medium math for banks 3-4
        } else if (bankNumber <= 6) {
            return 100; // Hard math for banks 5-6
        } else {
            return 500; // Expert math for banks 7-9
        }
    }
    
    submitAnswer() {
        const userAnswer = parseInt(document.getElementById('mathAnswer').value);
        this.mathMode.totalCount++;
        
        if (userAnswer === this.mathMode.correctAnswer) {
            this.mathMode.correctCount++;
            this.addAmmunition();
            this.showMathFeedback(`Correct! +10 ${this.ammoTypes[this.mathMode.targetBank].name} Ammo (Bank ${this.mathMode.targetBank})`, this.ammoTypes[this.mathMode.targetBank].color);
        } else {
            this.showMathFeedback(`Wrong! Answer was ${this.mathMode.correctAnswer}`, '#ff0000');
        }
        
        this.updateMathStats();
        document.getElementById('mathAnswer').value = '';
        this.generateMathProblem();
        
        // Refocus on the answer input
        setTimeout(() => {
            document.getElementById('mathAnswer').focus();
        }, 100);
    }
    
    addAmmunition() {
        // Add 10 shots to the target bank
        const bank = this.ammunitionBanks[this.mathMode.targetBank];
        if (bank.length < this.maxAmmoPerBank) {
            const ammoType = this.ammoTypes[this.mathMode.targetBank];
            for (let i = 0; i < this.ammoPerProblem; i++) {
                if (bank.length < this.maxAmmoPerBank) {
                    bank.push(ammoType);
                }
            }
            this.updateAmmoDisplay();
            // Also update the math bank display if in math mode
            if (this.gameState === 'math') {
                this.updateMathBankDisplay();
            }
            // Auto-save user data
            this.saveUserData();
        }
    }
    
    showMathFeedback(message, color) {
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.color = color;
        feedback.style.position = 'absolute';
        feedback.style.top = '50%';
        feedback.style.left = '50%';
        feedback.style.transform = 'translate(-50%, -50%)';
        feedback.style.fontSize = '20px';
        feedback.style.zIndex = '30';
        feedback.style.pointerEvents = 'none';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 1000);
    }
    
    updateMathStats() {
        document.getElementById('correctCount').textContent = this.mathMode.correctCount;
        document.getElementById('totalCount').textContent = this.mathMode.totalCount;
        const accuracy = this.mathMode.totalCount > 0 ? 
            Math.round((this.mathMode.correctCount / this.mathMode.totalCount) * 100) : 0;
        document.getElementById('accuracy').textContent = accuracy + '%';
    }
    
    shoot() {
        if (this.gameState === 'playing') {
            const currentBank = this.ammunitionBanks[this.currentBank];
            
            // Check if we have ammo (bank 0 is infinite, others need ammo)
            if (this.currentBank === 0 || currentBank.length > 0) {
                const ammo = this.ammoTypes[this.currentBank];
                
                // Only consume ammo if not bank 0 (infinite)
                if (this.currentBank !== 0) {
                    currentBank.pop();
                }
                
                this.bullets.push({
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y,
                    width: 6 + (ammo.power * 2), // Bigger bullets for higher power
                    height: 12 + (ammo.power * 2),
                    speed: 8 + (ammo.power * 0.5), // Faster bullets for higher power
                    damage: ammo.damage,
                    color: ammo.color,
                    power: ammo.power
                });
                this.updateAmmoDisplay();
            } else {
                // Auto-downgrade to basic ammo if current bank is empty
                this.downgradeAmmo();
                this.shoot(); // Try shooting again with downgraded ammo
            }
        }
    }
    
    showOutOfAmmoMessage() {
        const message = document.createElement('div');
        message.textContent = `BANK ${this.currentBank} EMPTY! Press M for math mode or 1-9 to switch banks!`;
        message.style.position = 'absolute';
        message.style.top = '60px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.color = '#ff0000';
        message.style.fontSize = '16px';
        message.style.zIndex = '30';
        message.style.pointerEvents = 'none';
        message.style.textShadow = '0 0 10px #ff0000';
        message.style.animation = 'blink 0.5s infinite alternate';
        
        // Add blinking animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                from { opacity: 1; }
                to { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 2000);
    }
    
    spawnEnemy() {
        const enemyTypes = [
            { size: 30, shield: 2, speed: 1, color: '#ff0000' },
            { size: 40, shield: 3, speed: 0.8, color: '#ff8800' },
            { size: 50, shield: 5, speed: 0.6, color: '#8800ff' }
        ];
        
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        this.enemies.push({
            x: Math.random() * (this.width - type.size),
            y: -type.size,
            width: type.size,
            height: type.size,
            speed: type.speed,
            color: type.color,
            shield: type.shield,
            maxShield: type.shield,
            fleeing: false
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update player
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > 0;
        });
        
        // Spawn enemies
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer >= this.enemySpawnRate) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.fleeing) {
                // Move to sides
                if (enemy.x < this.width / 2) {
                    enemy.x -= enemy.speed * 2;
                } else {
                    enemy.x += enemy.speed * 2;
                }
                return enemy.x > -enemy.width && enemy.x < this.width + enemy.width;
            } else {
                enemy.y += enemy.speed;
                return enemy.y < this.height + enemy.height;
            }
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
        
        // Update explosions
        this.explosions = this.explosions.filter(explosion => {
            explosion.life--;
            return explosion.life > 0;
        });
        
        // Check if enemy reached bottom
        this.enemies.forEach(enemy => {
            if (!enemy.fleeing && enemy.y + enemy.height >= this.height) {
                this.playerEscapes();
            }
        });
    }
    
    checkCollisions() {
        // Bullet vs Enemy collisions
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (!enemy.fleeing && 
                    bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    
                    // Hit!
                    enemy.shield -= bullet.damage;
                    this.bullets.splice(bulletIndex, 1);
                    
        if (enemy.shield <= 0) {
            // Shield down, enemy flees
            enemy.fleeing = true;
            this.score += 100;
            this.enemiesDestroyed++;
            this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            this.checkLevelComplete();
            // Auto-save user data
            this.saveUserData();
        }
                }
            });
        });
    }
    
    playerEscapes() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset player position
            this.player.x = this.width / 2;
            this.player.y = this.height - 60;
            
            // Clear enemies
            this.enemies = [];
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        alert(`Game Over! Final Score: ${this.score}`);
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.bullets = [];
        this.enemies = [];
        this.enemiesDestroyed = 0;
        this.levelEnemyTarget = 5;
        this.particles = [];
        this.explosions = [];
        this.clearAllAmmunition();
        this.updateUI();
        this.gameState = 'playing';
    }
    
    checkLevelComplete() {
        if (this.enemiesDestroyed >= this.levelEnemyTarget) {
            this.level++;
            this.enemiesDestroyed = 0;
            this.levelEnemyTarget += 2; // Increase difficulty
            this.enemySpawnRate = Math.max(60, this.enemySpawnRate - 10); // Faster spawning
            this.updateUI();
            this.showLevelUp();
        }
    }
    
    showLevelUp() {
        const levelUp = document.createElement('div');
        levelUp.textContent = `LEVEL ${this.level}!`;
        levelUp.style.position = 'absolute';
        levelUp.style.top = '50%';
        levelUp.style.left = '50%';
        levelUp.style.transform = 'translate(-50%, -50%)';
        levelUp.style.fontSize = '48px';
        levelUp.style.color = '#00ff00';
        levelUp.style.zIndex = '30';
        levelUp.style.pointerEvents = 'none';
        levelUp.style.textShadow = '0 0 20px #00ff00';
        
        document.body.appendChild(levelUp);
        
        setTimeout(() => {
            document.body.removeChild(levelUp);
        }, 2000);
    }
    
    createExplosion(x, y) {
        this.explosions.push({
            x: x,
            y: y,
            life: 30,
            maxLife: 30,
            particles: []
        });
        
        // Create particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                color: `hsl(${Math.random() * 60 + 20}, 100%, 50%)`
            });
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars
        this.drawStars();
        
        if (this.gameState === 'playing' || this.gameState === 'math') {
            // Draw player
            this.drawPlayer();
            
            // Draw bullets
            this.bullets.forEach(bullet => {
                this.ctx.fillStyle = bullet.color;
                this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            });
            
            // Draw enemies
            this.enemies.forEach(enemy => {
                this.drawEnemy(enemy);
            });
            
            // Draw particles
            this.particles.forEach(particle => {
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(particle.x, particle.y, 2, 2);
            });
            
            // Draw explosions
            this.explosions.forEach(explosion => {
                const alpha = explosion.life / explosion.maxLife;
                this.ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(explosion.x, explosion.y, (1 - alpha) * 30, 0, 2 * Math.PI);
                this.ctx.fill();
            });
        }
    }
    
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 7) % this.width;
            const y = (i * 11) % this.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    drawPlayer() {
        const x = this.player.x;
        const y = this.player.y;
        const w = this.player.width;
        const h = this.player.height;
        
        // Draw spaceship body (plane-like shape)
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.moveTo(x + w/2, y); // Nose
        this.ctx.lineTo(x + w, y + h/2); // Right wing
        this.ctx.lineTo(x + w*0.8, y + h); // Right back
        this.ctx.lineTo(x + w*0.2, y + h); // Left back
        this.ctx.lineTo(x, y + h/2); // Left wing
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw cockpit
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x + w/2, y + h/2, w/6, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw current ammo laser blaster
        const ammoType = this.ammoTypes[this.currentBank];
        this.ctx.fillStyle = ammoType.color;
        this.ctx.fillRect(x + w/2 - 2, y - 8, 4, 8);
        
        // Draw ammo glow effect
        this.ctx.shadowColor = ammoType.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(x + w/2 - 1, y - 6, 2, 6);
        this.ctx.shadowBlur = 0;
    }
    
    drawEnemy(enemy) {
        // Draw shield bubble
        if (enemy.shield > 0) {
            this.ctx.strokeStyle = enemy.color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(
                enemy.x + enemy.width / 2, 
                enemy.y + enemy.height / 2, 
                enemy.width / 2 + 10, 
                0, 
                2 * Math.PI
            );
            this.ctx.stroke();
            
            // Shield strength indicator
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x - 5, enemy.y - 15, enemy.shield * 4, 3);
        }
        
        // Draw enemy ship
        this.ctx.fillStyle = enemy.fleeing ? '#888888' : enemy.color;
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw enemy details
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, 3);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Global functions for HTML buttons
function submitAnswer() {
    game.submitAnswer();
}

function exitMathMode() {
    game.exitMathMode();
}

// Removed changeTargetBank function - now using clickable bank buttons

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        game.showLoginMessage('Please enter both username and password', '#ff0000');
        return;
    }
    
    await game.login(username, password);
}

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        game.showLoginMessage('Please enter both username and password', '#ff0000');
        return;
    }
    
    await game.register(username, password);
}

function logout() {
    game.logout();
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    game.gameState = 'playing';
}

// Start the game
const game = new SpaceshipGame();
