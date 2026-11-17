  import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
  import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBU-9TxC1k3fHTdGSdd1ti2S70H4QtjpkQ",
    authDomain: "christmas-wishlist-2026.firebaseapp.com",
    projectId: "christmas-wishlist-2026",
    storageBucket: "christmas-wishlist-2026.firebasestorage.app",
    messagingSenderId: "31993292527",
    appId: "1:31993292527:web:757c3ec22e483b2b4b9d1a"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const state = { wishes: [], filter: "all", passcode: sessionStorage.getItem("ownerPass") || "", ownerConfigured: true, hasVoice: false, voiceVersion: null };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tilt = (i) => `${((i * 37) % 7) - 3}deg`;
const RIBBONS = ["#c8102e", "#1d7a4f", "#3a8fd6", "#b8860b", "#8e3fb5"];

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2600);
}

async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.json !== undefined) headers["Content-Type"] = "application/json";
  if (path.startsWith("/api/owner")) headers["x-owner-passcode"] = state.passcode;
  const res = await fetch(path, { method: opts.method || "GET", headers, body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Something went wrong"), { status: res.status });
  return data;
}

/* ---------------- decorations ---------------- */
function decorate() {
  const lights = $("#lights");
  const n = Math.ceil(window.innerWidth / 48);
  lights.innerHTML = "<span></span>".repeat(n);
  const stars = $("#stars");
  stars.innerHTML = Array.from({ length: 90 }, () => {
    const s = Math.random() * 2 + 1;
    return `<i style="left:${Math.random() * 100}%;top:${Math.random() * 60}%;width:${s}px;height:${s}px;animation-delay:${Math.random() * 3}s"></i>`;
  }).join("");
}

function snow() {
  const c = $("#snow");
  const ctx = c.getContext("2d");
  let w, h, flakes;
  const reset = () => {
    w = c.width = innerWidth;
    h = c.height = innerHeight;
    flakes = Array.from({ length: Math.min(140, Math.floor(w / 9)) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 2.6 + 0.8, s: Math.random() * 0.8 + 0.3, d: Math.random() * Math.PI * 2 }));
  };
  reset();
  addEventListener("resize", reset);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  (function tick() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    for (const f of flakes) {
      f.d += 0.01;
      f.y += f.s;
      f.x += Math.sin(f.d) * 0.4;
      if (f.y > h) { f.y = -5; f.x = Math.random() * w; }
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  })();
}

const pad = (n) => String(n).padStart(2, "0");

// Time left until 12 midnight (start of the day) of the next month/day.
function untilNext(month, day, now = new Date()) {
  const isToday = now.getMonth() === month && now.getDate() === day;
  let target = new Date(now.getFullYear(), month, day);
  if (now >= target) target = new Date(now.getFullYear() + 1, month, day);
  return { isToday, diff: target - now };
}

function paint(prefix, diff) {
  $(`#${prefix}-d`).textContent = Math.floor(diff / 864e5);
  $(`#${prefix}-h`).textContent = pad(Math.floor(diff / 36e5) % 24);
  $(`#${prefix}-m`).textContent = pad(Math.floor(diff / 6e4) % 60);
  $(`#${prefix}-s`).textContent = pad(Math.floor(diff / 1e3) % 60);
}

function countdown() {
  const tick = () => {
    const x = untilNext(11, 25);
    $("#countdown").hidden = x.isToday;
    $("#cd-label").textContent = x.isToday ? "🎉 IT’S CHRISTMAS! Merry Christmas, everyone! 🎄" : "to go until Christmas, 12 midnight 🎄";
    if (!x.isToday) paint("cd", x.diff);

    tickBabies();
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------------- DO YOU KNOW? birthday bomb ---------------- */
const BOMB = ["🎄", "🎁", "⭐", "🎂", "🎉", "❄️", "🔔", "🎈", "🍬", "✨", "🦌", "🎊"];
function christmasBomb(x, y) {
  const flash = document.createElement("div");
  flash.className = "bomb-flash";
  flash.style.left = `${x}px`;
  flash.style.top = `${y}px`;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 900);
  const count = matchMedia("(prefers-reduced-motion: reduce)").matches ? 12 : 46;
  for (let k = 0; k < count; k++) {
    const p = document.createElement("div");
    p.className = "bomb-bit";
    p.textContent = BOMB[k % BOMB.length];
    const ang = (Math.PI * 2 * k) / count + Math.random() * 0.4;
    const dist = 140 + Math.random() * Math.min(innerWidth, 700) * 0.45;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(ang) * dist}px`);
    p.style.setProperty("--rot", `${(Math.random() - 0.5) * 900}deg`);
    p.style.fontSize = `${1.4 + Math.random() * 1.6}rem`;
    p.style.animationDelay = `${Math.random() * 0.12}s`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
}

const BABY_STEPS = [
  { html: `There are <b>3 December babies</b>! 👶🎄`, btn: "😮 Who?! Click again" },
  { num: "1.", name: "Mia", day: 18, emoji: "🎀", btn: "🤩 Who’s next? Click again" },
  { num: "2.", name: "Apple", day: 19, emoji: "🍎", btn: "👀 There’s more… click again" },
  { html: `And the <b>most awaiteeeed</b>… 🥁🥁🥁`, btn: "🥁 Drumroll… click again" },
  { num: "3.", name: "✝️ JESUS ✝️", day: 25, emoji: "⭐", noTimer: true, btn: "😜 Kidding aside… THERE ARE ACTUALLY 4! Click again" },
  { html: `of couuuurseeee, our very own… 💖`, btn: "💖 Reveal! Click again" },
  { name: "Inay", day: 25, emoji: "👑", big: true, btn: "🔁 Play it again" },
];
const babyTimers = [];

function tickBabies() {
  for (const t of babyTimers) {
    const u = untilNext(11, t.day);
    t.el.querySelector(".countdown").hidden = u.isToday;
    t.el.querySelector(".countdown-label").textContent = u.isToday ? `🎂 It’s ${t.name}’s birthday TODAY! Happy birthday! 🥳` : `to go until ${t.name}’s birthday 🥳`;
    if (u.isToday) continue;
    const [d, h, m, s] = t.el.querySelectorAll(".countdown b");
    d.textContent = Math.floor(u.diff / 864e5);
    h.textContent = pad(Math.floor(u.diff / 36e5) % 24);
    m.textContent = pad(Math.floor(u.diff / 6e4) % 60);
    s.textContent = pad(Math.floor(u.diff / 1e3) % 60);
  }
}

function setupBirthday() {
  const btn = $("#dykBtn");
  const list = $("#dykReveals");
  let step = 0;
  btn.addEventListener("click", () => {
    if (step >= BABY_STEPS.length) { // replay
      step = 0;
      list.innerHTML = "";
      babyTimers.length = 0;
    }
    const st = BABY_STEPS[step++];
    const li = document.createElement("li");
    if (st.html) {
      li.className = "dyk-line";
      li.innerHTML = st.html;
    } else {
      li.className = `dyk-baby${st.big ? " big" : ""}`;
      li.innerHTML = `
        <p class="baby-name">${st.num ? `<span class="baby-num">${st.num}</span>` : ""}${st.emoji} ${esc(st.name)} <span class="baby-date">Dec ${st.day}</span></p>
        ${st.extra ? `<p class="baby-extra">${st.extra}</p>` : ""}
        ${st.noTimer ? "" : `<div class="countdown countdown-bday"><div><b>--</b><span>days</span></div><div><b>--</b><span>hours</span></div><div><b>--</b><span>mins</span></div><div><b>--</b><span>secs</span></div></div><p class="countdown-label"></p>`}`;
      if (!st.noTimer) babyTimers.push({ el: li, name: st.name, day: st.day });
    }
    list.appendChild(li);
    tickBabies();
    $("#dykTease").hidden = true;
    btn.innerHTML = st.btn;
    btn.classList.toggle("done", step >= BABY_STEPS.length);
    li.scrollIntoView({ behavior: "smooth", block: "center" });

    const r = li.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + Math.min(r.height, 120) / 2;
    try {
      if (st.big) { christmasBomb(cx, cy); setTimeout(() => christmasBomb(innerWidth * 0.25, cy), 250); setTimeout(() => christmasBomb(innerWidth * 0.75, cy), 500); boom(); setTimeout(birthdayTune, 450); }
      else if (st.name) { christmasBomb(cx, cy); boom(); }
      else playBells();
    } catch { /* audio not available */ }
  });
}

/* ---------------- sleigh fun ---------------- */
const HO = [
  { text: "Ho ho ho! 🎅", audio: "assets/music/Ho Ho Ho.mp3" },
  { text: "Merry Christmas Magtibays! 🎄", audio: "assets/music/Merry Christmas Magtibays.mp3" },
  { text: "Check the wishlist! 🎁", audio: "assets/music/Check the wishlist.mp3" },
  { text: "Wishlist 300 php 🦌", audio: "assets/music/Wishlist 300 php.mp3" },
  { text: "Jingle all the way! 🔔", audio: "assets/music/Jingle Bell.mp3" }
];

function sleighFun() {
  const flight = $("#flight");
  const speech = $("#speech");
  let i = 0;

  flight.addEventListener("click", (e) => {
    const current = HO[i++ % HO.length];
    speech.textContent = current.text;
    speech.classList.add("show");
    clearTimeout(speech.t);
    speech.t = setTimeout(() => speech.classList.remove("show"), 1800);

    for (let k = 0; k < 5; k++) {
      const g = document.createElement("div");
      g.className = "falling-gift";
      g.textContent = ["🎁", "🍬", "⭐", "🧸", "🍪"][k];
      g.style.left = `${e.clientX + (Math.random() - 0.5) * 160}px`;
      g.style.top = `${e.clientY}px`;
      g.style.animationDelay = `${k * 0.08}s`;
      document.body.appendChild(g);
      setTimeout(() => g.remove(), 2200);
    }

    playSurprise(current.audio);
  });

  // touch devices: tap toggles pause briefly
  flight.addEventListener("touchstart", () => {
    flight.classList.add("paused");
    clearTimeout(flight.t);
    flight.t = setTimeout(() => flight.classList.remove("paused"), 3000);
  }, { passive: true });
}

let voiceAudio = null;

function playSurprise(audioPath) {
  const bgMusic = document.getElementById("bgMusic");

  if (voiceAudio) {
    voiceAudio.pause();
    voiceAudio.currentTime = 0;
  }

  voiceAudio = new Audio(audioPath);
  voiceAudio.volume = 1.0; // Set your voice clip to max volume

  // Lower background music while voice is speaking
  if (bgMusic) {
    bgMusic.volume = 0.15; // Drops background music to 15% volume
  }

  // Restore background music volume when voice finishes
  voiceAudio.addEventListener("ended", () => {
    if (bgMusic) {
      bgMusic.volume = 0.6; // Returns background music to 60% volume
    }
  });

  voiceAudio.play().catch(() => {
    if (bgMusic) bgMusic.volume = 0.6; // Restore volume if playback fails
    playBells();
  });
}

function loadHeadPhoto() {
  const img = new Image();
  const src = `/api/photo?v=${Date.now()}`;
  img.onload = () => {
    const el = $("#headPhoto");
    el.setAttribute("href", src);
    el.style.display = "";
    $("#fallbackFace").style.display = "none";
  };
  img.onerror = () => {
    $("#headPhoto").style.display = "none";
    $("#fallbackFace").style.display = "";
  };
  img.src = src;
}

/* ---------------- sound ---------------- */
let actx;
function ctx() { return (actx ||= new (window.AudioContext || window.webkitAudioContext)()); }
function note(freq, t, dur, type = "triangle", vol = 0.18) {
  const a = ctx(), o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
}
function playBells() {
  const t = ctx().currentTime;
  [1568, 2093, 2637].forEach((f, i) => note(f, t + i * 0.07, 0.5, "sine", 0.08));
}
function boom() {
  const a = ctx(), t = a.currentTime;
  const len = a.sampleRate * 0.6;
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
  src.buffer = buf; f.type = "lowpass"; f.frequency.value = 900;
  g.gain.setValueAtTime(0.5, t);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
  playBells();
}
function birthdayTune() {
  const N = { G: 392, A: 440, B: 493.88, C: 523.25, D: 587.33, E: 659.25, F: 698.46, g: 783.99 };
  const tune = "G.75 G.25 A1 G1 C1 B2 G.75 G.25 A1 G1 D1 C2".split(" ");
  let t = ctx().currentTime + 0.05;
  const beat = 0.32;
  for (const n of tune) {
    const d = parseFloat(n.slice(1)) * beat;
    note(N[n[0]], t, d * 0.95);
    note(N[n[0]] * 2, t, d * 0.5, "sine", 0.04);
    t += d;
  }
}

/* ---------------- wishes ---------------- */
let wishlists = [];
let activeWishlist = null;
const wishlistsRef = collection(db, "wishlists");

// Real-time listener: updates wishlists automatically across all devices
onSnapshot(query(wishlistsRef, orderBy("createdAt", "asc")), (snapshot) => {
  wishlists = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (!wishlists.length) {
    activeWishlist = null;
    document.querySelector("#wishGrid").innerHTML =
      `<p class="loading">Create the first wishlist 🎄</p>`;
  } else {
    if (activeWishlist === null || activeWishlist >= wishlists.length) {
      activeWishlist = 0;
    }
    showWishlist(activeWishlist);
  }
  renderTabs();
});

document.getElementById("addWishlistBtn").addEventListener("click", () => {
  document.getElementById("wishlistDialog").showModal();
});

document.getElementById("createWishlistBtn").addEventListener("click", createWishlist);

async function createWishlist() {
  const ownerInput = document.getElementById("wishlistOwner");
  const owner = ownerInput.value.trim();

  if (!owner) {
    alert("Please enter a name.");
    return;
  }

  const exists = wishlists.some(
    (list) => list.owner.toLowerCase() === owner.toLowerCase()
  );

  if (exists) {
    alert("Wishlist already exists!");
    return;
  }

  activeWishlist = wishlists.length;
  ownerInput.value = "";
  document.getElementById("wishlistDialog").close();

  await addDoc(wishlistsRef, {
    owner,
    wishes: [],
    createdAt: Date.now()
  });
}

function renderTabs() {
  const container = document.querySelector(".wishlist-tabs");
  container.innerHTML = "";

  wishlists.forEach((list, index) => {
    const btn = document.createElement("button");
    btn.className = "wishlist-tab";
    if (index === activeWishlist) btn.classList.add("active");

    btn.innerHTML = `
      🎁 ${list.owner}
      <span class="wishlist-remove" onclick="event.stopPropagation(); deleteWishlist(${index});">
        ✕
      </span>
    `;

    btn.onclick = () => {
      activeWishlist = index;
      renderTabs();
      showWishlist(index);
    };

    container.appendChild(btn);
  });
}

function showWishlist(index) {
  const list = wishlists[index];
  if (!list) return;

  document.querySelector("#wishGrid").innerHTML = `
    <div class="wishlist-page">
      <h2>🎁 ${list.owner}'s Wishlist</h2>
      <p class="wishlist-count">${list.wishes.length}/9 Wishes</p>

      <div class="wish-form">
        <input id="wishTitle" placeholder="Wish name">
        <input id="wishLink" placeholder="Product link">
        <input id="wishPrice" placeholder="Price">
        <button class="btn btn-gold" onclick="addWish(${index})">Add Wish</button>
      </div>

      <div class="wishlist-items">
        ${
          list.wishes.length === 0
            ? `<p class="empty">No wishes added yet.</p>`
            : list.wishes
                .map(
                  (wish, wishIndex) => `
                <div class="wish">
                  <button class="del" onclick="deleteWish(${index}, ${wishIndex})">✕</button>
                  <div class="catalog-body">
                    <h3>${wish.title}</h3>
                    <div class="meta">
                      <span class="price">${wish.price || ""}</span>
                    </div>
                    ${
                      wish.link
                        ? `<a href="${wish.link}" target="_blank" class="shop">View Item ↗</a>`
                        : `<span class="shop">No link provided</span>`
                    }
                  </div>
                </div>`
                )
                .join("")
        }
      </div>
    </div>
  `;
}

window.addWish = async function (index) {
  const title = document.getElementById("wishTitle").value.trim();
  const link = document.getElementById("wishLink").value.trim();
  const price = document.getElementById("wishPrice").value.trim();

  if (!title) {
    alert("Please enter a wish name.");
    return;
  }

  const targetList = wishlists[index];
  if (targetList.wishes.length >= 9) {
    alert("Maximum of 9 wishes allowed 🎁");
    return;
  }

  const updatedWishes = [...targetList.wishes, { title, link, price }];
  await updateDoc(doc(db, "wishlists", targetList.id), {
    wishes: updatedWishes
  });
};

window.deleteWish = async function (wishlistIndex, wishIndex) {
  if (!confirm("Delete this wish?")) return;

  const targetList = wishlists[wishlistIndex];
  const updatedWishes = targetList.wishes.filter((_, i) => i !== wishIndex);

  await updateDoc(doc(db, "wishlists", targetList.id), {
    wishes: updatedWishes
  });
};

window.deleteWishlist = async function (index) {
  const targetList = wishlists[index];
  if (!confirm(`Delete ${targetList.owner}'s wishlist?`)) return;

  await deleteDoc(doc(db, "wishlists", targetList.id));
};

/* ---------------- notes ---------------- */
let allNotes = [];
const notesRef = collection(db, "notes");

const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

const noteHtml = (n, del = true) => `
  <article class="nb-entry">
    ${del ? `<button class="del" title="Remove note" data-del-note="${n.id}">✕</button>` : ""}
    <p class="nb-msg">${esc(n.message)}</p>
    <footer><span>— ${esc(n.name)}</span><time>${esc(fmtDate(n.createdAt))}</time></footer>
  </article>`;

function renderNotes() {
  const wall = document.getElementById("notesWall");
  document.getElementById("notesCount").textContent = allNotes.length
    ? `📖 ${allNotes.length} notes in our Christmas notebook`
    : "📖 Our Christmas notebook";

  wall.innerHTML = allNotes.length
    ? allNotes.map((note) => noteHtml(note)).join("")
    : `<p class="nb-empty">No notes yet… be the first!</p>`;
}

function setupNotes() {
  $("#nbYear").textContent = `Christmas ${new Date().getFullYear()}`;
  $("#downloadNotes").addEventListener("click", downloadNotebook);

  // Real-time listener: syncs notes automatically across all family devices
  onSnapshot(query(notesRef, orderBy("createdAt", "asc")), (snapshot) => {
    allNotes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderNotes();
  });

  $("#noteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;

    await addDoc(notesRef, {
      name: form.name.value,
      message: form.message.value,
      createdAt: Date.now()
    });

    form.reset();
    toast("Note added! 🎄");
  });

  $("#notesWall").addEventListener("click", async (e) => {
    const d = e.target.closest("[data-del-note]");
    if (!d) return;

    if (!confirm("Remove this note?")) return;

    await deleteDoc(doc(db, "notes", d.dataset.delNote));
    toast("Note removed 🗑️");
  });
}

/* ---------------- Welcome ---------------- */
function setupWelcomeDialog() {
  const welcomeDialog = document.getElementById("welcomeDialog");
  const noChoiceDialog = document.getElementById("noChoiceDialog");
  const bgMusic = document.getElementById("bgMusic");

  const startMusicAndClose = (dialogToClose) => {
    bgMusic.play().catch((error) => {
      console.error("Audio playback failed:", error);
    });
    dialogToClose.close();
  };

  welcomeDialog.showModal();

  // 1. "Enter with Music" button
  document.getElementById("musicEnterBtn").addEventListener("click", () => {
    startMusicAndClose(welcomeDialog);
  });

  // 2. "Enter Silently" button
  document.getElementById("silentEnterBtn").addEventListener("click", () => {
    welcomeDialog.close();
    noChoiceDialog.showModal();
  });

  // 3. "Fine, Play the Music" button
  document.getElementById("forceMusicBtn").addEventListener("click", () => {
    startMusicAndClose(noChoiceDialog);
  });
}

/* ---------------- boot ---------------- */
setupWelcomeDialog();
decorate();
snow();
countdown();
setupBirthday();
sleighFun();
loadHeadPhoto();
setupNotes();
setupOwner();
loadNotes();

