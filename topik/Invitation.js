        // === 變數宣告 ===
        const charImg = document.getElementById('char-img');
        const popupWrapper = document.getElementById('popup-wrapper');
        const flipInner = document.getElementById('flip-inner');
        
        const SRC_03 = "https://mon-ami.up.seesaa.net/topik/Invitation03.png";
        const SRC_04 = "https://mon-ami.up.seesaa.net/topik/Invitation04.png";

        let isPopupOpen = false;       
        let isClosing = false;         
        let nextAudioIsFast = true;    
        let currentAudio = null;       
        let waveInterval = null;       

        // === 初始化 ===
        function init() {
            new Image().src = SRC_04;
            charImg.addEventListener('mouseenter', onCharHover);
            charImg.addEventListener('mouseleave', onCharLeave);
            charImg.addEventListener('click', onCharClick);
        }

        // === 人物互動邏輯 ===
        function onCharHover() {
            if (!isPopupOpen && !isClosing) {
                charImg.src = SRC_04;
            }
        }

        function onCharLeave() {
            if (!isPopupOpen && !isClosing) {
                charImg.src = SRC_03;
            }
        }

        function onCharClick() {
            if (isClosing) return; 

            if (!isPopupOpen) {
                // 開啟
                isPopupOpen = true;
                charImg.src = SRC_04; 
                flipInner.classList.remove('flipped');
                popupWrapper.classList.remove('closing');
                popupWrapper.classList.add('open');
            } else {
                // 關閉
                closePopup();
            }
        }

        function closePopup() {
            isPopupOpen = false; 
            isClosing = true;    
            
            popupWrapper.classList.remove('open');
            popupWrapper.classList.add('closing');

            if(currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                stopWaveAnimation();
            }

            setTimeout(() => {
                isClosing = false;
                if (!charImg.matches(':hover')) {
                    charImg.src = SRC_03;
                }
            }, 1500);
        }

        // === 翻頁邏輯 ===
        function flipCard() {
            flipInner.classList.toggle('flipped');
            
            // 修改點 2：播放翻頁音效
            const audioFlip = document.getElementById('audio-flip');
            if (audioFlip) {
                audioFlip.currentTime = 0; // 每次重頭播放
                audioFlip.play().catch(e => console.log('Audio play error:', e));
            }
        }

        // === 音訊與喇叭動畫邏輯 ===
        const wavePaths = [
            `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>`,
            `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`,
            `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM19 12c0-2.76-1.46-5.18-3.64-6.53v1.8c1.47 1.07 2.64 2.89 2.64 4.73 0 1.84-1.17 3.66-2.64 4.73v1.8C17.54 17.18 19 14.76 19 12z"/>`
        ];
        
        const staticPath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;

        function playAudioSequence(btnElement, event) {
            event.stopPropagation();

            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                stopWaveAnimation();
            }

            const audioId = nextAudioIsFast ? 'audio-fast' : 'audio-slow';
            currentAudio = document.getElementById(audioId);
            nextAudioIsFast = !nextAudioIsFast;

            currentAudio.volume = 1.0;
            currentAudio.play().catch(e => console.error("Audio play error:", e));

            const svgIcon = btnElement.querySelector('.icon-svg.speaker');
            if(svgIcon) {
                svgIcon.style.color = '#2563eb'; 
                startWaveAnimation(svgIcon);
            }

            currentAudio.onended = () => {
                stopWaveAnimation(svgIcon);
                if(svgIcon) svgIcon.style.color = ''; 
                currentAudio = null;
            };
        }

        function startWaveAnimation(svgElement) {
            let index = 0;
            if (waveInterval) clearInterval(waveInterval);
            
            waveInterval = setInterval(() => {
                if(svgElement) {
                    svgElement.innerHTML = wavePaths[index];
                    index = (index + 1) % 3;
                }
            }, 200); 
        }

        function stopWaveAnimation(svgElement) {
            if (waveInterval) {
                clearInterval(waveInterval);
                waveInterval = null;
            }
            if (svgElement) {
                svgElement.innerHTML = staticPath;
            } else {
                document.querySelectorAll('.icon-svg.speaker').forEach(el => el.innerHTML = staticPath);
            }
        }