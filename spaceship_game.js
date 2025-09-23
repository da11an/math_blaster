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
        this.userSettings = { ammo_persistence: true };
        this.apiBaseUrl = 'http://localhost:8001/api';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // Player spaceship
        this.player = {
            x: this.width / 2,
            y: this.height - 60,
            width: 60,  // 50% larger (was 40)
            height: 45, // 50% larger (was 30)
            speed: 5,
            color: '#00ff00',
            colorway: 'blue' // Default colorway
        };
        
        // Ammunition system - 9 banks with different power levels
        this.ammunitionBanks = [];
        this.maxAmmoPerBank = 1000;
        this.ammoPerProblem = 10;
        
        // Initialize 10 ammunition banks with increasing power (0-9)
        this.ammoTypes = [
            { power: 0, color: '#666666', damage: 1, name: 'Pulse', infinite: true, splashRadius: 0 },    // Bank 0 - Infinite
            { power: 1, color: '#00ff00', damage: 2, name: 'Heavy Pulse', splashRadius: 10 },   // Bank 1
            { power: 2, color: '#88ff00', damage: 3, name: 'Laser', splashRadius: 20 },   // Bank 2
            { power: 3, color: '#ffff00', damage: 4, name: 'Heavy Laser', splashRadius: 40 },   // Bank 3
            { power: 4, color: '#ffaa00', damage: 5, name: 'Blaster', splashRadius: 70 },   // Bank 4
            { power: 5, color: '#ff8800', damage: 8, name: 'Heavy Blaster', splashRadius: 100 },      // Bank 5
            { power: 6, color: '#ff4400', damage: 12, name: 'Cannon', splashRadius: 150 },    // Bank 6
            { power: 7, color: '#ff0000', damage: 18, name: 'Heavy Cannon', splashRadius: 200 }, // Bank 7
            { power: 8, color: '#ff00ff', damage: 25, name: 'Destroyer', splashRadius: 250 },  // Bank 8
            { power: 9, color: '#ffffff', damage: 35, name: 'Heavy Destroyer', splashRadius: 300 }     // Bank 9
        ];
        
        // Initialize ammunition banks (0-9, so 10 banks total)
        for (let i = 0; i < 10; i++) {
            this.ammunitionBanks.push([]);
        }
        
        // Current bank selection (start with basic infinite ammo)
        this.currentBank = 0;
        
        // Gun pulse effect
        this.gunPulseTime = 0;
        this.gunPulseDuration = 200; // milliseconds
        
        // Ship colorways
        this.shipColorways = {
            'blue': {
                main: '#4a90e2',
                wing: '#2e5c8a',
                trim: '#87ceeb',
                cockpit: '#87ceeb',
                highlight: '#ffffff',
                engine: '#00ffff'
            },
            'red': {
                main: '#e24a4a',
                wing: '#8a2e2e',
                trim: '#eb8787',
                cockpit: '#eb8787',
                highlight: '#ffffff',
                engine: '#ff4444'
            },
            'green': {
                main: '#4ae24a',
                wing: '#2e8a2e',
                trim: '#87eb87',
                cockpit: '#87eb87',
                highlight: '#ffffff',
                engine: '#44ff44'
            },
            'purple': {
                main: '#8a4ae2',
                wing: '#5a2e8a',
                trim: '#b787eb',
                cockpit: '#b787eb',
                highlight: '#ffffff',
                engine: '#8844ff'
            },
            'orange': {
                main: '#e28a4a',
                wing: '#8a5a2e',
                trim: '#ebb787',
                cockpit: '#ebb787',
                highlight: '#ffffff',
                engine: '#ff8844'
            }
        };
        
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
            targetBank: 1,
            currentLevel: 1,
            levelName: 'Easy',
            problemLog: [], // Store recent problems for logging
            problemStartTime: null // Track when problem was generated
        };
        
        // Available math generators
        this.availableGenerators = [];
        this.selectedGenerator = 'mental'; // Default generator
        this.mathProblemGenerationInProgress = false; // Prevent multiple simultaneous calls
        
        // Visual effects
        this.particles = [];
        this.explosions = [];
        this.splashEffects = []; // For splash damage visual effects
        
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
        this.drawAmmoBanks(); // Initialize ammo banks display
        this.gameLoop();
    }
    
    async login(username, password, colorway = null) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, colorway })
            });
            
            const data = await response.json();
            console.log('API response:', data);
            
            if (data.success) {
                console.log('Login successful, setting up user...');
                this.currentUser = username;
                
                // Use selected colorway if provided, otherwise use saved colorway
                if (colorway) {
                    this.player.colorway = colorway;
                }
                
                try {
                    this.loadUserData(data.user_data);
                    console.log('loadUserData() completed');
                } catch (error) {
                    console.error('Error in loadUserData():', error);
                }
                console.log('About to show login message');
                this.showLoginMessage('Login successful!', '#00ff00');
                console.log('Login message shown');
                
                // Show logout button
                console.log('About to show logout button');
                document.getElementById('logoutBtn').style.display = 'inline-block';
                console.log('Logout button shown');
                
                console.log('About to call showStartScreen()');
                try {
                    this.showStartScreen();
                    console.log('showStartScreen() returned, login method returning true');
                    return true;
                } catch (error) {
                    console.error('Error in showStartScreen():', error);
                    return false;
                }
            } else {
                console.log('Login failed:', data.message);
                this.showLoginMessage(data.message, '#ff0000');
                return false;
            }
        } catch (error) {
            this.showLoginMessage('Connection error. Make sure API server is running.', '#ff0000');
            return false;
        }
    }
    
    async register(username, password, colorway = 'blue') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, colorway })
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
        // Load ship colorway
        if (userData.colorway) {
            this.player.colorway = userData.colorway;
        }
        
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
        
        // Load user settings
        if (userData.settings) {
            this.userSettings = { ...this.userSettings, ...userData.settings };
        }
        
        this.updateAmmoDisplay();
        this.updateUI();
        this.updateSettingsUI();
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
                    ammunition_banks: banks,
                    colorway: this.player.colorway
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
    
    async saveUserSettings() {
        if (!this.currentUser) return;
        
        try {
            await fetch(`${this.apiBaseUrl}/save_settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: this.currentUser,
                    settings: this.userSettings
                })
            });
        } catch (error) {
            console.error('Failed to save user settings:', error);
        }
    }
    
    showLoginMessage(message, color) {
        const messageDiv = document.getElementById('loginMessage');
        messageDiv.textContent = message;
        messageDiv.style.color = color;
    }
    
    showStartScreen() {
        console.log('showStartScreen() called');
        this.gameState = 'menu';
        console.log('Game state set to:', this.gameState);
        
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'block';
        console.log('UI screens updated');
        
        document.getElementById('currentUser').textContent = this.currentUser;
        console.log('Current user set to:', this.currentUser);
        
        this.updateSettingsUI();
        this.updateUI();
        console.log('showStartScreen() completed');
    }
    
    updateSettingsUI() {
        const toggle = document.getElementById('ammoPersistenceToggle');
        if (toggle) {
            toggle.checked = this.userSettings.ammo_persistence;
        }
    }
    
    toggleAmmoPersistence() {
        this.userSettings.ammo_persistence = !this.userSettings.ammo_persistence;
        this.updateSettingsUI();
        this.saveUserSettings();
    }
    
    logout() {
        console.log('logout() called');
        // Save current user data before logging out
        if (this.currentUser) {
            console.log('Saving user data for:', this.currentUser);
            this.saveUserData();
        }
        
        // Stop the game loop by setting game state to login
        this.gameState = 'login';
        this.currentUser = null;
        console.log('Game state set to login, currentUser cleared');
        
        // Clear all game objects
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.explosions = [];
        this.splashEffects = [];
        
        // Reset game counters and stats
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.enemiesDestroyed = 0;
        this.enemySpawnTimer = 0;
        
        // Reset math mode
        this.mathMode.active = false;
        this.mathMode.correctCount = 0;
        this.mathMode.totalCount = 0;
        this.mathMode.problemLog = [];
        this.mathMode.problemStartTime = null;
        
        // Reset player position
        this.player.x = this.width / 2 - this.player.width / 2;
        this.player.y = this.height - this.player.height - 10;
        
        // Clear ammunition
        this.clearAllAmmunition();
        
        // Hide all screens except login
        console.log('Hiding all screens except login');
        
        // Hide screens with error handling
        const startScreen = document.getElementById('startScreen');
        if (startScreen) startScreen.style.display = 'none';
        
        const mathMode = document.getElementById('mathMode');
        if (mathMode) {
            mathMode.style.display = 'none';
            console.log('Math mode screen hidden');
        } else {
            console.log('Math mode screen not found');
        }
        
        const gameOver = document.getElementById('gameOver');
        if (gameOver) gameOver.style.display = 'none';
        
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'block';
            console.log('Login screen should now be visible');
        } else {
            console.log('Login screen not found!');
        }
        
        // Hide logout button
        console.log('Hiding logout button');
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
            console.log('Logout button hidden');
        } else {
            console.log('Logout button not found');
        }
        
        // Clear login form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        this.showLoginMessage('Logged out successfully', '#00ff00');
        
        // Update UI elements
        document.getElementById('currentUser').textContent = 'Guest';
        this.updateUI();
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Focus on username field for immediate login
        setTimeout(() => {
            document.getElementById('username').focus();
            console.log('Username field focused, logout complete');
        }, 100);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyM' && this.gameState !== 'login') {
                e.preventDefault();
                this.toggleMathMode();
            } else if (e.code === 'Escape' && this.currentUser) {
                e.preventDefault();
                this.logout();
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
        this.splashEffects = []; // Clear any active splash effects
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
        // Update the new ammo banks display instead of the old one
        this.drawAmmoBanks();
    }
    
    async toggleMathMode() {
        if (this.gameState === 'playing') {
            this.gameState = 'math';
            this.mathMode.active = true;
            this.mathMode.targetBank = 1; // Default to bank 1
            this.updateMathBankDisplay();
            this.updateMathLog(); // Initialize the log display
            await this.loadMathGenerators(); // Load available generators
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
    
    async loadMathGenerators() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/generators`);
            const data = await response.json();
            
            if (data.success) {
                const select = document.getElementById('mathGeneratorSelect');
                const description = document.getElementById('generatorDescription');
                
                // Clear existing options
                select.innerHTML = '';
                
                // Add options for each generator
                data.generators.forEach(generator => {
                    const option = document.createElement('option');
                    option.value = generator.type;
                    option.textContent = generator.name;
                    select.appendChild(option);
                });
                
                // Store generators and set default selection
                this.availableGenerators = data.generators;
                
                if (data.generators.length > 0) {
                    const defaultGen = data.generators[0];
                    select.value = defaultGen.type;
                    description.textContent = defaultGen.description;
                    this.selectedGenerator = defaultGen.type;
                    console.log('🎯 Initial generator set to:', this.selectedGenerator);
                }
                
                // Remove existing event listeners and add new one
                const newSelect = select.cloneNode(true);
                select.parentNode.replaceChild(newSelect, select);
                
                // Add change event listener to update description and regenerate problem
                newSelect.addEventListener('change', (e) => {
                    const selectedGen = data.generators.find(g => g.type === e.target.value);
                    if (selectedGen) {
                        console.log('🔄 Generator changed to:', selectedGen.type);
                        description.textContent = selectedGen.description;
                        this.selectedGenerator = selectedGen.type;
                        console.log('Updated selectedGenerator to:', this.selectedGenerator);
                        // Regenerate problem with new generator
                        this.generateMathProblem();
                    }
                });
                
                console.log('Generators loaded successfully:', data.generators);
                return data.generators;
                
            } else {
                console.error('Failed to load generators:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error loading generators:', error);
            return [];
        }
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
        this.updateMathLog(); // Update log when switching banks
        this.generateMathProblem(); // Generate new problem with current generator selection
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
        // Map bank numbers to mental math level names
        if (bankNumber <= 2) return 'Easy';
        if (bankNumber <= 4) return 'Medium';
        if (bankNumber <= 6) return 'Hard';
        if (bankNumber <= 8) return 'Expert';
        return 'Master';
    }
    
    async generateMathProblem() {
        // Prevent multiple simultaneous calls
        if (this.mathProblemGenerationInProgress) {
            console.log('⏸️ Math problem generation already in progress, skipping duplicate call');
            return;
        }
        
        this.mathProblemGenerationInProgress = true;
        
        try {
            // Record the start time for this problem
            this.mathMode.problemStartTime = Date.now();
            
            const selectedGenerator = this.selectedGenerator || 'mental'; // Use stored generator or fallback
            const mathLevel = this.getMathLevelForBank(this.mathMode.targetBank, selectedGenerator);
            const callId = Math.random().toString(36).substr(2, 9); // Unique ID for this call
            
            console.log(`🚀 [${callId}] Generating math problem:`, { level: mathLevel, generator_type: selectedGenerator });
            console.log(`📊 [${callId}] Selected generator from property:`, this.selectedGenerator);
            console.log(`📋 [${callId}] Available generators:`, this.availableGenerators);
            
            const response = await fetch(`${this.apiBaseUrl}/generate_math_problem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    level: mathLevel,
                    generator_type: selectedGenerator
                })
            });
            
            const data = await response.json();
            
            console.log(`📥 [${callId}] API Response:`, data);
            console.log(`📊 [${callId}] Response status:`, response.status);
            
            if (data.success) {
                console.log(`✅ [${callId}] Using API-generated problem:`, data.problem.question);
                this.mathMode.currentProblem = data.problem.question;
                this.mathMode.correctAnswer = data.problem.answer;
                this.mathMode.currentLevel = data.problem.level;
                this.mathMode.levelName = data.problem.level_name;
                
                console.log(`📝 [${callId}] Setting problem display to:`, this.mathMode.currentProblem);
                document.getElementById('mathProblem').textContent = this.mathMode.currentProblem + ' = ?';
                // Clear any previous result
                document.getElementById('mathResult').style.display = 'none';
                console.log(`🎯 [${callId}] API problem successfully displayed`);
            } else {
                console.error(`❌ [${callId}] Failed to generate math problem:`, data.message);
                console.log(`🔄 [${callId}] Falling back to simple math generation`);
                // Fallback to simple generation
                this.generateSimpleMathProblem();
            }
        } catch (error) {
            console.error(`💥 [${callId}] Error generating math problem:`, error);
            // Fallback to simple generation
            this.generateSimpleMathProblem();
        } finally {
            // Always reset the flag when done
            this.mathProblemGenerationInProgress = false;
        }
    }
    
    generateSimpleMathProblem() {
        const fallbackId = Math.random().toString(36).substr(2, 9);
        console.log(`🔄 [${fallbackId}] FALLBACK: Generating simple math problem locally`);
        
        // Check if we already have a problem from API (prevent overwriting)
        if (this.mathMode.currentProblem && (this.mathMode.currentProblem.includes('×') || this.mathMode.currentProblem.includes('÷'))) {
            console.log(`⚠️ [${fallbackId}] SKIPPING FALLBACK: API problem already exists with proper symbols:`, this.mathMode.currentProblem);
            return;
        }
        
        // Record the start time for this problem
        this.mathMode.problemStartTime = Date.now();
        
        // Fallback simple math generation (original logic)
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
        
        console.log(`📝 [${fallbackId}] Setting problem display to:`, this.mathMode.currentProblem);
        document.getElementById('mathProblem').textContent = this.mathMode.currentProblem + ' = ?';
        // Clear any previous result
        document.getElementById('mathResult').style.display = 'none';
    }
    
    getMaxNumberForBank(bankNumber) {
        // Fallback method for simple math generation
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
    
    getMathLevelForBank(bankNumber, generatorType = 'mental') {
        // Map bank numbers to appropriate math difficulty levels based on generator
        if (generatorType === 'simple') {
            // Simple math generator has 4 levels (1-4)
            if (bankNumber <= 2) {
                return 1;  // Easy math for banks 1-2
            } else if (bankNumber <= 4) {
                return 2;  // Medium math for banks 3-4
            } else if (bankNumber <= 6) {
                return 3;  // Hard math for banks 5-6
            } else {
                return 4;  // Expert math for banks 7-9
            }
        } else if (generatorType === 'fact_ladder') {
            // Fact ladder generator has 9 levels (1-9)
            if (bankNumber <= 1) {
                return 1;  // Basic addition for bank 1
            } else if (bankNumber <= 2) {
                return 2;  // Basic subtraction for bank 2
            } else if (bankNumber <= 3) {
                return 3;  // Advanced addition for bank 3
            } else if (bankNumber <= 4) {
                return 4;  // Advanced subtraction for bank 4
            } else if (bankNumber <= 5) {
                return 5;  // Basic multiplication for bank 5
            } else if (bankNumber <= 6) {
                return 6;  // Basic division for bank 6
            } else if (bankNumber <= 7) {
                return 7;  // Advanced multiplication for bank 7
            } else if (bankNumber <= 8) {
                return 8;  // Advanced division for bank 8
            } else {
                return 9;  // Two-step problems for bank 9
            }
        } else {
            // Mental math generator has 10 levels (1-10)
            if (bankNumber <= 2) {
                return 1;  // Easy math for banks 1-2
            } else if (bankNumber <= 4) {
                return 3;  // Medium math for banks 3-4
            } else if (bankNumber <= 6) {
                return 5;  // Hard math for banks 5-6
            } else if (bankNumber <= 8) {
                return 7;  // Expert math for banks 7-8
            } else {
                return 9;  // Master math for banks 9 (highest level)
            }
        }
    }
    
    submitAnswer() {
        const userAnswer = parseInt(document.getElementById('mathAnswer').value);
        this.mathMode.totalCount++;
        
        const isCorrect = userAnswer === this.mathMode.correctAnswer;
        
        // Calculate reward amount for display
        const rewardAmount = isCorrect ? this.calculateHalfLifeReward() : 0;
        
        // Log the problem result
        this.logMathProblem(this.mathMode.currentProblem, userAnswer, this.mathMode.correctAnswer, isCorrect, rewardAmount);
        
        if (isCorrect) {
            this.mathMode.correctCount++;
            this.addAmmunition();
            
            // Show reward feedback
            this.showMathFeedback(`+${rewardAmount} ammo!`, '#00ff00');
        } else {
            this.showMathFeedback('Incorrect!', '#ff4444');
        }
        
        this.updateMathStats();
        
        // Generate new problem immediately
        this.generateMathProblem();
        // Clear the input and refocus
        document.getElementById('mathAnswer').value = '';
        setTimeout(() => {
            document.getElementById('mathAnswer').focus();
        }, 100);
    }
    
    calculateHalfLifeReward() {
        if (!this.mathMode.problemStartTime) {
            return 10; // Fallback to minimum amount
        }
        
        const responseTime = (Date.now() - this.mathMode.problemStartTime) / 1000; // Convert to seconds
        const halfLife = 1; // X second half-life
        const initialReward = 100;
        const minReward = 10;
        
        // Calculate reward using half-life formula: initial * (0.5)^(time/halfLife)
        const reward = Math.max(minReward, Math.round(initialReward * Math.pow(0.5, responseTime / halfLife)));
        
        return reward;
    }

    addAmmunition() {
        // Calculate reward based on response time (half-life system)
        const rewardAmount = this.calculateHalfLifeReward();
        
        // Add calculated shots to the target bank
        const bank = this.ammunitionBanks[this.mathMode.targetBank];
        if (bank.length < this.maxAmmoPerBank) {
            const ammoType = this.ammoTypes[this.mathMode.targetBank];
            const shotsToAdd = Math.min(rewardAmount, this.maxAmmoPerBank - bank.length);
            
            for (let i = 0; i < shotsToAdd; i++) {
                bank.push(ammoType);
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
    
    logMathProblem(problem, userAnswer, correctAnswer, isCorrect, rewardAmount = 0) {
        // Add to problem log (keep only last 6)
        this.mathMode.problemLog.unshift({
            problem: problem,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            rewardAmount: rewardAmount,
            timestamp: new Date()
        });
        
        // Keep only last 6 problems
        if (this.mathMode.problemLog.length > 6) {
            this.mathMode.problemLog = this.mathMode.problemLog.slice(0, 6);
        }
    
        // Update the log display
        this.updateMathLog();
    }
    
    updateMathLog() {
        const logDiv = document.getElementById('mathLog');
        if (!logDiv) return;
        
        if (this.mathMode.problemLog.length === 0) {
            logDiv.innerHTML = '<div style="color: #666; text-align: center; font-style: italic;">No problems yet</div>';
            return;
        }
        
        let logHTML = '';
        this.mathMode.problemLog.forEach((entry, index) => {
            const timeAgo = this.getTimeAgo(entry.timestamp);
            const statusIcon = entry.isCorrect ? '✅' : '❌';
            const statusColor = entry.isCorrect ? '#00ff00' : '#ff4444';
            const ammoReward = entry.isCorrect ? `+${entry.rewardAmount} ${this.ammoTypes[this.mathMode.targetBank].name}` : '';
            
            logHTML += `
                <div style="margin-bottom: 8px; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; border-left: 3px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                        <span style="color: ${statusColor}; font-weight: bold;">${statusIcon}</span>
                        <span style="color: #888; font-size: 10px;">${timeAgo}</span>
                    </div>
                    <div style="color: #fff; font-weight: bold; margin-bottom: 2px;">${entry.problem} = ?</div>
                    <div style="color: #ccc; font-size: 11px;">
                        You: <span style="color: ${statusColor};">${entry.userAnswer}</span>
                        ${!entry.isCorrect ? ` | Correct: ${entry.correctAnswer}` : ''}
                        ${ammoReward ? ` | ${ammoReward}` : ''}
                    </div>
                </div>
            `;
        });
        
        logDiv.innerHTML = logHTML;
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
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
                    x: this.player.x + this.player.width / 2 - (6 + ammo.power * 2) / 2, // Center bullet
                    y: this.player.y,
                    width: 6 + (ammo.power * 2), // Bigger bullets for higher power
                    height: 12 + (ammo.power * 2),
                    speed: 8 + (ammo.power * 0.5), // Faster bullets for higher power
                    damage: ammo.damage,
                    color: ammo.color,
                    power: ammo.power,
                    bankNumber: this.currentBank // Add bank number for splash damage
                });
                
                // Trigger gun pulse effect
                this.gunPulseTime = Date.now();
                
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
        // Get available enemy types based on level
        const availableTypes = this.getAvailableEnemyTypes();
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        this.enemies.push({
            x: Math.random() * (this.width - type.size),
            y: -type.size,
            width: type.size,
            height: type.size,
            speed: type.speed,
            color: type.color,
            shield: type.shield,
            maxShield: type.shield,
            fleeing: false,
            personality: type.personality,
            name: type.name,
            behavior: type.behavior,
            behaviorTimer: 0,
            originalX: 0,
            sideDirection: Math.random() > 0.5 ? 1 : -1,
            spiralAngle: 0
        });
    }
    
    getAvailableEnemyTypes() {
        const allTypes = [
            // Level 1-2: Basic enemies (easy to destroy)
            { 
                size: 25, 
                shield: 1, 
                speed: 0.8, 
                color: '#ff6666',
                personality: 'basic',
                name: 'Scout',
                behavior: 'straight_down',
                minLevel: 1
            },
            { 
                size: 30, 
                shield: 1, 
                speed: 0.6, 
                color: '#66ff66',
                personality: 'basic',
                name: 'Patrol',
                behavior: 'straight_down',
                minLevel: 1
            },
            
            // Level 3-4: Slightly tougher
            { 
                size: 35, 
                shield: 2, 
                speed: 0.7, 
                color: '#6666ff',
                personality: 'defensive',
                name: 'Guardian',
                behavior: 'straight_down',
                minLevel: 3
            },
            { 
                size: 40, 
                shield: 2, 
                speed: 0.5, 
                color: '#ffff66',
                personality: 'defensive',
                name: 'Sentinel',
                behavior: 'straight_down',
                minLevel: 3
            },
            
            // Level 5-6: Start moving patterns
            { 
                size: 30, 
                shield: 3, 
                speed: 0.9, 
                color: '#ff6666',
                personality: 'agile',
                name: 'Interceptor',
                behavior: 'zigzag',
                minLevel: 5
            },
            { 
                size: 35, 
                shield: 3, 
                speed: 0.8, 
                color: '#66ffff',
                personality: 'agile',
                name: 'Swift',
                behavior: 'side_to_side',
                minLevel: 5
            },
            
            // Level 7-8: Advanced patterns
            { 
                size: 40, 
                shield: 4, 
                speed: 0.7, 
                color: '#ff66ff',
                personality: 'aggressive',
                name: 'Hunter',
                behavior: 'dive_bomb',
                minLevel: 7
            },
            { 
                size: 45, 
                shield: 5, 
                speed: 0.6, 
                color: '#ffaa66',
                personality: 'tank',
                name: 'Destroyer',
                behavior: 'straight_down',
                minLevel: 7
            },
            
            // Level 9+: Boss-level enemies
            { 
                size: 50, 
                shield: 6, 
                speed: 0.5, 
                color: '#aa66ff',
                personality: 'boss',
                name: 'Warlord',
                behavior: 'spiral',
                minLevel: 9
            },
            { 
                size: 55, 
                shield: 7, 
                speed: 0.4, 
                color: '#ffaa00',
                personality: 'boss',
                name: 'Titan',
                behavior: 'complex_pattern',
                minLevel: 9
            }
        ];
        
        // Filter types available at current level
        return allTypes.filter(type => this.level >= type.minLevel);
    }
    
    updateEnemyBehavior(enemy) {
        enemy.behaviorTimer++;
        
        switch (enemy.behavior) {
            case 'straight_down':
                // Basic enemies: Just move straight down (no horizontal movement)
                break;
                
            case 'zigzag':
                // Agile enemies: Zigzag pattern
                if (enemy.behaviorTimer % 60 < 30) {
                    enemy.x += enemy.speed * 0.3;
                } else {
                    enemy.x -= enemy.speed * 0.3;
                }
                break;
                
            case 'side_to_side':
                // Agile enemies: Side to side movement
                enemy.x += Math.sin(enemy.behaviorTimer * 0.1) * enemy.speed * 0.4;
                break;
                
            case 'dive_bomb':
                // Aggressive enemies: Dive toward player
                if (enemy.behaviorTimer > 30) {
                    const playerCenterX = this.player.x + this.player.width / 2;
                    const enemyCenterX = enemy.x + enemy.width / 2;
                    const direction = playerCenterX > enemyCenterX ? 1 : -1;
                    enemy.x += direction * enemy.speed * 0.5;
                }
                break;
                
            case 'spiral':
                // Boss enemies: Spiral pattern
                enemy.spiralAngle += 0.1;
                enemy.x += Math.cos(enemy.spiralAngle) * enemy.speed * 0.3;
                break;
                
            case 'complex_pattern':
                // Boss enemies: Complex movement pattern
                const wave1 = Math.sin(enemy.behaviorTimer * 0.05) * 2;
                const wave2 = Math.cos(enemy.behaviorTimer * 0.08) * 1.5;
                enemy.x += (wave1 + wave2) * enemy.speed * 0.2;
                break;
        }
        
        // Keep enemies within bounds
        enemy.x = Math.max(0, Math.min(this.width - enemy.width, enemy.x));
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update player
        if ((this.keys['ArrowLeft'] || this.keys['KeyJ']) && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if ((this.keys['ArrowRight'] || this.keys['KeyL']) && this.player.x < this.width - this.player.width) {
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
        
        // Update enemies with personality-based movement
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
                // Apply personality-based movement
                this.updateEnemyBehavior(enemy);
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
        
        // Update splash effects
        this.splashEffects = this.splashEffects.filter(splash => {
            splash.life--;
            splash.radius = splash.maxRadius * (1 - splash.life / splash.maxLife);
            return splash.life > 0;
        });
        
        // Check if enemy reached bottom
        this.enemies.forEach(enemy => {
            if (!enemy.fleeing && enemy.y + enemy.height >= this.height) {
                this.playerEscapes();
            }
        });
    }
    
    checkCollisions() {
        // Bullet vs Enemy collisions with splash damage
        this.bullets.forEach((bullet, bulletIndex) => {
            let hitEnemy = null;
            let hitEnemyIndex = -1;
            
            // Find direct hit
            this.enemies.forEach((enemy, enemyIndex) => {
                if (!enemy.fleeing && 
                    bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    
                    hitEnemy = enemy;
                    hitEnemyIndex = enemyIndex;
                }
            });
            
            if (hitEnemy) {
                // Process splash damage
                this.processSplashDamage(bullet, hitEnemy, hitEnemyIndex);
                this.bullets.splice(bulletIndex, 1);
            }
        });
    }
    
    processSplashDamage(bullet, primaryEnemy, primaryEnemyIndex) {
        const ammoType = this.ammoTypes[bullet.bankNumber];
        const splashRadius = ammoType.splashRadius;
        
        if (splashRadius > 0) {
            // Create splash effect
            this.createSplashEffect(bullet.x + bullet.width/2, bullet.y + bullet.height/2, splashRadius, ammoType.color);
            
            // Calculate damage to primary target
            const primaryDamage = Math.min(bullet.damage, primaryEnemy.shield);
            primaryEnemy.shield -= primaryDamage;
            let remainingDamage = bullet.damage - primaryDamage;
            
            // Find enemies within splash radius
            const enemiesInRadius = [];
            this.enemies.forEach((enemy, enemyIndex) => {
                if (enemyIndex !== primaryEnemyIndex && !enemy.fleeing) {
                    const dx = (bullet.x + bullet.width/2) - (enemy.x + enemy.width/2);
                    const dy = (bullet.y + bullet.height/2) - (enemy.y + enemy.height/2);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= splashRadius) {
                        enemiesInRadius.push({ enemy, enemyIndex, distance });
                    }
                }
            });
            
            // Sort by distance (closest first)
            enemiesInRadius.sort((a, b) => a.distance - b.distance);
            
            // Distribute remaining damage
            enemiesInRadius.forEach(({ enemy, enemyIndex }) => {
                if (remainingDamage > 0) {
                    const splashDamage = Math.min(remainingDamage, enemy.shield);
                    enemy.shield -= splashDamage;
                    remainingDamage -= splashDamage;
                    
                    // Create smaller explosion for splash hits
                    this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 0.5);
                }
            });
        } else {
            // No splash damage, just direct hit
            primaryEnemy.shield -= bullet.damage;
        }
        
        // Check if primary enemy is destroyed
        if (primaryEnemy.shield <= 0) {
            primaryEnemy.fleeing = true;
            this.score += 100;
            this.enemiesDestroyed++;
            this.createExplosion(primaryEnemy.x + primaryEnemy.width/2, primaryEnemy.y + primaryEnemy.height/2);
            this.checkLevelComplete();
            this.saveUserData();
        }
        
        // Check all enemies for destruction (including splash targets)
        this.enemies.forEach((enemy, enemyIndex) => {
            if (enemy.shield <= 0 && !enemy.fleeing) {
                enemy.fleeing = true;
                this.score += 100;
                this.enemiesDestroyed++;
                this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                this.checkLevelComplete();
                this.saveUserData();
            }
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
        this.splashEffects = [];
        
        // Only clear ammunition if persistence is disabled
        if (!this.userSettings.ammo_persistence) {
            this.clearAllAmmunition();
        }
        
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
    
    createExplosion(x, y, scale = 1) {
        this.explosions.push({
            x: x,
            y: y,
            life: 30,
            maxLife: 30,
            particles: [],
            scale: scale
        });
        
        // Create particles
        const particleCount = Math.floor(10 * scale);
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8 * scale,
                vy: (Math.random() - 0.5) * 8 * scale,
                life: 30,
                color: `hsl(${Math.random() * 60 + 20}, 100%, 50%)`
            });
        }
    }
    
    createSplashEffect(x, y, radius, color) {
        this.splashEffects.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: radius,
            life: 20,
            maxLife: 20,
            color: color
        });
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
        
        // Only render game elements if not in login state
        if (this.gameState === 'login') {
            return; // Don't render anything in login state
        }
        
        // Draw stars
        this.drawStars();
        
        if (this.gameState === 'playing' || this.gameState === 'math') {
            // Draw player
            this.drawPlayer();
            
            // Draw bullets with enhanced visuals
            this.bullets.forEach(bullet => {
                // Draw bullet with glow effect
                this.ctx.shadowColor = bullet.color;
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = bullet.color;
                this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
                this.ctx.shadowBlur = 0;
                
                // Draw bullet trail effect
                this.ctx.fillStyle = bullet.color;
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillRect(bullet.x - 1, bullet.y - 2, bullet.width + 2, bullet.height + 2);
                this.ctx.globalAlpha = 1.0;
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
                const scale = explosion.scale || 1;
                this.ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(explosion.x, explosion.y, (1 - alpha) * 30 * scale, 0, 2 * Math.PI);
                this.ctx.fill();
            });
            
            // Draw splash effects
            this.splashEffects.forEach(splash => {
                const alpha = splash.life / splash.maxLife;
                this.ctx.strokeStyle = `${splash.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(splash.x, splash.y, splash.radius, 0, 2 * Math.PI);
                this.ctx.stroke();
            });
            
            // Draw new UI elements
            this.drawLifeBar();
            this.drawAmmoBanks();
            this.drawScoreAndLevel();
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
    
    hexToRgb(hex) {
        // Convert hex color to RGB
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 255, g: 255, b: 255}; // Default to white if parsing fails
    }
    
    drawPlayer() {
        const x = this.player.x;
        const y = this.player.y;
        const w = this.player.width;
        const h = this.player.height;
        
        // Get current colorway
        const colorway = this.shipColorways[this.player.colorway] || this.shipColorways['blue'];
        
        // Draw spaceship body - sleek futuristic design with user's colorway
        this.ctx.fillStyle = colorway.main;
        this.ctx.beginPath();
        // Main hull - elongated teardrop shape
        this.ctx.moveTo(x + w/2, y + h*0.1); // Top point
        this.ctx.lineTo(x + w*0.8, y + h*0.3); // Right side
        this.ctx.lineTo(x + w*0.9, y + h*0.7); // Right back
        this.ctx.lineTo(x + w*0.7, y + h*0.9); // Right bottom
        this.ctx.lineTo(x + w*0.3, y + h*0.9); // Left bottom
        this.ctx.lineTo(x + w*0.1, y + h*0.7); // Left back
        this.ctx.lineTo(x + w*0.2, y + h*0.3); // Left side
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw wing details
        this.ctx.fillStyle = colorway.wing;
        this.ctx.beginPath();
        this.ctx.moveTo(x + w*0.2, y + h*0.3);
        this.ctx.lineTo(x + w*0.1, y + h*0.5);
        this.ctx.lineTo(x + w*0.3, y + h*0.6);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + w*0.8, y + h*0.3);
        this.ctx.lineTo(x + w*0.9, y + h*0.5);
        this.ctx.lineTo(x + w*0.7, y + h*0.6);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add bright trim lines
        this.ctx.strokeStyle = colorway.trim;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + w*0.2, y + h*0.3);
        this.ctx.lineTo(x + w*0.8, y + h*0.3);
        this.ctx.stroke();
        
        // Draw cockpit - bright glass
        this.ctx.fillStyle = colorway.cockpit;
        this.ctx.beginPath();
        this.ctx.ellipse(x + w/2, y + h*0.4, w*0.15, h*0.08, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw cockpit highlight
        this.ctx.fillStyle = colorway.highlight;
        this.ctx.beginPath();
        this.ctx.ellipse(x + w/2, y + h*0.35, w*0.08, h*0.04, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw enhanced engine glow
        this.ctx.fillStyle = colorway.engine;
        this.ctx.shadowColor = colorway.engine;
        this.ctx.shadowBlur = 15;
        // Main engine
        this.ctx.fillRect(x + w*0.35, y + h*0.85, w*0.3, h*0.15);
        // Side engines
        this.ctx.fillRect(x + w*0.1, y + h*0.75, w*0.15, h*0.1);
        this.ctx.fillRect(x + w*0.75, y + h*0.75, w*0.15, h*0.1);
        this.ctx.shadowBlur = 0;
        
        // Draw current ammo laser blaster - size and color match ammunition exactly
        const ammoType = this.ammoTypes[this.currentBank];
        
        // Calculate gun size to match bullet size exactly
        const gunWidth = 6 + (ammoType.power * 2);  // Same as bullet width
        const gunHeight = 12 + (ammoType.power * 2); // Same as bullet height
        const gunX = x + w/2 - gunWidth/2;  // Center on ship
        const gunY = y - gunHeight;
        
        // Draw gun barrel
        this.ctx.fillStyle = ammoType.color;
        this.ctx.fillRect(gunX, gunY, gunWidth, gunHeight);
        
        // Draw gun glow effect
        this.ctx.shadowColor = ammoType.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(gunX + gunWidth/4, gunY + gunHeight/4, gunWidth/2, gunHeight/2);
        this.ctx.shadowBlur = 0;
        
        // Draw gun pulse effect when firing
        const currentTime = Date.now();
        const timeSincePulse = currentTime - this.gunPulseTime;
        if (timeSincePulse < this.gunPulseDuration) {
            const pulseIntensity = 1 - (timeSincePulse / this.gunPulseDuration);
            const pulseSize = 20 * pulseIntensity;
            const pulseAlpha = pulseIntensity * 0.6;
            
            this.ctx.shadowColor = ammoType.color;
            this.ctx.shadowBlur = pulseSize;
            this.ctx.globalAlpha = pulseAlpha;
            this.ctx.fillStyle = ammoType.color;
            this.ctx.fillRect(gunX - pulseSize/2, gunY - pulseSize/2, gunWidth + pulseSize, gunHeight + pulseSize);
            this.ctx.globalAlpha = 1.0;
            this.ctx.shadowBlur = 0;
        }
        
        // Draw bank number on gun (only in game mode, not math mode)
        if (this.gameState === 'playing') {
            // Determine text color based on ammunition color brightness
            const color = ammoType.color;
            const rgb = this.hexToRgb(color);
            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            const textColor = brightness > 128 ? '#000000' : '#ffffff'; // Black for light colors, white for dark
            
            this.ctx.fillStyle = textColor;
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentBank.toString(), x + w/2, gunY + gunHeight/2 + 4);
        }
        
        // Draw ammunition count indicator (small dots above gun)
        const ammoCount = this.ammunitionBanks[this.currentBank].length;
        const maxAmmo = this.maxAmmoPerBank;
        const indicatorY = gunY - 8;
        const indicatorWidth = Math.min(5, Math.ceil(ammoCount / (maxAmmo / 5))) * 3;
        const indicatorStartX = x + w/2 - indicatorWidth/2;
        
        for (let i = 0; i < Math.min(5, Math.ceil(ammoCount / (maxAmmo / 5))); i++) {
            this.ctx.fillStyle = ammoType.color;
            this.ctx.fillRect(indicatorStartX + (i * 3), indicatorY, 2, 2);
        }
    }
    
    drawLifeBar() {
        // Update HTML life bar instead of drawing on canvas
        const lifeBar = document.getElementById('lifeBar');
        if (lifeBar) {
            const lifePercent = (this.lives / 5) * 100;
            lifeBar.style.width = `${lifePercent}%`;
        }
    }
    
    drawAmmoBanks() {
        // Update HTML ammo banks instead of drawing on canvas
        const container = document.getElementById('ammoBanksContainer');
        if (!container) return;
        
        // Check if sliding container already exists
        let slidingContainer = container.querySelector('.sliding-container');
        
        if (!slidingContainer) {
            // Create a sliding container
            slidingContainer = document.createElement('div');
            slidingContainer.className = 'sliding-container';
            slidingContainer.style.cssText = `
                display: flex;
                gap: 2px;
                height: 80px;
                transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                position: absolute;
                left: 0;
                top: 5px;
            `;
            container.appendChild(slidingContainer);
            
            // Create bank elements if they don't exist
            for (let i = 0; i < 10; i++) {
                const bankElement = document.createElement('div');
                bankElement.className = `ammo-bank bank-${i}`;
                bankElement.style.cssText = `
                    width: 76px;
                    height: 80px;
                    background: #222;
                    border: 1px solid #666;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 2px;
                    cursor: pointer;
                    position: relative;
                    flex-shrink: 0;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                `;
                
                // Fill bar (bottom-to-top fill)
                const fillBar = document.createElement('div');
                fillBar.className = 'fill-bar';
                fillBar.style.cssText = `
                    width: 100%;
                    height: 0%;
                    background: #ff0000;
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    opacity: 0.3;
                    border-radius: 2px;
                    transition: height 0.3s ease, background-color 0.3s ease;
                `;
                bankElement.appendChild(fillBar);
                
                // Bank number
                const bankNumber = document.createElement('div');
                bankNumber.className = 'bank-number';
                bankNumber.textContent = i.toString();
                bankNumber.style.cssText = `
                    color: white;
                    font-family: monospace;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 1;
                    position: relative;
                `;
                bankElement.appendChild(bankNumber);
                
                // Ammo type name
                const typeName = document.createElement('div');
                typeName.className = 'type-name';
                typeName.textContent = this.ammoTypes[i].name;
                typeName.style.cssText = `
                    color: white;
                    font-family: monospace;
                    font-size: 8px;
                    text-align: center;
                    z-index: 1;
                    position: relative;
                `;
                bankElement.appendChild(typeName);
                
                // Ammo count
                const ammoCountElement = document.createElement('div');
                ammoCountElement.className = 'ammo-count';
                ammoCountElement.textContent = `${this.ammunitionBanks[i].length}/${this.maxAmmoPerBank}`;
                ammoCountElement.style.cssText = `
                    color: white;
                    font-family: monospace;
                    font-size: 8px;
                    z-index: 1;
                    position: relative;
                `;
                bankElement.appendChild(ammoCountElement);
                
                // Add click handler
                bankElement.addEventListener('click', () => {
                    this.currentBank = i;
                    this.updateAmmoDisplay();
                });
                
                slidingContainer.appendChild(bankElement);
            }
        }
        
        // Update all bank elements
        for (let i = 0; i < 10; i++) {
            const bankElement = slidingContainer.querySelector(`.bank-${i}`);
            const fillBar = bankElement.querySelector('.fill-bar');
            const ammoCountElement = bankElement.querySelector('.ammo-count');
            
            const ammoCount = this.ammunitionBanks[i].length;
            const maxAmmo = this.maxAmmoPerBank;
            const fillPercent = ammoCount / maxAmmo;
            const isSelected = i === this.currentBank;
            
            // Update bank styling
            bankElement.style.background = isSelected ? '#444' : '#222';
            bankElement.style.border = isSelected ? '3px solid #00ff00' : '1px solid #666';
            
            // Update fill bar
            const fillColor = fillPercent > 0.5 ? '#00ff00' : fillPercent > 0.2 ? '#ffff00' : '#ff0000';
            fillBar.style.height = `${fillPercent * 100}%`;
            fillBar.style.background = fillColor;
            
            // Update ammo count
            ammoCountElement.textContent = `${ammoCount}/${maxAmmo}`;
        }
        
        // Calculate and apply sliding animation
        const bankWidth = 76;
        const gap = 2;
        const totalBankWidth = bankWidth + gap;
        const containerWidth = 800;
        const selectedBankOffset = (containerWidth / 2) - (this.currentBank * totalBankWidth + bankWidth / 2);
        slidingContainer.style.transform = `translateX(${selectedBankOffset}px)`;
    }
    
    drawScoreAndLevel() {
        // Update HTML elements instead of drawing on canvas
        const levelElement = document.getElementById('level');
        const scoreElement = document.getElementById('score');
        
        if (levelElement) {
            levelElement.textContent = this.level;
        }
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }
    
    drawEnemy(enemy) {
        const centerX = enemy.x + enemy.width / 2;
        const centerY = enemy.y + enemy.height / 2;
        
        // Draw shield bubble - shrinks as shield decreases
        if (enemy.shield > 0) {
            const shieldRatio = enemy.shield / enemy.maxShield;
            const bubbleRadius = (enemy.width / 2 + 15) * shieldRatio;
            const bubbleAlpha = 0.3 + (shieldRatio * 0.4); // More opaque when stronger
            
            // Outer glow
            this.ctx.shadowColor = enemy.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = `rgba(${this.hexToRgb(enemy.color).r}, ${this.hexToRgb(enemy.color).g}, ${this.hexToRgb(enemy.color).b}, ${bubbleAlpha * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, bubbleRadius + 5, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Main bubble
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = enemy.color;
            this.ctx.lineWidth = 2 + shieldRatio * 2;
            this.ctx.fillStyle = `rgba(${this.hexToRgb(enemy.color).r}, ${this.hexToRgb(enemy.color).g}, ${this.hexToRgb(enemy.color).b}, ${bubbleAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, bubbleRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Pulsing effect when shield is low
            if (shieldRatio < 0.3) {
                const pulseAlpha = (Math.sin(Date.now() * 0.01) + 1) * 0.3;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, bubbleRadius * 0.8, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
        
        // Draw enemy ship with personality-based design
        this.ctx.fillStyle = enemy.fleeing ? '#666666' : enemy.color;
        
        // Different ship shapes based on personality
        this.ctx.beginPath();
        switch (enemy.personality) {
            case 'basic':
                // Simple triangular ship
                this.ctx.moveTo(centerX, enemy.y);
                this.ctx.lineTo(enemy.x, enemy.y + enemy.height);
                this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
                this.ctx.closePath();
                break;
                
            case 'defensive':
                // Rounded, defensive design
                this.ctx.ellipse(centerX, centerY, enemy.width / 2, enemy.height / 2, 0, 0, 2 * Math.PI);
                break;
                
            case 'agile':
                // Sleek, streamlined design
                this.ctx.moveTo(centerX, enemy.y);
                this.ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height * 0.2);
                this.ctx.lineTo(enemy.x + enemy.width, centerY);
                this.ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height * 0.8);
                this.ctx.lineTo(centerX, enemy.y + enemy.height);
                this.ctx.lineTo(enemy.x + enemy.width * 0.2, enemy.y + enemy.height * 0.8);
                this.ctx.lineTo(enemy.x, centerY);
                this.ctx.lineTo(enemy.x + enemy.width * 0.2, enemy.y + enemy.height * 0.2);
                this.ctx.closePath();
                break;
                
            case 'aggressive':
                // Sharp, angular design
                this.ctx.moveTo(centerX, enemy.y);
                this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.3);
                this.ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height);
                this.ctx.lineTo(enemy.x + enemy.width * 0.2, enemy.y + enemy.height);
                this.ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.3);
                this.ctx.closePath();
                break;
                
            case 'tank':
                // Blocky, heavy design with armor plating
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);
                this.ctx.fillStyle = enemy.fleeing ? '#666666' : enemy.color;
                this.ctx.fillRect(enemy.x + 10, enemy.y + 10, enemy.width - 20, enemy.height - 20);
                break;
                
            case 'boss':
                // Intimidating, spiky design
                this.ctx.moveTo(centerX, enemy.y);
                this.ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.2);
                this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.4);
                this.ctx.lineTo(enemy.x + enemy.width * 0.8, centerY);
                this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.6);
                this.ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.8);
                this.ctx.lineTo(centerX, enemy.y + enemy.height);
                this.ctx.lineTo(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.8);
                this.ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.6);
                this.ctx.lineTo(enemy.x + enemy.width * 0.2, centerY);
                this.ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.4);
                this.ctx.lineTo(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.2);
                this.ctx.closePath();
                break;
                
            default:
                // Default rectangular design
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
        this.ctx.fill();
        
        // Draw personality-based details
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(enemy.name, centerX, enemy.y - 5);
        
        // Draw behavior indicators
        if (enemy.behavior === 'spiral') {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 20, 0, enemy.spiralAngle);
            this.ctx.stroke();
        } else if (enemy.behavior === 'complex_pattern') {
            // Draw complex pattern indicator
            this.ctx.strokeStyle = '#ff00ff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                const radius = 15 + Math.sin(enemy.behaviorTimer * 0.1 + angle) * 5;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }
    
    gameLoop() {
        // Only update and render if not in login state
        if (this.gameState !== 'login') {
            this.update();
            this.render();
        }
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

function toggleAmmoPersistence() {
    game.toggleAmmoPersistence();
}

// Removed changeTargetBank function - now using clickable bank buttons

async function login() {
    console.log('Global login function called');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('Username:', username, 'Password length:', password.length);
    
    if (!username || !password) {
        console.log('Missing username or password');
        game.showLoginMessage('Please enter both username and password', '#ff0000');
        return;
    }
    
    console.log('Selected colorway:', selectedColorway);
    console.log('Calling game.login()');
    try {
        const result = await game.login(username, password, selectedColorway);
        console.log('game.login() completed, result:', result);
    } catch (error) {
        console.error('Error in game.login():', error);
    }
}

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        game.showLoginMessage('Please enter both username and password', '#ff0000');
        return;
    }
    
    await game.register(username, password, selectedColorway);
}

function logout() {
    game.logout();
}

// Global variable to track selected colorway
let selectedColorway = 'blue';

function selectColorway(colorway) {
    selectedColorway = colorway;
    
    // Update button borders to show selection
    const colorways = ['blue', 'red', 'green', 'purple', 'orange'];
    colorways.forEach(cw => {
        const button = document.getElementById(`colorway-${cw}`);
        if (button) {
            button.style.border = cw === colorway ? '2px solid #00ff00' : '2px solid #666';
        }
    });
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    game.gameState = 'playing';
}

// Start the game
const game = new SpaceshipGame();
console.log('Game object created:', game);
console.log('Game API URL:', game.apiBaseUrl);
