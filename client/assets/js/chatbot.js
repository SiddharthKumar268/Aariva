/**
 * chatbot.js — Aariva floating chatbot widget
 * Styled to match Anthropic support widget (multi-screen: Home → Chat)
 * Themed to Aariva dark design system
 */

(function () {
  'use strict';

  const API_ENDPOINT = '/api/chat';
  const MAX_HISTORY  = 20;
  const BOT_NAME     = 'Aari';
  const BOT_EMOJI    = '🤖';

  let isOpen       = false;
  let isTyping     = false;
  let currentView  = 'home'; // 'home' | 'chat'
  let history      = [];

  // ── Styles ─────────────────────────────────────────────────────────────────
  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

    /* ── FAB ── */
    #aariva-fab {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #1a1b23;
      border: 1.5px solid #2e3044;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
      outline: none;
    }
    #aariva-fab:hover {
      transform: scale(1.06);
      background: #22243a;
      box-shadow: 0 6px 32px rgba(79,142,247,0.3);
    }
    #aariva-fab .fab-icon { pointer-events: none; }

    /* Unread badge */
    #aariva-fab .fab-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #4f8ef7;
      border: 2px solid #0e0f14;
      display: none;
    }
    #aariva-fab.has-unread .fab-badge { display: block; }

    /* ── Main Window ── */
    #aariva-window {
      position: fixed;
      bottom: 96px;
      right: 28px;
      z-index: 9998;
      width: 380px;
      height: 580px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 12px 60px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'DM Sans', 'Segoe UI', sans-serif;
      transform-origin: bottom right;
      transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s;
    }
    #aariva-window.hidden {
      transform: scale(0.85);
      opacity: 0;
      pointer-events: none;
    }

    /* ── HOME SCREEN ── */
    .av-home {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .av-home-hero {
      background: #0e0f14;
      padding: 28px 24px 32px;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }
    .av-home-hero::before {
      content: '';
      position: absolute;
      top: -40px;
      right: -40px;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(79,142,247,0.15) 0%, transparent 70%);
    }
    .av-home-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 22px;
    }
    .av-home-logo-icon {
      width: 38px;
      height: 38px;
      background: rgba(79,142,247,0.12);
      border: 1px solid rgba(79,142,247,0.25);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .av-home-logo-text {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.2px;
    }
    .av-home-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255,255,255,0.08);
      border: none;
      color: rgba(255,255,255,0.55);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .av-home-close:hover { background: rgba(255,255,255,0.14); color: #fff; }
    .av-home-headline {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
      letter-spacing: -0.3px;
    }

    /* Status card */
    .av-status-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 13px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
      cursor: default;
    }
    .av-status-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e8f5e9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .av-status-check {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #22c55e;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .av-status-check::after {
      content: '✓';
      color: #fff;
      font-size: 10px;
      font-weight: 700;
    }
    .av-status-label {
      font-size: 13.5px;
      font-weight: 600;
      color: #111827;
    }
    .av-status-sub {
      font-size: 11.5px;
      color: #9ca3af;
      margin-top: 1px;
    }

    /* Home body */
    .av-home-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f3f4f6;
    }
    .av-home-body::-webkit-scrollbar { width: 4px; }
    .av-home-body::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

    .av-card {
      background: #ffffff;
      border-radius: 12px;
      margin-bottom: 10px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      transition: box-shadow 0.15s;
    }
    .av-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }

    .av-card-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      cursor: pointer;
      text-decoration: none;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.12s;
    }
    .av-card-link:last-child { border-bottom: none; }
    .av-card-link:hover { background: #f9fafb; }
    .av-card-link-text {
      font-size: 13.5px;
      font-weight: 500;
      color: #111827;
    }
    .av-card-link-arrow {
      color: #4f8ef7;
      font-size: 14px;
      flex-shrink: 0;
    }
    .av-card-cta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 16px;
      cursor: pointer;
      transition: background 0.12s;
    }
    .av-card-cta:hover { background: #f9fafb; }
    .av-card-cta-text {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
    .av-card-cta-arrow {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #4f8ef7;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .av-featured-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 15px 16px;
      margin-bottom: 10px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: box-shadow 0.15s;
    }
    .av-featured-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
    .av-featured-title {
      font-size: 13.5px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 5px;
    }
    .av-featured-desc {
      font-size: 12.5px;
      color: #6b7280;
      line-height: 1.5;
    }
    .av-featured-desc .av-truncate { 
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ── Bottom Nav ── */
    .av-bottom-nav {
      background: #ffffff;
      border-top: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      padding: 6px 0 10px;
      flex-shrink: 0;
    }
    .av-nav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px 4px;
      transition: color 0.15s;
    }
    .av-nav-btn .nav-icon { font-size: 20px; line-height: 1; }
    .av-nav-btn .nav-label { font-size: 11px; font-family: 'DM Sans', sans-serif; font-weight: 500; color: #9ca3af; }
    .av-nav-btn.active .nav-label { color: #4f8ef7; }
    .av-nav-btn.active .nav-icon-svg path { fill: #4f8ef7; }

    /* ── CHAT SCREEN ── */
    .av-chat {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f3f4f6;
    }
    .av-chat-header {
      background: #0e0f14;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 11px;
      flex-shrink: 0;
    }
    .av-chat-back {
      background: rgba(255,255,255,0.08);
      border: none;
      color: rgba(255,255,255,0.7);
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
    }
    .av-chat-back:hover { background: rgba(255,255,255,0.14); color: #fff; }
    .av-chat-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(79,142,247,0.15);
      border: 1px solid rgba(79,142,247,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      flex-shrink: 0;
    }
    .av-chat-info { flex: 1; }
    .av-chat-name {
      font-size: 13.5px;
      font-weight: 600;
      color: #ffffff;
    }
    .av-chat-status {
      font-size: 11px;
      color: #9ca3b0;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 2px;
    }
    .av-chat-status::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      display: inline-block;
      animation: avPulse 2s infinite;
    }
    @keyframes avPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
    .av-chat-close-btn {
      background: none;
      border: none;
      color: rgba(255,255,255,0.5);
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.15s;
    }
    .av-chat-close-btn:hover { color: #fff; }

    /* Messages area */
    .av-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      scroll-behavior: smooth;
    }
    .av-messages::-webkit-scrollbar { width: 4px; }
    .av-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

    /* Date stamp */
    .av-date-stamp {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      margin: 4px 0 6px;
    }

    /* Bubble */
    .av-bubble {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.55;
      word-break: break-word;
      animation: avMsgIn 0.17s ease;
    }
    @keyframes avMsgIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .av-bubble.user {
      background: #0e0f14;
      color: #ffffff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .av-bubble.bot {
      background: #ffffff;
      color: #111827;
      border: 1px solid #e5e7eb;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .av-bubble.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fee2e2;
      align-self: flex-start;
      font-size: 13px;
    }

    /* Typing indicator */
    .av-typing {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 11px 14px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      animation: avMsgIn 0.17s ease;
    }
    .av-typing span {
      width: 6px;
      height: 6px;
      background: #9ca3af;
      border-radius: 50%;
      animation: avBounce 1.2s infinite;
    }
    .av-typing span:nth-child(2) { animation-delay: 0.2s; }
    .av-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes avBounce {
      0%,60%,100% { transform: translateY(0); }
      30%          { transform: translateY(-5px); }
    }

    /* Suggestions chips */
    .av-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 14px 10px;
    }
    .av-chip {
      font-size: 12px;
      padding: 5px 12px;
      border-radius: 20px;
      border: 1.5px solid #e5e7eb;
      background: #ffffff;
      color: #374151;
      cursor: pointer;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .av-chip:hover {
      border-color: #4f8ef7;
      color: #4f8ef7;
      background: rgba(79,142,247,0.05);
    }

    /* Chat footer */
    .av-chat-footer {
      border-top: 1px solid #e5e7eb;
      padding: 10px 12px;
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: #ffffff;
      flex-shrink: 0;
    }
    .av-input {
      flex: 1;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 9px 13px;
      font-size: 13.5px;
      outline: none;
      background: #f9fafb;
      color: #111827;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.2s, box-shadow 0.2s;
      resize: none;
      line-height: 1.45;
      max-height: 80px;
      overflow-y: auto;
    }
    .av-input:focus {
      border-color: #4f8ef7;
      box-shadow: 0 0 0 3px rgba(79,142,247,0.1);
      background: #fff;
    }
    .av-input::placeholder { color: #9ca3af; }
    .av-send-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #0e0f14;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.15s, opacity 0.15s;
    }
    .av-send-btn:hover { background: #22243a; transform: scale(1.05); }
    .av-send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

    /* MESSAGES TAB (empty state) */
    .av-msgs-tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: #f3f4f6;
      padding: 24px;
    }
    .av-msgs-tab-icon { font-size: 36px; opacity: 0.4; }
    .av-msgs-tab-text { font-size: 14px; color: #9ca3af; text-align: center; }
    .av-msgs-tab-btn {
      margin-top: 8px;
      padding: 9px 20px;
      background: #0e0f14;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: background 0.15s;
    }
    .av-msgs-tab-btn:hover { background: #22243a; }

    /* HELP TAB */
    .av-help-tab {
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px;
      background: #f3f4f6;
    }
    .av-help-title {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 14px;
    }
    .av-help-item {
      background: #ffffff;
      border-radius: 10px;
      padding: 13px 15px;
      margin-bottom: 8px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: box-shadow 0.12s;
    }
    .av-help-item:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.07); }
    .av-help-item-title { font-size: 13.5px; font-weight: 600; color: #111827; }
    .av-help-item-sub { font-size: 12px; color: #6b7280; margin-top: 3px; }

    @media (max-width: 440px) {
      #aariva-window { width: calc(100vw - 20px); right: 10px; height: 90vh; bottom: 80px; }
    }
  `;

  function injectStyles() {
    const el = document.createElement('style');
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  // ── BUILD ───────────────────────────────────────────────────────────────────
  function buildWidget() {
    // FAB
    const fab = document.createElement('button');
    fab.id = 'aariva-fab';
    fab.setAttribute('aria-label', 'Open Aari assistant');
    fab.innerHTML = `
      <span class="fab-badge"></span>
      <svg class="fab-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#e8eaf0"/>
        <circle cx="8"  cy="10" r="1.2" fill="#4f8ef7"/>
        <circle cx="12" cy="10" r="1.2" fill="#4f8ef7"/>
        <circle cx="16" cy="10" r="1.2" fill="#4f8ef7"/>
      </svg>`;
    fab.addEventListener('click', toggleWidget);

    // Window
    const win = document.createElement('div');
    win.id = 'aariva-window';
    win.classList.add('hidden');

    document.body.appendChild(fab);
    document.body.appendChild(win);

    renderHomeScreen(win);
  }

  // ── HOME SCREEN ─────────────────────────────────────────────────────────────
  function renderHomeScreen(win) {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    win.innerHTML = `
      <div class="av-home">
        <div class="av-home-hero">
          <button class="av-home-close" id="av-close-btn" aria-label="Close">×</button>
          <div class="av-home-logo">
            <div class="av-home-logo-icon">${BOT_EMOJI}</div>
            <span class="av-home-logo-text">Aariva</span>
          </div>
          <div class="av-home-headline">Need support?<br>How can we help?</div>
        </div>

        <div class="av-home-body" id="av-home-tab-content">
          <!-- Quick Links -->
          <div class="av-card">
            <div class="av-card-link" id="av-open-chat">
              <span class="av-card-link-text">Chat with ${BOT_NAME}</span>
              <svg class="av-card-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#4f8ef7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="av-card-link" onclick="window.open('','_blank')">
              <span class="av-card-link-text">View my case status</span>
              <svg class="av-card-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#4f8ef7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- Status -->
          <div class="av-card">
            <div style="padding:14px 16px;display:flex;align-items:center;gap:12px;">
              <div class="av-status-check" style="width:28px;height:28px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <div class="av-status-label">Status: All Systems Operational</div>
                <div class="av-status-sub">Updated ${today}</div>
              </div>
            </div>
          </div>

          <!-- Send a message CTA -->
          <div class="av-card" id="av-send-message-cta">
            <div class="av-card-cta">
              <span class="av-card-cta-text">Send us a message</span>
              <div class="av-card-cta-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Safeguards -->
          <div class="av-featured-card" id="av-safeguards">
            <div class="av-featured-title">Safeguards, Warnings and Appeals</div>
            <div class="av-featured-desc">
              <div class="av-truncate">Please note: Response times may be longer during peak hours. You can appeal any decision made on your case within 30 days.</div>
            </div>
          </div>
        </div>

        <!-- Bottom Nav -->
        <div class="av-bottom-nav">
          <button class="av-nav-btn active" id="av-nav-home">
            <span class="nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z" fill="#4f8ef7"/>
              </svg>
            </span>
            <span class="nav-label">Home</span>
          </button>
          <button class="av-nav-btn" id="av-nav-messages">
            <span class="nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#9ca3af"/>
              </svg>
            </span>
            <span class="nav-label">Messages</span>
          </button>
          <button class="av-nav-btn" id="av-nav-help">
            <span class="nav-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#9ca3af" stroke-width="2"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="17" r="1" fill="#9ca3af"/>
              </svg>
            </span>
            <span class="nav-label">Help</span>
          </button>
        </div>
      </div>`;

    // Events
    win.querySelector('#av-close-btn').addEventListener('click', closeWidget);
    win.querySelector('#av-open-chat').addEventListener('click', () => switchToChatView(win));
    win.querySelector('#av-send-message-cta').addEventListener('click', () => switchToChatView(win));
    win.querySelector('#av-safeguards').addEventListener('click', () => switchToChatView(win));

    // Nav
    win.querySelector('#av-nav-home').addEventListener('click', () => {
      setActiveNav(win, 'home');
      renderHomeTabContent(win);
    });
    win.querySelector('#av-nav-messages').addEventListener('click', () => {
      setActiveNav(win, 'messages');
      renderMessagesTabContent(win);
    });
    win.querySelector('#av-nav-help').addEventListener('click', () => {
      setActiveNav(win, 'help');
      renderHelpTabContent(win);
    });
  }

  function setActiveNav(win, tab) {
    win.querySelectorAll('.av-nav-btn').forEach(btn => btn.classList.remove('active'));
    const map = { home: '#av-nav-home', messages: '#av-nav-messages', help: '#av-nav-help' };
    win.querySelector(map[tab])?.classList.add('active');
  }

  function renderHomeTabContent(win) {
    const body = win.querySelector('#av-home-tab-content');
    if (!body) return;
    // Re-render the default cards
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    body.innerHTML = `
      <div class="av-card">
        <div class="av-card-link" id="av-open-chat2">
          <span class="av-card-link-text">Chat with ${BOT_NAME}</span>
          <svg class="av-card-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="#4f8ef7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="av-card-link">
          <span class="av-card-link-text">View my case status</span>
          <svg class="av-card-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="#4f8ef7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>
      <div class="av-card">
        <div style="padding:14px 16px;display:flex;align-items:center;gap:12px;">
          <div style="width:28px;height:28px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <div class="av-status-label">Status: All Systems Operational</div>
            <div class="av-status-sub">Updated ${today}</div>
          </div>
        </div>
      </div>
      <div class="av-card" id="av-send-cta2">
        <div class="av-card-cta">
          <span class="av-card-cta-text">Send us a message</span>
          <div class="av-card-cta-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" stroke-width="2.2" stroke-linecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2.2" stroke-linejoin="round"/></svg></div>
        </div>
      </div>
      <div class="av-featured-card" id="av-safeguards2">
        <div class="av-featured-title">Safeguards, Warnings and Appeals</div>
        <div class="av-featured-desc"><div class="av-truncate">Please note: Response times may be longer during peak hours. You can appeal any decision on your case within 30 days.</div></div>
      </div>`;
    body.querySelector('#av-open-chat2')?.addEventListener('click', () => switchToChatView(win));
    body.querySelector('#av-send-cta2')?.addEventListener('click', () => switchToChatView(win));
    body.querySelector('#av-safeguards2')?.addEventListener('click', () => switchToChatView(win));
  }

  function renderMessagesTabContent(win) {
    const body = win.querySelector('#av-home-tab-content');
    if (!body) return;
    if (history.length > 0) {
      // Show last convo snippet
      body.innerHTML = `
        <div class="av-card" id="av-resume-chat" style="cursor:pointer;">
          <div style="padding:14px 16px;display:flex;align-items:center;gap:12px;">
            <div style="width:38px;height:38px;border-radius:50%;background:#f3f4f6;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${BOT_EMOJI}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13.5px;font-weight:600;color:#111827;">${BOT_NAME} · Aariva</div>
              <div style="font-size:12.5px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${history[history.length - 1]?.content || '...'}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>`;
      body.querySelector('#av-resume-chat').addEventListener('click', () => switchToChatView(win));
    } else {
      body.innerHTML = `
        <div class="av-msgs-tab">
          <div class="av-msgs-tab-icon">💬</div>
          <div class="av-msgs-tab-text">No conversations yet.<br>Start chatting with ${BOT_NAME}!</div>
          <button class="av-msgs-tab-btn" id="av-start-chat-btn">Start a conversation</button>
        </div>`;
      body.querySelector('#av-start-chat-btn').addEventListener('click', () => switchToChatView(win));
    }
  }

  function renderHelpTabContent(win) {
    const body = win.querySelector('#av-home-tab-content');
    if (!body) return;
    const articles = [
      { title: 'What does "Under Review" mean?', sub: 'Learn about each case status and what to expect.' },
      { title: 'How do I upload documents?', sub: 'Step-by-step guide to submitting required files.' },
      { title: 'Why was my case flagged?', sub: 'Cases pending 7+ days are auto-escalated.' },
      { title: 'How long does approval take?', sub: 'Typical processing timelines explained.' },
      { title: 'OTP and session issues', sub: 'OTP expires in 5 min; sessions in 2 hours.' },
      { title: 'Appeals and rejections', sub: 'How to appeal a rejected case decision.' },
    ];
    body.innerHTML = `
      <div class="av-help-tab" style="padding:0;background:transparent;">
        <div class="av-help-title" style="margin-bottom:12px;">Helpful Articles</div>
        ${articles.map(a => `
          <div class="av-help-item" onclick="document.getElementById('av-nav-home')&&void(0)">
            <div class="av-help-item-title">${a.title}</div>
            <div class="av-help-item-sub">${a.sub}</div>
          </div>`).join('')}
      </div>`;
  }

  // ── CHAT SCREEN ──────────────────────────────────────────────────────────────
  function switchToChatView(win) {
    currentView = 'chat';
    win.innerHTML = `
      <div class="av-chat">
        <div class="av-chat-header">
          <button class="av-chat-back" id="av-back-btn" aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="av-chat-avatar">${BOT_EMOJI}</div>
          <div class="av-chat-info">
            <div class="av-chat-name">${BOT_NAME}</div>
            <div class="av-chat-status">Online · Aariva Assistant</div>
          </div>
          <button class="av-chat-close-btn" id="av-chat-close" aria-label="Close">×</button>
        </div>

        <div class="av-messages" id="av-messages">
          <div class="av-date-stamp">Today</div>
        </div>

        <div class="av-chips" id="av-chips"></div>

        <div class="av-chat-footer">
          <textarea
            id="av-input"
            class="av-input"
            placeholder="Ask me anything…"
            rows="1"
            maxlength="500"
            aria-label="Chat message"
          ></textarea>
          <button id="av-send" class="av-send-btn" aria-label="Send message">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>`;

    win.querySelector('#av-back-btn').addEventListener('click', () => {
      currentView = 'home';
      renderHomeScreen(win);
    });
    win.querySelector('#av-chat-close').addEventListener('click', closeWidget);
    win.querySelector('#av-send').addEventListener('click', sendMessage);
    win.querySelector('#av-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    win.querySelector('#av-input').addEventListener('input', () => {
      const ta = win.querySelector('#av-input');
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 80) + 'px';
    });

    // Render existing history or show welcome
    const msgBox = win.querySelector('#av-messages');
    if (history.length > 0) {
      history.forEach(m => appendBubble(m.role === 'user' ? 'user' : 'bot', m.content));
    } else {
      showWelcome();
    }
    win.querySelector('#av-input').focus();
  }

  // ── WELCOME ──────────────────────────────────────────────────────────────────
  const SUGGESTIONS = [
    'What does "Under Review" mean?',
    'How do I upload documents?',
    'Why was my case flagged?',
    'How long does approval take?'
  ];

  function showWelcome() {
    appendBubble('bot', `Hi! I'm **${BOT_NAME}**, your Aariva assistant. How can I help you today?`);
    renderChips();
  }

  function renderChips() {
    const container = document.getElementById('av-chips');
    if (!container) return;
    container.innerHTML = '';
    SUGGESTIONS.forEach(text => {
      const btn = document.createElement('button');
      btn.className = 'av-chip';
      btn.textContent = text;
      btn.addEventListener('click', () => {
        container.innerHTML = '';
        submitText(text);
      });
      container.appendChild(btn);
    });
  }

  // ── MESSAGES ──────────────────────────────────────────────────────────────────
  function appendBubble(role, content) {
    const box = document.getElementById('av-messages');
    if (!box) return;
    const el = document.createElement('div');
    el.className = `av-bubble ${role}`;
    el.innerHTML = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
    return el;
  }

  function showTypingDots() {
    const box = document.getElementById('av-messages');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'av-typing';
    el.id = 'av-typing-dots';
    el.innerHTML = '<span></span><span></span><span></span>';
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
  }

  function hideTypingDots() {
    document.getElementById('av-typing-dots')?.remove();
  }

  // ── SEND ──────────────────────────────────────────────────────────────────────
  function sendMessage() {
    const input = document.getElementById('av-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || isTyping) return;
    input.value = '';
    input.style.height = 'auto';
    const chips = document.getElementById('av-chips');
    if (chips) chips.innerHTML = '';
    submitText(text);
  }

  async function submitText(text) {
    appendBubble('user', text);
    history.push({ role: 'user', content: text });
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

    isTyping = true;
    const sendBtn = document.getElementById('av-send');
    if (sendBtn) sendBtn.disabled = true;
    showTypingDots();

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      hideTypingDots();
      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      const data  = await res.json();
      const reply = data.reply || 'Sorry, I did not get a response.';
      appendBubble('bot', reply);
      history.push({ role: 'assistant', content: reply });
      if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

      // Show FAB badge if window is closed
      if (!isOpen) {
        document.getElementById('aariva-fab')?.classList.add('has-unread');
      }

    } catch (err) {
      hideTypingDots();
      const box = document.getElementById('av-messages');
      if (box) {
        const errEl = document.createElement('div');
        errEl.className = 'av-bubble error';
        errEl.textContent = '⚠️ Could not reach the assistant. Please try again.';
        box.appendChild(errEl);
        box.scrollTop = box.scrollHeight;
      }
    } finally {
      isTyping = false;
      if (sendBtn) sendBtn.disabled = false;
      document.getElementById('av-input')?.focus();
    }
  }

  // ── TOGGLE ─────────────────────────────────────────────────────────────────
  function toggleWidget() {
    isOpen ? closeWidget() : openWidget();
  }

  function openWidget() {
    isOpen = true;
    document.getElementById('aariva-fab')?.classList.remove('has-unread');
    document.getElementById('aariva-window')?.classList.remove('hidden');
    if (currentView === 'chat') {
      document.getElementById('av-input')?.focus();
    }
  }

  function closeWidget() {
    isOpen = false;
    document.getElementById('aariva-window')?.classList.add('hidden');
  }

  // ── INIT ────────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    buildWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();