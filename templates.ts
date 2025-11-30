
import type { FileNode } from './types';

const FUTURIST_STARTER_TEMPLATE: FileNode[] = [
    {
        id: 'b1', name: 'index.html', type: 'file', path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus Coder | Genesis Project</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- Floating Menu Bar -->
    <nav class="floating-menu">
        <a href="#" class="menu-item active"><i class="fas fa-home"></i> Dashboard</a>
        <a href="#" class="menu-item"><i class="fas fa-network-wired"></i> Systems</a>
        <a href="#" class="menu-item"><i class="fas fa-database"></i> Data Streams</a>
        <a href="#" class="menu-item"><i class="fas fa-cogs"></i> Configuration</a>
        <a href="#" class="menu-item"><i class="fas fa-terminal"></i> Terminal</a>
    </nav>

    <div class="container">
        <header class="app-header">
            <div class="logo">
                <span class="logo-bracket">[</span>NEXUS<span class="logo-bracket">]</span>
            </div>
            <h1>GENESIS PROJECT</h1>
        </header>
        
        <main class="main-content">
            <div class="data-sphere">
                <div class="inner-sphere"></div>
            </div>
            
            <p class="status-text">SYSTEM ONLINE</p>
            
            <button id="actionButton" class="action-button">INITIALIZE</button>
            
            <div class="cards-container">
                <div class="card">
                    <h3><i class="fas fa-brain"></i> Neural Network</h3>
                    <p>Advanced neural processing unit operating at 98.7% efficiency. All cognitive modules are functioning within optimal parameters.</p>
                </div>
                
                <div class="card">
                    <h3><i class="fas fa-shield-alt"></i> Security Matrix</h3>
                    <p>Quantum encryption protocols active. Multi-layered defense systems are fully operational with zero vulnerabilities detected.</p>
                </div>
                
                <div class="card">
                    <h3><i class="fas fa-rocket"></i> Propulsion Systems</h3>
                    <p>Warp drive charged to 87%. All navigation systems calibrated and ready for interstellar deployment.</p>
                </div>
            </div>
        </main>
        
        <footer class="app-footer">
            <p>&copy; 2024 Nexus Coder AI. All systems nominal.</p>
        </footer>
    </div>
    <script src="script.js"></script>
</body>
</html>`
    },
    { id: 'b2', name: 'style.css', type: 'file', path: '/style.css', content: `:root {
    --primary-color: #00f3ff;
    --secondary-color: #ff00e6;
    --accent-color: #00ff9d;
    --background-color: #0a0a1a;
    --card-bg: rgba(16, 18, 37, 0.6);
    --text-color: #e0e0ff;
    --neon-glow: 0 0 10px, 0 0 20px, 0 0 30px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background: var(--background-color);
    color: var(--text-color);
    min-height: 100vh;
    overflow-x: hidden;
    background-image: 
        radial-gradient(circle at 10% 20%, rgba(0, 243, 255, 0.05) 0%, transparent 20%),
        radial-gradient(circle at 90% 80%, rgba(255, 0, 230, 0.05) 0%, transparent 20%),
        radial-gradient(circle at 50% 50%, rgba(0, 255, 157, 0.03) 0%, transparent 50%);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    position: relative;
}

/* Floating Menu Bar */
.floating-menu {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--card-bg);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 12px 24px;
    display: flex;
    gap: 30px;
    z-index: 100;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
    flex-wrap: wrap;
    justify-content: center;
}

.menu-item {
    color: var(--text-color);
    text-decoration: none;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 12px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
}

.menu-item:hover {
    color: var(--primary-color);
    text-shadow: 0 0 8px var(--primary-color);
}

.menu-item.active {
    color: var(--primary-color);
    background: rgba(0, 243, 255, 0.1);
    box-shadow: 0 0 15px rgba(0, 243, 255, 0.3);
}

/* Header */
.app-header {
    text-align: center;
    margin-top: 100px;
    margin-bottom: 60px;
    animation: fadeIn 1.5s ease-out;
}

.logo {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 20px;
    text-shadow: var(--neon-glow) var(--primary-color);
    letter-spacing: 4px;
}

.logo-bracket {
    color: var(--primary-color);
    animation: pulse 2s infinite;
}

h1 {
    font-size: 2.5rem;
    font-weight: 300;
    letter-spacing: 8px;
    color: var(--text-color);
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    position: relative;
}

h1::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
}

/* Main Content */
.main-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    margin-bottom: 60px;
}

/* Cards */
.cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    width: 100%;
    margin-top: 30px;
}

.card {
    background: var(--card-bg);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
}

.card:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 243, 255, 0.2);
}

.card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(0, 243, 255, 0.1), rgba(255, 0, 230, 0.1));
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: -1;
}

.card:hover::before {
    opacity: 1;
}

.card h3 {
    font-size: 1.5rem;
    margin-bottom: 15px;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    gap: 10px;
}

.card p {
    line-height: 1.6;
    color: rgba(224, 224, 255, 0.8);
}

/* Data Sphere */
.data-sphere {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, var(--primary-color), transparent 70%);
    box-shadow: 
        inset 0 0 50px rgba(0, 243, 255, 0.5),
        0 0 60px rgba(0, 243, 255, 0.3);
    position: relative;
    animation: rotate 20s linear infinite;
    display: flex;
    align-items: center;
    justify-content: center;
}

.data-sphere::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(
        from 0deg,
        var(--primary-color),
        var(--secondary-color),
        var(--accent-color),
        var(--primary-color)
    );
    animation: rotate 15s linear infinite;
    opacity: 0.3;
    filter: blur(20px);
}

.data-sphere::after {
    content: '';
    position: absolute;
    width: 120%;
    height: 120%;
    border-radius: 50%;
    border: 2px solid transparent;
    border-top: 2px solid var(--primary-color);
    border-right: 2px solid var(--secondary-color);
    animation: rotate 10s linear infinite;
}

.inner-sphere {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(0, 243, 255, 0.2);
    box-shadow: 0 0 20px rgba(0, 243, 255, 0.5);
    z-index: 2;
    position: relative;
}

/* Status Text */
.status-text {
    font-size: 1.5rem;
    font-weight: 300;
    letter-spacing: 3px;
    color: var(--accent-color);
    text-shadow: 0 0 10px var(--accent-color);
    animation: pulse 2s infinite;
    margin: 20px 0;
}

/* Buttons */
.action-button {
    background: transparent;
    color: var(--primary-color);
    border: 2px solid var(--primary-color);
    border-radius: 24px;
    padding: 15px 40px;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 0 15px rgba(0, 243, 255, 0.3);
}

.action-button:hover {
    background: rgba(0, 243, 255, 0.1);
    box-shadow: 0 0 25px rgba(0, 243, 255, 0.5);
    transform: translateY(-3px);
}

.action-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.action-button:hover::before {
    left: 100%;
}

/* Footer */
.app-footer {
    text-align: center;
    padding: 30px 0;
    margin-top: 60px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(224, 224, 255, 0.6);
    font-size: 0.9rem;
    letter-spacing: 1px;
}

/* Animations */
@keyframes float {
    0%, 100% {
        transform: translateX(-50%) translateY(0);
    }
    50% {
        transform: translateX(-50%) translateY(-10px);
    }
}

@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive Design */
@media (max-width: 768px) {
    .floating-menu {
        padding: 10px 15px;
        gap: 15px;
        width: 90%;
        top: 10px;
    }
    
    .menu-item {
        font-size: 0.9rem;
        padding: 6px 10px;
    }
    
    .logo {
        font-size: 2.5rem;
    }
    
    h1 {
        font-size: 1.8rem;
        letter-spacing: 4px;
    }
    
    .cards-container {
        grid-template-columns: 1fr;
    }
    
    .data-sphere {
        width: 150px;
        height: 150px;
    }
}
` },
    { id: 'b3', name: 'script.js', type: 'file', path: '/script.js', content: `document.addEventListener('DOMContentLoaded', function() {
    const actionButton = document.getElementById('actionButton');
    const statusText = document.querySelector('.status-text');
    const dataSphere = document.querySelector('.data-sphere');
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Button click animation
    actionButton.addEventListener('click', function() {
        // Add pulse animation
        this.style.animation = 'pulse 0.5s';
        
        // Change status text temporarily
        statusText.textContent = 'INITIALIZING...';
        statusText.style.color = 'var(--secondary-color)';
        
        // Enhance data sphere glow
        dataSphere.style.boxShadow = 'inset 0 0 70px rgba(0, 243, 255, 0.7), 0 0 80px rgba(0, 243, 255, 0.5)';
        
        setTimeout(() => {
            statusText.textContent = 'SYSTEM ONLINE';
            statusText.style.color = 'var(--accent-color)';
            dataSphere.style.boxShadow = 'inset 0 0 50px rgba(0, 243, 255, 0.5), 0 0 60px rgba(0, 243, 255, 0.3)';
            this.style.animation = '';
        }, 2000);
    });
    
    // Menu item interactions
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            menuItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
    
    // Add floating particles in background
    createParticles();
    
    function createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.style.position = 'fixed';
        particlesContainer.style.top = '0';
        particlesContainer.style.left = '0';
        particlesContainer.style.width = '100%';
        particlesContainer.style.height = '100%';
        particlesContainer.style.pointerEvents = 'none';
        particlesContainer.style.zIndex = '-1';
        document.body.appendChild(particlesContainer);
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = Math.random() * 4 + 1 + 'px';
            particle.style.height = particle.style.width;
            particle.style.background = i % 3 === 0 ? 'var(--primary-color)' : 
                                       i % 3 === 1 ? 'var(--secondary-color)' : 
                                       'var(--accent-color)';
            particle.style.borderRadius = '50%';
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.top = Math.random() * 100 + 'vh';
            
            particlesContainer.appendChild(particle);
            
            // Animate particles
            animateParticle(particle);
        }
    }
    
    function animateParticle(particle) {
        let x = parseFloat(particle.style.left);
        let y = parseFloat(particle.style.top);
        let xSpeed = (Math.random() - 0.5) * 0.5;
        let ySpeed = (Math.random() - 0.5) * 0.5;
        
        function move() {
            x += xSpeed;
            y += ySpeed;
            
            // Wrap around edges
            if (x > 100) x = 0;
            if (x < 0) x = 100;
            if (y > 100) y = 0;
            if (y < 0) y = 100;
            
            particle.style.left = x + 'vw';
            particle.style.top = y + 'vh';
            
            requestAnimationFrame(move);
        }
        
        move();
    }
});` },
];

const LEGACY_REAL_ESTATE_TEMPLATE: FileNode[] = [
    {
        id: 're1', name: 'index.html', type: 'file', path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kings Realtors - Futuristic Real Estate</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;600;800&display=swap');
        body { font-family: 'Exo 2', sans-serif; background-color: #050b0a; color: #FFF; }
        .neon-border { box-shadow: 0 0 10px #10B981, inset 0 0 5px #10B981; }
        .property-card:hover { transform: scale(1.02); box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); border-color: #10B981; }
    </style>
</head>
<body class="bg-[#050b0a] min-h-screen flex flex-col">
    <!-- Navbar -->
    <header class="p-6 flex justify-between items-center sticky top-0 z-50 bg-[#050b0a]/90 backdrop-blur border-b border-emerald-900/50">
        <div class="text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            KINGS<span class="text-white">REALTORS</span>
        </div>
        <div class="hidden md:flex gap-8 text-sm font-bold uppercase text-gray-400 tracking-wider">
            <a href="#" class="hover:text-emerald-400 transition">Listings</a>
            <a href="#" class="hover:text-emerald-400 transition">Virtual Tours</a>
            <a href="#" class="hover:text-emerald-400 transition">Smart Homes</a>
        </div>
        <button class="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-2 rounded-none -skew-x-12 font-bold transition transform hover:-translate-y-1 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <span class="block skew-x-12">CONNECT WALLET</span>
        </button>
    </header>

    <!-- Hero -->
    <div class="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-[#050b0a] via-[#050b0a]/50 to-transparent"></div>
        
        <div class="text-center z-10 max-w-4xl px-4">
            <h1 class="text-7xl font-black mb-6 leading-tight">
                LIVING IN <br>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">THE FUTURE</span>
            </h1>
            <p class="text-xl text-emerald-100/70 mb-10 max-w-2xl mx-auto">
                Discover blockchain-verified smart homes with integrated AI environmental controls in Lagos' most exclusive zones.
            </p>
            <div class="flex justify-center gap-4">
                <button class="bg-white text-black px-8 py-4 font-bold text-lg hover:bg-emerald-400 transition">VIEW MAP</button>
                <button class="border border-emerald-500 text-emerald-400 px-8 py-4 font-bold text-lg hover:bg-emerald-900/30 transition backdrop-blur-md">3D TOUR</button>
            </div>
        </div>
    </div>

    <!-- Properties -->
    <main class="max-w-7xl mx-auto px-6 py-12 w-full">
        <div class="flex justify-between items-end mb-8">
            <h2 class="text-3xl font-bold border-l-4 border-emerald-500 pl-4">PRIME SECTORS</h2>
            <div class="text-emerald-500 font-mono text-xs">LIVE MARKET FEED ●</div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Card 1 -->
            <div class="property-card bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden transition duration-300 group">
                <div class="h-64 bg-gray-800 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1600596542815-37a9a200ce10?q=80&w=2075&auto=format&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-80 group-hover:opacity-100" alt="Villa">
                    <div class="absolute top-4 right-4 bg-emerald-500 text-black text-xs font-bold px-3 py-1">VERIFIED</div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-white">Neo-Lekki Villa</h3>
                        <span class="text-emerald-400 font-mono">₦250M</span>
                    </div>
                    <p class="text-gray-400 text-sm mb-4">5 Beds • 4 Baths • AI Security Core</p>
                    <div class="flex gap-2">
                        <span class="text-[10px] bg-gray-800 px-2 py-1 text-gray-300 border border-gray-700">SOLAR</span>
                        <span class="text-[10px] bg-gray-800 px-2 py-1 text-gray-300 border border-gray-700">SMART</span>
                    </div>
                </div>
            </div>

            <!-- Card 2 -->
            <div class="property-card bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden transition duration-300 group">
                <div class="h-64 bg-gray-800 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-80 group-hover:opacity-100" alt="Penthouse">
                    <div class="absolute top-4 right-4 bg-cyan-500 text-black text-xs font-bold px-3 py-1">NEW</div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-white">Eko Atlantic Sky-Pod</h3>
                        <span class="text-emerald-400 font-mono">₦480M</span>
                    </div>
                    <p class="text-gray-400 text-sm mb-4">3 Beds • Panoramic Ocean View</p>
                    <div class="flex gap-2">
                        <span class="text-[10px] bg-gray-800 px-2 py-1 text-gray-300 border border-gray-700">AUTO-CLIMATE</span>
                    </div>
                </div>
            </div>

            <!-- Card 3 -->
            <div class="property-card bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden transition duration-300 group">
                <div class="h-64 bg-gray-800 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?q=80&w=2073&auto=format&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-80 group-hover:opacity-100" alt="Mansion">
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-white">Maitama Fortress</h3>
                        <span class="text-emerald-400 font-mono">₦850M</span>
                    </div>
                    <p class="text-gray-400 text-sm mb-4">8 Beds • Underground Bunker</p>
                    <div class="flex gap-2">
                        <span class="text-[10px] bg-gray-800 px-2 py-1 text-gray-300 border border-gray-700">SECURE</span>
                        <span class="text-[10px] bg-gray-800 px-2 py-1 text-gray-300 border border-gray-700">HELIPAD</span>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="bg-gray-900 border-t border-gray-800 py-8 mt-auto">
        <div class="max-w-7xl mx-auto px-6 flex justify-between items-center text-sm text-gray-500">
            <p>&copy; 2077 Kings Realtors. Secured on Ethereum.</p>
            <div class="flex gap-4">
                <a href="#" class="hover:text-emerald-400">Terms</a>
                <a href="#" class="hover:text-emerald-400">Privacy</a>
            </div>
        </div>
    </footer>
</body>
</html>`
    }
];

const LEGACY_MEDICAL_TEMPLATE: FileNode[] = [
    {
        id: 'med1', name: 'index.html', type: 'file', path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MediCore Future - Next Gen Healthcare</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Roboto:wght@300;400;700&display=swap');
        body { font-family: 'Roboto', sans-serif; background-color: #0B1120; color: #E2E8F0; }
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .neon-text { text-shadow: 0 0 10px rgba(6, 182, 212, 0.7); }
        .card-glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(56, 189, 248, 0.3); }
        .btn-glow:hover { box-shadow: 0 0 15px rgba(6, 182, 212, 0.5); }
    </style>
</head>
<body class="bg-gray-900 min-h-screen">
    <nav class="p-6 flex justify-between items-center border-b border-cyan-900/50">
        <div class="text-2xl font-orbitron font-bold text-cyan-400 neon-text">MEDICORE</div>
        <div class="space-x-6 text-gray-300">
            <a href="#" class="hover:text-cyan-400 transition">Diagnostics</a>
            <a href="#" class="hover:text-cyan-400 transition">Telehealth</a>
            <a href="#" class="hover:text-cyan-400 transition">AI Analysis</a>
        </div>
        <button class="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-full font-bold transition btn-glow">Patient Portal</button>
    </nav>

    <main class="container mx-auto px-6 py-12">
        <div class="flex flex-col md:flex-row items-center gap-12">
            <div class="md:w-1/2">
                <h1 class="text-5xl font-orbitron font-bold mb-6 leading-tight">
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Advanced AI</span> <br>
                    Healthcare Solutions
                </h1>
                <p class="text-xl text-gray-400 mb-8">Experience the future of medicine with our quantum-powered diagnostic tools and personalized treatment plans.</p>
                <div class="flex gap-4">
                    <button class="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-lg hover:from-cyan-500 hover:to-blue-500 transition btn-glow">Book Consultation</button>
                    <button class="px-8 py-3 border border-cyan-500 text-cyan-400 rounded-lg font-bold text-lg hover:bg-cyan-900/30 transition">Learn More</button>
                </div>
            </div>
            <div class="md:w-1/2 relative">
                <div class="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 rounded-full"></div>
                <div class="card-glass p-8 rounded-2xl relative z-10 transform rotate-2 hover:rotate-0 transition duration-500">
                    <div class="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                        <h3 class="text-xl font-bold text-cyan-300">Live Vitals Monitor</h3>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                    </div>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Heart Rate</span>
                            <span class="text-2xl font-mono text-white">72 <span class="text-sm text-gray-500">bpm</span></span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2.5">
                            <div class="bg-cyan-500 h-2.5 rounded-full" style="width: 72%"></div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">O2 Saturation</span>
                            <span class="text-2xl font-mono text-white">98 <span class="text-sm text-gray-500">%</span></span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2.5">
                            <div class="bg-blue-500 h-2.5 rounded-full" style="width: 98%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="card-glass p-6 rounded-xl hover:-translate-y-2 transition duration-300">
                <div class="w-12 h-12 bg-cyan-900/50 rounded-lg flex items-center justify-center mb-4 text-cyan-400 text-2xl">🧬</div>
                <h3 class="text-xl font-bold mb-2">Genomic Sequencing</h3>
                <p class="text-gray-400">Rapid full-genome analysis for personalized preventative care.</p>
            </div>
            <div class="card-glass p-6 rounded-xl hover:-translate-y-2 transition duration-300">
                <div class="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center mb-4 text-blue-400 text-2xl">🤖</div>
                <h3 class="text-xl font-bold mb-2">AI Diagnosis</h3>
                <p class="text-gray-400">Neural networks processing medical imaging with 99.9% accuracy.</p>
            </div>
            <div class="card-glass p-6 rounded-xl hover:-translate-y-2 transition duration-300">
                <div class="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4 text-purple-400 text-2xl">🛡️</div>
                <h3 class="text-xl font-bold mb-2">Secure Records</h3>
                <p class="text-gray-400">Blockchain-encrypted patient history accessible worldwide.</p>
            </div>
        </div>
    </main>
</body>
</html>`
    }
];

const LEGACY_ECOMMERCE_TEMPLATE: FileNode[] = [
    {
        id: 'eco1', name: 'index.html', type: 'file', path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShopGalaxy - Hyper-Commerce</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;600;800&display=swap');
        body { font-family: 'Exo 2', sans-serif; background-color: #0F0518; color: #FFF; }
        .neon-border { box-shadow: 0 0 10px #D946EF, inset 0 0 5px #D946EF; }
        .product-card:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(217, 70, 239, 0.4); border-color: #D946EF; }
    </style>
</head>
<body class="bg-[#0F0518] min-h-screen">
    <header class="p-6 flex justify-between items-center sticky top-0 z-50 bg-[#0F0518]/90 backdrop-blur">
        <div class="text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">SHOPGALAXY</div>
        <div class="flex gap-6 items-center">
            <input type="text" placeholder="Search across dimensions..." class="bg-gray-900 border border-purple-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-pink-500 w-64">
            <button class="relative p-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <span class="absolute top-0 right-0 bg-purple-600 text-xs rounded-full h-4 w-4 flex items-center justify-center">2</span>
            </button>
        </div>
    </header>

    <div class="relative h-[500px] flex items-center justify-center overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-[#0F0518]"></div>
        <div class="text-center z-10">
            <h1 class="text-6xl font-black mb-4">CYBER SALE <span class="text-pink-500">2077</span></h1>
            <p class="text-xl text-purple-200 mb-8">Up to 70% off on Neural Implants and Holographic Displays</p>
            <button class="bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-none skew-x-[-12deg] font-bold text-lg transition-transform hover:skew-x-[-12deg] hover:-translate-y-1">
                <span class="block skew-x-[12deg]">SHOP NOW</span>
            </button>
        </div>
    </div>

    <main class="max-w-7xl mx-auto px-6 py-12">
        <h2 class="text-2xl font-bold mb-8 flex items-center gap-2">
            <span class="w-2 h-8 bg-pink-500 block"></span> TRENDING ARTIFACTS
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- Product 1 -->
            <div class="product-card bg-gray-900 border border-purple-900 p-4 rounded-xl transition duration-300">
                <div class="h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative group">
                    <div class="absolute inset-0 bg-pink-500/10 group-hover:bg-pink-500/0 transition"></div>
                    <span class="text-4xl">👟</span>
                </div>
                <h3 class="text-lg font-bold">Anti-Grav Sneakers</h3>
                <p class="text-gray-400 text-sm mb-3">Urban Hover Tech</p>
                <div class="flex justify-between items-center">
                    <span class="text-xl font-bold text-pink-400">₿ 0.045</span>
                    <button class="bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded text-sm">+</button>
                </div>
            </div>

            <!-- Product 2 -->
            <div class="product-card bg-gray-900 border border-purple-900 p-4 rounded-xl transition duration-300">
                <div class="h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <span class="text-4xl">🕶️</span>
                </div>
                <h3 class="text-lg font-bold">AR Visor X1</h3>
                <p class="text-gray-400 text-sm mb-3">Ocular Enhancement</p>
                <div class="flex justify-between items-center">
                    <span class="text-xl font-bold text-pink-400">₿ 0.120</span>
                    <button class="bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded text-sm">+</button>
                </div>
            </div>

            <!-- Product 3 -->
            <div class="product-card bg-gray-900 border border-purple-900 p-4 rounded-xl transition duration-300">
                <div class="h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <span class="text-4xl">⌚</span>
                </div>
                <h3 class="text-lg font-bold">Bio-Sync Watch</h3>
                <p class="text-gray-400 text-sm mb-3">Health Monitoring</p>
                <div class="flex justify-between items-center">
                    <span class="text-xl font-bold text-pink-400">₿ 0.085</span>
                    <button class="bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded text-sm">+</button>
                </div>
            </div>

            <!-- Product 4 -->
            <div class="product-card bg-gray-900 border border-purple-900 p-4 rounded-xl transition duration-300">
                <div class="h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <span class="text-4xl">🎒</span>
                </div>
                <h3 class="text-lg font-bold">Solar Pack</h3>
                <p class="text-gray-400 text-sm mb-3">Infinite Power</p>
                <div class="flex justify-between items-center">
                    <span class="text-xl font-bold text-pink-400">₿ 0.060</span>
                    <button class="bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded text-sm">+</button>
                </div>
            </div>
        </div>
    </main>
</body>
</html>`
    }
];

const LEGACY_AGRICULTURE_TEMPLATE: FileNode[] = [
    {
        id: 'ag1', name: 'index.html', type: 'file', path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgriTech One - Smart Farming</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@400;700&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #051910; color: #ECFDF5; }
        .font-tech { font-family: 'Share Tech Mono', monospace; }
        .border-glow { box-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
        .bg-grid { background-size: 20px 20px; background-image: linear-gradient(to right, #064E3B 1px, transparent 1px), linear-gradient(to bottom, #064E3B 1px, transparent 1px); }
    </style>
</head>
<body class="bg-grid min-h-screen">
    <nav class="bg-[#022c22]/90 border-b border-emerald-800 px-8 py-4 flex justify-between items-center fixed w-full z-50 backdrop-blur-md">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-emerald-500 rounded-sm rotate-45"></div>
            <span class="text-2xl font-bold tracking-tighter text-emerald-400">AGRITECH<span class="text-white">ONE</span></span>
        </div>
        <div class="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-widest text-emerald-200/70">
            <a href="#" class="hover:text-white transition">Drone Fleet</a>
            <a href="#" class="hover:text-white transition">Soil Sensors</a>
            <a href="#" class="hover:text-white transition">Market Data</a>
        </div>
        <button class="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded font-bold transition">DASHBOARD</button>
    </nav>

    <section class="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div class="flex flex-col lg:flex-row items-center gap-16">
            <div class="lg:w-1/2">
                <div class="text-orange-500 font-tech mb-2">SYSTEM STATUS: OPTIMAL</div>
                <h1 class="text-6xl font-black mb-6 leading-none">
                    Precision <br>
                    <span class="text-emerald-500">Agriculture</span> <br>
                    Reloaded.
                </h1>
                <p class="text-xl text-emerald-100/60 mb-8 max-w-lg">
                    Maximize yield with AI-driven insights, autonomous drone monitoring, and real-time environmental control systems.
                </p>
                <div class="flex gap-4">
                    <button class="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded font-bold transition border-glow">START FREE TRIAL</button>
                    <button class="border border-emerald-600 text-emerald-400 px-8 py-4 rounded font-bold hover:bg-emerald-900/30 transition">VIEW DEMO</button>
                </div>
            </div>
            
            <div class="lg:w-1/2 relative">
                <div class="absolute -inset-4 bg-orange-500/20 blur-2xl rounded-full"></div>
                <div class="bg-[#064E3B]/80 p-6 rounded-lg border border-emerald-500/50 backdrop-blur-md relative z-10">
                    <div class="flex justify-between items-center mb-6 border-b border-emerald-800 pb-4">
                        <span class="font-tech text-emerald-300">FIELD SENSOR #402</span>
                        <div class="flex gap-2">
                            <span class="w-3 h-3 rounded-full bg-red-500"></span>
                            <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
                            <span class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-[#022c22] p-4 rounded border border-emerald-900/50">
                            <div class="text-xs text-gray-400 mb-1">SOIL MOISTURE</div>
                            <div class="text-2xl font-tech text-blue-400">42%</div>
                        </div>
                        <div class="bg-[#022c22] p-4 rounded border border-emerald-900/50">
                            <div class="text-xs text-gray-400 mb-1">NITROGEN LVL</div>
                            <div class="text-2xl font-tech text-orange-400">LOW</div>
                        </div>
                        <div class="bg-[#022c22] p-4 rounded border border-emerald-900/50">
                            <div class="text-xs text-gray-400 mb-1">TEMPERATURE</div>
                            <div class="text-2xl font-tech text-white">24°C</div>
                        </div>
                        <div class="bg-[#022c22] p-4 rounded border border-emerald-900/50">
                            <div class="text-xs text-gray-400 mb-1">CROP HEALTH</div>
                            <div class="text-2xl font-tech text-green-400">98%</div>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-emerald-800">
                        <div class="text-xs text-emerald-500 mb-2 font-tech">AI RECOMMENDATION:</div>
                        <div class="bg-orange-900/30 text-orange-200 text-sm p-3 rounded border-l-2 border-orange-500">
                            Initiate localized nitrogen enrichment protocol in Sector 7.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 bg-[#022c22]">
        <div class="max-w-7xl mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-12">The Future of Farming</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-[#051910] p-8 border-t-4 border-orange-500 hover:bg-[#062c1e] transition cursor-pointer group">
                    <div class="text-4xl mb-4 group-hover:scale-110 transition duration-300">🛸</div>
                    <h3 class="text-xl font-bold text-white mb-2">Autonomous Drones</h3>
                    <p class="text-gray-400 text-sm">24/7 aerial monitoring and automated crop spraying systems.</p>
                </div>
                <div class="bg-[#051910] p-8 border-t-4 border-emerald-500 hover:bg-[#062c1e] transition cursor-pointer group">
                    <div class="text-4xl mb-4 group-hover:scale-110 transition duration-300">🌱</div>
                    <h3 class="text-xl font-bold text-white mb-2">Smart Soil Analysis</h3>
                    <p class="text-gray-400 text-sm">Molecular level soil composition tracking for perfect growth.</p>
                </div>
                <div class="bg-[#051910] p-8 border-t-4 border-blue-500 hover:bg-[#062c1e] transition cursor-pointer group">
                    <div class="text-4xl mb-4 group-hover:scale-110 transition duration-300">💧</div>
                    <h3 class="text-xl font-bold text-white mb-2">Hydro-Optimization</h3>
                    <p class="text-gray-400 text-sm">Water usage reduction by up to 40% with smart irrigation.</p>
                </div>
            </div>
        </div>
    </section>
</body>
</html>`
    }
];

// Added missing template constants for compilation fix
const REACT_TEMPLATE: FileNode[] = [
    {
        id: 'react1', name: 'package.json', type: 'file', path: '/package.json',
        content: `{\n  "name": "react-finance-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "chart.js": "^4.0.0",\n    "react-chartjs-2": "^5.0.0"\n  }\n}`
    },
    {
        id: 'react2', name: 'src', type: 'folder', path: '/src',
        children: [
            { id: 'react3', name: 'index.html', type: 'file', path: '/src/index.html', content: '<!DOCTYPE html><html><head><title>Finance App</title></head><body><div id="root"></div></body></html>' },
            { id: 'react4', name: 'index.js', type: 'file', path: '/src/index.js', content: 'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\n\nconst root = createRoot(document.getElementById("root"));\nroot.render(<App />);' },
            { id: 'react5', name: 'App.js', type: 'file', path: '/src/App.js', content: 'import React from "react";\n\nexport default function App() {\n  return (\n    <div style={{ padding: 20 }}>\n      <h1>Finance Dashboard</h1>\n      <p>Tracking market trends...</p>\n    </div>\n  );\n}' }
        ]
    }
];

const REACT_NATIVE_TEMPLATE: FileNode[] = [
    {
        id: 'rn1', name: 'package.json', type: 'file', path: '/package.json',
        content: `{\n  "name": "mobile-app",\n  "dependencies": {\n    "react": "18.2.0",\n    "react-native": "0.71.0"\n  }\n}`
    },
    { id: 'rn2', name: 'App.tsx', type: 'file', path: '/App.tsx', content: 'import React from "react";\nimport { View, Text, StyleSheet } from "react-native";\n\nexport default function App() {\n  return (\n    <View style={styles.container}>\n      <Text style={styles.text}>React Native Mobile App</Text>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },\n  text: { color: "#fff", fontSize: 20 }\n});' }
];

const FLUTTER_TEMPLATE: FileNode[] = [
    {
        id: 'fl1', name: 'pubspec.yaml', type: 'file', path: '/pubspec.yaml',
        content: 'name: flutter_app\ndescription: A new Flutter project.\ndependencies:\n  flutter:\n    sdk: flutter\n  cupertino_icons: ^1.0.2'
    },
    {
        id: 'fl2', name: 'lib', type: 'folder', path: '/lib',
        children: [
            { id: 'fl3', name: 'main.dart', type: 'file', path: '/lib/main.dart', content: 'import "package:flutter/material.dart";\n\nvoid main() {\n  runApp(const MyApp());\n}\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(\n      title: "Flutter Demo",\n      theme: ThemeData(\n        primarySwatch: Colors.blue,\n      ),\n      home: const Scaffold(body: Center(child: Text("Hello Flutter"))),\n    );\n  }\n}' }
        ]
    }
];

const VUE_TEMPLATE: FileNode[] = [
    {
        id: 'vue1', name: 'package.json', type: 'file', path: '/package.json',
        content: `{\n  "name": "vue-health-app",\n  "dependencies": {\n    "vue": "^3.0.0"\n  }\n}`
    },
    { id: 'vue2', name: 'index.html', type: 'file', path: '/index.html', content: '<!DOCTYPE html><html><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>' },
    {
        id: 'vue3', name: 'src', type: 'folder', path: '/src',
        children: [
            { id: 'vue4', name: 'main.js', type: 'file', path: '/src/main.js', content: 'import { createApp } from "vue";\nimport App from "./App.vue";\n\ncreateApp(App).mount("#app");' },
            { id: 'vue5', name: 'App.vue', type: 'file', path: '/src/App.vue', content: '<template>\n  <div class="container">\n    <h1>Health Tracker</h1>\n  </div>\n</template>\n\n<script>\nexport default {\n  name: "App"\n}\n</script>\n\n<style>\n.container { color: #fff; background: #111; height: 100vh; padding: 20px; }\n</style>' }
        ]
    }
];

const NODE_TEMPLATE: FileNode[] = [
    {
        id: 'node1', name: 'package.json', type: 'file', path: '/package.json',
        content: `{\n  "name": "node-dao",\n  "main": "index.js",\n  "dependencies": {\n    "express": "^4.18.2"\n  }\n}`
    },
    { id: 'node2', name: 'index.js', type: 'file', path: '/index.js', content: 'const express = require("express");\nconst app = express();\nconst port = 3000;\n\napp.get("/", (req, res) => {\n  res.send("DAO Node Backend Running");\n});\n\napp.listen(port, () => {\n  console.log(`Example app listening on port ${port}`);\n});' }
];

const NEXTJS_TEMPLATE: FileNode[] = [
    {
        id: 'next1', name: 'package.json', type: 'file', path: '/package.json',
        content: `{\n  "name": "next-landing",\n  "dependencies": {\n    "next": "latest",\n    "react": "latest",\n    "react-dom": "latest"\n  }\n}`
    },
    {
        id: 'next2', name: 'pages', type: 'folder', path: '/pages',
        children: [
            { id: 'next3', name: 'index.js', type: 'file', path: '/pages/index.js', content: 'export default function Home() {\n  return (\n    <div style={{ color: "white", background: "#000", minHeight: "100vh", padding: "50px" }}>\n      <h1>Welcome to Next.js Landing</h1>\n    </div>\n  );\n}' }
        ]
    }
];

const PYTHON_TEMPLATE: FileNode[] = [
    { id: 'py1', name: 'main.py', type: 'file', path: '/main.py', content: 'def main():\n    print("Logistics Platform Initialized")\n\nif __name__ == "__main__":\n    main()' },
    { id: 'py2', name: 'requirements.txt', type: 'file', path: '/requirements.txt', content: 'requests==2.28.1' }
];

export const ALL_TEMPLATES = [
    { name: 'Futurist Starter', files: FUTURIST_STARTER_TEMPLATE },
    { name: 'React (Finance)', files: REACT_TEMPLATE },
    { name: 'React Native (Mobile)', files: REACT_NATIVE_TEMPLATE },
    { name: 'Flutter (Mobile)', files: FLUTTER_TEMPLATE },
    { name: 'Vue (Health)', files: VUE_TEMPLATE },
    { name: 'Node.js (DAO)', files: NODE_TEMPLATE },
    { name: 'Next.js (Landing)', files: NEXTJS_TEMPLATE },
    { name: 'Python (Logistics)', files: PYTHON_TEMPLATE },
];

export const LEGACY_TEMPLATES = {
    realEstate: { name: "Real Estate (Kings)", files: LEGACY_REAL_ESTATE_TEMPLATE, color: "from-green-400 to-cyan-500", icon: "🏠" },
    medical: { name: "Medical (MediCore)", files: LEGACY_MEDICAL_TEMPLATE, color: "from-cyan-500 to-blue-600", icon: "⚕️" },
    ecommerce: { name: "eCommerce (ShopGalaxy)", files: LEGACY_ECOMMERCE_TEMPLATE, color: "from-purple-500 to-pink-600", icon: "🛍️" },
    agriculture: { name: "Agriculture (AgriTech)", files: LEGACY_AGRICULTURE_TEMPLATE, color: "from-emerald-500 to-orange-500", icon: "🌱" }
};
