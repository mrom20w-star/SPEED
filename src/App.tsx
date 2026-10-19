/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [entered, setEntered] = useState(() => Boolean(typeof window !== 'undefined' && (window as any).__entered));
  const [views, setViews] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showUidTooltip, setShowUidTooltip] = useState(false);
  const [showViewsTooltip, setShowViewsTooltip] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync with native first-frame click listener
  useEffect(() => {
    const handleNativeEnter = () => {
      setEntered(true);
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('app:entered', handleNativeEnter);
    if ((window as any).__entered) {
      handleNativeEnter();
    }
    return () => window.removeEventListener('app:entered', handleNativeEnter);
  }, [isMuted, volume]);

  // Initialize and track unique device views (starts from 0)
  useEffect(() => {
    let visitorId = localStorage.getItem('guns_visitor_id');
    const isFirstVisitForDevice = !visitorId;

    if (!visitorId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        visitorId = crypto.randomUUID();
      } else {
        visitorId = 'visitor_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      }
      localStorage.setItem('guns_visitor_id', visitorId);
    }

    // Call server asynchronously in background without delaying anything
    fetch('/api/views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visitorId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === 'number') {
          setViews(data.count);
        }
      })
      .catch(() => {
        setViews(isFirstVisitForDevice ? 1 : 1);
      });
  }, []);

  // Guns.lol animated title in browser tab:
  // Types and untypes "@Speed33" next to the purple gun favicon
  useEffect(() => {
    const target = 'Speed33';
    let r = 0;
    let a = true;

    const interval = setInterval(() => {
      if (r === target.length) {
        a = false;
      }
      if (r === 0) {
        a = true;
      }

      r = a ? r + 1 : r - 1;
      const current = r === 0 ? '' : target.slice(0, r);
      document.title = '@' + current;
    }, 380);

    return () => clearInterval(interval);
  }, []);

  // Instant 0ms response on click
  const handleEnter = () => {
    (window as any).__entered = true;
    const el = document.getElementById('initial-entry-overlay');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
    setEntered(true);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play().catch(() => {});
    }
  };

  // Handle volume changes
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) / 100;
    setVolume(val);
    if (isMuted && val > 0) {
      setIsMuted(false);
    }
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = volume > 0 ? volume : 0.5;
      }
    } else {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full select-none overflow-hidden bg-[#080808] font-['Satoshi'] text-white">
      {/* Background audio element (optimized 650KB, instant playback) */}
      <audio
        ref={audioRef}
        src="/assets/audio.mp3"
        loop
        preload="auto"
      />

      {/* Base solid background layer */}
      <div className="guns-base-bg" />

      {/* Exact guns.lol/light_stg background image */}
      <div
        className="guns-bg"
        style={{
          backgroundImage: "url('/assets/guns_bg.webp')",
          backgroundPosition: '50% 50%',
          backgroundSize: 'cover',
        }}
      />

      {/* Night atmospheric overlay (exact guns.lol light_stg layer) */}
      <div
        className="guns-night-overlay"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
        }}
      />

      {/* "click to enter..." Overlay fallback */}
      {!entered && (
        <div
          onClick={handleEnter}
          className="fixed inset-0 z-[9999] flex cursor-pointer flex-col items-center justify-center gap-3.5 bg-black/75 backdrop-blur-[10px] select-none transition-opacity duration-150 active:opacity-80"
        >
          <div className="max-w-[1200px] px-2.5 text-center text-[30px] font-bold text-[#fafafa] tracking-wide active:scale-95 transition-transform duration-100">
            click to enter...
          </div>
        </div>
      )}

      {/* Volume Control Widget (Top Left) */}
      <div className="guns-volume-box group">
        <span
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="flex cursor-pointer text-[29px] text-white active:translate-y-0.5"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            /* Muted Speaker SVG */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 48 48"
              className="min-w-[30px]"
            >
              <g fill="none" stroke="currentColor" strokeWidth="4">
                <path
                  fill="currentColor"
                  strokeLinejoin="round"
                  d="M24 6v36c-7 0-12.201-9.16-12.201-9.16H6a2 2 0 0 1-2-2V17.01a2 2 0 0 1 2-2h5.799S17 6 24 6Z"
                />
                <path strokeLinecap="round" d="m32 20l12 12m0-12L32 32" />
              </g>
            </svg>
          ) : (
            /* Active Speaker SVG */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 48 48"
              className="min-w-[30px]"
            >
              <defs>
                <mask id="ipTVolumeNotice0">
                  <g fill="none" stroke="#fff" strokeWidth="4">
                    <path
                      fill="#555"
                      strokeLinejoin="round"
                      d="M24 6v36c-7 0-12.201-9.16-12.201-9.16H6a2 2 0 0 1-2-2V17.01a2 2 0 0 1 2-2h5.799S17 6 24 6Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M32 15a11.91 11.91 0 0 1 1.684 1.859A12.07 12.07 0 0 1 36 24c0 2.654-.846 5.107-2.278 7.09A11.936 11.936 0 0 1 32 33"
                    />
                    <path
                      strokeLinecap="round"
                      d="M34.236 41.186C40.084 37.696 44 31.305 44 24c0-7.192-3.796-13.496-9.493-17.02"
                    />
                  </g>
                </mask>
              </defs>
              <path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipTVolumeNotice0)" />
            </svg>
          )}
        </span>

        {/* Expandable Slider */}
        <div className="flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={isMuted ? 0 : Math.round(volume * 100)}
            onChange={handleVolumeChange}
            className="guns-slider"
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Main Profile Page Content */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-[50px_15px] box-border">
        <div className="relative z-10 flex w-full max-w-[40rem] flex-col items-center gap-[15px]">
          {/* Profile Card Container (Exact guns.lol translucent glass & border) */}
          <div className="relative w-full rounded-[20px] bg-[#1b1b1b]/50 p-[35px_15px] pb-[52px] backdrop-blur-[10px] border-2 border-white/30 shadow-2xl">
            <div className="flex w-full flex-col items-center">
              {/* Avatar with Discord Wings Decoration */}
              <div className="relative flex items-center justify-center mt-6 mb-7">
                {/* Feathered Wings Decoration lifted higher up */}
                <img
                  src="/assets/avatar_decoration_wings.webp"
                  alt="Avatar Wings Decoration"
                  className="pointer-events-none absolute z-10 w-[185px] h-[185px] -top-[48px] max-w-none select-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
                />
                {/* Circular Profile Avatar (User's Discord Avatar) */}
                <img
                  src="/assets/discord_avatar.webp"
                  alt="Discord Avatar"
                  className="relative z-0 h-[118px] w-[118px] rounded-full object-cover select-none shadow-2xl ring-2 ring-white/15"
                />
              </div>

              {/* Display Name and Subtitle: Speed33 with full clarity */}
              <div className="mt-[2px] flex max-w-[27rem] flex-col items-center justify-center text-center">
                {/* Name: Speed33 with Sparkle Yellow Effect & Glow */}
                <div
                  className="relative inline-flex items-center justify-center cursor-default group/uid"
                  onMouseEnter={() => setShowUidTooltip(true)}
                  onMouseLeave={() => setShowUidTooltip(false)}
                >
                  <h1 className="sparkle-username m-0 text-[39.5px] font-[600] text-white tracking-wide">
                    Speed33
                  </h1>

                  {/* Tooltip: UID 1392685347967864956 */}
                  <div
                    className={`guns-tooltip ${
                      showUidTooltip ? '!opacity-100 !scale-100 !translate-y-0' : ''
                    }`}
                    style={{
                      borderColor: 'rgba(26, 26, 26, 0.4)',
                      backgroundColor: 'rgba(20, 20, 20, 0.85)',
                    }}
                  >
                    UID 1392685347967864956
                  </div>
                </div>

                {/* Subtitle / Description */}
                <h3 className="m-0 mt-[5px] text-[19px] font-[570] text-white/90">
                  33
                </h3>
              </div>

              {/* Connected Discord Profile Box (Exact guns.lol styling) */}
              <div className="mt-[20px] flex w-full max-w-[28rem] justify-center">
                <a
                  href="https://discord.com/users/1392685347967864956"
                  target="_blank"
                  rel="noreferrer"
                  className="group/discord flex w-full items-center gap-3.5 rounded-[22px] border-2 border-[#1b1b1b]/30 bg-[#1b1b1b]/35 p-3 px-4 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-[#1b1b1b]/55"
                >
                  {/* Discord Avatar with status ring */}
                  <div className="relative">
                    <img
                      src="/assets/discord_avatar.webp"
                      alt="Discord"
                      className="h-11 w-11 rounded-full object-cover ring-1 ring-white/15"
                    />
                    {/* Status ring at bottom right */}
                    <div
                      className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#1b1b1b] bg-[#23a55a]"
                      title="Online"
                    />
                  </div>

                  {/* User info */}
                  <div className="flex flex-1 flex-col justify-center text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] font-bold text-white group-hover/discord:text-[#e2b309] transition-colors">
                        Speed
                      </span>

                      {/* Clan tag: ⚡ Speed33 */}
                      <span className="flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-xs font-bold text-white">
                        <span className="text-yellow-400">⚡</span> Speed33
                      </span>

                      {/* Nitro Badge */}
                      <span className="flex items-center rounded bg-[#5865f2]/30 px-1.5 py-0.5 text-[10px] font-semibold text-[#5865f2]">
                        NITRO
                      </span>
                    </div>

                    {/* Subtext: @mrwan0741 • Online */}
                    <span className="text-[12.5px] text-white/60">
                      @mrwan0741 • <span className="text-[#23a55a]">Online</span>
                    </span>
                  </div>
                </a>
              </div>

              {/* Social Links Row (ONLY the 3 requested links: Discord, TikTok, GitHub) */}
              <div className="mt-[28px] flex w-full flex-wrap items-center justify-center gap-[18px]">
                {/* 1. Discord Link */}
                <div className="flex">
                  <a
                    href="https://discord.com/users/1392685347967864956"
                    target="_blank"
                    rel="nofollow ugc noopener noreferrer"
                    className="flex transition-transform duration-300 hover:scale-110"
                    title="Discord (@mrwan0741)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="1.96 4.26 20.03 15.53"
                      className="text-[35px] text-[#e2b309]"
                      style={{ filter: 'drop-shadow(#e2b309 1px 0 7px)' }}
                    >
                      <path
                        fill="currentColor"
                        d="M14.82 4.26a10.14 10.14 0 0 0-.53 1.1a14.66 14.66 0 0 0-4.58 0a10.14 10.14 0 0 0-.53-1.1a16 16 0 0 0-4.13 1.3a17.33 17.33 0 0 0-3 11.59a16.6 16.6 0 0 0 5.07 2.59A12.89 12.89 0 0 0 8.23 18a9.65 9.65 0 0 1-1.71-.83a3.39 3.39 0 0 0 .42-.33a11.66 11.66 0 0 0 10.12 0q.21.18.42.33a10.84 10.84 0 0 1-1.71.84a12.41 12.41 0 0 0 1.08 1.78a16.44 16.44 0 0 0 5.06-2.59a17.22 17.22 0 0 0-3-11.59a16.09 16.09 0 0 0-4.09-1.35zM8.68 14.81a1.94 1.94 0 0 1-1.8-2a1.93 1.93 0 0 1 1.8-2a1.93 1.93 0 0 1 1.8 2a1.93 1.93 0 0 1-1.8 2zm6.64 0a1.94 1.94 0 0 1-1.8-2a1.93 1.93 0 0 1 1.8-2a1.92 1.92 0 0 1 1.8 2a1.92 1.92 0 0 1-1.8 2z"
                      />
                    </svg>
                  </a>
                </div>

                {/* 2. TikTok Link */}
                <div className="flex">
                  <a
                    href="https://www.tiktok.com/@mrwan3333?is_from_webapp=1&sender_device=pc"
                    target="_blank"
                    rel="nofollow ugc noopener noreferrer"
                    className="flex transition-transform duration-300 hover:scale-110"
                    title="TikTok (@mrwan3333)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="3.2 2 17.43 19.99"
                      className="text-[35px] text-[#e2b309]"
                      style={{ filter: 'drop-shadow(#e2b309 1px 0 7px)' }}
                    >
                      <path
                        fill="currentColor"
                        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74a2.89 2.89 0 0 1 2.31-4.64a2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                      />
                    </svg>
                  </a>
                </div>

                {/* 3. GitHub Link */}
                <div className="flex">
                  <a
                    href="https://github.com/mrom20w-star"
                    target="_blank"
                    rel="nofollow ugc noopener noreferrer"
                    className="flex transition-transform duration-300 hover:scale-110"
                    title="GitHub (mrom20w-star)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="2.05 2 19.95 19.46"
                      className="text-[35px] text-[#e2b309]"
                      style={{ filter: 'drop-shadow(#e2b309 1px 0 7px)' }}
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974c0 4.406 2.857 8.145 6.821 9.465c.499.09.679-.217.679-.481c0-.237-.008-.865-.011-1.696c-2.775.602-3.361-1.338-3.361-1.338c-.452-1.152-1.107-1.459-1.107-1.459c-.905-.619.069-.605.069-.605c1.002.07 1.527 1.028 1.527 1.028c.89 1.524 2.336 1.084 2.902.829c.091-.645.351-1.085.635-1.334c-2.214-.251-4.542-1.107-4.542-4.93c0-1.087.389-1.979 1.024-2.675c-.101-.253-.446-1.268.099-2.64c0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336a9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021c.545 1.372.203 2.387.099 2.64c.64.696 1.024 1.587 1.024 2.675c0 3.833-2.33 4.675-4.552 4.922c.355.308.675.916.675 1.846c0 1.334-.012 2.41-.012 2.737c0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974C22 6.465 17.535 2 12.026 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Profile Views Counter (bottom-left inside container) */}
            <div className="absolute bottom-[12px] left-[15px] z-20">
              <div
                className="relative inline-flex items-center justify-center cursor-default group/views"
                onMouseEnter={() => setShowViewsTooltip(true)}
                onMouseLeave={() => setShowViewsTooltip(false)}
              >
                <div className="flex items-center rounded-[10px] border-2 border-white/30 bg-[#1b1b1b]/50 px-2.5 py-1 text-white backdrop-blur-[10px]">
                  <span className="flex items-center text-[14px] font-[550]">
                    {/* Eye SVG */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                      className="mr-[5px] text-[19px]"
                    >
                      <path
                        fill="currentColor"
                        d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"
                      />
                    </svg>
                    {views}
                  </span>
                </div>

                {/* Tooltip: Profile Views */}
                <div
                  className={`guns-tooltip ${
                    showViewsTooltip ? '!opacity-100 !scale-100 !translate-y-0' : ''
                  }`}
                  style={{
                    borderColor: 'rgba(26, 26, 26, 0.4)',
                    backgroundColor: 'rgba(20, 20, 20, 0.85)',
                  }}
                >
                  Profile Views
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
