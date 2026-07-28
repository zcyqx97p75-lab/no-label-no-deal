// Globale Variablen
let mandatare = [];
let selectedLanguage = '';
let selectedCountry = '';
let selectedRole = '';
let showAllCountries = false;
let counter = 0;
let counterFarmer = 0;
let counterConsumer = 0;

// Fraktionsnamen aus CSV (i. d. R. Deutsch) auf Anzeigenamen in Landessprache
const FRACTION_KEY = {
    'der Europäischen Volkspartei (Christdemokraten)': 'epp',
    'der Progressiven Allianz der Sozialdemokraten im Europäischen Parlament': 'sd',
    'Renew Europe': 'renew',
    'der Grünen / Freie Europäische Allianz': 'greens',
    'der Europäischen Konservativen und Reformer': 'ecr',
    'Europa der Souveränen Nationen': 'id',
    'Die Linke im Europäischen Parlament - GUE/NGL': 'gue',
    'Fraktionslos': 'ni',
    'Patrioten für Europa': 'patriots',
    'Fraktion': 'ni'
};
function getFractionDisplayName(fraktion, lang) {
    if (!fraktion) return '';
    const key = FRACTION_KEY[fraktion];
    const langData = translations[lang] || translations.en || {};
    const names = langData.ui?.fractionNames || translations.en?.ui?.fractionNames || {};
    return (key && names[key]) || names[fraktion] || fraktion;
}

// Übersetzungs-Helper (global, stabil)
const getTranslation = (lang, key, vars = {}) => {
    const langData = (typeof translations !== 'undefined' && translations[lang]) || (translations && translations.en) || {};
    const fromUi = (langData.ui && langData.ui[key]) || (translations && translations.en && translations.en.ui && translations.en.ui[key]);
    const direct = langData[key] || (translations && translations.en && translations.en[key]);
    let text = fromUi || direct || key;
    Object.entries(vars || {}).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return text;
};
// Auch als globale Variable bereitstellen (Browser global scope)
if (typeof window !== 'undefined') {
    window.getTranslation = getTranslation;
}

// Ab 2.4.2026: Protest-Overlay aus, neuer Hero + Story-Sektionen
const PROTEST_PHASE_END = new Date('2026-04-02T00:00:00');
function isPostDemoPhase() {
    return new Date() >= PROTEST_PHASE_END;
}
if (typeof window !== 'undefined') {
    window.isPostDemoPhase = isPostDemoPhase;
}

function getPostDemoObject(lang) {
    const pd = translations[lang] && translations[lang].ui && translations[lang].ui.postDemo;
    const enPd = translations.en && translations.en.ui && translations.en.ui.postDemo;
    return pd || enPd || {};
}

function getPostDemoText(lang, key) {
    const o = getPostDemoObject(lang);
    const eno = translations.en && translations.en.ui && translations.en.ui.postDemo;
    const v = o[key];
    if (v !== undefined && v !== '') return v;
    return eno && eno[key] !== undefined ? eno[key] : '';
}

function escapeHtmlForStory(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function fillStoryBulletList(elementId, items) {
    const el = document.getElementById(elementId);
    if (!el || !Array.isArray(items)) return;
    el.innerHTML = items.map(t => `<li>${escapeHtmlForStory(t)}</li>`).join('');
}

function applyPostDemoUI(lang) {
    if (!isPostDemoPhase()) return;
    const o = getPostDemoObject(lang);
    const eno = translations.en.ui.postDemo;
    const g = (k) => (o[k] !== undefined && o[k] !== '' ? o[k] : (eno[k] !== undefined ? eno[k] : ''));

    const setText = (id, key) => {
        const node = document.getElementById(id);
        if (node) node.textContent = g(key);
    };

    setText('postHeroHeadline', 'heroHeadline');
    setText('postHeroSubline', 'heroSubline');
    setText('postHeroBody', 'heroBody');
    setText('postHeroBtnLearn', 'btnLearnMore');
    setText('postHeroBtnWhy', 'btnWhyBeginning');

    const heroImg = document.getElementById('postHeroImg');
    const honeyImg = document.getElementById('storyHoneyImg');
    const altH = g('imgHeroAlt');
    if (heroImg) heroImg.alt = altH;
    if (honeyImg) honeyImg.alt = g('imgHoneyAlt');

    setText('storyHoneyBadge', 'honeyBadge');
    setText('storyHoneyTitle', 'honeyTitle');
    fillStoryBulletList('storyHoneyBullets', Array.isArray(o.honeyBullets) ? o.honeyBullets : eno.honeyBullets);
    setText('storyHoneyKey', 'honeyKey');

    setText('storyBioBadge', 'bioBadge');
    setText('storyBioTitle', 'bioTitle');
    setText('storyBioIntro', 'bioIntro');
    setText('storyBioHighlight', 'bioHighlight');
    fillStoryBulletList('storyBioBullets', Array.isArray(o.bioBullets) ? o.bioBullets : eno.bioBullets);
    setText('storyBioKey', 'bioKey');

    setText('storyMessageBadge', 'messageBadge');
    setText('storyMessageTitle', 'messageTitle');
    setText('storyMessageBody', 'messageBody');
    setText('storyMessageKey', 'messageKey');

    setText('storySharedBadge', 'sharedBadge');
    setText('storySharedTitle', 'sharedTitle');
    fillStoryBulletList('storySharedBullets', Array.isArray(o.sharedBullets) ? o.sharedBullets : eno.sharedBullets);
    setText('storySharedKey', 'sharedKey');

    setText('storyCtaBadge', 'ctaBadge');
    setText('storyCtaTitle', 'ctaTitle');
    setText('storyCtaBody', 'ctaBody');
    setText('storyCtaBtnShop', 'ctaBtnShop');
    setText('storyCtaBtnFarm', 'ctaBtnFarm');
    setText('storyCtaBtnShare', 'ctaBtnShare');
}

function initPostDemoPhaseLayout() {
    if (!isPostDemoPhase()) return;
    document.body.classList.add('post-demo-phase', 'theme-friendly');
    const heroLegacy = document.getElementById('hero');
    const heroPost = document.getElementById('heroPostDemo');
    const story = document.getElementById('storySections');
    const howSteps = document.getElementById('how-it-works');
    const privacyAdv = document.getElementById('privacyAdvantageSection');
    if (heroLegacy) {
        heroLegacy.hidden = true;
        heroLegacy.style.display = 'none';
        heroLegacy.setAttribute('aria-hidden', 'true');
    }
    if (heroPost) {
        heroPost.hidden = false;
        heroPost.removeAttribute('aria-hidden');
        heroPost.style.display = '';
    }
    [howSteps, privacyAdv, story].forEach((el) => {
        if (!el) return;
        el.hidden = false;
        el.removeAttribute('aria-hidden');
        el.style.display = '';
    });
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn('Scroll target not found:', id);
        return;
    }
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-offset').trim();
    const offset = parseInt(raw, 10) || 88;
    const top = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - offset);
    window.scrollTo({ top, behavior: 'smooth' });
    requestAnimationFrame(() => {
        if (typeof el.focus === 'function') {
            try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        }
    });
}
window.scrollToSection = scrollToSection;

function handleHashNavigation() {
    const hash = (window.location.hash || '').replace(/^#/, '');
    const allowed = ['step-language-country', 'mep-selection', 'petition', 'about', 'how-it-works', 'step-role', 'message-editor'];
    if (!hash || !allowed.includes(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    if (hash === 'step-role') el.style.display = 'block';
    if (hash === 'mep-selection' || hash === 'message-editor') {
        const mep = document.getElementById('mep-selection');
        if (mep) mep.style.display = 'block';
    }
    if (hash === 'petition') {
        const pet = document.getElementById('petition');
        if (pet) pet.style.display = 'block';
    }
    setTimeout(() => scrollToSection(hash), 80);
}

const COUNTRY_FLAGS = {
    'Deutschland': '🇩🇪', 'Österreich': '🇦🇹', 'Belgien': '🇧🇪', 'Bulgarien': '🇧🇬',
    'Dänemark': '🇩🇰', 'Estland': '🇪🇪', 'Finnland': '🇫🇮', 'Frankreich': '🇫🇷',
    'Griechenland': '🇬🇷', 'Irland': '🇮🇪', 'Italien': '🇮🇹', 'Kroatien': '🇭🇷',
    'Lettland': '🇱🇻', 'Litauen': '🇱🇹', 'Luxemburg': '🇱🇺', 'Malta': '🇲🇹',
    'Niederlande': '🇳🇱', 'Polen': '🇵🇱', 'Portugal': '🇵🇹', 'Rumänien': '🇷🇴',
    'Schweden': '🇸🇪', 'Slowakei': '🇸🇰', 'Slowenien': '🇸🇮', 'Spanien': '🇪🇸',
    'Tschechien': '🇨🇿', 'Ungarn': '🇭🇺', 'Zypern': '🇨🇾'
};

const MEP_PLACEHOLDER = 'assets/mep-placeholder.svg';
let selectedComposeEmail = '';
let googleTranslateLoaded = false;
let shareBarUnlocked = false;
window.__shareBarNearBottom = false;

function setShareBarVisible(visible) {
    const shareBar = document.getElementById('shareBar');
    if (!shareBar) return;
    if (visible) {
        shareBar.hidden = false;
        shareBar.style.display = 'flex';
        shareBar.removeAttribute('aria-hidden');
        shareBar.classList.remove('is-hidden');
    } else {
        shareBar.hidden = true;
        shareBar.style.display = 'none';
        shareBar.setAttribute('aria-hidden', 'true');
        shareBar.classList.add('is-hidden');
    }
}

function refreshShareBarVisibility() {
    const shouldShow = !!shareBarUnlocked || !!window.__shareBarNearBottom;
    setShareBarVisible(shouldShow);
}
window.refreshShareBarVisibility = refreshShareBarVisibility;

function unlockShareBarAfterContact() {
    shareBarUnlocked = true;
    setShareBarVisible(true);
}
window.unlockShareBarAfterContact = unlockShareBarAfterContact;

// Petition-Konfiguration
const petitionStatus = 'pending'; // 'pending' oder 'approved'
const PETITION_SIGNATURE_URL = 'https://placeholder-url.com/sign'; // Externe URL für Unterzeichnung

// Frontend-Rate-Limit für Mandatare (localStorage)
const EMAIL_RATE_LIMIT_MS = 24 * 60 * 60 * 1000;
let lastRateLimitEmail = '';
function getEmailRateLimitKey(email) {
    if (!email) return '';
    return `emailRateLimit:${encodeURIComponent(email.trim().toLowerCase())}`;
}
function getEmailLastSent(email) {
    const key = getEmailRateLimitKey(email);
    if (!key) return 0;
    const raw = localStorage.getItem(key);
    const ts = parseInt(raw, 10);
    return Number.isFinite(ts) ? ts : 0;
}
function getRemainingRateLimitMs(email) {
    const last = getEmailLastSent(email);
    if (!last) return 0;
    const remaining = EMAIL_RATE_LIMIT_MS - (Date.now() - last);
    return remaining > 0 ? remaining : 0;
}
function isEmailRateLimited(email) {
    return getRemainingRateLimitMs(email) > 0;
}
function setEmailRateLimit(email) {
    const key = getEmailRateLimitKey(email);
    if (!key) return;
    localStorage.setItem(key, Date.now().toString());
}
function formatRemainingTime(ms, lang) {
    const totalMinutes = Math.ceil(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (lang === 'de') {
        if (hours > 0 && minutes > 0) return `${hours} Std. ${minutes} Min.`;
        if (hours > 0) return `${hours} Std.`;
        return `${minutes} Min.`;
    }
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
}
function getRateLimitMessage(lang, remainingMs) {
    const timeText = formatRemainingTime(remainingMs, lang);
    return getTranslation(lang, 'emailRateLimitWarning', { time: timeText });
}
function showRateLimitWarning(show, lang, email) {
    const el = document.getElementById('emailRateLimitText');
    if (!el) return;
    if (show && email) {
        const remainingMs = getRemainingRateLimitMs(email);
        if (remainingMs > 0) {
            el.textContent = getRateLimitMessage(lang, remainingMs);
            el.style.display = 'block';
            lastRateLimitEmail = email;
            return;
        }
    } else {
        el.textContent = '';
        el.style.display = 'none';
        lastRateLimitEmail = '';
    }
    el.textContent = '';
    el.style.display = 'none';
    lastRateLimitEmail = '';
}
function updateRateLimitUI() {
    const lang = selectedLanguage || detectBrowserLanguage();
    const buttons = document.querySelectorAll('.mandatar-email-send-btn[data-email]');
    buttons.forEach(btn => {
        const email = btn.dataset.email || '';
        const remainingMs = getRemainingRateLimitMs(email);
        const limited = remainingMs > 0;
        btn.disabled = limited;
        btn.classList.toggle('is-disabled', limited);
        btn.title = limited ? getRateLimitMessage(lang, remainingMs) : getTranslation(lang, 'sendEmail');
    });
    if (lastRateLimitEmail) {
        showRateLimitWarning(true, lang, lastRateLimitEmail);
    }
}

// translations wird aus translations.js geladen

// Browser-Sprache erkennen - zuverlässigste Methode
function detectBrowserLanguage() {
    // Zuverlässigste Methode: navigator.language (Standard, modernste Browser)
    // Fallback 1: navigator.userLanguage (IE/ältere Browser)
    // Fallback 2: navigator.languages[0] (wenn verfügbar, gibt bevorzugte Sprache zurück)
    const browserLang = navigator.language || 
                       navigator.userLanguage || 
                       (navigator.languages && navigator.languages.length > 0 ? navigator.languages[0] : null) || 
                       'en';
    
    // Sprachcode extrahieren (z.B. 'de-AT' -> 'de', 'en-US' -> 'en')
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Unterstützte Sprachen
    const supportedLanguages = ['de', 'en', 'fr', 'es', 'it', 'pl', 'nl', 'pt', 'cs', 'hu', 'sk', 'sl', 'hr', 'ro', 'bg', 'da', 'sv', 'fi', 'lt', 'lv', 'et', 'mt', 'el', 'ga'];
    
    // Prüfen ob Sprache unterstützt wird, sonst Englisch als Fallback
    return supportedLanguages.includes(langCode) ? langCode : 'en';
}

// UI-Texte aktualisieren
function updateUITexts(lang) {
    // HTML lang Attribut setzen
    document.documentElement.lang = lang;
    
    // Hero-Bereich und Intro Lobby
    const introLobbyTitle = document.getElementById('introLobbyTitle');
    if (introLobbyTitle) introLobbyTitle.textContent = getTranslation(lang, 'introLobbyTitle');
    const introLobbyP1 = document.getElementById('introLobbyP1');
    if (introLobbyP1) introLobbyP1.textContent = getTranslation(lang, 'introLobbyP1');
    const introLobbyP2 = document.getElementById('introLobbyP2');
    if (introLobbyP2) introLobbyP2.textContent = getTranslation(lang, 'introLobbyP2');
    const introLobbyP3 = document.getElementById('introLobbyP3');
    if (introLobbyP3) introLobbyP3.textContent = getTranslation(lang, 'introLobbyP3');
    const introLobbyContinue = document.getElementById('introLobbyContinue');
    if (introLobbyContinue) introLobbyContinue.textContent = getTranslation(lang, 'introLobbyContinue');

    const heroBottomText = document.getElementById('heroBottomText');
    if (heroBottomText) {
        heroBottomText.textContent = getTranslation(lang, 'heroBottomText');
    }

    const heroSubline = document.getElementById('heroSubline');
    if (heroSubline) {
        heroSubline.textContent = getTranslation(lang, 'heroSubline');
    }
    
    // Rotierende Texte aktualisieren
    const langData = translations[lang] || translations.en;
    const rotatingTexts = langData.rotatingTexts || translations.en.rotatingTexts;
    if (rotatingTexts && rotatingTexts.length > 0) {
        const container = document.getElementById('textRotation');
        if (container) {
            currentTextIndex = 0;
            const firstText = rotatingTexts[0];
            renderRotatingText(container, firstText);
        }
    }
    
    // Hero CTA Button
    const heroCTA = document.getElementById('petitionHeroCTA');
    if (heroCTA) {
        const translatedText = getTranslation(lang, 'petitionHeroCTA');
        heroCTA.textContent = translatedText;
        console.log('Hero CTA Button übersetzt:', { lang, translatedText });
    } else {
        console.warn('Hero CTA Button nicht gefunden beim Übersetzen');
    }
    
    // Sprache & Land Auswahl
    const langSection = document.getElementById('step-language-country');
    if (langSection) {
        const h2 = langSection.querySelector('h2');
        if (h2) h2.textContent = getTranslation(lang, 'selectLanguageCountry');
        
        const langLabel = langSection.querySelector('label[for="language"]');
        if (langLabel) langLabel.textContent = getTranslation(lang, 'language');
        
        const countryLabel = langSection.querySelector('label[for="country"]');
        if (countryLabel) countryLabel.textContent = getTranslation(lang, 'country');
        
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) continueBtn.textContent = getTranslation(lang, 'continue');
        
        const hintText = langSection.querySelector('.hint-text');
        if (hintText) hintText.textContent = getTranslation(lang, 'hintSelection');
        
        const pleaseSelect = langSection.querySelector('#language option[value=""]');
        if (pleaseSelect) pleaseSelect.textContent = getTranslation(lang, 'pleaseSelect');
    }
    
    // Rollenabfrage
    const roleSection = document.getElementById('step-role');
    if (roleSection) {
        const h2 = roleSection.querySelector('h2');
        if (h2) h2.textContent = getTranslation(lang, 'selectRole');
        
        const farmerBtn = roleSection.querySelector('[data-role="farmer"]');
        if (farmerBtn) farmerBtn.textContent = getTranslation(lang, 'farmer');
        
        const consumerBtn = roleSection.querySelector('[data-role="consumer"]');
        if (consumerBtn) consumerBtn.textContent = getTranslation(lang, 'consumer');
        
        const hintText = roleSection.querySelector('.hint-text');
        if (hintText) hintText.textContent = getTranslation(lang, 'hintRole');
    }
    
    // Kontaktseite
    const contactsSection = document.getElementById('mep-selection');
    if (contactsSection) {
        const h2 = contactsSection.querySelector('h2');
        if (h2) h2.textContent = getTranslation(lang, 'contactMEPs');
        
        const toggleBtn = document.getElementById('toggleAllBtn');
        if (toggleBtn) {
            if (showAllCountries && selectedCountry) {
                toggleBtn.textContent = getTranslation(lang, 'showOnlyCountry', { country: selectedCountry });
            } else {
                toggleBtn.textContent = getTranslation(lang, 'showAllMEPs');
            }
        }
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = getTranslation(lang, 'searchByName');
            const label = contactsSection.querySelector('label[for="searchInput"]');
            if (label) label.textContent = getTranslation(lang, 'searchByName');
        }
        
        const countryFilter = document.getElementById('countryFilter');
        if (countryFilter) {
            const allOption = countryFilter.querySelector('option[value=""]');
            if (allOption) allOption.textContent = getTranslation(lang, 'allCountries');
            const label = contactsSection.querySelector('label[for="countryFilter"]');
            if (label) label.textContent = getTranslation(lang, 'country');
        }
        
        const fractionFilter = document.getElementById('fractionFilter');
        if (fractionFilter) {
            const allOption = fractionFilter.querySelector('option[value=""]');
            if (allOption) allOption.textContent = getTranslation(lang, 'allFractions');
            const label = contactsSection.querySelector('label[for="fractionFilter"]');
            if (label) {
                const labelText = getTranslation(lang, 'allFractions').replace(/^Alle\s+/i, '');
                label.textContent = labelText;
            }
            // Fraktionsoptionen in Landessprache
            Array.from(fractionFilter.querySelectorAll('option[value]')).forEach(opt => {
                if (opt.value) opt.textContent = getFractionDisplayName(opt.value, lang);
            });
        }
        
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            const nameOption = sortSelect.querySelector('option[value="name"]');
            if (nameOption) nameOption.textContent = getTranslation(lang, 'sortByName');
            const countryOption = sortSelect.querySelector('option[value="country"]');
            if (countryOption) countryOption.textContent = getTranslation(lang, 'sortByCountry');
            const label = contactsSection.querySelector('label[for="sortSelect"]');
            if (label) label.textContent = 'Sortierung'; // Könnte später übersetzt werden
        }
        
        const copyEmailsBtn = document.getElementById('copyEmailsBtn');
        if (copyEmailsBtn) {
            copyEmailsBtn.textContent = getTranslation(lang, 'copyEmails');
        }
        
        const sendEmailBtn = document.getElementById('sendEmailBtn');
        if (sendEmailBtn) {
            sendEmailBtn.textContent = getTranslation(lang, 'sendEmail');
        }
        
        const emailWarningText = document.getElementById('emailWarningText');
        if (emailWarningText) emailWarningText.textContent = getTranslation(lang, 'emailSingleRecipientWarning');

        const emailRateLimitText = document.getElementById('emailRateLimitText');
        if (emailRateLimitText && emailRateLimitText.style.display !== 'none' && lastRateLimitEmail) {
            const remainingMs = getRemainingRateLimitMs(lastRateLimitEmail);
            if (remainingMs > 0) {
                emailRateLimitText.textContent = getRateLimitMessage(lang, remainingMs);
            } else {
                emailRateLimitText.textContent = '';
                emailRateLimitText.style.display = 'none';
                lastRateLimitEmail = '';
            }
        }
        
        const showTextSuggestionsBtn = document.getElementById('showTextSuggestionsBtn');
        if (showTextSuggestionsBtn) showTextSuggestionsBtn.textContent = getTranslation(lang, 'showTextSuggestions');
        
        // Fixer Block: Teilen & Drucken
        const contactsShareTitle = document.getElementById('contactsShareTitle');
        if (contactsShareTitle) contactsShareTitle.textContent = getTranslation(lang, 'shareBarTitle');
        const btnShareWaContacts = document.getElementById('btnShareWhatsAppContacts');
        if (btnShareWaContacts) {
            const span = btnShareWaContacts.querySelector('span');
            if (span) span.textContent = getTranslation(lang, 'shareWhatsAppMain');
        }
        const btnCopyContacts = document.getElementById('btnCopyLinkContacts');
        if (btnCopyContacts) {
            const span = btnCopyContacts.querySelector('span');
            if (span) span.textContent = getTranslation(lang, 'copyLinkMain');
        }
        const btnPrintLabel = document.getElementById('btnPrintContactsLabel');
        if (btnPrintLabel) {
            const printText = getTranslation(lang, 'btnPrint');
            btnPrintLabel.textContent = (printText && printText !== 'btnPrint') ? printText : 'Print';
        }
        
        const textSuggestionsHint = contactsSection.querySelector('.text-suggestions-hint-small p');
        if (textSuggestionsHint) {
            const hintText = getTranslation(lang, 'textSuggestionsHint');
            textSuggestionsHint.innerHTML = hintText.replace('💡', '💡').replace('<strong>', '<strong>').replace('</strong>', '</strong>');
        }
    }
    
    // Footer
    const footer = document.querySelector('.footer');
    if (footer) {
        // Aktualisiere den ersten Paragraph mit dataSource und epPublic
        const epPublic = footer.querySelector('p');
        if (epPublic) {
            epPublic.innerHTML = `<strong>${getTranslation(lang, 'dataSource')}</strong> ${getTranslation(lang, 'epPublic')}`;
        }
        
        // Aktualisiere den zweiten Paragraph mit noDataStored
        const noDataStored = footer.querySelectorAll('p')[1];
        if (noDataStored) {
            noDataStored.textContent = getTranslation(lang, 'noDataStored');
        }
        
        const homeLink = footer.querySelector('a[href="/"], a[href="index.html"]');
        if (homeLink) homeLink.textContent = getTranslation(lang, 'home');
        
        const impressumLink = footer.querySelector('a[href="impressum.html"]');
        if (impressumLink) impressumLink.textContent = getTranslation(lang, 'impressum');
        
        const datenschutzLink = footer.querySelector('a[href="datenschutz.html"]');
        if (datenschutzLink) datenschutzLink.textContent = getTranslation(lang, 'datenschutz');
    }
    
    // Counter
    const counterText = document.querySelector('.counter-text');
    const counterDetail = document.getElementById('counterDetail');
    if (counterText && counter) {
        const formattedCount = formatNumber(counter);
        counterText.innerHTML = getTranslation(lang, 'counterText', { count: formattedCount });
    }
    if (counterDetail && (counterFarmer > 0 || counterConsumer > 0)) {
        const farmerLabel = getTranslation(lang, 'farmer');
        const consumerLabel = getTranslation(lang, 'consumer');
        const formattedFarmer = formatNumber(counterFarmer);
        const formattedConsumer = formatNumber(counterConsumer);
        counterDetail.textContent = `(${farmerLabel}: ${formattedFarmer}, ${consumerLabel}: ${formattedConsumer})`;
        counterDetail.style.display = 'block';
    }

    if (isPostDemoPhase()) {
        applyPostDemoUI(lang);
    }
    applyFriendlyStaticTexts(lang);
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    const homeFab = document.getElementById('homeFab');
    let homeFabTimer;
    if (homeFab) {
        homeFab.style.opacity = '0';
        homeFab.style.pointerEvents = 'none';
        homeFab.style.transition = 'opacity 0.2s ease';
        const showHomeFab = () => {
            homeFab.style.opacity = '1';
            homeFab.style.pointerEvents = 'auto';
            if (homeFabTimer) {
                clearTimeout(homeFabTimer);
            }
            homeFabTimer = setTimeout(() => {
                homeFab.style.opacity = '0';
                homeFab.style.pointerEvents = 'none';
            }, 2000);
        };
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                showHomeFab();
            }
        }, { passive: true });
    }

    initPostDemoPhaseLayout();

    // Browser-Sprache erkennen und setzen
    selectedLanguage = detectBrowserLanguage();
    console.log('Erkannte Sprache:', selectedLanguage);
    document.getElementById('language').value = selectedLanguage;
    document.documentElement.lang = selectedLanguage;
    
    // UI-Texte sofort übersetzen
    updateUITexts(selectedLanguage);
    
    // Rotierende Texte (nur wenn klassischer Hero sichtbar)
    if (!isPostDemoPhase()) {
        const langData = translations[selectedLanguage] || translations.en;
        const rotatingTexts = langData.rotatingTexts || translations.en.rotatingTexts;
        if (rotatingTexts && rotatingTexts.length > 0) {
            const container = document.getElementById('textRotation');
            if (container) {
                currentTextIndex = 0;
                const firstText = rotatingTexts[0];
                if (typeof firstText === 'object' && firstText.role) {
                    container.innerHTML = `
                    <p class="rotating-text active">
                        <strong class="rotating-role">${firstText.role}</strong>
                        ${firstText.text}<br>
                        <button type="button" class="rotating-cta-btn">${firstText.cta}</button>
                    </p>
                `;
                } else {
                    container.innerHTML = `<p class="rotating-text active">${firstText}</p>`;
                }
            }
        }
    }
    
    loadMandatare();
    initEventListeners();
    startTextRotation();
    loadCounter();
    updateCounter();
    loadPetitionContent();
    initPetitionNavigation();
    // Counter bereits beim Laden anzeigen
    document.getElementById('counterSection').style.display = 'block';

    const filtersAccordion = document.getElementById('filtersAccordion');
    if (filtersAccordion && window.matchMedia('(min-width: 800px)').matches) {
        filtersAccordion.open = true;
    }

    refreshShareBarVisibility();

    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);

    // Rate-Limit UI alle 60s aktualisieren
    setInterval(updateRateLimitUI, 60000);
});

// CSV laden und parsen
async function loadMandatare() {
    try {
        const response = await fetch('EU_Parlamentarier_aktuell_mit_Mail.csv');
        const text = await response.text();
        const lines = text.split('\n');
        
        // Header überspringen
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(';');
            if (parts.length >= 7) {
                const epId = (parts[7] || '').trim();
                const photoUrl = (parts[8] || '').trim();
                mandatare.push({
                    vorname: parts[2] || '',
                    name: parts[3] || '',
                    land: parts[4] || '',
                    fraktion: parts[5] || '',
                    email: parts[6] || '',
                    epId,
                    photoUrl: photoUrl || (epId ? `https://www.europarl.europa.eu/mepphoto/${epId}.jpg` : '')
                });
            }
        }
        
        populateFilters();
    } catch (error) {
        console.error('Fehler beim Laden der Mandatare:', error);
    }
}

// Filter-Optionen befüllen
function populateFilters() {
    const countries = [...new Set(mandatare.map(m => m.land).filter(Boolean))].sort();
    const fractions = [...new Set(mandatare.map(m => m.fraktion).filter(Boolean))].sort();
    
    const countryFilter = document.getElementById('countryFilter');
    const fractionFilter = document.getElementById('fractionFilter');
    
    if (!countryFilter || !fractionFilter) {
        console.error('Filter-Elemente nicht gefunden');
        return;
    }
    
    // Bestehende Optionen löschen (außer "Alle Länder" / "Alle Fraktionen")
    while (countryFilter.children.length > 1) {
        countryFilter.removeChild(countryFilter.lastChild);
    }
    while (fractionFilter.children.length > 1) {
        fractionFilter.removeChild(fractionFilter.lastChild);
    }
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
    
    const lang = selectedLanguage || detectBrowserLanguage();
    fractions.forEach(fraction => {
        const option = document.createElement('option');
        option.value = fraction;
        option.textContent = getFractionDisplayName(fraction, lang);
        fractionFilter.appendChild(option);
    });
}

// Event Listeners
function initEventListeners() {
    // Sprache & Land Auswahl
    document.getElementById('language').addEventListener('change', (e) => {
        selectedLanguage = e.target.value;
        updateUITexts(selectedLanguage);
        checkContinueButton();
    });
    document.getElementById('country').addEventListener('change', checkContinueButton);
    document.getElementById('continueBtn').addEventListener('click', handleContinue);

    const introLobbyContinue = document.getElementById('introLobbyContinue');
    if (introLobbyContinue) {
        introLobbyContinue.addEventListener('click', () => {
            const sec = document.getElementById('step-language-country');
            if (sec) {
                sec.style.display = 'block';
                scrollToSection('step-language-country');
            }
        });
    }

    const friendlyHeroCTA = document.getElementById('friendlyHeroCTA');
    if (friendlyHeroCTA) {
        friendlyHeroCTA.addEventListener('click', () => {
            const sec = document.getElementById('step-language-country');
            if (sec) {
                sec.style.display = 'block';
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', '#step-language-country');
                } else {
                    window.location.hash = 'step-language-country';
                }
                scrollToSection('step-language-country');
            }
        });
    }

    const enableGtBtn = document.getElementById('enableGoogleTranslateBtn');
    if (enableGtBtn) {
        enableGtBtn.addEventListener('click', () => loadGoogleTranslateOnDemand());
    }

    const composeOpenMail = document.getElementById('composeOpenMail');
    if (composeOpenMail) composeOpenMail.addEventListener('click', openMailtoFromCompose);
    const composeCopyText = document.getElementById('composeCopyText');
    if (composeCopyText) {
        composeCopyText.addEventListener('click', () => {
            const text = (document.getElementById('composeBody') || {}).value || '';
            const lang = selectedLanguage || detectBrowserLanguage();
            const feedback = document.getElementById('copyFeedback');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    if (feedback) {
                        feedback.textContent = getTranslation(lang, 'sentencesCopied');
                        feedback.style.display = 'block';
                        setTimeout(() => { feedback.style.display = 'none'; }, 2500);
                    }
                });
            }
        });
    }
    const composeCopyEmail = document.getElementById('composeCopyEmail');
    if (composeCopyEmail) {
        composeCopyEmail.addEventListener('click', () => {
            if (!selectedComposeEmail) return;
            const lang = selectedLanguage || detectBrowserLanguage();
            const feedback = document.getElementById('copyFeedback');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(selectedComposeEmail).then(() => {
                    if (feedback) {
                        feedback.textContent = getTranslation(lang, 'emailsCopied');
                        feedback.style.display = 'block';
                        setTimeout(() => { feedback.style.display = 'none'; }, 2500);
                    }
                });
            }
        });
    }

    // Rollenauswahl
    document.querySelectorAll('.btn-role').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedRole = e.target.dataset.role;
            showContactsSection();
        });
    });
    
    // Filter & Suche
    document.getElementById('searchInput').addEventListener('input', filterMandatare);
    document.getElementById('countryFilter').addEventListener('change', filterMandatare);
    document.getElementById('fractionFilter').addEventListener('change', filterMandatare);
    document.getElementById('sortSelect').addEventListener('change', filterMandatare);
    
    // Toggle alle Mandatare
    document.getElementById('toggleAllBtn').addEventListener('click', toggleAllCountries);
    
    // Format Cards und Select All Visible Button entfernt - nicht mehr benötigt
    
    // Copy Button
    const copyEmailsBtn = document.getElementById('copyEmailsBtn');
    if (copyEmailsBtn) {
        copyEmailsBtn.addEventListener('click', copyEmails);
    }
    
    // Send Email Button
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', sendEmail);
    }
    
    // Show Text Suggestions Button
    const showTextSuggestionsBtn = document.getElementById('showTextSuggestionsBtn');
    if (showTextSuggestionsBtn) {
        showTextSuggestionsBtn.addEventListener('click', scrollToTextSuggestions);
    }
    
    // Kontaktseite: Fixer Block Viber + Teilen & Drucken
    initContactsFixedActions();
    
    // Scroll Indicator
    const scrollIndicator = document.getElementById('scrollIndicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const languageCountrySection = document.getElementById('step-language-country');
            if (languageCountrySection) {
                languageCountrySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Rotating CTA Button
    const textRotation = document.getElementById('textRotation');
    if (textRotation) {
        textRotation.addEventListener('click', (event) => {
            const target = event.target.closest('.rotating-cta-btn');
            if (!target) return;
            const languageCountrySection = document.getElementById('step-language-country');
            if (languageCountrySection) {
                languageCountrySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    
    // Petition Hero CTA
    const petitionHeroCTA = document.getElementById('petitionHeroCTA');
    if (petitionHeroCTA) {
        petitionHeroCTA.addEventListener('click', () => {
            window.location.hash = '#petition';
            showPetitionSection();
        });
    }

    // Translate Petition Button
    const translatePetitionBtn = document.getElementById('translatePetitionBtn');
    if (translatePetitionBtn) {
        translatePetitionBtn.addEventListener('click', () => {
            console.log('[Translate] Button clicked');
            const lang = selectedLanguage || detectBrowserLanguage();
            console.log('[Translate] Selected language:', lang);
            checkTranslateDom();
            
            try {
                // Prüfe ob Google Translate Widget verfügbar ist
                if (typeof google !== 'undefined' && google.translate) {
                    console.log('[Translate] Google API available');
                    // Finde das Google Translate Element
                    const translateElement = document.querySelector('.goog-te-combo');
                    console.log('[Translate] .goog-te-combo found:', !!translateElement);
                    if (translateElement) {
                        // Setze die Zielsprache und löse Übersetzung aus
                        const targetLang = lang === 'en' ? 'en' : lang;
                        
                        // Google Translate verwendet andere Sprachcodes
                        const googleLangMap = {
                            'de': 'de', 'en': 'en', 'fr': 'fr', 'es': 'es', 'it': 'it',
                            'pl': 'pl', 'nl': 'nl', 'pt': 'pt', 'cs': 'cs', 'hu': 'hu',
                            'sk': 'sk', 'sl': 'sl', 'hr': 'hr', 'ro': 'ro', 'bg': 'bg',
                            'da': 'da', 'sv': 'sv', 'fi': 'fi', 'lt': 'lt', 'lv': 'lv',
                            'et': 'et', 'mt': 'mt', 'el': 'el', 'ga': 'ga'
                        };
                        
                        const googleLang = googleLangMap[targetLang] || 'en';
                        console.log('[Translate] Target lang:', targetLang, 'mapped:', googleLang);
                        translateElement.value = googleLang;
                        translateElement.dispatchEvent(new Event('change'));
                        console.log('[Translate] Change event dispatched');
                        
                        // Scroll zum Petitionstext
                        const petitionContent = document.getElementById('petitionContent');
                        console.log('[Translate] petitionContent exists:', !!petitionContent);
                        if (petitionContent) {
                            setTimeout(() => {
                                petitionContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 500);
                        }
                    } else {
                        console.warn('[Translate] .goog-te-combo missing, retry in 1s');
                        // Widget noch nicht geladen, warte kurz und versuche es erneut
                        setTimeout(() => {
                        const container = document.getElementById('google_translate_element');
                        console.log('[Translate] Retry widget HTML:', container ? container.innerHTML : 'missing');
                        if (typeof googleTranslateElementInit === 'function') {
                            console.log('[Translate] Retry init call');
                            googleTranslateElementInit();
                        }
                            const translateElementRetry = document.querySelector('.goog-te-combo');
                            console.log('[Translate] Retry .goog-te-combo found:', !!translateElementRetry);
                            if (translateElementRetry) {
                                const googleLangMap = {
                                    'de': 'de', 'en': 'en', 'fr': 'fr', 'es': 'es', 'it': 'it',
                                    'pl': 'pl', 'nl': 'nl', 'pt': 'pt', 'cs': 'cs', 'hu': 'hu',
                                    'sk': 'sk', 'sl': 'sl', 'hr': 'hr', 'ro': 'ro', 'bg': 'bg',
                                    'da': 'da', 'sv': 'sv', 'fi': 'fi', 'lt': 'lt', 'lv': 'lv',
                                    'et': 'et', 'mt': 'mt', 'el': 'el', 'ga': 'ga'
                                };
                                const targetLang = lang === 'en' ? 'en' : lang;
                                const googleLang = googleLangMap[targetLang] || 'en';
                                console.log('[Translate] Retry target lang:', targetLang, 'mapped:', googleLang);
                                translateElementRetry.value = googleLang;
                                translateElementRetry.dispatchEvent(new Event('change'));
                                console.log('[Translate] Retry change event dispatched');
                            } else {
                                console.warn('[Translate] Retry failed, applying cookie fallback');
                                const targetLang = lang === 'en' ? 'en' : lang;
                                setGoogleTranslateCookie(targetLang);
                                console.warn('[Translate] Reload to apply translation cookie');
                                window.location.reload();
                            }
                        }, 1000);
                    }
                } else {
                    console.warn('[Translate] Google Translate Widget not available');
                    alert('Übersetzungsdienst ist nicht verfügbar. Bitte laden Sie die Seite neu.');
                }
            } catch (err) {
                console.error('[Translate] Error during translation', err);
            }
        });
    }

    if (isPostDemoPhase()) {
        const scrollToId = (targetId) => {
            const el = document.getElementById(targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        const postLearn = document.getElementById('postHeroBtnLearn');
        const postWhy = document.getElementById('postHeroBtnWhy');
        if (postLearn) postLearn.addEventListener('click', () => scrollToId('storySectionHoney'));
        if (postWhy) postWhy.addEventListener('click', () => scrollToId('storySectionMessage'));
        const goLang = () => {
            const sec = document.getElementById('step-language-country');
            if (sec) {
                sec.style.display = 'block';
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', '#step-language-country');
                }
                scrollToSection('step-language-country');
            }
        };
        const shop = document.getElementById('storyCtaBtnShop');
        const farm = document.getElementById('storyCtaBtnFarm');
        if (shop) shop.addEventListener('click', goLang);
        if (farm) farm.addEventListener('click', goLang);
        const shareBtn = document.getElementById('storyCtaBtnShare');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                const copyBtn = document.getElementById('copyLinkMain');
                if (copyBtn) copyBtn.click();
            });
        }
    }
}

function checkTranslateDom() {
    const container = document.getElementById('google_translate_element');
    const combo = document.querySelector('.goog-te-combo');
    const petitionContent = document.getElementById('petitionContent');
    const petitionSection = document.getElementById('petition');
    console.log('[Translate] DOM check:', {
        googleTranslateElement: !!container,
        googleTranslateCombo: !!combo,
        petitionContent: !!petitionContent,
        petitionSectionVisible: petitionSection ? petitionSection.style.display : 'n/a'
    });
}

function setGoogleTranslateCookie(lang) {
    const value = `/en/${lang}`;
    const host = window.location.hostname;
    document.cookie = `googtrans=${value};path=/;`;
    document.cookie = `googtrans=${value};path=/;domain=${host};`;
    console.log('[Translate] Cookie set:', value);
}

// Scroll zu Textvorschlägen
function scrollToTextSuggestions() {
    const element = document.getElementById('textSuggestions');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function checkContinueButton() {
    const language = document.getElementById('language').value;
    const country = document.getElementById('country').value;
    const btn = document.getElementById('continueBtn');
    
    btn.disabled = !(language && country);
}

function handleContinue() {
    const languageSelect = document.getElementById('language');
    const countrySelect = document.getElementById('country');
    selectedLanguage = languageSelect ? languageSelect.value : '';
    selectedCountry = countrySelect ? countrySelect.value : '';

    if (!selectedLanguage) {
        if (languageSelect) {
            languageSelect.focus();
            languageSelect.setAttribute('aria-invalid', 'true');
        }
        return;
    }
    if (!selectedCountry) {
        if (countrySelect) {
            countrySelect.focus();
            countrySelect.setAttribute('aria-invalid', 'true');
        }
        return;
    }
    if (languageSelect) languageSelect.removeAttribute('aria-invalid');
    if (countrySelect) countrySelect.removeAttribute('aria-invalid');
    
    // Hero ausblenden, Rollenabfrage anzeigen
    if (isPostDemoPhase()) {
        const hp = document.getElementById('heroPostDemo');
        const ss = document.getElementById('storySections');
        if (hp) hp.style.display = 'none';
        if (ss) ss.style.display = 'none';
    } else {
        const heroEl = document.getElementById('hero');
        if (heroEl) heroEl.style.display = 'none';
    }
    document.getElementById('step-language-country').style.display = 'none';
    const roleSection = document.getElementById('step-role');
    roleSection.style.display = 'block';
    scrollToSection('step-role');
}

function toggleAllCountries() {
    showAllCountries = !showAllCountries;
    const btn = document.getElementById('toggleAllBtn');
    const lang = selectedLanguage || detectBrowserLanguage();
    if (showAllCountries && selectedCountry) {
        btn.textContent = getTranslation(lang, 'showOnlyCountry', { country: selectedCountry });
    } else {
        btn.textContent = getTranslation(lang, 'showAllMEPs');
    }
    filterMandatare();
}

let contactsFixedActionsInitialized = false;
function initContactsFixedActions() {
    if (contactsFixedActionsInitialized) return;
    const shareWaBtn = document.getElementById('btnShareWhatsAppContacts');
    const copyBtn = document.getElementById('btnCopyLinkContacts');
    const printBtn = document.getElementById('btnPrintContacts');
    if (!shareWaBtn) return;
    contactsFixedActionsInitialized = true;
    if (shareWaBtn) {
        shareWaBtn.addEventListener('click', () => {
            const lang = selectedLanguage || detectBrowserLanguage();
            const shareText = (translations[lang] && translations[lang].ui && translations[lang].ui.shareTextWhatsApp) || (translations.en && translations.en.ui && translations.en.ui.shareTextWhatsApp) || '';
            const text = encodeURIComponent(shareText);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        });
    }
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const url = window.location.href;
            const lang = selectedLanguage || detectBrowserLanguage();
            navigator.clipboard.writeText(url).then(() => {
                const toast = document.getElementById('toastNotification');
                if (toast) {
                    toast.textContent = getTranslation(lang, 'toastCopied');
                    toast.style.display = 'block';
                    setTimeout(() => { toast.style.display = 'none'; }, 3000);
                }
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    const toast = document.getElementById('toastNotification');
                    if (toast) {
                        toast.textContent = getTranslation(lang, 'toastCopied');
                        toast.style.display = 'block';
                        setTimeout(() => { toast.style.display = 'none'; }, 3000);
                    }
                } catch (e) {}
                document.body.removeChild(textArea);
            });
        });
    }
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
}

function showContactsSection() {
    document.getElementById('step-role').style.display = 'none';
    document.getElementById('mep-selection').style.display = 'block';
    document.getElementById('counterSection').style.display = 'block';
    
    // Sticky Share Bar erst nach Kontaktaktion oder ganz unten
    refreshShareBarVisibility();
    
    // Counter wird jetzt nur noch beim E-Mail-Versand erhöht, nicht mehr beim Öffnen der Kontaktseite
    
    // Filter befüllen, falls noch nicht geschehen (mit kurzer Verzögerung, damit DOM bereit ist)
    setTimeout(() => {
        if (mandatare.length > 0) {
            populateFilters();
        }
        updateCounter();
        filterMandatare();
        showTextSuggestions();
        scrollToSection('mep-selection');
    }, 100);
}

function filterMandatare() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const countryFilter = document.getElementById('countryFilter').value;
    const fractionFilter = document.getElementById('fractionFilter').value;
    const sortBy = document.getElementById('sortSelect').value;
    
    let filtered = mandatare.filter(m => {
        // Land-Filter
        if (!showAllCountries && m.land !== selectedCountry) {
            return false;
        }
        if (showAllCountries && countryFilter && m.land !== countryFilter) {
            return false;
        }
        
        // Fraktions-Filter
        if (fractionFilter && m.fraktion !== fractionFilter) {
            return false;
        }
        
        // Such-Filter
        if (searchTerm) {
            const fullName = `${m.vorname} ${m.name}`.toLowerCase();
            if (!fullName.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    // Sortieren
    filtered.sort((a, b) => {
        if (sortBy === 'name') {
            return `${a.vorname} ${a.name}`.localeCompare(`${b.vorname} ${b.name}`);
        } else {
            return a.land.localeCompare(b.land);
        }
    });
    
    displayMandatare(filtered);
}

function displayMandatare(mandatareList) {
    const container = document.getElementById('mandatareList');
    if (!container) {
        console.error('mandatareList Container nicht gefunden');
        return;
    }
    container.innerHTML = '';
    container.classList.add('mandatare-grid');
    
    const lang = selectedLanguage || detectBrowserLanguage();
    const writeMsg = getTranslation(lang, 'writeMessage') || getTranslation(lang, 'sendEmail');
    
    mandatareList.forEach((m, index) => {
        const item = document.createElement('article');
        item.className = 'mandatar-card';
        const email = (m.email || '').trim();
        const fullName = `${m.vorname} ${m.name}`.trim();
        const remainingMs = email ? getRemainingRateLimitMs(email) : 0;
        const rateLimited = remainingMs > 0;
        const buttonClass = rateLimited ? 'mandatar-email-send-btn btn-card-message is-disabled' : 'mandatar-email-send-btn btn-card-message';
        const buttonDisabled = rateLimited ? 'disabled' : '';
        const buttonTitle = rateLimited ? getRateLimitMessage(lang, remainingMs) : writeMsg;
        const flag = COUNTRY_FLAGS[m.land] || '🇪🇺';
        const fraction = getFractionDisplayName(m.fraktion, lang);
        const photoSrc = m.photoUrl || MEP_PLACEHOLDER;
        
        item.innerHTML = `
            <label class="mandatar-card-select">
                <input type="checkbox" id="mandatar-${index}" data-email="${email.replace(/"/g, '&quot;')}" aria-label="${fullName}">
                <span class="visually-hidden">${fullName}</span>
            </label>
            <img class="mandatar-photo" src="${photoSrc.replace(/"/g, '&quot;')}" alt="${fullName.replace(/"/g, '&quot;')}" width="120" height="120" loading="lazy" decoding="async" data-fallback="${MEP_PLACEHOLDER}">
            <h3 class="mandatar-name">${fullName}</h3>
            <p class="mandatar-country"><span aria-hidden="true">${flag}</span> ${m.land || ''}</p>
            <p class="mandatar-fraction">${fraction}</p>
            ${email ? `<button type="button" class="${buttonClass}" ${buttonDisabled} data-email="${email.replace(/"/g, '&quot;')}" title="${buttonTitle}">${writeMsg}</button>` : ''}
        `;
        container.appendChild(item);

        const img = item.querySelector('.mandatar-photo');
        if (img) {
            img.addEventListener('error', () => {
                img.onerror = null;
                img.src = MEP_PLACEHOLDER;
            });
        }
        
        if (email) {
            const sendBtn = item.querySelector('.mandatar-email-send-btn');
            if (sendBtn) {
                sendBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openComposeForMandatar(m);
                });
            }
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        document.querySelectorAll('#mandatareList input[type="checkbox"]').forEach((cb) => {
                            if (cb !== checkbox) cb.checked = false;
                        });
                        openComposeForMandatar(m);
                    }
                });
            }
        }
    });
}

function openComposeForMandatar(m) {
    const panel = document.getElementById('message-editor');
    if (!panel || !m) return;
    const lang = selectedLanguage || detectBrowserLanguage();
    selectedComposeEmail = (m.email || '').trim();
    const fullName = `${m.vorname} ${m.name}`.trim();
    const photo = document.getElementById('composePhoto');
    const nameEl = document.getElementById('composeName');
    const metaEl = document.getElementById('composeMeta');
    const bodyEl = document.getElementById('composeBody');
    const subjectEl = document.getElementById('composeSubject');

    if (photo) {
        photo.src = m.photoUrl || MEP_PLACEHOLDER;
        photo.alt = fullName;
        photo.onerror = () => { photo.onerror = null; photo.src = MEP_PLACEHOLDER; };
    }
    if (nameEl) nameEl.textContent = fullName;
    if (metaEl) {
        const flag = COUNTRY_FLAGS[m.land] || '🇪🇺';
        metaEl.textContent = `${flag} ${m.land || ''} · ${getFractionDisplayName(m.fraktion, lang)}`;
    }
    if (subjectEl && !subjectEl.value) subjectEl.value = 'NO LABEL NO DEAL';
    if (bodyEl) {
        const checkedSentences = document.querySelectorAll('#sentenceList input[type="checkbox"]:checked');
        const sentences = Array.from(checkedSentences).map(cb => cb.dataset.sentence.replace(/&quot;/g, '"'));
        if (sentences.length > 0) {
            bodyEl.value = sentences.join('\n');
        } else if (!bodyEl.value) {
            const suggestions = getTextSuggestions();
            bodyEl.value = suggestions[0] || '';
        }
    }

    // sync checkbox selection to this MEP only
    document.querySelectorAll('#mandatareList input[type="checkbox"]').forEach((cb) => {
        cb.checked = cb.dataset.email === selectedComposeEmail;
    });

    panel.hidden = false;
    scrollToSection('message-editor');
    const subjectElFocus = document.getElementById('composeSubject');
    if (subjectElFocus) {
        requestAnimationFrame(() => subjectElFocus.focus({ preventScroll: true }));
    }
}

function getTextSuggestions() {
    const lang = selectedLanguage || detectBrowserLanguage();
    const langData = translations[lang] || translations.en;
    const roleKey = selectedRole === 'farmer' ? 'farmer' : 'consumer';
    const list = langData[roleKey] || translations.en[roleKey] || [];
    return Array.isArray(list) ? list : [];
}

function openMailtoFromCompose() {
    const email = selectedComposeEmail;
    if (!email) {
        const lang = selectedLanguage || detectBrowserLanguage();
        alert(getTranslation(lang, 'selectMandatar'));
        return;
    }
    const lang = selectedLanguage || detectBrowserLanguage();
    const remainingMs = getRemainingRateLimitMs(email);
    if (remainingMs > 0) {
        alert(getRateLimitMessage(lang, remainingMs));
        return;
    }
    const subject = encodeURIComponent((document.getElementById('composeSubject') || {}).value || 'NO LABEL NO DEAL');
    const bodyText = (document.getElementById('composeBody') || {}).value || '';
    const body = encodeURIComponent(bodyText);
    if (selectedRole === 'farmer') counterFarmer++;
    else if (selectedRole === 'consumer') counterConsumer++;
    counter++;
    saveCounter();
    updateCounter();
    setEmailRateLimit(email);
    updateRateLimitUI();
    unlockShareBarAfterContact();
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

// selectAllVisible Funktion entfernt - nicht mehr benötigt

// OFFICIAL_EMAILS entfernt - werden nicht mehr automatisch hinzugefügt

function copyEmails() {
    console.log('copyEmails aufgerufen');
    const checked = document.querySelectorAll('#mandatareList input[type="checkbox"]:checked');
    console.log('Gefundene Checkboxen:', checked.length);
    let emails = Array.from(checked).map(cb => cb.dataset.email).filter(Boolean);
    console.log('E-Mail-Adressen:', emails.length);
    
    if (emails.length === 0) {
        const lang = selectedLanguage || detectBrowserLanguage();
        alert(getTranslation(lang, 'selectMandatar'));
        return;
    }
    
    // Warnung wenn mehr als 1 Empfänger ausgewählt
    if (emails.length > 1) {
        const lang = selectedLanguage || detectBrowserLanguage();
        alert(getTranslation(lang, 'emailSingleRecipientWarning'));
        return;
    }
    
    // Format-Auswahl entfernt - immer eine Adresse pro Zeile
    const text = emails.join('\n');
    
    console.log('Zu kopierender Text:', text.substring(0, 100) + '...');
    
    const lang = selectedLanguage || detectBrowserLanguage();
    const feedback = document.getElementById('copyFeedback');
    if (!feedback) {
        console.error('copyFeedback Element nicht gefunden');
        return;
    }
    
    // Clipboard API mit Fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Erfolgreich in Zwischenablage kopiert');
            feedback.textContent = getTranslation(lang, 'emailsCopied');
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 3000);
        }).catch(err => {
            console.error('Fehler beim Kopieren:', err);
            // Fallback: Alte Methode verwenden
            fallbackCopyTextToClipboard(text, feedback, lang);
        });
    } else {
        console.log('Clipboard API nicht verfügbar, verwende Fallback');
        // Fallback für Browser ohne Clipboard API
        fallbackCopyTextToClipboard(text, feedback, lang);
    }
}

function sendEmail() {
    // Ausgewählte E-Mail-Adressen sammeln
    const checked = document.querySelectorAll('#mandatareList input[type="checkbox"]:checked');
    let emails = Array.from(checked).map(cb => cb.dataset.email).filter(Boolean);
    
    // Wenn keine Mandatare ausgewählt sind, Warnung anzeigen
    if (emails.length === 0) {
        const lang = selectedLanguage || detectBrowserLanguage();
        alert(getTranslation(lang, 'selectMandatar'));
        return;
    }
    
    // Warnung wenn mehr als 1 Empfänger ausgewählt
    if (emails.length > 1) {
        const lang = selectedLanguage || detectBrowserLanguage();
        alert(getTranslation(lang, 'emailSingleRecipientWarning'));
        return;
    }

    // Frontend-Rate-Limit prüfen
    const lang = selectedLanguage || detectBrowserLanguage();
    const email = emails[0];
    const remainingMs = getRemainingRateLimitMs(email);
    if (remainingMs > 0) {
        const message = getRateLimitMessage(lang, remainingMs);
        showRateLimitWarning(true, lang, email);
        alert(message);
        return;
    }
    showRateLimitWarning(false, lang);
    
    // Ausgewählte Textvorlagen sammeln
    const checkedSentences = document.querySelectorAll('#sentenceList input[type="checkbox"]:checked');
    const sentences = Array.from(checkedSentences).map(cb => cb.dataset.sentence.replace(/&quot;/g, '"'));
    const bodyText = sentences.length > 0 ? sentences.join('\n') : '';
    
    // mailto: Link erstellen
    // Für mailto: werden E-Mail-Adressen immer komma-getrennt verwendet
    const emailList = emails.join(',');
    const subject = encodeURIComponent('NO LABEL NO DEAL');
    const body = encodeURIComponent(bodyText);
    
    let mailtoLink = `mailto:${emailList}?subject=${subject}`;
    if (bodyText) {
        mailtoLink += `&body=${body}`;
    }
    
    // Counter erhöhen beim E-Mail-Versand
    if (selectedRole === 'farmer') {
        counterFarmer++;
    } else if (selectedRole === 'consumer') {
        counterConsumer++;
    }
    counter++;
    saveCounter();
    updateCounter();

    // Rate-Limit setzen (clientseitig)
    setEmailRateLimit(email);
    updateRateLimitUI();
    unlockShareBarAfterContact();
    
    // Standard-Mailprogramm öffnen
    window.location.href = mailtoLink;
}

function sendEmailToSingleRecipient(email, sendBtn) {
    if (!email || !email.trim()) {
        const lang = selectedLanguage || detectBrowserLanguage();
        alert(getTranslation(lang, 'selectMandatar'));
        return;
    }

    const lang = selectedLanguage || detectBrowserLanguage();
    const remainingMs = getRemainingRateLimitMs(email);
    if (remainingMs > 0) {
        const message = getRateLimitMessage(lang, remainingMs);
        showRateLimitWarning(true, lang, email);
        alert(message);
        return;
    }
    showRateLimitWarning(false, lang);
    
    // Ausgewählte Textvorlagen sammeln
    const checkedSentences = document.querySelectorAll('#sentenceList input[type="checkbox"]:checked');
    const sentences = Array.from(checkedSentences).map(cb => cb.dataset.sentence.replace(/&quot;/g, '"'));
    const bodyText = sentences.length > 0 ? sentences.join('\n') : '';
    
    // mailto: Link erstellen
    const subject = encodeURIComponent('NO LABEL NO DEAL');
    const body = encodeURIComponent(bodyText);
    
    let mailtoLink = `mailto:${email}?subject=${subject}`;
    if (bodyText) {
        mailtoLink += `&body=${body}`;
    }
    
    // Counter erhöhen beim E-Mail-Versand
    if (selectedRole === 'farmer') {
        counterFarmer++;
    } else if (selectedRole === 'consumer') {
        counterConsumer++;
    }
    counter++;
    saveCounter();
    updateCounter();

    // Rate-Limit setzen (clientseitig)
    setEmailRateLimit(email);
    if (sendBtn) {
        const updatedRemaining = getRemainingRateLimitMs(email);
        sendBtn.disabled = updatedRemaining > 0;
        sendBtn.classList.toggle('is-disabled', updatedRemaining > 0);
        sendBtn.title = updatedRemaining > 0 ? getRateLimitMessage(lang, updatedRemaining) : getTranslation(lang, 'sendEmail');
    }
    unlockShareBarAfterContact();
    
    window.location.href = mailtoLink;
}

// Fallback-Methode für ältere Browser
function fallbackCopyTextToClipboard(text, feedback, lang) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            feedback.textContent = getTranslation(lang, 'emailsCopied');
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 3000);
        } else {
            alert('Kopieren fehlgeschlagen. Bitte manuell kopieren.');
        }
    } catch (err) {
        console.error('Fallback-Kopieren fehlgeschlagen:', err);
        alert('Kopieren fehlgeschlagen. Bitte manuell kopieren.');
    } finally {
        document.body.removeChild(textArea);
    }
}

function showTextSuggestions() {
    const container = document.getElementById('textSuggestions');
    if (!container) return;
    
    const lang = selectedLanguage || detectBrowserLanguage();
    const langData = translations[lang] || translations.en;
    const sentences = langData[selectedRole] || translations.en[selectedRole] || [];
    
    if (sentences.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <h3>${getTranslation(lang, 'textSuggestions')}</h3>
        <p class="hint-text">${getTranslation(lang, 'selectSentences')}</p>
        <div class="email-buttons-container">
            <button id="copySelectedSentences" class="btn-copy-primary">${getTranslation(lang, 'copySelected')}</button>
            <button id="copyAllSentences" class="btn-copy-primary">${getTranslation(lang, 'copyAll')}</button>
            <button id="sendEmailBtn2" class="btn-copy-primary">${getTranslation(lang, 'sendEmail')}</button>
        </div>
        <div class="sentence-list" id="sentenceList"></div>
        <div id="sentenceCopyFeedback" class="copy-feedback" style="display: none;">${getTranslation(lang, 'sentencesCopied')}</div>
    `;
    
    const sentenceList = document.getElementById('sentenceList');
    sentences.forEach((sentence, index) => {
        const item = document.createElement('div');
        item.className = 'sentence-item';
        item.innerHTML = `
            <input type="checkbox" id="sentence-${index}" data-sentence="${sentence.replace(/"/g, '&quot;')}">
            <label for="sentence-${index}" class="sentence-text">${sentence}</label>
        `;
        sentenceList.appendChild(item);
    });
    
    // Ersten Textvorschlag je nach Rolle (Konsument/Landwirt) vorauswählen
    const firstCheckbox = sentenceList.querySelector('input[type="checkbox"]');
    if (firstCheckbox) firstCheckbox.checked = true;
    
    // Event Listeners für Kopier-Buttons
    document.getElementById('copySelectedSentences').addEventListener('click', copySelectedSentences);
    document.getElementById('copyAllSentences').addEventListener('click', copyAllSentences);
    
    // Zweiter E-Mail-Button (gleiche Funktion wie erster)
    const sendEmailBtn2 = document.getElementById('sendEmailBtn2');
    if (sendEmailBtn2) {
        sendEmailBtn2.addEventListener('click', sendEmail);
    }
}

function copySelectedSentences() {
    const checked = document.querySelectorAll('#sentenceList input[type="checkbox"]:checked');
    const sentences = Array.from(checked).map(cb => cb.dataset.sentence.replace(/&quot;/g, '"'));
    
    if (sentences.length === 0) {
        const lang = selectedLanguage || detectBrowserLanguage();
        alert(getTranslation(lang, 'selectSentence'));
        return;
    }
    
    const text = sentences.join('\n');
    navigator.clipboard.writeText(text).then(() => {
        showSentenceFeedback();
    });
}

function copyAllSentences() {
    const allCheckboxes = document.querySelectorAll('#sentenceList input[type="checkbox"]');
    const sentences = Array.from(allCheckboxes).map(cb => cb.dataset.sentence.replace(/&quot;/g, '"'));
    
    if (sentences.length === 0) {
        return;
    }
    
    const text = sentences.join('\n');
    navigator.clipboard.writeText(text).then(() => {
        showSentenceFeedback();
    });
}

function showSentenceFeedback() {
    const feedback = document.getElementById('sentenceCopyFeedback');
    feedback.style.display = 'block';
    setTimeout(() => {
        feedback.style.display = 'none';
    }, 3000);
}

// Text-Rotation
let currentTextIndex = 0;
function renderRotatingText(container, textObj) {
    if (!container || !textObj) return;
    if (typeof textObj === 'object' && textObj.role) {
        container.innerHTML = `
            <p class="rotating-text active">
                ${textObj.text}<br>
                <button type="button" class="rotating-cta-btn">${textObj.cta}</button>
            </p>
        `;
    } else {
        // Fallback für alte Struktur
        container.innerHTML = `<p class="rotating-text active">${textObj}</p>`;
    }
}

function startTextRotation() {
    if (isPostDemoPhase()) return;
    setInterval(() => {
        const container = document.getElementById('textRotation');
        if (!container) return;
        
        const lang = selectedLanguage || detectBrowserLanguage();
        const langData = translations[lang] || translations.en;
        const rotatingTexts = langData.rotatingTexts || translations.en.rotatingTexts;
        
        if (!rotatingTexts || rotatingTexts.length === 0) return;
        
        const current = container.querySelector('.active');
        if (current) {
            current.classList.remove('active');
        }
        
        currentTextIndex = (currentTextIndex + 1) % rotatingTexts.length;
        
        const textObj = rotatingTexts[currentTextIndex];
        const newText = document.createElement('p');
        newText.className = 'rotating-text active';
        
        if (typeof textObj === 'object' && textObj.role) {
            newText.innerHTML = `
                ${textObj.text}<br>
                <button type="button" class="rotating-cta-btn">${textObj.cta}</button>
            `;
        } else {
            // Fallback für alte Struktur
            newText.textContent = textObj;
        }
        
        container.innerHTML = '';
        container.appendChild(newText);
    }, 3000);
}

// Counter
function loadCounter() {
    try {
        const saved = localStorage.getItem('campaignCounter');
        const savedFarmer = localStorage.getItem('campaignCounterFarmer');
        const savedConsumer = localStorage.getItem('campaignCounterConsumer');
        
        // Startwerte definieren
        const startConsumer = 1142; // 842 + 300
        const startFarmer = 174;
        
        // Werte aus localStorage laden oder Startwerte verwenden
        if (savedConsumer) {
            const savedConsumerValue = parseInt(savedConsumer, 10) || 0;
            counterConsumer = savedConsumerValue < startConsumer ? startConsumer : savedConsumerValue;
        } else {
            counterConsumer = startConsumer;
        }
        
        if (savedFarmer) {
            const savedFarmerValue = parseInt(savedFarmer, 10) || 0;
            counterFarmer = savedFarmerValue < startFarmer ? startFarmer : savedFarmerValue;
        } else {
            counterFarmer = startFarmer;
        }
        
        // Gesamt-Counter berechnen
        counter = counterConsumer + counterFarmer;
        
        // Werte speichern (falls sie geändert wurden)
        saveCounter();
        
        console.log('Counter geladen:', { counter, counterFarmer, counterConsumer });
    } catch (error) {
        console.error('Fehler beim Laden des Counters:', error);
        // Fallback: Counter auf 0 setzen
        counter = 0;
        counterFarmer = 0;
        counterConsumer = 0;
    }
}

function saveCounter() {
    localStorage.setItem('campaignCounter', counter.toString());
    localStorage.setItem('campaignCounterFarmer', counterFarmer.toString());
    localStorage.setItem('campaignCounterConsumer', counterConsumer.toString());
}

// Funktion zum Formatieren von Zahlen mit Leerzeichen als Tausender-Trennzeichen
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function updateCounter() {
    const lang = selectedLanguage || detectBrowserLanguage();
    const counterText = document.querySelector('.counter-text');
    const counterDetail = document.getElementById('counterDetail');
    const counterSection = document.getElementById('counterSection');
    
    if (counterText) {
        const formattedCount = formatNumber(counter);
        counterText.innerHTML = getTranslation(lang, 'counterText', { count: formattedCount });
        console.log('Counter aktualisiert:', counter);
    }
    
    // Sicherstellen, dass Counter-Section sichtbar ist
    if (counterSection) {
        counterSection.style.display = 'block';
    }
    
    // Detail-Anzeige für Landwirt/Konsument (optional - kann später ausgeblendet werden)
    if (counterDetail && (counterFarmer > 0 || counterConsumer > 0)) {
        const farmerLabel = getTranslation(lang, 'farmer');
        const consumerLabel = getTranslation(lang, 'consumer');
        const formattedFarmer = formatNumber(counterFarmer);
        const formattedConsumer = formatNumber(counterConsumer);
        counterDetail.textContent = `(${farmerLabel}: ${formattedFarmer}, ${consumerLabel}: ${formattedConsumer})`;
        counterDetail.style.display = 'block';
    }
}


// Petition-Funktionen
function loadPetitionContent() {
    const contentContainer = document.getElementById('petitionContent');
    if (!contentContainer) return;
    
    // Vollständiger Petitionstext aus RTF extrahiert und in HTML konvertiert
    // Enthält: Titel, Untertitel, Website-Beschreibung und Petitionstext
    const petitionHTML = `
        <h2>NO LABEL, NO DEAL – Mandatory Origin Labelling for Processed Foods in the EU</h2>
        <p style="font-style: italic; font-size: 1.2em; margin-bottom: 1.5em;">No origin, no future.</p>
        
        <p id="petitionDescription" class="petition-description">This website is dedicated to the European petition <strong>"NO LABEL, NO DEAL – Mandatory Origin Labelling for Processed Foods in the EU."</strong> Its purpose is to provide citizens with a clear, simple, and effective way to demand transparency in food origin labelling across the European Union.</p>
        
        <p>On this website, you can:</p>
        <ul>
            <li>select your country and preferred language,</li>
            <li>contact your Members of the European Parliament directly by email,</li>
            <li>use pre-written messages or write your own message to ask them to support this initiative,</li>
            <li>and support the official EU petition with your signature.</li>
        </ul>
        
        <p>Once a European Citizens' Initiative reaches <strong>one million signatures</strong>, it must be formally addressed by the European Commission and discussed at EU level.</p>
        
        <p>Knowing where our food comes from is not a request or a privilege – <strong>it is a fundamental consumer right</strong>. Transparency in food origin is essential for informed choices, fair competition, and the future of European agriculture. This right must be claimed and enforced.</p>
        
        <h3 style="margin-top: 2em; margin-bottom: 1em;">Petition Text</h3>
        
        <p>Consumers in the European Union currently lack a clear and reliable basis for informed purchasing decisions when it comes to processed food products. Unlike most other consumer goods, the origin of raw agricultural ingredients used in processed foods is often unclear or completely undisclosed.</p>
        
        <p>As a result, consumers are unable to consciously decide where they want food production to take place and which standards they wish to support through their purchasing choices. This lack of transparency undermines consumer sovereignty and distorts fair competition within the EU internal market.</p>
        
        <p>At the same time, European farmers are increasingly exposed to international price pressure. Without transparent origin labelling, agricultural products become interchangeable commodities, allowing large multinational corporations to shift sourcing globally based solely on cost considerations. This places significant economic pressure on European farmers, who must comply with higher production, environmental, and social standards.</p>
        
        <p>The solution is a comprehensive, EU-wide <strong>mandatory origin labelling system for all processed food products</strong>, regardless of whether they are produced within or outside the European Union. Consumers must be clearly informed about the country of origin of all agricultural ingredients used in processed foods.</p>
        
        <p>Modern technical solutions and existing quality assurance systems make such transparency fully feasible. Food processors can reasonably be expected to provide origin information through standardised country codes, abbreviations, or digital solutions such as QR codes, without creating disproportionate administrative burdens.</p>
        
        <p>Mandatory origin labelling would:</p>
        <ul>
            <li>restore transparency and trust for consumers,</li>
            <li>enable informed and responsible purchasing decisions,</li>
            <li>strengthen fair competition within the EU internal market,</li>
            <li>reduce economic pressure on European farmers caused by global price competition,</li>
            <li>and prevent the systematic outsourcing of agricultural production driven solely by cost considerations.</li>
        </ul>
        
        <p>Food is our most fundamental basis of life. Consumers have a legitimate right to know where it comes from, and European farmers deserve protection from unfair market conditions created by a lack of transparency.</p>
        
        <p>For these reasons, <strong>we call on the European Union to introduce mandatory, comprehensive origin labelling for all processed food products across the EU.</strong></p>
    `;
    
    contentContainer.innerHTML = petitionHTML;
}

function initPetitionNavigation() {
    // Hash-basierte Navigation
    function handleHashChange() {
        const hash = window.location.hash;
        if (hash === '#petition') {
            showPetitionSection();
        }
    }
    
    // Initial check
    if (window.location.hash === '#petition') {
        showPetitionSection();
    }
    
    // Event listener für Hash-Änderungen
    window.addEventListener('hashchange', handleHashChange);
}

function showPetitionSection() {
    // Alle anderen Sections verstecken
    const heroEl = document.getElementById('hero');
    if (heroEl) heroEl.style.display = 'none';
    if (isPostDemoPhase()) {
        const hp = document.getElementById('heroPostDemo');
        const ss = document.getElementById('storySections');
        if (hp) hp.style.display = 'none';
        if (ss) ss.style.display = 'none';
    }
    document.getElementById('counterSection').style.display = 'none';
    document.getElementById('step-language-country').style.display = 'none';
    document.getElementById('step-role').style.display = 'none';
    document.getElementById('mep-selection').style.display = 'none';
    
    // Petition-Section anzeigen
    const petitionSection = document.getElementById('petition');
    if (petitionSection) {
        petitionSection.style.display = 'block';
        updatePetitionTexts();
        updatePetitionButtons();
        refreshShareBarVisibility();
        
        // Smooth scroll zur Section
        setTimeout(() => {
            scrollToSection('petition');
        }, 100);
    }
}

function showHomeSection() {
    const hero = document.getElementById('hero');
    const counterSection = document.getElementById('counterSection');
    const languageCountrySection = document.getElementById('step-language-country');
    const roleSection = document.getElementById('step-role');
    const contactsSection = document.getElementById('mep-selection');
    const petitionSection = document.getElementById('petition');

    if (isPostDemoPhase()) {
        const hp = document.getElementById('heroPostDemo');
        const ss = document.getElementById('storySections');
        if (hp) hp.style.display = '';
        if (ss) ss.style.display = '';
    } else if (hero) {
        hero.style.display = 'block';
    }
    if (counterSection) counterSection.style.display = 'block';
    if (languageCountrySection) languageCountrySection.style.display = 'block';
    if (roleSection) roleSection.style.display = 'none';
    if (contactsSection) contactsSection.style.display = 'none';
    if (petitionSection) petitionSection.style.display = 'none';
    refreshShareBarVisibility();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePetitionTexts() {
    const lang = selectedLanguage || detectBrowserLanguage();
    
    // Titel - kann übersetzt werden (UI-Label), aber Content bleibt Englisch
    const title = document.getElementById('petitionTitle');
    if (title) {
        title.textContent = getTranslation(lang, 'petitionSectionTitle') || 'Petition beim Europäischen Parlament';
    }
    
    // Hero CTA - UI-Label, wird übersetzt
    const heroCTA = document.getElementById('petitionHeroCTA');
    if (heroCTA) {
        heroCTA.textContent = getTranslation(lang, 'petitionHeroCTA');
    }
    
    // Disclaimer - optional, kann übersetzt werden
    const disclaimer = document.getElementById('petitionDisclaimer');
    if (disclaimer) {
        disclaimer.textContent = getTranslation(lang, 'petitionDisclaimer');
        // Disclaimer optional anzeigen (kann später aktiviert werden)
        // disclaimer.style.display = 'block';
    }
    
    // Translate Button bleibt versteckt, bis Google Translate per Opt-in geladen wurde
    const translateBtn = document.getElementById('translatePetitionBtn');
    if (translateBtn && !googleTranslateLoaded) {
        translateBtn.style.display = 'none';
    }
    
    // Petitionstext bleibt IMMER auf Englisch (Originalfassung)
    // Wird in loadPetitionContent() gesetzt und nicht übersetzt
}

function updatePetitionButtons() {
    const lang = selectedLanguage || detectBrowserLanguage();
    const signTopBtn = document.getElementById('petitionSignTop');
    const signBottomBtn = document.getElementById('petitionSignBottom');
    const pendingNotice = document.getElementById('petitionPendingNotice');
    const pendingLabel = getTranslation(lang, 'petitionSupportLater') || getTranslation(lang, 'petitionPendingNotice');
    
    if (signTopBtn) {
        signTopBtn.textContent = pendingLabel;
    }
    
    if (signBottomBtn) {
        signBottomBtn.textContent = pendingLabel;
    }
    
    if (petitionStatus === 'pending') {
        if (signTopBtn) {
            signTopBtn.disabled = true;
            signTopBtn.hidden = true;
            signTopBtn.setAttribute('aria-hidden', 'true');
        }
        if (signBottomBtn) {
            signBottomBtn.disabled = true;
            signBottomBtn.hidden = true;
            signBottomBtn.setAttribute('aria-hidden', 'true');
        }
        if (pendingNotice) {
            pendingNotice.textContent = pendingLabel;
            pendingNotice.style.display = 'block';
            pendingNotice.classList.add('petition-pending-notice--visible');
        }
    } else if (petitionStatus === 'approved') {
        if (signTopBtn) {
            signTopBtn.hidden = false;
            signTopBtn.removeAttribute('aria-hidden');
            signTopBtn.disabled = false;
            signTopBtn.textContent = getTranslation(lang, 'signNow');
            signTopBtn.onclick = () => {
                window.open(PETITION_SIGNATURE_URL, '_blank', 'noopener,noreferrer');
            };
        }
        if (signBottomBtn) {
            signBottomBtn.hidden = false;
            signBottomBtn.removeAttribute('aria-hidden');
            signBottomBtn.disabled = false;
            signBottomBtn.textContent = getTranslation(lang, 'sign');
            signBottomBtn.onclick = () => {
                window.open(PETITION_SIGNATURE_URL, '_blank', 'noopener,noreferrer');
            };
        }
        if (pendingNotice) {
            pendingNotice.style.display = 'none';
        }
    }
}

function loadGoogleTranslateOnDemand() {
    if (googleTranslateLoaded) return;
    googleTranslateLoaded = true;
    window.googleTranslateElementInit = function googleTranslateElementInit() {
        try {
            if (typeof google === 'undefined' || !google.translate) return;
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'de,en,fr,es,it,pl,nl,pt,cs,hu,sk,sl,hr,ro,bg,da,sv,fi,lt,lv,et,mt,el,ga',
                layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                autoDisplay: false
            }, 'google_translate_element');
            const el = document.getElementById('google_translate_element');
            if (el) el.classList.remove('google-translate-hidden');
            const btn = document.getElementById('enableGoogleTranslateBtn');
            if (btn) btn.style.display = 'none';
            const translateBtn = document.getElementById('translatePetitionBtn');
            if (translateBtn) translateBtn.style.display = 'flex';
        } catch (err) {
            console.error('[Translate] Init error', err);
        }
    };
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
}

function applyFriendlyStaticTexts(lang) {
    const map = [
        ['friendlyHeroHeadline', 'friendlyHeroHeadline'],
        ['friendlyHeroSubline', 'friendlyHeroSubline'],
        ['friendlyHeroCTA', 'friendlyHeroCTA'],
        ['friendlyHeroTrust', 'friendlyHeroTrust'],
        ['friendlyHeroNote', 'friendlyHeroNote'],
        ['friendlyHeroMercosur', 'friendlyHeroMercosur'],
        ['howStep1Title', 'howStep1Title'],
        ['howStep1Text', 'howStep1Text'],
        ['howStep2Title', 'howStep2Title'],
        ['howStep2Text', 'howStep2Text'],
        ['howStep3Title', 'howStep3Title'],
        ['howStep3Text', 'howStep3Text'],
        ['privacyAdvTitle', 'privacyAdvTitle'],
        ['privacyAdvText', 'privacyAdvText'],
        ['privacyAdv1', 'privacyAdv1'],
        ['privacyAdv2', 'privacyAdv2'],
        ['privacyAdv3', 'privacyAdv3'],
        ['privacyAdv4', 'privacyAdv4'],
        ['privacyGtNote', 'privacyGtNote'],
        ['aboutTitle', 'aboutTitle'],
        ['aboutP1', 'aboutP1'],
        ['aboutP2', 'aboutP2'],
        ['petitionStatusText', 'petitionStatusText'],
        ['composeHint', 'composeHint'],
        ['composeOpenMail', 'openInEmailApp'],
        ['composeCopyText', 'copyMessageText'],
        ['composeCopyEmail', 'copyEmailAddress'],
        ['composeSubjectLabel', 'emailSubjectLabel'],
        ['composeBodyLabel', 'emailBodyLabel'],
        ['filtersSummary', 'filtersSummary'],
        ['enableGoogleTranslateBtn', 'enableGoogleTranslate'],
        ['googleTranslateOptin', 'googleTranslateOptin'],
        ['footerPrivacyLine', 'footerPrivacyLine'],
        ['flowProgressLang', 'stepOf', { step: 1, total: 3 }],
        ['flowProgressRole', 'stepOf', { step: 2, total: 3 }],
        ['flowProgressContacts', 'stepOf', { step: 3, total: 3 }]
    ];
    map.forEach((entry) => {
        const [id, key, vars] = entry;
        const el = document.getElementById(id);
        if (!el) return;
        const normalizedVars = {};
        Object.entries(vars || {}).forEach(([k, v]) => {
            normalizedVars[k] = String(v);
        });
        const text = getTranslation(lang, key, normalizedVars);
        if (text && text !== key) el.textContent = text;
    });
    const aboutPhoto = document.getElementById('aboutPhoto');
    if (aboutPhoto) {
        const alt = getTranslation(lang, 'aboutPhotoAlt');
        if (alt && alt !== 'aboutPhotoAlt') aboutPhoto.alt = alt;
    }
}

window.updateUI = function() {
    updateUITexts(selectedLanguage || detectBrowserLanguage());
};
