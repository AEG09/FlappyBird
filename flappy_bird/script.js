const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GRAVITY = 0.25;
const FLAP_STRENGTH = -4.5;
const PIPE_SPEED = 2;
const PIPE_SPAWN_RATE = 100; // Frames
const PIPE_GAP = 100;

// Game State
let frames = 0;
let score = 0;
let gameState = 'START'; // START, PLAYING, GAMEOVER

// Resize canvas to match container
canvas.width = 320;
canvas.height = 480;

// Assets (Simple shapes for now, can be replaced with images)
const bird = {
    x: 50,
    y: 150,
    w: 34,
    h: 24,
    radius: 12,
    velocity: 0,
    
    draw: function() {
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(this.x + this.w/2, this.y + this.h/2, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + this.w/2 + 6, this.y + this.h/2 - 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.w/2 + 8, this.y + this.h/2 - 6, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.x + this.w/2 - 5, this.y + this.h/2 + 2, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    },
    
    update: function() {
        this.velocity += GRAVITY;
        this.y += this.velocity;
        
        // Floor collision
        if (this.y + this.h >= canvas.height - 20) { // -20 for ground
            this.y = canvas.height - 20 - this.h;
            gameOver();
        }
        
        // Ceiling collision (optional)
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
    },
    
    flap: function() {
        this.velocity = FLAP_STRENGTH;
    },
    
    reset: function() {
        this.y = 150;
        this.velocity = 0;
    }
};

const pipes = {
    items: [],
    
    draw: function() {
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            
            ctx.fillStyle = '#73bf2e';
            ctx.strokeStyle = '#558c22';
            ctx.lineWidth = 2;
            
            // Top Pipe
            ctx.fillRect(p.x, 0, p.w, p.top);
            ctx.strokeRect(p.x, 0, p.w, p.top);
            
            // Bottom Pipe
            ctx.fillRect(p.x, canvas.height - p.bottom, p.w, p.bottom);
            ctx.strokeRect(p.x, canvas.height - p.bottom, p.w, p.bottom);
            
            // Cap details
            ctx.fillStyle = '#73bf2e';
            ctx.fillRect(p.x - 2, p.top - 20, p.w + 4, 20);
            ctx.strokeRect(p.x - 2, p.top - 20, p.w + 4, 20);
            
            ctx.fillRect(p.x - 2, canvas.height - p.bottom, p.w + 4, 20);
            ctx.strokeRect(p.x - 2, canvas.height - p.bottom, p.w + 4, 20);
        }
    },
    
    update: function() {
        if (frames % PIPE_SPAWN_RATE === 0) {
            // Calculate random position
            // Min pipe height = 50
            // Max pipe height = canvas.height - ground - gap - min_height
            const groundHeight = 20;
            const minPipe = 50;
            const maxTop = canvas.height - groundHeight - PIPE_GAP - minPipe;
            const topHeight = Math.floor(Math.random() * (maxTop - minPipe + 1)) + minPipe;
            
            this.items.push({
                x: canvas.width,
                y: 0, // Not used really
                w: 52,
                top: topHeight,
                bottom: canvas.height - groundHeight - (topHeight + PIPE_GAP),
                passed: false
            });
        }
        
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            p.x -= PIPE_SPEED;
            
            // Collision Detection
            // X axis overlap
            if (bird.x + bird.w > p.x && bird.x < p.x + p.w) {
                // Y axis overlap (hit top or bottom pipe)
                if (bird.y < p.top || bird.y + bird.h > canvas.height - p.bottom) {
                    gameOver();
                }
            }
            
            // Score update
            if (p.x + p.w < bird.x && !p.passed) {
                score++;
                scoreElement.innerText = score;
                p.passed = true;
            }
            
            // Remove off-screen pipes
            if (p.x + p.w < 0) {
                this.items.shift();
                i--;
            }
        }
    },
    
    reset: function() {
        this.items = [];
    }
};

const ground = {
    x: 0,
    h: 20,
    
    draw: function() {
        ctx.fillStyle = '#ded895';
        ctx.fillRect(this.x, canvas.height - this.h, canvas.width, this.h);
        
        // Moving effect
        ctx.fillStyle = '#cbb968';
        for (let i = this.x; i < canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, canvas.height - this.h);
            ctx.lineTo(i + 10, canvas.height);
            ctx.lineTo(i - 10, canvas.height);
            ctx.fill();
        }
        
        ctx.strokeStyle = '#734c1e';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - this.h);
        ctx.lineTo(canvas.width, canvas.height - this.h);
        ctx.stroke();
    },
    
    update: function() {
        this.x -= PIPE_SPEED;
        if (this.x <= -20) {
            this.x = 0;
        }
    }
}

// UI Elements
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Input Handling
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        action();
    }
});

canvas.addEventListener('click', action);
restartBtn.addEventListener('click', resetGame);

function action() {
    switch (gameState) {
        case 'START':
            gameState = 'PLAYING';
            startScreen.classList.remove('active');
            gameLoop();
            bird.flap();
            break;
        case 'PLAYING':
            bird.flap();
            break;
    }
}

function gameOver() {
    gameState = 'GAMEOVER';
    gameOverScreen.classList.add('active');
    finalScoreElement.innerText = score;
}

function resetGame() {
    bird.reset();
    pipes.reset();
    score = 0;
    scoreElement.innerText = score;
    frames = 0;
    gameState = 'START';
    gameOverScreen.classList.remove('active');
    startScreen.classList.add('active');
    draw(); // Draw initial state
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw entities
    pipes.draw();
    ground.draw();
    bird.draw();
}

function update() {
    bird.update();
    pipes.update();
    ground.update();
}

function gameLoop() {
    if (gameState === 'PLAYING') {
        update();
        draw();
        frames++;
        requestAnimationFrame(gameLoop);
    }
}

// Initial Draw
draw();
