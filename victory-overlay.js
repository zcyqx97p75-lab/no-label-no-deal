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

        // Nach 2.4.2026: Protest-Overlay nicht mehr (Hero + Story auf der Seite)
        if (typeof window.isPostDemoPhase === 'function' && window.isPostDemoPhase()) {
            overlay.style.display = 'none';
            const shareBar = document.getElementById('shareBar');
            if (shareBar) shareBar.style.display = 'flex';
            return;
        }

        // Update text content
        document.getElementById('vicHeadline').textContent = getVictoryTranslation('vicHeadline');
        document.getElementById('vicSubline1').textContent = getVictoryTranslation('vicSubline1');
        document.getElementById('vicSubline2').textContent = getVictoryTranslation('vicSubline2');
        document.getElementById('vicClaim').textContent = getVictoryTranslation('vicClaim');
        document.getElementById('vicExplain').textContent = getVictoryTranslation('vicExplain');
        document.getElementById('btnStartLobby').textContent = getVictoryTranslation('btnStartLobby');

        const posterImg = document.getElementById('vicPosterImg');
        if (posterImg) {
            const alt = getVictoryTranslation('vicPosterAlt');
            if (alt && alt !== 'vicPosterAlt') posterImg.alt = alt;
        }

        // „Jetzt mitmachen“ – zuerst Erklärungstext, dann Sprache & Land
        const btnStartLobby = document.getElementById('btnStartLobby');
        if (btnStartLobby && !btnStartLobby.dataset.lobbyistBound) {
            btnStartLobby.dataset.lobbyistBound = '1';
            btnStartLobby.addEventListener('click', function() {
                const intro = document.getElementById('introLobbySection');
                const langSection = document.getElementById('languageCountrySection');
                if (langSection) langSection.style.display = 'none';
                closeOverlay();
                window.location.hash = 'introLobbySection';
                if (intro) {
                    intro.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (langSection) {
                    langSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    const ctaBtn = document.getElementById('petitionHeroCTA');
                    if (ctaBtn) ctaBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }

        // Show overlay immediately
        overlay.style.display = 'flex';
    }

    // Close overlay
    function closeOverlay() {
        const overlay = document.getElementById('victoryOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        // Ensure Share Bar is visible after closing overlay
        const shareBar = document.getElementById('shareBar');
        if (shareBar) {
            shareBar.style.display = 'flex';
        }
    }

    // Scroll to target section (Sprache & Land)
    function scrollToTarget() {
        const target = document.getElementById('languageCountrySection');
        if (target) {
            target.style.display = 'block';
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
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

    // Initialize Share Bar
    function initShareBar() {
        const shareBar = document.getElementById('shareBar');
        if (!shareBar) {
            console.warn('Share Bar element not found');
            return;
        }
        
        const contactsSection = document.getElementById('contactsSection');
        const onContactsPage = contactsSection && contactsSection.style.display !== 'none';
        shareBar.style.display = onContactsPage ? 'none' : 'flex';
        console.log('Share Bar initialized, display:', shareBar.style.display);

        const title = document.getElementById('shareBarTitle');
        const shareBtn = document.getElementById('shareWhatsAppMain');
        const copyBtn = document.getElementById('copyLinkMain');
        const viberBtnShareBar = document.getElementById('btnViberChannelShareBar');
        
        console.log('Share Bar elements found:', {
            title: !!title,
            shareBtn: !!shareBtn,
            copyBtn: !!copyBtn,
            viberBtn: !!viberBtnShareBar
        });

        if (title) {
            title.textContent = getVictoryTranslation('shareBarTitle');
            console.log('Share Bar Title set:', title.textContent);
        } else {
            console.warn('Share Bar Title element not found');
        }
        
        if (shareBtn) {
            const span = shareBtn.querySelector('span');
            if (span) {
                span.textContent = getVictoryTranslation('shareWhatsAppMain');
                console.log('WhatsApp button text set:', span.textContent);
            } else {
                console.warn('WhatsApp button span not found');
            }
            // Remove old listener if exists, then add new one
            shareBtn.onclick = null;
            shareBtn.addEventListener('click', shareOnWhatsApp);
        } else {
            console.warn('WhatsApp button not found');
        }
        
        if (copyBtn) {
            const span = copyBtn.querySelector('span');
            if (span) {
                span.textContent = getVictoryTranslation('copyLinkMain');
                console.log('Copy Link button text set:', span.textContent);
            } else {
                console.warn('Copy Link button span not found');
            }
            // Remove old listener if exists, then add new one
            copyBtn.onclick = null;
            copyBtn.addEventListener('click', copyLink);
        } else {
            console.warn('Copy Link button not found');
        }
        
        if (viberBtnShareBar) {
            const span = viberBtnShareBar.querySelector('span');
            if (span) {
                span.textContent = getVictoryTranslation('BTN_VIBER_CHANNEL');
                console.log('Viber button text set:', span.textContent);
            } else {
                console.warn('Viber button span not found');
            }
            // Remove old listener if exists, then add new one
            viberBtnShareBar.onclick = null;
            viberBtnShareBar.addEventListener('click', () => {
                window.open(VIBER_CHANNEL_URL, '_blank', 'noopener,noreferrer');
            });
        } else {
            console.warn('Viber button not found');
        }

        // Share Bar ausblenden, wenn Footer im Viewport ist – aber nie auf der Mandatare-Kontaktseite anzeigen
        setTimeout(() => {
            const footer = document.querySelector('.footer');
            const contactsSection = document.getElementById('contactsSection');
            if (footer) {
                const observer = new IntersectionObserver((entries) => {
                    const onContactsPage = contactsSection && contactsSection.style.display !== 'none';
                    if (onContactsPage) {
                        shareBar.style.display = 'none';
                        return;
                    }
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            shareBar.style.display = 'none';
                        } else {
                            shareBar.style.display = 'flex';
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                });

                observer.observe(footer);
            }
        }, 500);
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
                const overlay = document.getElementById('victoryOverlay');
                if (overlay && overlay.style.display !== 'none') {
                    initVictoryOverlay();
                }
                initShareBar();
            };
        }
    }
})();
