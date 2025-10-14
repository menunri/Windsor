import { supabase } from '../serverClient.js';


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
            
      
            let startX;
            let scrollLeft;
            
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
                if (e.key === 'ArrowLeft') {
                    scrollContainer.scrollBy({ left: -cardWidth * visibleCards, behavior: 'smooth' });
                    updateIndicatorsAfterScroll();
                } else if (e.key === 'ArrowRight') {
                    scrollContainer.scrollBy({ left: cardWidth * visibleCards, behavior: 'smooth' });
                    updateIndicatorsAfterScroll();
                }
            });
            
        
            function scrollToPage(pageIndex) {
                scrollContainer.scrollTo({
                    left: pageIndex * cardWidth * visibleCards,
                    behavior: 'smooth'
                });
            }
            
            function updateIndicators(pageIndex) {
                document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
                    if (index === pageIndex) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
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
                if (isElementInViewport(scrollContainer)) {
                    scrollContainer.scrollBy({ left: cardWidth * visibleCards, behavior: 'smooth' });
                    updateIndicatorsAfterScroll();
                }
            }, 5000);
            
        
            scrollContainer.addEventListener('mouseenter', () => {
                clearInterval(autoScrollInterval);
            });
            
            scrollContainer.addEventListener('mouseleave', () => {
                autoScrollInterval = setInterval(() => {
                    if (isElementInViewport(scrollContainer)) {
                        scrollContainer.scrollBy({ left: cardWidth * visibleCards, behavior: 'smooth' });
                        updateIndicatorsAfterScroll();
                    }
                }, 5000);
            });
            
      
            function isElementInViewport(el) {
                const rect = el.getBoundingClientRect();
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            }
        });

const cards = document.querySelectorAll('.residence-card');

cards.forEach(card => {


  card.addEventListener('click', () => {
    cards.forEach(c => {
      c.classList.remove('active');
      
    });
    card.classList.add('active');
    
  });

  card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const deltaX = (mouseX - centerX) / centerX;
  const deltaY = (mouseY - centerY) / centerY; 

  const rotateX = -(deltaY * 10); 
  const rotateY = deltaX * 10;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });


});        


window.addEventListener('DOMContentLoaded', () => {
   
    document.querySelectorAll('a[href="#home"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const hamburger = document.querySelector('.hamburger');
            const mobileMenu = document.querySelector('.mobile-menu');
            if (hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
                hamburger.setAttribute('aria-expanded', 'false');
            }

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

   
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');

    hamburger?.addEventListener('click', function () {
        const isOpening = !this.classList.contains('active');
        this.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = isOpening ? 'hidden' : '';
        this.setAttribute('aria-expanded', isOpening);
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.navbar-container') &&
            !e.target.closest('.mobile-menu') &&
            mobileMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    function closeMenu() {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
    }

    document.querySelectorAll('.mobile-menu a, .mobile-signin, .mobile-signup').forEach(item => {
        item.addEventListener('click', closeMenu);
    });

    // Scrollable cards
    const scrollContainer = document.querySelector('.scroll-container');
    const leftBtn = document.getElementById('scrollLeftBtn');
    const rightBtn = document.getElementById('scrollRightBtn');

    function scrollToCard(direction) {
        if (!scrollContainer) return;
        const card = scrollContainer.querySelector('.card');
        if (!card) return;
        const cardWidth = card.offsetWidth + 20;
        scrollContainer.scrollBy({
            left: direction * cardWidth,
            behavior: 'smooth'
        });
    }

    if (leftBtn) leftBtn.addEventListener('click', () => scrollToCard(-1));
    if (rightBtn) rightBtn.addEventListener('click', () => scrollToCard(1));

    // Accordion
    document.querySelectorAll('.accordion-item').forEach(item => {
        item.querySelector('.accordion-header').addEventListener('click', () => {
            const openItem = document.querySelector('.accordion-item.active');
            if (openItem && openItem !== item) {
                openItem.classList.remove('active');
                openItem.querySelector('.icon').textContent = '+';
            }
            item.classList.toggle('active');
            const icon = item.querySelector('.icon');
            icon.textContent = item.classList.contains('active') ? '−' : '+';
        });
    });
});


function openLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function openSignupModal() {
    const modal = document.getElementById('signupModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeLoginModal();
}

function closeSignupModal() {
    const modal = document.getElementById('signupModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function switchToLogin() {
    closeSignupModal();
    openLoginModal();
}

function togglePassword(fieldId, iconSpan) {
    const input = document.getElementById(fieldId);
    const icon = iconSpan.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}


async function validateLoginForm() {
    const emailOrUsername = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!emailOrUsername || !password) {
        alert('Please enter both username/email and password');
        return;
    }

    try {
        let { data, error } = await supabase.auth.signInWithPassword({
            email: emailOrUsername,
            password
        });

        if (error && !emailOrUsername.includes('@')) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', emailOrUsername)
                .single();

            if (profileError || !profile?.email) throw new Error("Username not found");

            ({ data, error } = await supabase.auth.signInWithPassword({
                email: profile.email,
                password
            }));
        }

        if (error) throw error;

        
        closeLoginModal();
        window.location.href = 'pages/home.html';

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

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    if (!termsChecked) {
        alert('You must agree to the terms and conditions');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username, phone_number: phone }
            }
        });

        if (error) throw error;

        alert('Signup successful! An OTP code has been sent to your email.');

     
        document.getElementById('otpEmail').value = email;
        closeSignupModal();
        openOtpModal();

    } catch (err) {
        alert(err.message);
    }
}

function openOtpModal() {
    const modal = document.getElementById('otpModal');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeOtpModal() {
    const modal = document.getElementById('otpModal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

async function verifyOtp() {
    const email = document.getElementById('otpEmail').value.trim();
    const otp = document.getElementById('otpInput').value.trim();

    if (!otp || otp.length !== 6) {
        alert('Please enter a valid 6-digit OTP');
        return;
    }

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup' 
        });

        if (error) throw error;

        alert('Email verified successfully. You are now signed in!');
        closeOtpModal();
        window.location.href = '../index.html'; 

    } catch (err) {
        alert('OTP verification failed: ' + err.message);
    }
}


function openForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.remove('hidden');
    document.getElementById('forgotPasswordModal').setAttribute('aria-hidden', 'false');
    closeLoginModal();
    document.body.style.overflow = 'hidden';
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function switchToLoginFromForgot() {
    closeForgotPasswordModal();
    openLoginModal();
}

async function handleForgotPassword() {
    const email = document.getElementById('forgotEmail').value.trim();

    if (!email) {
        alert('Please enter your email address');
        return;
    }

    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/pages/reset-password.html`
        });

        if (error) throw error;

        alert('A password reset link has been sent to your email.');
        closeForgotPasswordModal();
        openLoginModal();

    } catch (err) {
        alert(err.message);
    }
}

async function resendOtp() {
    const email = document.getElementById('otpEmail').value.trim();

    try {
        const { data, error } = await supabase.auth.resend({
            type: 'signup',
            email
        });

        if (error) throw error;

        alert('OTP resent to your email.');
    } catch (err) {
        alert('Failed to resend OTP: ' + err.message);
    }
}





window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeLoginModal();
        closeSignupModal();
    }
});


window.openLoginModal = openLoginModal;
window.resendOtp = resendOtp;
window.closeLoginModal = closeLoginModal;
window.openSignupModal = openSignupModal;
window.closeSignupModal = closeSignupModal;
window.switchToLogin = switchToLogin;
window.togglePassword = togglePassword;
window.validateLoginForm = validateLoginForm;
window.validateSignupForm = validateSignupForm;
window.openForgotPasswordModal = openForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.switchToLoginFromForgot = switchToLoginFromForgot;
window.handleForgotPassword = handleForgotPassword;
window.openOtpModal = openOtpModal;
window.closeOtpModal = closeOtpModal;
window.verifyOtp = verifyOtp;
