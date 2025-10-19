import { supabase } from '../serverClient.js';

/* --------------------------- UNIVERSAL REDIRECT --------------------------- */
function goToHome() {
    const host = window.location.host;
    let path;
    if (host.includes('github.io')) {
        // GitHub Pages
        path = '/Windsor/pages/home.html';
    } else {
        // Local server (Live Server)
        path = '/pages/home.html';
    }
    window.location.href = path;
}

/* --------------------------- SCROLLABLE CARDS --------------------------- */
document.addEventListener('DOMContentLoaded', function() {
    const scrollContainer = document.getElementById('scrollContainer');
    const scrollLeftBtn = document.getElementById('scrollLeftBtn');
    const scrollRightBtn = document.getElementById('scrollRightBtn');
    const scrollIndicator = document.getElementById('scrollIndicator');

    if (!scrollContainer) return;

    const card = document.querySelector('.card');
    if (!card) return;

    const cardWidth = card.offsetWidth + parseInt(getComputedStyle(card).marginRight);
    const visibleCards = Math.floor(scrollContainer.offsetWidth / cardWidth);
    const totalCards = document.querySelectorAll('.card').length;
    const pages = Math.ceil(totalCards / visibleCards);

    scrollIndicator.innerHTML = '';
    for (let i = 0; i < pages; i++) {
        const dot = document.createElement('div');
        dot.classList.add('indicator-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            scrollToPage(i);
            updateIndicators(i);
        });
        scrollIndicator.appendChild(dot);
    }

    scrollRightBtn.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: cardWidth * visibleCards, behavior: 'smooth' });
        updateIndicatorsAfterScroll();
    });

    scrollLeftBtn.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: -cardWidth * visibleCards, behavior: 'smooth' });
        updateIndicatorsAfterScroll();
    });

    let startX, scrollLeft;

    scrollContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX - scrollContainer.offsetLeft;
        scrollLeft = scrollContainer.scrollLeft;
    });

    scrollContainer.addEventListener('touchmove', (e) => {
        if (!startX) return;
        const x = e.touches[0].pageX - scrollContainer.offsetLeft;
        const walk = (x - startX) * 2;
        scrollContainer.scrollLeft = scrollLeft - walk;
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') scrollContainer.scrollBy({ left: -cardWidth * visibleCards, behavior: 'smooth' });
        if (e.key === 'ArrowRight') scrollContainer.scrollBy({ left: cardWidth * visibleCards, behavior: 'smooth' });
        updateIndicatorsAfterScroll();
    });

    function scrollToPage(pageIndex) {
        scrollContainer.scrollTo({ left: pageIndex * cardWidth * visibleCards, behavior: 'smooth' });
    }

    function updateIndicators(pageIndex) {
        document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === pageIndex);
        });
    }

    function updateIndicatorsAfterScroll() {
        setTimeout(() => {
            const scrollPos = scrollContainer.scrollLeft;
            const currentPage = Math.round(scrollPos / (cardWidth * visibleCards));
            updateIndicators(currentPage);
        }, 500);
    }

    let autoScrollInterval = setInterval(() => {
        if (scrollContainer) {
            scrollContainer.scrollBy({ left: cardWidth * visibleCards, behavior: 'smooth' });
            updateIndicatorsAfterScroll();
        }
    }, 5000);

    scrollContainer.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
    scrollContainer.addEventListener('mouseleave', () => {
        autoScrollInterval = setInterval(() => {
            scrollContainer.scrollBy({ left: cardWidth * visibleCards, behavior: 'smooth' });
            updateIndicatorsAfterScroll();
        }, 5000);
    });
});

/* --------------------------- CARD HOVER EFFECT --------------------------- */
const cards = document.querySelectorAll('.residence-card');
cards.forEach(card => {
    card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    });
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const rotateX = -((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 10;
        const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 10;
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = 'rotateX(0deg) rotateY(0deg)');
});

/* --------------------------- NAVIGATION & MOBILE MENU --------------------------- */
window.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');

    hamburger?.addEventListener('click', function() {
        const isOpening = !this.classList.contains('active');
        this.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = isOpening ? 'hidden' : '';
    });

    document.querySelectorAll('.mobile-menu a, .mobile-signin, .mobile-signup').forEach(item => {
        item.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
});

/* --------------------------- MODALS --------------------------- */
function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); document.body.style.overflow = ''; }
function openSignupModal() { document.getElementById('signupModal').classList.add('active'); document.body.style.overflow = 'hidden'; closeLoginModal(); }
function closeSignupModal() { document.getElementById('signupModal').classList.remove('active'); document.body.style.overflow = ''; }
function openOtpModal() { document.getElementById('otpModal').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeOtpModal() { document.getElementById('otpModal').classList.add('hidden'); document.body.style.overflow = ''; }
function openForgotPasswordModal() { document.getElementById('forgotPasswordModal').classList.remove('hidden'); document.body.style.overflow = 'hidden'; closeLoginModal(); }
function closeForgotPasswordModal() { document.getElementById('forgotPasswordModal').classList.add('hidden'); document.body.style.overflow = ''; }

/* --------------------------- AUTH (SUPABASE) --------------------------- */
async function validateLoginForm() {
    const emailOrUsername = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!emailOrUsername || !password) return alert('Please enter both username/email and password');

    try {
        let { data, error } = await supabase.auth.signInWithPassword({ email: emailOrUsername, password });
        if (error && !emailOrUsername.includes('@')) {
            const { data: profile, error: profileError } = await supabase.from('profiles').select('email').eq('username', emailOrUsername).single();
            if (profileError || !profile?.email) throw new Error("Username not found");
            ({ data, error } = await supabase.auth.signInWithPassword({ email: profile.email, password }));
        }
        if (error) throw error;
        closeLoginModal();
        goToHome(); // ✅ redirect works locally & GitHub
    } catch (err) {
        alert(err.message);
    }
}

async function validateSignupForm() {
    const username = document.querySelector('#signupModal input[placeholder="Username"]').value.trim();
    const email = document.querySelector('#signupModal input[type="email"]').value.trim();
    const phone = document.querySelector('#signupModal input[type="tel"]').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsChecked = document.getElementById('terms').checked;
    if (password !== confirmPassword) return alert('Passwords do not match');
    if (!termsChecked) return alert('You must agree to terms and conditions');

    try {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username, phone_number: phone } } });
        if (error) throw error;
        alert('Signup successful! An OTP code has been sent to your email.');
        document.getElementById('otpEmail').value = email;
        closeSignupModal();
        openOtpModal();
    } catch (err) {
        alert(err.message);
    }
}

async function verifyOtp() {
    const email = document.getElementById('otpEmail').value.trim();
    const otp = document.getElementById('otpInput').value.trim();
    if (!otp || otp.length !== 6) return alert('Please enter a valid 6-digit OTP');

    try {
        const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
        if (error) throw error;
        alert('Email verified successfully!');
        closeOtpModal();
        goToHome();
    } catch (err) {
        alert('OTP verification failed: ' + err.message);
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) return alert('Please enter your email');

    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        alert('Password reset link sent!');
        closeForgotPasswordModal();
    } catch (err) {
        alert(err.message);
    }
}

async function resendOtp() {
    const email = document.getElementById('otpEmail').value.trim();
    try {
        const { data, error } = await supabase.auth.resend({ type: 'signup', email });
        if (error) throw error;
        alert('OTP resent to your email.');
    } catch (err) {
        alert('Failed to resend OTP: ' + err.message);
    }
}

/* --------------------------- EXPORT FUNCTIONS TO WINDOW --------------------------- */
window.goToHome = goToHome;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.openSignupModal = openSignupModal;
window.closeSignupModal = closeSignupModal;
window.switchToLogin = () => { closeSignupModal(); openLoginModal(); };
window.togglePassword = (fieldId, iconSpan) => {
    const input = document.getElementById(fieldId);
    const icon = iconSpan.querySelector('i');
    if (input.type === 'password') { input.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { input.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
};
window.validateLoginForm = validateLoginForm;
window.validateSignupForm = validateSignupForm;
window.verifyOtp = verifyOtp;
window.openOtpModal = openOtpModal;
window.closeOtpModal = closeOtpModal;
window.resendOtp = resendOtp;
window.openForgotPasswordModal = openForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.switchToLoginFromForgot = () => { closeForgotPasswordModal(); openLoginModal(); };
window.handleForgotPassword = handleForgotPassword;

