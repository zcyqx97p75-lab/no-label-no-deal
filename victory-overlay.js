// Victory Overlay and Share Tools
(function() {
    'use strict';

    // Viber Channel URL - central constant, reused everywhere
    const VIBER_CHANNEL_URL = "https://invite.viber.com/?g2=AQBNQ0jEeiZmnFX5wLjxHb92YUzC%2Futi0p11vHwaQWRDnuVZaJu6BeMV4m047%2BcV";

    // Get current language from script.js or default to 'de'
    function getCurrentLanguage() {
        // Use global selectedLanguage from script.js if available
        if (typeof selectedLanguage !== 'undefined' && selectedLanguage) {
            return selectedLanguage;
        }
        // Try to detect browser language if detectBrowserLanguage is available
        if (typeof detectBrowserLanguage === 'function') {
            return detectBrowserLanguage();
        }
        // Try to get from localStorage or default
        return localStorage.getItem('selectedLanguage') || 'de';
    }

    // Get translation - use global getTranslation from script.js if available
    function getVictoryTranslation(key) {
        if (typeof getTranslation === 'function') {
            const lang = getCurrentLanguage();
            return getTranslation(lang, key);
        }
        // Fallback
        const lang = getCurrentLanguage();
        if (typeof translations !== 'undefined' && translations[lang] && translations[lang].ui) {
            return translations[lang].ui[key] || key;
        }
        return key;
    }

    // Initialize Victory Overlay (only on index.html)
    function initVictoryOverlay() {
        const overlay = document.getElementById('victoryOverlay');
        if (!overlay) return;

        // Only show overlay on index.html (homepage)
        const isHomepage = window.location.pathname === '/' || 
                          window.location.pathname === '/index.html' ||
                          window.location.pathname.endsWith('/');
        if (!isHomepage) {
            overlay.style.display = 'none';
            return;
        }

        // Update text content
        document.getElementById('vicHeadline').textContent = getVictoryTranslation('vicHeadline');
        document.getElementById('vicSubline1').textContent = getVictoryTranslation('vicSubline1');
        document.getElementById('vicSubline2').textContent = getVictoryTranslation('vicSubline2');
        document.getElementById('vicClaim').textContent = getVictoryTranslation('vicClaim');
        document.getElementById('vicExplain').textContent = getVictoryTranslation('vicExplain');
        document.getElementById('btnStartLobby').textContent = getVictoryTranslation('btnStartLobby');
        document.getElementById('btnCloseOverlay').textContent = getVictoryTranslation('btnCloseOverlay');
        document.getElementById('btnShareWhatsApp').textContent = getVictoryTranslation('btnShareWhatsApp');
        document.getElementById('btnCopyLink').textContent = getVictoryTranslation('btnCopyLink');
        document.getElementById('btnViberChannelOverlay').textContent = getVictoryTranslation('BTN_VIBER_CHANNEL');

        // Initialize canvas animation
        initFireworksAnimation();

        // Button event listeners
        document.getElementById('btnStartLobby').addEventListener('click', () => {
            closeOverlay();
            scrollToTarget();
        });
        document.getElementById('btnCloseOverlay').addEventListener('click', closeOverlay);
        document.getElementById('btnShareWhatsApp').addEventListener('click', shareOnWhatsApp);
        document.getElementById('btnCopyLink').addEventListener('click', copyLink);
        document.getElementById('btnViberChannelOverlay').addEventListener('click', () => {
            window.open(VIBER_CHANNEL_URL, '_blank', 'noopener,noreferrer');
        });

        // Show overlay immediately
        overlay.style.display = 'flex';
    }

    // Close overlay
    function closeOverlay() {
        const overlay = document.getElementById('victoryOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Scroll to target section
    function scrollToTarget() {
        const target = document.getElementById('languageCountrySection');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Fallback to main CTA button
            const ctaBtn = document.getElementById('petitionHeroCTA');
            if (ctaBtn) {
                ctaBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // Share on WhatsApp
    function shareOnWhatsApp() {
        const shareText = getVictoryTranslation('shareTextWhatsApp');
        
        // Ensure URL uses www. if not already present
        let shareUrl = window.location.href;
        if (!shareUrl.includes('www.')) {
            shareUrl = shareUrl.replace(/^(https?:\/\/)([^\/]+)/, (match, protocol, domain) => {
                return protocol + 'www.' + domain;
            });
        }
        
        // Encode text with emojis properly
        // encodeURIComponent correctly handles UTF-8 emojis
        const text = encodeURIComponent(shareText);
        
        // Use WhatsApp share URL
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }

    // Copy link to clipboard
    function copyLink() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            showToast(getVictoryTranslation('toastCopied'));
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast(getVictoryTranslation('toastCopied'));
            } catch (err) {
                console.error('Failed to copy:', err);
            }
            document.body.removeChild(textArea);
        });
    }

    // Show toast notification
    function showToast(message) {
        const toast = document.getElementById('toastNotification');
        if (!toast) return;

        toast.textContent = message;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    // Fireworks/Confetti Animation
    function initFireworksAnimation() {
        const canvas = document.getElementById('victoryFxCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 150;

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;
                this.life = 1.0;
                this.decay = Math.random() * 0.02 + 0.01;
                this.size = Math.random() * 4 + 2;
                this.color = `hsl(${Math.random() * 60 + 15}, 100%, ${Math.random() * 30 + 50}%)`;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.1; // gravity
                this.life -= this.decay;
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // Initial burst
        function createBurst() {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(centerX, centerY));
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                particle.update();
                particle.draw();

                if (particle.life <= 0) {
                    particles.splice(i, 1);
                }
            }

            // Add occasional new particles for subtle effect
            if (Math.random() < 0.1 && particles.length < 50) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height * 0.5;
                particles.push(new Particle(x, y));
            }

            requestAnimationFrame(animate);
        }

        createBurst();
        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    // Initialize Share Bar
    function initShareBar() {
        const shareBar = document.getElementById('shareBar');
        if (!shareBar) return;

        const title = document.getElementById('shareBarTitle');
        const shareBtn = document.getElementById('shareWhatsAppMain');
        const copyBtn = document.getElementById('copyLinkMain');
        const viberBtnShareBar = document.getElementById('btnViberChannelShareBar');

        if (title) title.textContent = getVictoryTranslation('shareBarTitle');
        if (shareBtn) {
            shareBtn.textContent = getVictoryTranslation('shareWhatsAppMain');
            shareBtn.addEventListener('click', shareOnWhatsApp);
        }
        if (copyBtn) {
            copyBtn.textContent = getVictoryTranslation('copyLinkMain');
            copyBtn.addEventListener('click', copyLink);
        }
        if (viberBtnShareBar) {
            viberBtnShareBar.textContent = getVictoryTranslation('BTN_VIBER_CHANNEL');
            viberBtnShareBar.addEventListener('click', () => {
                window.open(VIBER_CHANNEL_URL, '_blank', 'noopener,noreferrer');
            });
        }

        // Share Bar ausblenden, wenn Footer im Viewport ist
        const footer = document.querySelector('.footer');
        if (footer) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Footer ist sichtbar - Share Bar ausblenden
                        shareBar.style.display = 'none';
                    } else {
                        // Footer ist nicht sichtbar - Share Bar einblenden
                        shareBar.style.display = 'flex';
                    }
                });
            }, {
                threshold: 0.1, // Auslösen, wenn 10% des Footers sichtbar sind
                rootMargin: '0px 0px -50px 0px' // Etwas früher auslösen
            });

            observer.observe(footer);
        }
    }

    // Initialize Viber CTA on main page
    function initViberCTA() {
        const btnViberChannel = document.getElementById('btnViberChannel');
        const helperText = document.querySelector('.viber-helper-text');
        
        if (btnViberChannel) {
            btnViberChannel.textContent = getVictoryTranslation('BTN_VIBER_CHANNEL');
            btnViberChannel.addEventListener('click', () => {
                window.open(VIBER_CHANNEL_URL, '_blank', 'noopener,noreferrer');
            });
        }
        
        if (helperText) {
            helperText.textContent = getVictoryTranslation('VIBER_HELPER_TEXT');
        }
    }

    // Initialize when DOM is ready
    // Wait a bit to ensure script.js has set selectedLanguage
    function initializeVictory() {
        // Small delay to ensure script.js has initialized
        setTimeout(() => {
            initVictoryOverlay();
            initShareBar();
            initViberCTA();
        }, 100);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeVictory);
    } else {
        initializeVictory();
    }

    // Update translations when language changes (if script.js provides this)
    if (typeof window !== 'undefined') {
        const originalUpdateUI = window.updateUI;
        if (originalUpdateUI) {
            window.updateUI = function() {
                originalUpdateUI();
                // Re-initialize overlay and share bar with new language
                const overlay = document.getElementById('victoryOverlay');
                if (overlay && overlay.style.display !== 'none') {
                    initVictoryOverlay();
                }
                initShareBar();
            };
        }
    }
})();
