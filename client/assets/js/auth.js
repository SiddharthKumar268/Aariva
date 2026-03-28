// ─────────────────────────────────────────────
//  Aariva · auth.js  — Login + OTP Flow
// ─────────────────────────────────────────────

// ── Helpers ──────────────────────────────────

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOTP(otp) {
  sessionStorage.setItem('aariva_otp', otp);
  sessionStorage.setItem('aariva_otp_expiry', Date.now() + 5 * 60 * 1000);
}

function verifyOTP(enteredOTP) {
  const storedOTP = sessionStorage.getItem('aariva_otp');
  const expiry = parseInt(sessionStorage.getItem('aariva_otp_expiry'));

  if (!storedOTP || !expiry) return { valid: false, reason: 'No OTP found. Please request a new one.' };
  if (Date.now() > expiry) return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  if (enteredOTP.trim() !== storedOTP) return { valid: false, reason: 'Incorrect OTP. Please try again.' };

  sessionStorage.removeItem('aariva_otp');
  sessionStorage.removeItem('aariva_otp_expiry');
  return { valid: true };
}

function clearOTPState() {
  sessionStorage.removeItem('aariva_otp');
  sessionStorage.removeItem('aariva_otp_expiry');
  sessionStorage.removeItem('aariva_pending_email');
  sessionStorage.removeItem('aariva_pending_role');
  sessionStorage.removeItem('aariva_pending_name');
}

// ── EmailJS Send ──────────────────────────────

async function sendOTPEmail(toEmail, userName) {
  const otp = generateOTP();
  storeOTP(otp);

  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        to_email: toEmail,
        to_name: userName || 'User',
        otp_code: otp,
        expiry_minutes: '5'
      }
    );
    return { success: true };
  } catch (err) {
    console.error('EmailJS error:', err);
    return { success: false, error: err.text || 'Failed to send OTP email.' };
  }
}

// ── Resend Cooldown Timer ─────────────────────

function startResendCooldown(btnId = 'resend-btn', seconds = 30) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.disabled = true;
  let remaining = seconds;

  const interval = setInterval(() => {
    btn.textContent = `Resend OTP (${remaining}s)`;
    remaining--;

    if (remaining < 0) {
      clearInterval(interval);
      btn.disabled = false;
      btn.textContent = 'Resend OTP';
    }
  }, 1000);
}

// ── Step 1: Login Form Submit ─────────────────

async function handleLoginSubmit(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-btn');

  if (!email || !password) {
    showError(errorEl, 'Please enter both email and password.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifying...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(errorEl, data.message || 'Invalid credentials.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
      return;
    }

    sessionStorage.setItem('aariva_pending_email', email);
    sessionStorage.setItem('aariva_pending_role', data.role);
    sessionStorage.setItem('aariva_pending_name', data.name || '');

    submitBtn.textContent = 'Sending OTP...';
    const otpResult = await sendOTPEmail(email, data.name);

    if (!otpResult.success) {
      showError(errorEl, 'Could not send OTP. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
      return;
    }

    showOTPStep(email);
    startResendCooldown('resend-btn', 30);

  } catch (err) {
    console.error(err);
    showError(errorEl, 'Server error. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
}

// ── Step 2: OTP Verify Submit ─────────────────

async function handleOTPSubmit(e) {
  e.preventDefault();

  const otp = document.getElementById('otp-input').value.trim();
  const errorEl = document.getElementById('otp-error');
  const submitBtn = document.getElementById('otp-btn');

  if (!otp || otp.length !== 6) {
    showError(errorEl, 'Please enter the 6-digit OTP.');
    return;
  }

  const result = verifyOTP(otp);

  if (!result.valid) {
    showError(errorEl, result.reason);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifying...';

  try {
    const email = sessionStorage.getItem('aariva_pending_email');
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpVerified: true })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(errorEl, data.message || 'Session error. Please login again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Verify OTP';
      return;
    }

    clearOTPState();
    redirectByRole(data.role);

  } catch (err) {
    console.error(err);
    showError(errorEl, 'Server error. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Verify OTP';
  }
}

// ── Resend OTP ────────────────────────────────

async function handleResendOTP() {
  const email = sessionStorage.getItem('aariva_pending_email');
  const name = sessionStorage.getItem('aariva_pending_name');
  const errorEl = document.getElementById('otp-error');

  if (!email) {
    showError(errorEl, 'Session expired. Please login again.');
    showLoginStep();
    return;
  }

  const result = await sendOTPEmail(email, name);

  if (!result.success) {
    showError(errorEl, 'Could not resend OTP. Please try again.');
    return;
  }

  showSuccess(errorEl, 'A new OTP has been sent to your email.');
  startResendCooldown('resend-btn', 30);
}

// ── UI Helpers ────────────────────────────────

function showLoginStep() {
  document.getElementById('step-login').style.display = 'block';
  document.getElementById('step-otp').style.display = 'none';
}

function showOTPStep(email) {
  document.getElementById('step-login').style.display = 'none';
  document.getElementById('step-otp').style.display = 'block';

  const hint = document.getElementById('otp-email-hint');
  if (hint) {
    const [user, domain] = email.split('@');
    const masked = user.slice(0, 2) + '****@' + domain;
    hint.textContent = `OTP sent to ${masked}`;
  }
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = 'var(--color-error, #e74c3c)';
  el.style.display = 'block';
}

function showSuccess(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = 'var(--color-success, #27ae60)';
  el.style.display = 'block';
}

function redirectByRole(role) {
  // FIX: use alias routes — not .html paths
  const routes = {
    admin: '/admin',
    doctor: '/evaluation',
    caseworker: '/dashboard',
    applicant: '/track-case'
  };
  window.location.href = routes[role] || '/dashboard';
}

// ── OTP Input Auto-format ─────────────────────

function setupOTPInput() {
  const input = document.getElementById('otp-input');
  if (!input) return;

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 6);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('otp-btn')?.click();
    }
  });
}

// ── Register Form Submit ──────────────────────

async function handleRegisterSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('name')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const role = document.getElementById('role')?.value;
  const password = document.getElementById('password')?.value || '';
  const confirmPassword = document.getElementById('confirm-password')?.value || '';
  const alertEl = document.getElementById('alert');
  const submitBtn = document.getElementById('register-btn');

  if (!name || !email || !role || !password || !confirmPassword) {
    if (alertEl) {
      alertEl.className = 'alert error';
      alertEl.textContent = 'Please fill all fields.';
      alertEl.style.display = 'block';
    }
    return;
  }

  if (password.length < 6) {
    if (alertEl) {
      alertEl.className = 'alert error';
      alertEl.textContent = 'Password must be at least 6 characters.';
      alertEl.style.display = 'block';
    }
    return;
  }

  if (password !== confirmPassword) {
    if (alertEl) {
      alertEl.className = 'alert error';
      alertEl.textContent = 'Passwords do not match.';
      alertEl.style.display = 'block';
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();

    if (!res.ok) {
      if (alertEl) {
        alertEl.className = 'alert error';
        alertEl.textContent = data.message || 'Registration failed. Please try again.';
        alertEl.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
      return;
    }

    if (alertEl) {
      alertEl.className = 'alert success';
      alertEl.textContent = 'Account created successfully. Redirecting to login...';
      alertEl.style.display = 'block';
    }

    // FIX: use alias route — not .html path
    setTimeout(() => { window.location.href = '/login'; }, 1000);

  } catch (err) {
    console.error(err);
    if (alertEl) {
      alertEl.className = 'alert error';
      alertEl.textContent = 'Server error. Please try again.';
      alertEl.style.display = 'block';
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  }
}

// ── Init ──────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Init EmailJS only when config is present (login page)
  if (typeof emailjs !== 'undefined' && typeof EMAILJS_CONFIG !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  const otpForm = document.getElementById('otp-form');
  if (otpForm) otpForm.addEventListener('submit', handleOTPSubmit);

  const resendBtn = document.getElementById('resend-btn');
  if (resendBtn) resendBtn.addEventListener('click', handleResendOTP);

  const backBtn = document.getElementById('back-to-login');
  if (backBtn) backBtn.addEventListener('click', () => {
    clearOTPState();
    showLoginStep();
  });

  setupOTPInput();
  showLoginStep();
});