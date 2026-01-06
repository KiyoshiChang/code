        // Global variables
        let currentPage = 'page1';
        let currentVocabPage = 1;
        let currentPracticeQuestion = 1;
        let currentQuestion = 1;
        let practiceAnswers = {};
        let questionAnswers = {};
        let practiceCompleted = false;
        let audioSpeed = 1.0;
        let captionsEnabled = false;
        let countdownTimer = null;
        let audioTimer = null;
        let currentAudio = null;
        let currentResultsPage = 1;
        let resultAudios = {};
        let idleTimer = null; 
        let endingAudio = null; 

        // Page navigation
        function showPage(pageId) {
            if (idleTimer) {
                clearTimeout(idleTimer);
                idleTimer = null;
            }
            const idleHint = document.getElementById('idle-hint');
            if (idleHint) {
                idleHint.classList.add('hidden');
                idleHint.classList.remove('fade-in');
            }

            if (endingAudio && !endingAudio.paused) {
                fadeOutAudio(endingAudio, 1000, () => {
                    endingAudio.pause();
                    endingAudio.currentTime = 0;
                    endingAudio = null;
                });
            }

            if (currentPage === 'page1' && pageId !== 'page1') {
                const introAudio = document.getElementById('intro-audio');
                if (introAudio && !introAudio.paused) {
                    fadeOutAudio(introAudio, 1000, () => {
                        introAudio.currentTime = 0;
                        introAudio.pause();
                    });
                }
            }

            const questionAudio = document.getElementById('question-audio');
            if (questionAudio && !questionAudio.paused) {
                fadeOutAudio(questionAudio, 1000);
            }
            if (currentAudio) {
                fadeOutCurrentAudio(currentAudio);
            }
            
            stopAllResultAudios();
            
            if (countdownTimer) {
                clearInterval(countdownTimer);
                countdownTimer = null;
            }
            
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(pageId).classList.add('active');
            currentPage = pageId;
            
            if (pageId === 'page2') {
                showVocabPage(1);
            } else if (pageId === 'page3') {
                resetPractice();
            } else if (pageId === 'page4') {
                resetQuestions();
            }
        }

        // Vocabulary page functions
        function showVocabPage(pageNum) {
            currentVocabPage = pageNum;
            
            for (let i = 1; i <= 5; i++) {
                const btn = document.getElementById(`vocab-nav-${i}`);
                if (i === pageNum) {
                    btn.className = 'nav-button bg-blue-500 text-white';
                } else {
                    btn.className = 'nav-button bg-gray-400 text-white';
                }
            }
            
            const content = document.getElementById('vocab-content');
            const vocabs = vocabularyData[pageNum] || [];
            
            let html = '<div class="grid grid-cols-3 gap-x-1 h-full" style="gap-y: 0.125rem;">';
            
            for (let i = 0; i < Math.min(3, vocabs.length); i++) {
                html += createVocabularyCard(vocabs[i], i);
            }
            
            for (let i = 3; i < vocabs.length; i++) {
                html += createVocabularyCard(vocabs[i], i);
            }
            
            html += '</div>';
            content.innerHTML = html;
            
            vocabs.forEach(vocab => {
                if (vocab.audio) {
                    const audio = new Audio();
                    audio.preload = 'auto';
                    audio.src = vocab.audio;
                }
            });
        }

        function createVocabularyCard(vocab, index) {
            return `
                <div class="vocabulary-card flex flex-col items-center p-3" style="height: clamp(240px, 32vh, 340px);">
                    <div class="w-full flex items-center justify-center mb-1 overflow-hidden" style="height: calc(100% - 70px); min-height: 160px; max-height: 270px;">
                        <img src="${vocab.image}" alt="${vocab.korean}" class="max-w-full max-h-full object-contain" 
                             oncontextmenu="return false;" ondragstart="return false;">
                    </div>
                    <button onclick="playVocabAudio('${vocab.audio}', ${index})" 
                            class="btn-primary btn-hover py-2 mb-1 flex items-center justify-center min-w-0 w-full" 
                            style="white-space: nowrap; height: 40px;">
                        <svg class="flex-shrink-0 mr-1" id="speaker-${index}" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        <span class="font-bold overflow-hidden text-ellipsis min-w-0" style="font-size: clamp(12px, 4vw, 18px);">${vocab.korean}</span>
                    </button>
                    <p class="text-center text-gray-600 text-sm px-1" style="height: 20px; line-height: 20px;">${vocab.chinese}</p>
                </div>
            `;
        }

        function playVocabAudio(audioUrl, index) {
            if (currentAudio) {
                currentAudio.pause();
                document.querySelectorAll('[id^="speaker-"]').forEach(icon => {
                    icon.style.color = '';
                    icon.style.animation = '';
                    icon.innerHTML = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
                });
            }
            
            const speakerIcon = document.getElementById(`speaker-${index}`);
            speakerIcon.style.color = '#22c55e'; 
            
            const originalPath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
            const noWavePath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>`;
            const oneWavePath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
            const twoWavePath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM19 12c0-2.76-1.46-5.18-3.64-6.53v1.8c1.47 1.07 2.64 2.89 2.64 4.73 0 1.84-1.17 3.66-2.64 4.73v1.8C17.54 17.18 19 14.76 19 12z"/>`;
            
            const wavePaths = [noWavePath, oneWavePath, twoWavePath];
            let currentWaveIndex = 0;
            
            const waveInterval = setInterval(() => {
                if (speakerIcon) {
                    speakerIcon.innerHTML = wavePaths[currentWaveIndex];
                    currentWaveIndex = (currentWaveIndex + 1) % 3;
                }
            }, 200);
            
            currentAudio = new Audio(audioUrl);
            currentAudio.play();
            
            currentAudio.onended = () => {
                clearInterval(waveInterval);
                speakerIcon.style.color = ''; 
                speakerIcon.innerHTML = originalPath; 
                currentAudio = null;
            };
        }

        // Practice functions
        function playPracticeAudio(audioUrl, buttonElement) {
            if (currentAudio) {
                currentAudio.pause();
                document.querySelectorAll('.draggable .speaker-icon').forEach(icon => {
                    icon.style.color = '';
                    icon.style.animation = '';
                    icon.innerHTML = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
                });
            }
            
            const speakerIcon = buttonElement.querySelector('.speaker-icon');
            speakerIcon.style.color = '#22c55e'; 
            
            const originalPath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
            const noWavePath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>`;
            const oneWavePath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
            const twoWavePath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM19 12c0-2.76-1.46-5.18-3.64-6.53v1.8c1.47 1.07 2.64 2.89 2.64 4.73 0 1.84-1.17 3.66-2.64 4.73v1.8C17.54 17.18 19 14.76 19 12z"/>`;
            
            const wavePaths = [noWavePath, oneWavePath, twoWavePath];
            let currentWaveIndex = 0;
            
            const waveInterval = setInterval(() => {
                if (speakerIcon) {
                    speakerIcon.innerHTML = wavePaths[currentWaveIndex];
                    currentWaveIndex = (currentWaveIndex + 1) % 3;
                }
            }, 200);
            
            currentAudio = new Audio(audioUrl);
            currentAudio.play();
            
            currentAudio.onended = () => {
                clearInterval(waveInterval);
                speakerIcon.style.color = ''; 
                speakerIcon.innerHTML = originalPath; 
                currentAudio = null;
            };
        }

        function resetPractice() {
            currentPracticeQuestion = 1;
            practiceAnswers = {};
            practiceCompleted = false;
            
            const correctSound = new Audio('https://mon-ami.up.seesaa.net/topik/SE_Correct.mp3');
            const wrongSound = new Audio('https://mon-ami.up.seesaa.net/topik/SE_Wrong.mp3');
            const cheeringSound = new Audio('https://mon-ami.up.seesaa.net/topik/SE_Cheering.mp3');
            correctSound.preload = 'auto';
            wrongSound.preload = 'auto';
            cheeringSound.preload = 'auto';
            
            updatePracticeStatus();
            loadPracticeQuestion(1);
            createPracticeNavigation();
        }

        function loadPracticeQuestion(questionNum) {
            currentPracticeQuestion = questionNum;
            const question = practiceQuestions[questionNum - 1];
            
            if (!question) return;
            
            updatePracticeStatus();
            
            const shuffledVocabs = [...question.vocabularies].sort(() => Math.random() - 0.5);
            
            const content = document.getElementById('practice-content');
            
            let html = `
                <div class="h-full flex flex-col">
                    <div class="flex-1 grid grid-cols-3 gap-3 mb-1">
            `;
            
            question.vocabularies.forEach((vocab, index) => {
                html += `
                    <div class="flex flex-col items-center h-full">
                        <div class="bg-white rounded-xl shadow-lg p-1 w-full flex flex-col items-center" style="height: 380px; margin-top: -20px;">
                            <div class="w-full flex items-center justify-center mb-1" style="height: 300px;">
                                <img src="${vocab.image}" alt="${vocab.korean}" class="max-w-full max-h-full object-contain"
                                     oncontextmenu="return false;" ondragstart="return false;">
                            </div>
                            <div class="drag-zone dropzone" data-correct="${vocab.korean}" style="margin-top: 8px;">
                                Drop<br>Here
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                    <div class="flex justify-center gap-4 mobile-nav-up" id="options" style="--original-top: 76%; position: absolute; top: 76%; left: 0; right: 0; height: 5%;">
            `;
            
            shuffledVocabs.forEach((vocab, index) => {
                // 修改點 1: class 改為 btn-water
                // 修改點 2: 將 svg 包在 div.audio-trigger-zone 裡面，並加上 onclick="event.stopPropagation();"
                // 這樣做可以確保點擊圖示時只播放聲音，絕對不干擾拖曳
                html += `
                    <button class="btn-water btn-hover px-2 py-2 draggable flex items-center whitespace-nowrap" 
                            data-vocab="${vocab.korean}">
                        
                        <div class="audio-trigger-zone">
                            <svg class="speaker-icon flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                            </svg>
                        </div>

                        <span class="font-bold min-w-0 overflow-hidden text-ellipsis px-2" style="font-size: clamp(12px, 3vw, 16px); pointer-events: none;">${vocab.korean}</span>
                    </button>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
            
            content.innerHTML = html;
            
            question.vocabularies.forEach(vocab => {
                if (vocab.audio) {
                    const audio = new Audio();
                    audio.preload = 'auto';
                    audio.src = vocab.audio;
                }
            });
            
            document.querySelectorAll('.draggable').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const vocab = shuffledVocabs.find(v => v.korean === btn.dataset.vocab);
                    if (vocab) {
                        playPracticeAudio(vocab.audio, btn);
                    }
                });
            });
            
            setTimeout(() => {
                new Sortable(document.getElementById('options'), {
                    group: 'quiz',
                    animation: 150,
                    onEnd: function(evt) {
                        if (evt.to.classList.contains('dropzone')) {
                            handleDrop(evt.item, evt.to);
                        }
                    }
                });
                
                document.querySelectorAll('.dropzone').forEach(zone => {
                    new Sortable(zone, {
                        group: 'quiz',
                        animation: 150,
                        onAdd: function(evt) {
                            handleDrop(evt.item, evt.to);
                        }
                    });
                });
            }, 100);
            
            updatePracticeNavigation();
        }

        function createPracticeNavigation() {
            const nav = document.getElementById('practice-nav');
            let html = '';
            
            for (let i = 1; i <= practiceQuestions.length; i++) {
                let className = 'nav-button bg-gray-400 text-white';
                
                if (i === currentPracticeQuestion) {
                    className += ' current';
                }
                
                if (practiceAnswers[i]) {
                    const question = practiceQuestions[i - 1];
                    const totalVocabs = question.vocabularies.length;
                    const correctAnswers = Object.entries(practiceAnswers[i])
                        .filter(([key, value]) => key !== '_completed' && value === true)
                        .length;
                    
                    if (correctAnswers === totalVocabs) {
                        className = 'nav-button bg-green-500 text-white';
                    } else if (correctAnswers > 0) {
                        className = 'nav-button bg-yellow-500 text-white';
                    } else {
                        className = 'nav-button bg-red-500 text-white';
                    }
                    
                    if (i === currentPracticeQuestion) {
                        className += ' current';
                    }
                }
                
                html += `<button onclick="loadPracticeQuestion(${i})" class="${className}">${i}</button>`;
            }
            
            nav.innerHTML = html;
        }

        function updatePracticeNavigation() {
            createPracticeNavigation();
        }

        function updatePracticeStatus() {
            document.getElementById('practice-current').textContent = currentPracticeQuestion;
            
            let correctCount = 0;
            let totalScore = 0;
            
            Object.values(practiceAnswers).forEach(questionAnswers => {
                Object.entries(questionAnswers).forEach(([key, value]) => {
                    if (key !== '_completed' && value === true) {
                        correctCount++;
                    }
                });
            });
            
            const totalVocabs = practiceQuestions.reduce((sum, q) => sum + q.vocabularies.length, 0);
            totalScore = Math.round((correctCount / totalVocabs) * 100);
            
            document.getElementById('practice-correct').textContent = correctCount;
            document.getElementById('practice-score').textContent = totalScore;
        }

        function handleDrop(item, dropzone) {
            const vocab = item.dataset.vocab;
            const correctAnswer = dropzone.dataset.correct;
            const isCorrect = vocab === correctAnswer;
            
            dropzone.innerHTML = '';
            dropzone.classList.add('filled');
            if (!isCorrect) {
                dropzone.classList.add('incorrect');
            }
            dropzone.innerHTML = `<span class="font-bold" style="font-size: clamp(12px, 3vw, 16px);">${vocab}</span>`;
            item.remove();
            
            if (!practiceAnswers[currentPracticeQuestion]) {
                practiceAnswers[currentPracticeQuestion] = {};
            }
            
            practiceAnswers[currentPracticeQuestion][correctAnswer] = isCorrect;
            
            showPracticeFeedback(isCorrect);
            
            const question = practiceQuestions[currentPracticeQuestion - 1];
            const answeredCount = Object.keys(practiceAnswers[currentPracticeQuestion]).length;
            
            if (answeredCount === question.vocabularies.length) {
                if (practiceAnswers[currentPracticeQuestion]._completed) return;
                practiceAnswers[currentPracticeQuestion]._completed = true;

                setTimeout(() => {
                    if (currentPracticeQuestion < practiceQuestions.length) {
                        loadPracticeQuestion(currentPracticeQuestion + 1);
                    } else {
                        showPracticeResults();
                    }
                }, 1500);
            }
            
            updatePracticeStatus();
        }

        function showPracticeFeedback(isCorrect) {
            const feedback = document.getElementById('practice-feedback');
            const korean = document.getElementById('practice-feedback-korean');
            const english = document.getElementById('practice-feedback-english');
            
            if (isCorrect) {
                korean.textContent = '정답입니다!';
                korean.className = 'text-2xl font-bold mb-1 text-blue-600';
                english.textContent = '(Correct Answer!)';
                playAudio('https://mon-ami.up.seesaa.net/topik/SE_Correct.mp3');
            } else {
                korean.textContent = '정답이 아닙니다!';
                korean.className = 'text-2xl font-bold mb-1 text-red-600';
                english.textContent = '(Wrong Answer!)';
                playAudio('https://mon-ami.up.seesaa.net/topik/SE_Wrong.mp3');
            }
            
            feedback.classList.remove('hidden');
            
            setTimeout(() => {
                feedback.classList.add('hidden');
            }, 2000);
        }

        function showPracticeResults() {
            let correctCount = 0;
            let totalVocabs = 0;
            let resultsHtml = '<div class="grid grid-cols-3 gap-4 mb-6">';
            
            practiceQuestions.forEach((question, qIndex) => {
                resultsHtml += `<div class="bg-gray-50 p-4 rounded-lg">`;
                resultsHtml += `<h3 class="font-bold text-lg mb-2 text-blue-800">Q${qIndex + 1}</h3>`;
                
                question.vocabularies.forEach(vocab => {
                    totalVocabs++;
                    const isCorrect = practiceAnswers[qIndex + 1] && practiceAnswers[qIndex + 1][vocab.korean];
                    if (isCorrect) correctCount++;
                    
                    const symbol = isCorrect ? '〇' : '×';
                    resultsHtml += `<div class="mb-1">${vocab.korean} (${vocab.chinese}): ${symbol}</div>`;
                });
                
                resultsHtml += `</div>`;
            });
            
            resultsHtml += '</div>';
            
            const totalScore = Math.round((correctCount / totalVocabs) * 100);
            let gradeMessage = '';
            
            if (totalScore >= 80) {
                gradeMessage = `
                    <div class="text-center mb-6">
                        <div class="text-3xl font-bold text-green-600 mb-2">훌륭합니다!</div>
                        <div class="text-xl text-green-500">(Excellent!)</div>
                        <div class="text-2xl font-bold mt-4">점수: ${totalScore}점</div>
                    </div>
                `;
                createConfetti();
                playAudio('https://mon-ami.up.seesaa.net/topik/SE_Cheering.mp3');
            } else {
                gradeMessage = `
                    <div class="text-center mb-6">
                        <div class="text-3xl font-bold text-blue-600 mb-2">더 열심히 하세요!</div>
                        <div class="text-xl text-blue-500">(Keep trying!)</div>
                        <div class="text-2xl font-bold mt-4">점수: ${totalScore}점</div>
                    </div>
                `;
            }
            
            document.getElementById('practice-results-content').innerHTML = gradeMessage + resultsHtml;
            showPage('practice-results');
            practiceCompleted = true;
        }

        // Questions functions
        function resetQuestions() {
            currentQuestion = 1;
            questionAnswers = {};
            audioSpeed = 1.0;
            captionsEnabled = false;
            
            document.getElementById('speed-50').classList.remove('active');
            document.getElementById('speed-75').classList.remove('active');
            document.getElementById('captions-btn').classList.remove('active');
            document.getElementById('subtitles').style.visibility = 'hidden';
            
            updateQuestionStatus();
            loadQuestion(1);
            createQuestionNavigation();
        }

        function loadQuestion(questionNum) {
            currentQuestion = questionNum;
            const question = questionsData[questionNum - 1];
            
            if (!question) return;
            
            updateQuestionStatus();
            
            const audio = document.getElementById('question-audio');
            const track = document.getElementById('audio-track');
            
            audio.src = question.audio;
            track.src = question.vtt;
            audio.playbackRate = audioSpeed;
            
            let lastKnownTime = 0;
            
            const newAudio = audio.cloneNode(true);
            audio.parentNode.replaceChild(newAudio, audio);
            const cleanAudio = document.getElementById('question-audio');
            
            const newTrack = cleanAudio.querySelector('track');
            if (newTrack) newTrack.src = question.vtt;
            
            cleanAudio.addEventListener('timeupdate', () => {
                if (!cleanAudio.seeking) {
                    lastKnownTime = cleanAudio.currentTime;
                }
            });
            
            cleanAudio.addEventListener('seeking', () => {
                if (Math.abs(cleanAudio.currentTime - lastKnownTime) > 0.5) {
                    cleanAudio.currentTime = lastKnownTime;
                }
            });
            
            setupSubtitleTracking(cleanAudio, newTrack);
            
            const shuffledImages = [...question.images].sort(() => Math.random() - 0.5);
            
            const topContainer = document.getElementById('question-images-top');
            let topHtml = '';
            for (let i = 0; i < 2; i++) {
                const originalIndex = question.images.indexOf(shuffledImages[i]);
                topHtml += `
                    <div class="image-option w-1/2 h-full" onclick="selectAnswer(${originalIndex})" oncontextmenu="return false;">
                        <img src="${shuffledImages[i]}" alt="Option ${i + 1}" 
                             class="w-full h-full object-contain"
                             oncontextmenu="return false;" ondragstart="return false;">
                    </div>
                `;
            }
            topContainer.innerHTML = topHtml;
            
            const bottomContainer = document.getElementById('question-images-bottom');
            let bottomHtml = '';
            for (let i = 2; i < 4; i++) {
                const originalIndex = question.images.indexOf(shuffledImages[i]);
                bottomHtml += `
                    <div class="image-option w-1/2 h-full" onclick="selectAnswer(${originalIndex})" oncontextmenu="return false;">
                        <img src="${shuffledImages[i]}" alt="Option ${i + 1}" 
                             class="w-full h-full object-contain"
                             oncontextmenu="return false;" ondragstart="return false;">
                    </div>
                `;
            }
            bottomContainer.innerHTML = bottomHtml;
            
            startQuestionCountdown();
            updateQuestionNavigation();
        }

        function createQuestionNavigation() {
            const nav = document.getElementById('question-nav');
            let html = '';
            
            for (let i = 1; i <= questionsData.length; i++) {
                let className = 'nav-button bg-gray-400 text-white';
                
                if (i === currentQuestion) {
                    className += ' current';
                }
                
                if (questionAnswers[i] !== undefined) {
                    if (questionAnswers[i].correct) {
                        className = 'nav-button bg-green-500 text-white';
                    } else if (questionAnswers[i].timeout) {
                        className = 'nav-button bg-yellow-500 text-white';
                    } else {
                        className = 'nav-button bg-red-500 text-white';
                    }
                    
                    if (i === currentQuestion) {
                        className += ' current';
                    }
                }
                
                html += `<button onclick="loadQuestion(${i})" class="${className}">${i}</button>`;
            }
            
            nav.innerHTML = html;
        }

        function updateQuestionNavigation() {
            createQuestionNavigation();
        }

        function updateQuestionStatus() {
            document.getElementById('question-current').textContent = currentQuestion;
            
            const correctCount = Object.values(questionAnswers).filter(a => a.correct).length;
            const totalScore = Math.round((correctCount / questionsData.length) * 100);
            
            document.getElementById('question-correct').textContent = correctCount;
            document.getElementById('question-score').textContent = totalScore;
        }

        function startQuestionCountdown() {
            let countdown = 5;
            const countdownContainer = document.getElementById('countdown-container');
            const countdownDisplay = document.getElementById('countdown-display');
            const countdownCircle = document.getElementById('countdown-circle');
            const audio = document.getElementById('question-audio');
            
            const subtitles = document.getElementById('subtitles');
            const kText = document.getElementById('subtitle-korean');
            const cText = document.getElementById('subtitle-chinese');
            
            subtitles.style.visibility = 'visible';
            kText.textContent = '다음을 듣고 가장 알맞은 그림을 고르십시오.';
            cText.textContent = '(Listen to the following dialogue and choose the best picture.)';
            
            countdownContainer.classList.remove('hidden');
            countdownDisplay.className = 'countdown countdown-large text-gray-400';
            countdownDisplay.style.textShadow = '0 0 20px #9ca3af';
            countdownDisplay.textContent = countdown;
            countdownCircle.style.color = '#9ca3af';
            
            countdownCircle.style.animation = 'none';
            countdownCircle.offsetHeight; 
            countdownCircle.style.animation = 'drawCircle 1s ease-out forwards';
            
            countdownTimer = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    countdownDisplay.textContent = countdown;
                    countdownCircle.style.animation = 'none';
                    countdownCircle.offsetHeight; 
                    countdownCircle.style.animation = 'drawCircle 1s ease-out forwards';
                    countdownDisplay.style.animation = 'pulse 1s ease-in-out';
                    setTimeout(() => {
                        countdownDisplay.style.animation = '';
                    }, 1000);
                } else {
                    clearInterval(countdownTimer);
                    
                    countdownContainer.style.transition = 'opacity 1s ease-out';
                    countdownContainer.style.opacity = '0';
                    
                    setTimeout(() => {
                        countdownContainer.classList.add('hidden');
                        countdownContainer.style.opacity = '1';
                        countdownContainer.style.transition = '';
                    }, 1000);
                    
                    if (!captionsEnabled) {
                        subtitles.style.visibility = 'hidden';
                    }
                    kText.textContent = '';
                    cText.textContent = '';
                    
                    // Task 3 FIX: Prevent audio play if question is already answered
                    if (questionAnswers[currentQuestion]) return;

                    audio.play();
                    
                    audio.onended = () => {
                        startAnswerCountdown();
                    };
                }
            }, 1000);
        }

        function startAnswerCountdown() {
            let countdown = 15;
            const countdownContainer = document.getElementById('countdown-container');
            const countdownDisplay = document.getElementById('countdown-display');
            const countdownCircle = document.getElementById('countdown-circle');
            
            countdownContainer.classList.remove('hidden');
            countdownDisplay.className = 'countdown countdown-small text-blue-500';
            countdownDisplay.style.textShadow = '0 0 20px #3b82f6';
            countdownDisplay.textContent = countdown;
            countdownCircle.style.color = '#3b82f6';
            
            countdownCircle.style.animation = 'none';
            countdownCircle.offsetHeight; 
            countdownCircle.style.animation = 'drawCircle 1s ease-out forwards';
            
            countdownTimer = setInterval(() => {
                countdown--;
                
                if (countdown > 5) {
                    countdownDisplay.className = 'countdown countdown-small text-blue-500';
                    countdownDisplay.style.textShadow = '0 0 20px #3b82f6';
                    countdownCircle.style.color = '#3b82f6';
                } else if (countdown >= 1) {
                    countdownDisplay.className = 'countdown countdown-small text-red-500';
                    countdownDisplay.style.textShadow = '0 0 20px #ef4444';
                    countdownCircle.style.color = '#ef4444';
                    
                    countdownDisplay.style.transform = 'scale(1.5)';
                    countdownDisplay.style.transition = 'transform 1s ease-out';
                    
                    setTimeout(() => {
                        countdownDisplay.style.transform = 'scale(1)';
                    }, 100);
                }
                
                if (countdown > 0) {
                    countdownDisplay.textContent = countdown;
                    countdownCircle.style.animation = 'none';
                    countdownCircle.offsetHeight; 
                    countdownCircle.style.animation = 'drawCircle 1s ease-out forwards';
                } else {
                    clearInterval(countdownTimer);
                    
                    countdownContainer.style.transition = 'opacity 1s ease-out';
                    countdownContainer.style.opacity = '0';
                    
                    setTimeout(() => {
                        countdownContainer.classList.add('hidden');
                        countdownContainer.style.opacity = '1';
                        countdownContainer.style.transition = '';
                    }, 1000);
                    
                    if (!questionAnswers[currentQuestion]) {
                        questionAnswers[currentQuestion] = { correct: false, timeout: true };
                        showQuestionFeedback('timeout');
                        updateQuestionStatus();
                        
                        setTimeout(() => {
                            if (currentQuestion < questionsData.length) {
                                loadQuestion(currentQuestion + 1);
                            } else {
                                showQuestionResults();
                            }
                        }, 2000);
                    }
                }
            }, 1000);
        }

        function selectAnswer(answerIndex) {
            if (questionAnswers[currentQuestion]) return; 
            
            if (countdownTimer) {
                clearInterval(countdownTimer);
                countdownTimer = null;
            }
            
            const audio = document.getElementById('question-audio');
            let audioStopped = true;
            if (!audio.paused) {
                if (currentQuestion === questionsData.length) {
                    audio.pause();
                    audio.currentTime = 0;
                    audioStopped = true;
                } else {
                    audioStopped = false;
                    fadeOutAudio(audio, 100, () => {
                        audioStopped = true;
                    });
                }
            } else {
                // Task 3: Force ensure audio is paused/reset even if not playing (in case of countdown finish race condition)
                 if (currentQuestion === questionsData.length) {
                    audio.pause();
                    audio.currentTime = 0;
                    audioStopped = true;
                }
            }
            
            const question = questionsData[currentQuestion - 1];
            const isCorrect = answerIndex === question.correct;
            
            questionAnswers[currentQuestion] = { correct: isCorrect, timeout: false };
            
            showQuestionFeedback(isCorrect ? 'correct' : 'wrong');
            updateQuestionStatus();
            
            const checkAudioStopped = () => {
                if (audioStopped) {
                    if (currentQuestion < questionsData.length) {
                        loadQuestion(currentQuestion + 1);
                    } else {
                        showQuestionResults();
                    }
                } else {
                    setTimeout(checkAudioStopped, 100);
                }
            };
            
            setTimeout(checkAudioStopped, 2000);
        }

        function showQuestionFeedback(type) {
            const feedback = document.getElementById('question-feedback');
            const korean = document.getElementById('question-feedback-korean');
            const english = document.getElementById('question-feedback-english');
            const countdownContainer = document.getElementById('countdown-container');
            
            countdownContainer.classList.add('hidden');
            
            if (type === 'correct') {
                korean.textContent = '정답입니다!';
                korean.className = 'text-2xl font-bold mb-1 text-blue-600';
                english.textContent = '(Correct Answer!)';
                playAudio('https://mon-ami.up.seesaa.net/topik/SE_Correct.mp3');
            } else if (type === 'wrong') {
                korean.textContent = '정답이 아닙니다!';
                korean.className = 'text-2xl font-bold mb-1 text-red-600';
                english.textContent = '(Wrong Answer!)';
                playAudio('https://mon-ami.up.seesaa.net/topik/SE_Wrong.mp3');
            } else if (type === 'timeout') {
                korean.textContent = '타임업입니다!';
                korean.className = 'text-2xl font-bold mb-1 text-red-600';
                english.textContent = '(Time\'s Up!)';
                playAudio('https://mon-ami.up.seesaa.net/topik/SE_Wrong.mp3');
            }
            
            feedback.classList.remove('hidden');
            
            setTimeout(() => {
                feedback.classList.add('hidden');
            }, 2000);
        }

        function showQuestionResults() {
            const questionAudio = document.getElementById('question-audio');
            if (questionAudio && !questionAudio.paused) {
                questionAudio.pause();
                questionAudio.currentTime = 0;
            }
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }
            
            if (audioTimer) {
                clearInterval(audioTimer);
                audioTimer = null;
            }
            
            const correctCount = Object.values(questionAnswers).filter(a => a.correct).length;
            const totalScore = Math.round((correctCount / questionsData.length) * 100);
            
            let gradeMessage = '';
            
            if (totalScore >= 80) {
                gradeMessage = `
                    <div class="text-center mb-2">
                        <div class="text-3xl font-bold text-green-600 mb-0">훌륭합니다!</div>
                        <div class="text-xl text-green-500 mb-1">(Excellent!)</div>
                        <div class="text-2xl font-bold">점수: ${totalScore}점</div>
                    </div>
                `;
                createConfetti();
                setTimeout(() => {
                    playAudio('https://mon-ami.up.seesaa.net/topik/SE_Cheering.mp3');
                }, 200);
            } else {
                gradeMessage = `
                    <div class="text-center mb-2">
                        <div class="text-3xl font-bold text-blue-600 mb-0">더 열심히 하세요!</div>
                        <div class="text-xl text-blue-500 mb-1">(Keep trying!)</div>
                        <div class="text-2xl font-bold">점수: ${totalScore}점</div>
                    </div>
                `;
            }
            
            let practiceCorrectCount = 0;
            let practiceAnsweredCount = 0;
            let practiceTotalCount = 0;
            
            practiceQuestions.forEach((question, qIndex) => {
                question.vocabularies.forEach(vocab => {
                    practiceTotalCount++;
                    if (practiceAnswers[qIndex + 1] && practiceAnswers[qIndex + 1][vocab.korean] !== undefined) {
                        practiceAnsweredCount++;
                        if (practiceAnswers[qIndex + 1][vocab.korean] === true) {
                            practiceCorrectCount++;
                        }
                    }
                });
            });
            
            const practiceStatusHtml = `<div class="text-center mb-2 font-bold">PRACTICE: ${practiceCorrectCount} / ${practiceAnsweredCount} / ${practiceTotalCount} 어휘</div>`;
            
            const resultsHtml = createDetailedResults();
            
            document.getElementById('question-results-content').innerHTML = gradeMessage + practiceStatusHtml + resultsHtml;
            showPage('question-results');

            if (!endingAudio) {
                setTimeout(() => {
                    endingAudio = new Audio('https://mon-ami.up.seesaa.net/topik/SE_Ending.mp3');
                    endingAudio.play().catch(e => console.log("Ending audio failed:", e));
                }, 1000); 
            }
            
            setTimeout(() => {
                sendResultToEmail();
            }, 100);
        }

// Email function
function sendResultToEmail() {
            // Ensure all audio is completely stopped before sending email
            const questionAudio = document.getElementById('question-audio');
            if (questionAudio && !questionAudio.paused) {
                questionAudio.pause();
                questionAudio.currentTime = 0;
            }
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }
            
            // Clear any remaining audio timers
            if (audioTimer) {
                clearInterval(audioTimer);
                audioTimer = null;
            }
            
            const emailAddress = 'kiyoshihikawa3@gmail.com';
            const subject = 'TOPIK I Listening QUESTIONS Result (後測)';
            
            const correctCount = Object.values(questionAnswers).filter(a => a.correct).length;
            const totalScore = Math.round((correctCount / questionsData.length) * 100);
            
            let body = `TOPIK I Listening Test QUESTIONS (기출문제/過去問題)：\n\n`;
            body += `Total Score：${totalScore} Points\n`;
            body += `Correct Answers：${correctCount} / ${questionsData.length}\n\n`;
            
            body += `Answering Details：\n`;
            questionsData.forEach((question, index) => {
                const answer = questionAnswers[index + 1];
                if (answer) {
                    if (answer.timeout) {
                        body += `Q ${index + 1}： Time's Up\n`;
                    } else {
                        body += `Q ${index + 1}：${answer.correct ? '〇' : '×'}\n`;
                    }
                } else {
                    body += `Q ${index + 1}： Not Answered\n`;
                }
            });
            
            // Calculate practice statistics for email
            let emailPracticeCorrect = 0;
            let emailPracticeAnswered = 0;
            let emailPracticeTotal = 0;
            
            practiceQuestions.forEach((question, qIndex) => {
                question.vocabularies.forEach(vocab => {
                    emailPracticeTotal++;
                    if (practiceAnswers[qIndex + 1] && practiceAnswers[qIndex + 1][vocab.korean] !== undefined) {
                        emailPracticeAnswered++;
                        if (practiceAnswers[qIndex + 1][vocab.korean] === true) {
                            emailPracticeCorrect++;
                        }
                    }
                });
            });
            
            body += `\nPRACTICE: ${emailPracticeCorrect} / ${emailPracticeAnswered} / ${emailPracticeTotal} VOCABULARIES\n`;
            
            try {
                const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                
                // ▼▼▼ 修改這裡 (原本是 window.open) ▼▼▼
                window.location.href = mailtoLink;
                // ▲▲▲ 修改結束 ▲▲▲
                
                // Double-check audio is stopped after email launch
                setTimeout(() => {
                    const questionAudio = document.getElementById('question-audio');
                    if (questionAudio && !questionAudio.paused) {
                        questionAudio.pause();
                        questionAudio.currentTime = 0;
                    }
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                        currentAudio = null;
                    }
                }, 500);
                
            } catch (e) {
                console.error('發送郵件失敗:', e);
            }
        }

        // Subtitle tracking function (Unchanged)
        function setupSubtitleTracking(audio, track) {
            document.getElementById('subtitle-korean').textContent = '';
            document.getElementById('subtitle-chinese').textContent = '';
            
            if (track.src) {
                fetch(track.src)
                    .then(response => response.text())
                    .then(vttText => {
                        const cues = parseVTT(vttText);
                        
                        audio.addEventListener('timeupdate', () => {
                            if (captionsEnabled) {
                                const currentTime = audio.currentTime;
                                const activeCue = cues.find(cue => 
                                    currentTime >= cue.start && currentTime <= cue.end
                                );
                                
                                if (activeCue) {
                                    const lines = activeCue.text.split('\n');
                                    document.getElementById('subtitle-korean').textContent = lines[0] || '';
                                    document.getElementById('subtitle-chinese').textContent = lines[1] || '';
                                } else {
                                    document.getElementById('subtitle-korean').textContent = '';
                                    document.getElementById('subtitle-chinese').textContent = '';
                                }
                            }
                        });
                    })
                    .catch(err => console.log('VTT loading failed:', err));
            }
        }
        
        function parseVTT(vttText) {
            const cues = [];
            const lines = vttText.split('\n');
            let i = 0;
            
            while (i < lines.length) {
                if (lines[i].includes('-->')) {
                    const timeLine = lines[i];
                    const times = timeLine.split(' --> ');
                    const start = parseTime(times[0]);
                    const end = parseTime(times[1]);
                    
                    i++;
                    let text = '';
                    while (i < lines.length && lines[i].trim() !== '') {
                        if (text) text += '\n';
                        text += lines[i];
                        i++;
                    }
                    
                    cues.push({ start, end, text });
                }
                i++;
            }
            
            return cues;
        }
        
        function parseTime(timeStr) {
            const parts = timeStr.split(':');
            const seconds = parts[parts.length - 1].split(',')[0];
            const minutes = parts[parts.length - 2] || 0;
            const hours = parts[parts.length - 3] || 0;
            
            return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
        }

        function playAudio(audioUrl) {
            if (currentAudio) {
                currentAudio.pause();
            }
            
            currentAudio = new Audio(audioUrl);
            currentAudio.play();
            
            currentAudio.onended = () => {
                currentAudio = null;
            };
        }

        function fadeOutAudio(audio, duration = 1000, callback) {
            if (!audio || audio.paused) {
                if (callback) callback();
                return;
            }
            const originalVolume = audio.volume;
            const steps = 10;
            const stepTime = duration / steps;
            const volumeStep = originalVolume / steps;

            const fadeInterval = setInterval(() => {
                if (audio.volume > volumeStep) {
                    audio.volume -= volumeStep;
                } else {
                    clearInterval(fadeInterval);
                    audio.pause();
                    audio.volume = originalVolume;
                    if (callback) callback();
                }
            }, stepTime);
        }

        function fadeOutCurrentAudio(audio) {
            const fadeAudio = setInterval(() => {
                if (audio.volume > 0.1) {
                    audio.volume -= 0.1;
                } else {
                    clearInterval(fadeAudio);
                    audio.pause();
                    audio.volume = 1.0;
                }
            }, 100);
        }

        function setPlaybackSpeed(speed) {
            const audio = document.getElementById('question-audio');
            
            if (audioSpeed === speed) {
                audioSpeed = 1.0;
                audio.playbackRate = 1.0;
                document.getElementById('speed-50').classList.remove('active');
                document.getElementById('speed-75').classList.remove('active');
            } else {
                audioSpeed = speed;
                audio.playbackRate = speed;
                document.getElementById('speed-50').classList.toggle('active', speed === 0.5);
                document.getElementById('speed-75').classList.toggle('active', speed === 0.75);
            }
            
            closeOverflowPanel();
        }

        function toggleCaptions() {
            captionsEnabled = !captionsEnabled;
            const subtitles = document.getElementById('subtitles');
            const captionsBtn = document.getElementById('captions-btn');
            
            if (captionsEnabled) {
                subtitles.style.visibility = 'visible';
                captionsBtn.classList.add('active');
            } else {
                subtitles.style.visibility = 'hidden';
                captionsBtn.classList.remove('active');
                document.getElementById('subtitle-korean').textContent = '';
                document.getElementById('subtitle-chinese').textContent = '';
            }
            
            closeOverflowPanel();
        }

        function closeOverflowPanel() {
            document.getElementById('overflow-panel').classList.add('hidden');
        }

        function createDetailedResults() {
            currentResultsPage = 1;
            return generateResultsPageContent(1);
        }

        function generateResultsPageContent(page) {
            const startIndex = (page - 1) * 2;
            const endIndex = Math.min(startIndex + 2, questionsData.length);
            
            let html = '<div id="results-content-area">';
            
            html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">';
            
            for (let i = startIndex; i < endIndex; i++) {
                const question = questionsData[i];
                const answer = questionAnswers[i + 1];
                const correctImage = question.images[question.correct];
                
                let status = '미응답 (Not Answered)';
                let statusColor = 'text-gray-600';
                
                if (answer) {
                    if (answer.correct) {
                        status = '정답 (Correct)';
                        statusColor = 'text-green-600';
                    } else if (answer.timeout) {
                        status = '시간 초과 (Time\'s Up)';
                        statusColor = 'text-red-600';
                    } else {
                        status = '오답 (Wrong)';
                        statusColor = 'text-red-600';
                    }
                }
                
                let bgColor = 'bg-gray-50'; 
                if (answer) {
                    if (answer.correct) {
                        bgColor = 'bg-green-100'; 
                    } else if (answer.timeout) {
                        bgColor = 'bg-yellow-100'; 
                    } else {
                        bgColor = 'bg-red-100'; 
                    }
                }

                html += `
                    <div class="${bgColor} rounded-xl p-2 border-2 border-gray-200" style="background-color: ${bgColor === 'bg-green-100' ? 'rgba(34, 197, 94, 0.1)' : bgColor === 'bg-yellow-100' ? 'rgba(234, 179, 8, 0.1)' : bgColor === 'bg-red-100' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)'};">
                        <div class="text-center mb-2">
                            <h3 class="font-bold text-lg text-blue-800">
                                Q${i + 1} <span class="${statusColor} font-semibold">${status}</span>
                            </h3>
                        </div>
                        
                        <div class="flex justify-center mb-2">
                            <div class="relative flex-shrink-0 w-full max-w-xs lg:max-w-sm">
                                <img src="${correctImage}" alt="Correct Answer" class="w-full h-auto object-contain max-h-80" 
                                     oncontextmenu="return false;" ondragstart="return false;" 
                                     style="pointer-events: none; user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
                                <button onclick="toggleResultAudio(${i + 1})" 
                                        class="absolute btn-primary btn-hover text-xs flex items-center justify-center overflow-hidden"
                                        id="play-btn-${i + 1}" 
                                        style="bottom: 8px; right: 8px; height: 36px; width: 75px; z-index: 10; border-radius: 8px; padding: 4px 8px;">
                                    <div class="absolute inset-0 bg-blue-300 transition-all duration-100 ease-linear" 
                                         id="progress-${i + 1}" style="width: 0%; z-index: 0;"></div>
                                    <div class="relative z-10 flex items-center">
                                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24" id="speaker-result-${i + 1}" style="transform: scale(1.2);">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                        </svg>
                                        <span style="font-size: 0.9rem; font-weight: bold;">정답</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        <div class="text-sm bg-white p-2 rounded border">
                            <div id="subtitle-content-${i + 1}" class="leading-relaxed text-center">
                                <div class="text-gray-500">로딩 중...</div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
            
            const totalPages = Math.ceil(questionsData.length / 2);
            if (totalPages > 1) {
                html += '<div class="text-center mb-1">';
                html += '<div class="flex justify-center gap-1 flex-nowrap">';
                
                for (let p = 1; p <= totalPages; p++) {
                    const startQ = (p - 1) * 2 + 1;
                    const endQ = Math.min(p * 2, questionsData.length);
                    const label = endQ === startQ ? `${startQ}` : `${startQ}/${endQ}`;
                    const activeClass = p === page ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700';
                    
                    html += `<button onclick="showResultsPage(${p})" 
                                    class="${activeClass} hover:bg-blue-600 hover:text-white px-3 py-2 rounded font-medium transition-all text-sm whitespace-nowrap" style="transform: scale(1.2);">
                                ${label}
                            </button>`;
                }
                
                html += '</div>';
                html += '</div>';
            }
            
            html += '</div>';
            
            setTimeout(() => {
                for (let i = startIndex; i < endIndex; i++) {
                    loadSubtitleForQuestion(i + 1);
                }
            }, 100);
            
            return html;
        }

        function showResultsPage(page) {
            stopAllResultAudios();
            
            currentResultsPage = page;
            const newContent = generateResultsPageContent(page);
            document.getElementById('results-content-area').outerHTML = newContent;
        }

        function loadSubtitleForQuestion(questionNum) {
            const question = questionsData[questionNum - 1];
            if (!question.vtt) return;
            
            fetch(question.vtt)
                .then(response => response.text())
                .then(vttText => {
                    const cues = parseVTT(vttText);
                    let subtitleHtml = '';
                    
                    const halfLength = Math.ceil(cues.length / 2);
                    const firstHalfCues = cues.slice(0, halfLength);
                    
                    firstHalfCues.forEach(cue => {
                        const lines = cue.text.split('\n');
                        if (lines[0]) {
                            subtitleHtml += `<div class="text-blue-600 font-bold">${lines[0]}</div>`;
                        }
                        if (lines[1]) {
                            subtitleHtml += `<div class="text-gray-600 mb-2">${lines[1]}</div>`;
                        }
                    });
                    
                    const contentElement = document.getElementById(`subtitle-content-${questionNum}`);
                    if (contentElement) {
                        contentElement.innerHTML = subtitleHtml || '<div class="text-gray-500">자막 없음</div>';
                    }
                })
                .catch(err => {
                    const contentElement = document.getElementById(`subtitle-content-${questionNum}`);
                    if (contentElement) {
                        contentElement.innerHTML = '<div class="text-red-500">자막 로딩 실패</div>';
                    }
                    console.log('VTT loading failed:', err);
                });
        }

        function toggleResultAudio(questionNum) {
            const question = questionsData[questionNum - 1];
            const playBtn = document.getElementById(`play-btn-${questionNum}`);
            const progressBar = document.getElementById(`progress-${questionNum}`);
            const speakerIcon = document.getElementById(`speaker-result-${questionNum}`);
            
            Object.keys(resultAudios).forEach(key => {
                if (key != questionNum && resultAudios[key] && !resultAudios[key].paused) {
                    resultAudios[key].pause();
                    const otherBtn = document.getElementById(`play-btn-${key}`);
                    const otherProgress = document.getElementById(`progress-${key}`);
                    const otherSpeaker = document.getElementById(`speaker-result-${key}`);
                    if (otherBtn) {
                        otherBtn.querySelector('.relative.z-10').innerHTML = `
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24" id="speaker-result-${key}" style="transform: scale(1.2);">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                            </svg>
                            <span style="font-size: 0.9rem; font-weight: bold;">정답</span>
                        `;
                    }
                    if (otherProgress) {
                        otherProgress.style.width = '0%';
                    }
                    if (resultAudios[key] && resultAudios[key].waveInterval) {
                        clearInterval(resultAudios[key].waveInterval);
                        resultAudios[key].waveInterval = null;
                    }
                }
            });
            
            if (resultAudios[questionNum] && !resultAudios[questionNum].paused) {
                resultAudios[questionNum].pause();
                if (resultAudios[questionNum].waveInterval) {
                    clearInterval(resultAudios[questionNum].waveInterval);
                    resultAudios[questionNum].waveInterval = null;
                }
                speakerIcon.innerHTML = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
                speakerIcon.style.color = '';
            } else {
                if (!resultAudios[questionNum]) {
                    resultAudios[questionNum] = new Audio(question.audio);
                    
                    resultAudios[questionNum].addEventListener('timeupdate', () => {
                        if (resultAudios[questionNum].duration) {
                            const progress = (resultAudios[questionNum].currentTime / resultAudios[questionNum].duration) * 100;
                            if (progressBar) {
                                progressBar.style.width = progress + '%';
                            }
                        }
                    });
                    
                    resultAudios[questionNum].onended = () => {
                        if (resultAudios[questionNum].waveInterval) {
                            clearInterval(resultAudios[questionNum].waveInterval);
                            resultAudios[questionNum].waveInterval = null;
                        }
                        const endSpeaker = document.getElementById(`speaker-result-${questionNum}`);
                        if (endSpeaker) {
                            endSpeaker.innerHTML = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
                            endSpeaker.style.color = '';
                            endSpeaker.style.transform = 'scale(1.2)';
                        }
                        if (progressBar) {
                            progressBar.style.width = '0%';
                        }
                    };
                }
                
                speakerIcon.style.color = '#22c55e'; 
                const noWavePath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>`;
                const oneWavePath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
                const twoWavePath = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM19 12c0-2.76-1.46-5.18-3.64-6.53v1.8c1.47 1.07 2.64 2.89 2.64 4.73 0 1.84-1.17 3.66-2.64 4.73v1.8C17.54 17.18 19 14.76 19 12z"/>`;
                
                const wavePaths = [noWavePath, oneWavePath, twoWavePath];
                let currentWaveIndex = 0;
                
                resultAudios[questionNum].waveInterval = setInterval(() => {
                    if (speakerIcon) {
                        speakerIcon.innerHTML = wavePaths[currentWaveIndex];
                        currentWaveIndex = (currentWaveIndex + 1) % 3;
                    }
                }, 200);
                
                resultAudios[questionNum].play();
            }
        }

        function stopAllResultAudios() {
            Object.values(resultAudios).forEach(audio => {
                if (audio && !audio.paused) {
                    audio.pause();
                }
                if (audio && audio.waveInterval) {
                    clearInterval(audio.waveInterval);
                    audio.waveInterval = null;
                }
            });
            
            Object.keys(resultAudios).forEach(key => {
                const btn = document.getElementById(`play-btn-${key}`);
                const progress = document.getElementById(`progress-${key}`);
                const speaker = document.getElementById(`speaker-result-${key}`);
                if (btn) {
                    const contentDiv = btn.querySelector('.relative.z-10');
                    if (contentDiv) {
                        contentDiv.innerHTML = `
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24" id="speaker-result-${key}" style="transform: scale(1.2);">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                            </svg>
                            <span style="font-size: 0.9rem; font-weight: bold;">정답</span>
                        `;
                    }
                }
                if (progress) {
                    progress.style.width = '0%';
                }
                if (speaker) {
                    speaker.style.color = '';
                }
            });
        }

        function createConfetti() {
            const colors = ['#f39c12', '#e74c3c', '#9b59b6', '#3498db', '#2ecc71'];
            
            // 數量從 350 暴增至 1500，製造真正的密集感
            const particleCount = 1500; 
            
            // 設定產生區間為 16000 毫秒 (16秒)
            // 這樣可以確保在第 14 秒音樂結束時，彩帶雨仍然很強烈
            // 加上 3 秒落下動畫，總視覺時間約 19 秒
            const duration = 16000; 

            for (let i = 0; i < particleCount; i++) {
                // 隨機延遲
                const delay = Math.random() * duration;

                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    
                    // 隨機位置
                    confetti.style.left = Math.random() * 100 + 'vw';
                    // 隨機顏色
                    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    
                    // 隨機微調寬度，讓畫面看起來更自然不生硬 (選用)
                    confetti.style.width = (Math.random() * 5 + 8) + 'px';
                    confetti.style.height = (Math.random() * 5 + 8) + 'px';
                    
                    document.body.appendChild(confetti);
                    
                    // 配合 CSS 動畫時間 (3秒)，3秒後移除
                    setTimeout(() => {
                        confetti.remove();
                    }, 3000);
                }, delay);
            }
        }

        document.getElementById('overflow-btn').addEventListener('click', () => {
            const panel = document.getElementById('overflow-panel');
            panel.classList.toggle('hidden');
        });

        document.addEventListener('DOMContentLoaded', () => {
            showPage('page1');
            
            const mask = document.getElementById('intro-mask');
            const okBtn = document.getElementById('intro-ok-btn');
            const introAudio = document.getElementById('intro-audio');

            setTimeout(() => {
                mask.classList.remove('opacity-0');
            }, 100);

            okBtn.addEventListener('click', () => {
                if (introAudio) {
                    introAudio.volume = 0.5;
                    introAudio.play().catch(e => console.log("Audio play failed:", e));
                }

                mask.classList.add('opacity-0');

                setTimeout(() => {
                    mask.classList.add('hidden');
                }, 500);

                idleTimer = setTimeout(() => {
                    const idleHint = document.getElementById('idle-hint');
                    idleHint.classList.remove('hidden');
                    idleHint.classList.add('fade-in');
                }, 15000);
            });
        });