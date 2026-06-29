// Background music state
let backgroundMusicStarted = false;

function playBackgroundAudio() {
    if (backgroundMusicStarted) return;
    backgroundMusicStarted = true;

    const audio = document.getElementById('bg-audio');
    if (!audio) return;

    audio.volume = 0.25;
    audio.play().catch((error) => {
        console.warn('Background audio could not autoplay:', error);
    });
}

// Synthesize cute bubble sound using Web Audio API
function playBubbleSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        
        osc.start(now);
        osc.stop(now + 0.12);
    } catch (e) {
        console.warn("Audio Context blocked or not supported: ", e);
    }
}

// Synthesize pop sound for No button escape
function playPopSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.08);
    } catch (e) {}
}

// Synthesize success arpeggio sound
function playSuccessSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        
        // C major arpeggio notes
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; 
        
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            const noteTime = now + (idx * 0.08);
            osc.frequency.setValueAtTime(freq, noteTime);
            
            gain.gain.setValueAtTime(0.12, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
            
            osc.start(noteTime);
            osc.stop(noteTime + 0.35);
        });
    } catch (e) {}
}

// Generate ambient floating hearts in background
function createAmbientHearts() {
    const container = document.getElementById('bg-hearts');
    if (!container) return;
    
    const heartCount = 15;
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            spawnAmbientHeart(container);
        }, i * 600);
    }
    
    // Periodically spawn new ones
    setInterval(() => {
        spawnAmbientHeart(container);
    }, 1200);
}

function spawnAmbientHeart(container) {
    const heart = document.createElement('div');
    heart.classList.add('floating-heart');
    
    // Random position and timing attributes
    const size = Math.random() * 16 + 12; // 12px to 28px
    const left = Math.random() * 100; // 0% to 100%
    const duration = Math.random() * 6 + 6; // 6s to 12s
    const delay = Math.random() * 2;
    
    heart.style.width = `${size}px`;
    heart.style.height = `${size}px`;
    heart.style.left = `${left}%`;
    heart.style.animationDuration = `${duration}s`;
    heart.style.animationDelay = `${delay}s`;
    
    // Random transparency
    heart.style.opacity = (Math.random() * 0.4 + 0.1).toFixed(2);
    
    container.appendChild(heart);
    
    // Remove element after animation completes
    setTimeout(() => {
        heart.remove();
    }, (duration + delay) * 1000);
}

// Show custom toast notification
function showToast(message) {
    const toast = document.getElementById('toast-notif');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;
    
    toastMsg.textContent = message;
    toast.classList.add('show');
    
    // Play a gentle alert bubble sound
    playBubbleSound();
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4500);
}

// State tracking
let yesButtonScale = 1.0;
const scaleStep = 0.25;

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
    createAmbientHearts();
    
    // Check if user came back from clicking "No" (misclick)
    if (localStorage.getItem('girlfriend_misclick') === 'true') {
        localStorage.removeItem('girlfriend_misclick');
        // Give a tiny delay for everything to settle
        setTimeout(() => {
            showToast("Oops! Maybe that was a misclick? Try again! 😉");
        }, 600);
    }
    
    setupEventListeners();
});

function setupEventListeners() {
    const btnStart = document.getElementById('btn-start');
    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');
    
    const stepIntro = document.getElementById('step-intro');
    const stepQuestion = document.getElementById('step-question');
    const stepCelebration = document.getElementById('step-celebration');
    
    // Transition Step 1 to Step 2
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            playBubbleSound();
            playBackgroundAudio();
            stepIntro.classList.remove('active');
            stepQuestion.classList.add('active');
        });
    }
    
    // Escape behavior on hover / mouseover
    const btnRetry = document.getElementById('btn-retry');
    const stepSad = document.getElementById('step-sad');
    let noEscapesCount = 0;
    let noHasSighed = false;
    let noButtonHidden = false;
    const noDisappearThreshold = 4;

    if (btnNo) {
        const restoreNoButtonPosition = () => {
            const btnWidth = btnNo.offsetWidth;
            const btnHeight = btnNo.offsetHeight;
            const padding = 30;
            const yesRect = btnYes.getBoundingClientRect();
            const left = Math.min(window.innerWidth - btnWidth - padding, Math.max(padding, yesRect.left));
            const top = Math.min(window.innerHeight - btnHeight - padding, Math.max(padding, yesRect.bottom + 12));

            btnNo.style.position = 'fixed';
            btnNo.style.left = `${left}px`;
            btnNo.style.top = `${top}px`;
        };

        const restoreNoButtonWithSigh = () => {
            noButtonHidden = false;
            noHasSighed = true;
            noEscapesCount = 0;
            btnNo.style.pointerEvents = 'auto';
            btnNo.style.opacity = '1';
            btnNo.style.transform = 'scale(1)';
            btnNo.textContent = 'Sigh... No 😢';
            btnNo.classList.add('sigh');
            restoreNoButtonPosition();
        };

        const hideNoButtonForSigh = () => {
            if (noButtonHidden || noHasSighed) return;
            noButtonHidden = true;
            btnNo.style.pointerEvents = 'none';
            btnNo.style.transition = 'opacity 0.4s ease, transform 0.4s ease, left 0.4s ease, top 0.4s ease';
            btnNo.style.opacity = '0';
            btnNo.style.transform = 'scale(0.75) rotate(-18deg)';
            btnNo.style.left = '-140px';
            btnNo.style.top = '-140px';

            setTimeout(() => {
                restoreNoButtonWithSigh();
            }, 700);
        };

        const escapeButton = (e) => {
            if (noButtonHidden) return;
            playPopSound();

            // Calculate a random point on screen
            const btnWidth = btnNo.offsetWidth;
            const btnHeight = btnNo.offsetHeight;
            const padding = 30;
            const maxX = window.innerWidth - btnWidth - padding;
            const maxY = window.innerHeight - btnHeight - padding;

            let newX = Math.max(padding, Math.floor(Math.random() * maxX));
            let newY = Math.max(padding, Math.floor(Math.random() * maxY));

            // If new position overlaps the "Yes" button area, re-calculate once
            const yesRect = btnYes.getBoundingClientRect();
            if (newX > yesRect.left - 50 && newX < yesRect.right + 50 &&
                newY > yesRect.top - 50 && newY < yesRect.bottom + 50) {
                newX = Math.max(padding, Math.floor(Math.random() * maxX));
                newY = Math.max(padding, Math.floor(Math.random() * maxY));
            }

            btnNo.style.position = 'fixed';
            btnNo.style.left = `${newX}px`;
            btnNo.style.top = `${newY}px`;

            // Playfully grow the "Yes" button
            yesButtonScale += scaleStep;
            btnYes.style.transform = `scale(${yesButtonScale})`;

            // Add extra drop shadow glow to the yes button as it grows
            const blurRadius = 25 + (yesButtonScale * 5);
            btnYes.style.boxShadow = `0 10px ${blurRadius}px rgba(79, 70, 229, ${0.35 + (yesButtonScale * 0.05)})`;

            noEscapesCount += 1;
            if (noEscapesCount >= noDisappearThreshold && !noHasSighed) {
                hideNoButtonForSigh();
            }
        };

        btnNo.addEventListener('mouseover', escapeButton);
        btnNo.addEventListener('pointerenter', escapeButton);
        btnNo.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default mobile double click or focus
            escapeButton();
        });

        btnNo.addEventListener('click', () => {
            if (noButtonHidden) return;
            stepQuestion.classList.remove('active');
            stepSad.classList.add('active');
            btnNo.style.pointerEvents = 'none';
            btnYes.style.pointerEvents = 'none';
        });
    }

    if (btnRetry) {
        btnRetry.addEventListener('click', () => {
            stepSad.classList.remove('active');
            stepQuestion.classList.add('active');
            btnNo.textContent = 'No 😢';
            btnNo.classList.remove('sigh');
            btnNo.style.position = 'absolute';
            btnNo.style.left = '';
            btnNo.style.top = '';
            btnNo.style.opacity = '1';
            btnNo.style.pointerEvents = 'auto';
            btnNo.style.transform = 'scale(1)';
            yesButtonScale = 1.0;
            btnYes.style.transform = 'scale(1)';
            btnYes.style.boxShadow = '0 10px 25px rgba(79, 70, 229, 0.35)';
            noEscapesCount = 0;
            noHasSighed = false;
            noButtonHidden = false;
        });
    }

    // Transition to Success Step 3
    if (btnYes) {
        btnYes.addEventListener('click', () => {
            playSuccessSound();
            stepQuestion.classList.remove('active');
            stepCelebration.classList.add('active');
            
            // Start the celebration heart rain
            startCelebrationRain();
        });
    }

    // Navigation to Affirmations from Celebration screen
    const btnToAffirmationsYes = document.getElementById('btn-to-affirmations-from-yes');
    const stepAffirmations = document.getElementById('step-affirmations');
    if (btnToAffirmationsYes) {
        btnToAffirmationsYes.addEventListener('click', () => {
            playBubbleSound();
            stepCelebration.classList.remove('active');
            stepAffirmations.classList.add('active');
            displayAffirmation();
        });
    }

    // Navigation to Affirmations from Sad screen
    const btnToAffirmationsSad = document.getElementById('btn-to-affirmations-from-sad');
    if (btnToAffirmationsSad) {
        btnToAffirmationsSad.addEventListener('click', () => {
            playBubbleSound();
            stepSad.classList.remove('active');
            stepAffirmations.classList.add('active');
            displayAffirmation();
        });
    }
}

// Screen shaking animation inject
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
}
`;
document.head.appendChild(styleSheet);

// Celebration success rain (emojis falling from top)
function startCelebrationRain() {
    const heartEmojis = ['💖', '💕', '🌸', '💝', '❤️', '✨', '🌹', '🥰', '🧸'];
    
    // Spawn 100 emojis in a burst initially
    for (let i = 0; i < 40; i++) {
        setTimeout(() => {
            spawnCelebrationEmoji(heartEmojis);
        }, i * 50);
    }
    
    // Keep spawning for the next 15 seconds
    const interval = setInterval(() => {
        spawnCelebrationEmoji(heartEmojis);
    }, 150);
    
    // Stop after 20 seconds
    setTimeout(() => {
        clearInterval(interval);
    }, 20000);
}

function spawnCelebrationEmoji(emojis) {
    const emoji = document.createElement('div');
    emoji.classList.add('celebration-heart');
    
    // Random emoji from list
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.textContent = randomEmoji;
    
    // Random properties
    const left = Math.random() * 100; // 0% to 100%
    const duration = Math.random() * 3 + 2.5; // 2.5s to 5.5s
    const size = Math.random() * 20 + 20; // 20px to 40px
    const rotationSpeed = Math.random() * 360;
    
    emoji.style.left = `${left}%`;
    emoji.style.fontSize = `${size}px`;
    emoji.style.animationDuration = `${duration}s`;
    
    document.body.appendChild(emoji);
    
    // Remove element after it falls off
    setTimeout(() => {
        emoji.remove();
    }, duration * 1000);
}
// Array of daily affirmations
const affirmations = [
    'I am capable and confident.',
    'I am worthy of love and happiness.',
    'I am strong and resilient.',
    'I am grateful for all the blessings in my life.',
    'You make my heart smile every day.',
    'Together, we can achieve anything.',
    'Every moment with you is special.',
];

// Function to display a random affirmation
function displayAffirmation() {
    const affirmationMessage = document.querySelector('.affirm-message');
    if (!affirmationMessage) return;
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    affirmationMessage.textContent = affirmations[randomIndex];
}

// Setup affirmations functionality after page loads
window.addEventListener('DOMContentLoaded', () => {
    // Display the first affirmation when page loads
    displayAffirmation();

    // Add an event listener to the Reload Affirmations button
    const reloadAffirmationsButton = document.getElementById('btn-reload-affirmations');
    if (reloadAffirmationsButton) {
        reloadAffirmationsButton.addEventListener('click', () => {
            displayAffirmation();
        });
    }
}, { once: true });