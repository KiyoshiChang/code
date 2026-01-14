        // === Loading 邏輯區 ===
        const bgPlayer = document.getElementById('layer-bg');
        const fgPlayer = document.getElementById('layer-fg');
        const tank = document.getElementById('tank');
        const statusLineContent = document.getElementById('status-line-content');
        const percentNum = document.getElementById('percent-num');
        const overlay = document.getElementById('loading-overlay');

        const TOTAL_DURATION = 15000; 
        const TEXT_START = 2300;
        const TEXT_END = 16200;
        const TEXT_DURATION = TEXT_END - TEXT_START;
        const WATER_START = 1000;
        const WATER_END = 17500; 
        const WATER_DURATION = WATER_END - WATER_START;

        let startTime = null;
        let loadedCount = 0;
        let isSequenceStarted = false;

        const textStages = [
            { threshold: 20, prefix: 'NOW LOADING', content: 'PRESENTATION', isChinese: false },
            { threshold: 40, prefix: 'NOW LOADING', content: '"多模態科技"', isChinese: true },
            { threshold: 60, prefix: 'NOW LOADING', content: '"認知負荷"', isChinese: true },
            { threshold: 80, prefix: 'NOW LOADING', content: '"學習興趣"', isChinese: true },
            { threshold: 100, prefix: 'NOW LOADING', content: '"自主學習"', isChinese: true }
        ];

        function updateProgress(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            let textPercent = 0;
            if (elapsed < TEXT_START) textPercent = 0;
            else if (elapsed >= TEXT_END) textPercent = 100;
            else textPercent = ((elapsed - TEXT_START) / TEXT_DURATION) * 100;

            let waterPercent = 0;
            if (elapsed < WATER_START) waterPercent = 0;
            else if (elapsed >= WATER_END) waterPercent = 100;
            else waterPercent = ((elapsed - WATER_START) / WATER_DURATION) * 100;

            renderState(textPercent, waterPercent);

            if (elapsed < TOTAL_DURATION) {
                requestAnimationFrame(updateProgress);
            } else {
                endSequence();
            }
        }

        function renderState(textP, waterP) {
            percentNum.innerText = Math.floor(textP);

            let stage = textStages.find(s => textP < s.threshold);
            if (!stage) stage = textStages[textStages.length - 1];
            
            let contentHtml = '';
            if (stage.isChinese) {
                contentHtml = `<span class="en-text">${stage.prefix}</span><span class="zh-big">${stage.content}</span><span class="en-text">...</span>`;
            } else {
                contentHtml = `<span class="en-text">${stage.prefix}&nbsp;</span><span class="en-text">${stage.content}</span><span class="en-text">...</span>`;
            }

            if (statusLineContent.getAttribute('data-last-text') !== stage.content) {
                statusLineContent.innerHTML = contentHtml;
                statusLineContent.setAttribute('data-last-text', stage.content);
            }

            const visualHeight = waterP * 1.25; 
            tank.style.height = `${visualHeight}%`;
        }

        // 當 Loading 結束時
        function endSequence() {
            renderState(100, 100);
            console.log("Loading Complete. Fading out...");
            overlay.style.opacity = '0'; 
            
            setTimeout(() => {
                overlay.remove(); 
                console.log("Overlay removed. Starting Native Confetti!");
                // 啟動 Canva 相容版拉炮
                initConfetti();  
            }, 2000); 
        }

        function startLoadingSequence() {
            if (isSequenceStarted) return;
            isSequenceStarted = true;
            try { bgPlayer.stop(); fgPlayer.stop(); bgPlayer.play(); fgPlayer.play(); } catch (e) {}
            requestAnimationFrame(updateProgress);
        }

        function checkLoaded() {
            loadedCount++;
            if (loadedCount === 2) setTimeout(startLoadingSequence, 100);
        }
        bgPlayer.addEventListener('ready', checkLoaded);
        fgPlayer.addEventListener('ready', checkLoaded);

        setTimeout(() => {
            if (!isSequenceStarted) startLoadingSequence();
        }, 500);

        // === 拉炮特效邏輯 (Canva 相容 + 射遠版) ===
        // 設定參數：射遠版
        const CONFETTI_DURATION = 5000;     
        const CLEAR_DELAY = 5000;   
        const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ecff', '#ff0099'];
        
        // 物理參數 (強化射程)
        const GRAVITY = 0.2;        // 重力調低，飛得更遠
        const DRAG = 0.98;          // 阻力調低 (越接近 1 阻力越小)，保持速度
        const LAUNCH_SPEED = 45;    // 初速調大 (原本 25 -> 45)，爆發力增強
        const LAUNCH_SPREAD = 15;   

        class Particle {
            constructor(x, y, angleDeg, color) {
                this.element = document.createElement('div');
                this.element.className = 'confetti-particle';
                this.element.style.backgroundColor = color;
                
                if (Math.random() > 0.5) this.element.style.borderRadius = '50%';

                const size = Math.random() * 8 + 6; 
                this.element.style.width = `${size}px`;
                this.element.style.height = `${size}px`;

                document.body.appendChild(this.element);

                this.x = x;
                this.y = y;
                const angleRad = angleDeg * (Math.PI / 180);
                // 速度加上隨機因子
                const velocity = LAUNCH_SPEED * (0.8 + Math.random() * 0.4); 
                
                this.vx = Math.cos(angleRad) * velocity;
                this.vy = Math.sin(angleRad) * velocity; 
                
                this.rotation = Math.random() * 360;
                this.rotationSpeed = (Math.random() - 0.5) * 10;
                
                this.opacity = 1;
                this.life = 0;
                this.maxLife = 250 + Math.random() * 100; // 存活久一點
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                
                this.vy += GRAVITY;     
                this.vx *= DRAG;        
                this.vy *= DRAG;

                this.rotation += this.rotationSpeed;
                this.element.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;

                this.life++;
                if (this.life > this.maxLife - 50) {
                    this.opacity -= 0.02;
                    this.element.style.opacity = this.opacity;
                }
            }

            isDead() {
                // 超出底部很多才算死 (因為射很高掉下來需要時間)
                return this.opacity <= 0 || this.y > window.innerHeight + 100; 
            }

            remove() {
                this.element.remove();
            }
        }

        let particles = [];
        let animationId;
        let isFiring = false;
        let fireStartTime;

        function loop() {
            // 1. 發射階段
            if (isFiring && (Date.now() - fireStartTime < CONFETTI_DURATION)) {
                const width = window.innerWidth;
                const height = window.innerHeight;

                // 左下發射 (向右上)
                for (let i = 0; i < 3; i++) { 
                    const angle = -60 + (Math.random() - 0.5) * LAUNCH_SPREAD; 
                    particles.push(new Particle(0, height, angle, COLORS[Math.floor(Math.random() * COLORS.length)]));
                }

                // 右下發射 (向左上)
                for (let i = 0; i < 3; i++) {
                    const angle = -120 + (Math.random() - 0.5) * LAUNCH_SPREAD;
                    particles.push(new Particle(width, height, angle, COLORS[Math.floor(Math.random() * COLORS.length)]));
                }
            } else if (isFiring && (Date.now() - fireStartTime >= CONFETTI_DURATION)) {
                isFiring = false;
                console.log("停止發射，等待落下...");
                
                setTimeout(() => {
                    cancelAnimationFrame(animationId);
                    document.body.innerHTML = ''; 
                    console.log("已清空所有物件");
                }, CLEAR_DELAY);
            }

            // 2. 更新粒子
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                if (p.isDead()) {
                    p.remove();
                    particles.splice(i, 1);
                }
            }

            // 3. 迴圈
            if (isFiring || particles.length > 0) {
                animationId = requestAnimationFrame(loop);
            }
        }

        function initConfetti() {
            isFiring = true;
            fireStartTime = Date.now();
            loop();
        }