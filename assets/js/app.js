/* ==========================================================================
   Clínica Dental Elgorriaga — App principal
   GSAP (core + ScrollTrigger, vendados localmente) · vanilla JS modular.
   Carga única: cuando entras al sitio se prepara todo y la navegación entre
   subpáginas es fluida.
   ========================================================================== */
(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  if (hasGSAP && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out", duration: 0.7 });
  }

  /* ----------------------------------------------------------------------
     1. Page loader — solo en la primera visita de la sesión
     ---------------------------------------------------------------------- */
  function initLoader() {
    const loader = document.querySelector("[data-loader]");
    if (!loader) return;

    const alreadySeen = sessionStorage.getItem("cde_seen") === "1";
    if (alreadySeen || prefersReduced || !hasGSAP) {
      loader.remove();
      document.body.classList.remove("no-scroll");
      startReveals();
      return;
    }

    document.body.classList.add("no-scroll");
    const bar = loader.querySelector(".loader__bar span");
    const count = loader.querySelector(".loader__count");
    const tooth = loader.querySelector(".loader__tooth path");

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem("cde_seen", "1");
        loader.remove();
        document.body.classList.remove("no-scroll");
        startReveals();
        ScrollTrigger.refresh();
      },
    });

    if (tooth) {
      const len = tooth.getTotalLength ? tooth.getTotalLength() : 300;
      gsap.set(tooth, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(tooth, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, 0);
    }
    const counter = { v: 0 };
    tl.to(counter, {
      v: 100,
      duration: 1.15,
      ease: "power1.inOut",
      onUpdate: () => {
        if (count) count.textContent = Math.round(counter.v) + "%";
        if (bar) bar.style.width = counter.v + "%";
      },
    }, 0);
    tl.to(loader.querySelector(".loader__inner"), { autoAlpha: 0, duration: 0.4 }, "+=0.15");
    tl.to(loader, { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, "-=0.1");
  }

  /* ----------------------------------------------------------------------
     2. Navbar — scroll state, menú móvil, ocultar al bajar
     ---------------------------------------------------------------------- */
  function initNav() {
    const nav = document.querySelector("[data-nav]");
    if (!nav) return;
    const burger = nav.querySelector("[data-burger]");
    const mobile = nav.querySelector(".nav__mobile");
    let lastY = 0;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 20);
      if (!nav.classList.contains("is-open")) {
        if (y > lastY && y > 400) gsap.to(nav, { yPercent: -130, duration: 0.4, overwrite: true });
        else gsap.to(nav, { yPercent: 0, duration: 0.4, overwrite: true });
      }
      lastY = y;
    };
    if (hasGSAP) window.addEventListener("scroll", onScroll, { passive: true });

    const closeMenu = () => {
      nav.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
      burger?.setAttribute("aria-expanded", "false");
    };
    burger?.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      document.body.classList.toggle("no-scroll", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    mobile?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ----------------------------------------------------------------------
     3. Reveals al hacer scroll (cada sección con su propio carácter)
     ---------------------------------------------------------------------- */
  function startReveals() {
    // Sin GSAP o con reduced-motion: todo visible, sin gating. Nunca dejamos
    // contenido oculto si la animación no puede ejecutarse.
    if (!hasGSAP || prefersReduced) {
      document.documentElement.classList.remove("reveal-ready");
      initCounters();
      initHeadlineReveal();
      return;
    }
    document.documentElement.classList.add("reveal-ready");

    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.92 && r.bottom > 0;
    };

    // Helper de reveal con failsafe: si algo sigue oculto, se muestra igual.
    const revealEls = (els, stagger) =>
      gsap.to(els, {
        autoAlpha: 1,
        y: 0,
        duration: 0.85,
        stagger: stagger,
        ease: "power3.out",
        overwrite: true,
      });

    // --- Elementos sueltos [data-reveal] ---
    const singles = gsap.utils.toArray("[data-reveal]");
    singles.forEach((el) => gsap.set(el, { autoAlpha: 0, y: 28 }));
    // Revela de inmediato lo que ya está en pantalla
    const visibleSingles = singles.filter(inView);
    if (visibleSingles.length) revealEls(visibleSingles, 0.08);
    // El resto, al hacer scroll
    singles
      .filter((el) => !inView(el))
      .forEach((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () => revealEls(el, 0),
        })
      );

    // --- Grupos con stagger interno [data-reveal-group] ---
    gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
      const items = group.querySelectorAll("[data-reveal-item]");
      gsap.set(items, { autoAlpha: 0, y: 30 });
      const run = () =>
        gsap.to(items, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: { each: 0.08, from: "start" },
          ease: "power3.out",
          overwrite: true,
        });
      if (inView(group)) run();
      else
        ScrollTrigger.create({ trigger: group, start: "top 85%", once: true, onEnter: run });
    });

    // Failsafe global: pase lo que pase, nada se queda invisible.
    window.setTimeout(() => {
      gsap.utils.toArray("[data-reveal], [data-reveal-item]").forEach((el) => {
        if (parseFloat(getComputedStyle(el).opacity) === 0) {
          gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.4, overwrite: true });
        }
      });
      ScrollTrigger.refresh();
    }, 2600);

    initCounters();
    initParallax();
    initHeadlineReveal();
  }

  /* ----------------------------------------------------------------------
     4. Contadores animados
     ---------------------------------------------------------------------- */
  function initCounters() {
    gsap.utils.toArray("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () =>
          gsap.to(obj, {
            v: target,
            duration: 1.6,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toLocaleString("es-ES");
            },
          }),
      });
    });
  }

  /* ----------------------------------------------------------------------
     5. Parallax suave en medios marcados
     ---------------------------------------------------------------------- */
  function initParallax() {
    if (isTouch) return;
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const depth = parseFloat(el.dataset.parallax) || 12;
      gsap.fromTo(
        el,
        { yPercent: -depth },
        {
          yPercent: depth,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });
  }

  /* ----------------------------------------------------------------------
     6. Titular hero — revelado palabra a palabra
     ---------------------------------------------------------------------- */
  function initHeadlineReveal() {
    const h = document.querySelector("[data-headline]");
    if (!h) return;
    const words = h.querySelectorAll(".word");
    if (!words.length) return;
    gsap.set(words, { yPercent: 110, autoAlpha: 0 });
    gsap.to(words, {
      yPercent: 0,
      autoAlpha: 1,
      duration: 0.9,
      stagger: 0.08,
      ease: "power4.out",
      delay: sessionStorage.getItem("cde_seen") === "1" ? 0.15 : 0.1,
    });
  }

  /* ----------------------------------------------------------------------
     7. Hero canvas — escena ambiental (burbujas + haz de luz dental)
        Self-contenida, 60fps, reacciona al ratón. Sin vídeo externo.
     ---------------------------------------------------------------------- */
  function initHeroCanvas() {
    const canvas = document.querySelector("[data-hero-canvas]");
    if (!canvas || prefersReduced) {
      if (canvas) canvas.style.background =
        "radial-gradient(120% 90% at 75% 15%, oklch(0.93 0.03 274), var(--bg))";
      return;
    }
    const ctx = canvas.getContext("2d");
    let w, h, dpr, particles, raf;
    const mouse = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4 };

    const COLORS = ["56,67,172", "79,201,212", "120,130,210"];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 22000);
      particles = Array.from({ length: Math.min(count, 90) }, () => spawn());
    }
    function spawn() {
      const r = Math.random() * 4 + 1.5;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.4 + 0.1),
        a: Math.random() * 0.35 + 0.08,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      };
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      // Haz de luz dental suave que sigue el ratón
      const lx = mouse.x * w, ly = mouse.y * h;
      const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(w, h) * 0.5);
      grad.addColorStop(0, "rgba(79,201,212,0.10)");
      grad.addColorStop(0.4, "rgba(56,67,172,0.05)");
      grad.addColorStop(1, "rgba(56,67,172,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        // ligera atracción hacia el ratón
        p.x += p.vx + (lx - p.x) * 0.00012 * p.r;
        p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      mouse.tx = Math.max(0, Math.min(1, cx / rect.width));
      mouse.ty = Math.max(0, Math.min(1, cy / rect.height));
    }
    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    // Pausa cuando no es visible (rendimiento/batería)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else { cancelAnimationFrame(raf); draw(); }
    });
  }

  /* ----------------------------------------------------------------------
     8. Cursor reactivo (solo desktop, no táctil, no reduced-motion)
     ---------------------------------------------------------------------- */
  function initCursor() {
    if (isTouch || prefersReduced || !hasGSAP) return;
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    let active = false;
    window.addEventListener("pointermove", (e) => {
      if (!active) { active = true; cursor.classList.add("is-active"); }
      xTo(e.clientX);
      yTo(e.clientY);
    });
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest("a, button, [data-cursor-hover], summary, .treatment, .feature")) {
        cursor.classList.add("is-hover");
      }
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest("a, button, [data-cursor-hover], summary, .treatment, .feature")) {
        cursor.classList.remove("is-hover");
      }
    });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  }

  /* ----------------------------------------------------------------------
     9. Botón volver arriba con anillo de progreso de scroll
     ---------------------------------------------------------------------- */
  function initToTop() {
    const btn = document.querySelector("[data-to-top]");
    if (!btn) return;
    const ring = btn.querySelector(".to-top__ring circle");
    let len = 0;
    if (ring) { len = ring.getTotalLength(); ring.style.strokeDasharray = len; }
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      btn.classList.toggle("is-visible", window.scrollY > 600);
      if (ring) ring.style.strokeDashoffset = len * (1 - p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    btn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" })
    );
  }

  /* ----------------------------------------------------------------------
     10. Horario: pestañas invierno/verano + "abierto ahora"
     ---------------------------------------------------------------------- */
  // Horario real de la clínica (24h). Invierno = sep–jun, Verano = jul–ago.
  const SCHEDULE = {
    invierno: {
      // 0=Dom ... 6=Sáb
      1: [[9, 13], [16, 20]],
      2: [[12, 20]],
      3: [[9, 13], [16, 20]],
      4: [[8, 16]],
      5: [[9, 16]],
    },
    verano: {
      1: [[8, 16]],
      2: [[12.5, 20.5]],
      3: [[8, 16]],
      4: [[12.5, 20.5]],
      5: [[8, 16]],
    },
  };
  function currentSeason(d = new Date()) {
    const m = d.getMonth(); // 6=Jul, 7=Ago
    return m === 6 || m === 7 ? "verano" : "invierno";
  }
  function isOpenNow(d = new Date()) {
    const ranges = SCHEDULE[currentSeason(d)][d.getDay()];
    if (!ranges) return false;
    const t = d.getHours() + d.getMinutes() / 60;
    return ranges.some(([a, b]) => t >= a && t < b);
  }
  function initSchedule() {
    // Indicador "abierto ahora"
    document.querySelectorAll("[data-open-indicator]").forEach((el) => {
      const open = isOpenNow();
      el.classList.add("chip", "chip--live");
      el.innerHTML = `<span class="chip__dot" style="background:${
        open ? "var(--ok)" : "var(--warn)"
      }"></span>${open ? "Abierto ahora" : "Cerrado ahora"}`;
    });
    // Pestañas
    document.querySelectorAll("[data-schedule]").forEach((root) => {
      const tabs = root.querySelectorAll("[data-season-tab]");
      const panels = root.querySelectorAll("[data-season-panel]");
      const season = currentSeason();
      function activate(name) {
        tabs.forEach((t) =>
          t.setAttribute("aria-selected", String(t.dataset.seasonTab === name))
        );
        panels.forEach((p) => (p.hidden = p.dataset.seasonPanel !== name));
      }
      tabs.forEach((t) => t.addEventListener("click", () => activate(t.dataset.seasonTab)));
      activate(season);
      // Resaltar día de hoy en el panel activo
      const today = new Date().getDay();
      root.querySelectorAll("[data-day]").forEach((row) => {
        row.classList.toggle("is-today", Number(row.dataset.day) === today);
      });
    });
  }

  /* ----------------------------------------------------------------------
     11. Transiciones de página fluidas (View Transitions + prefetch)
     ---------------------------------------------------------------------- */
  function initPageTransitions() {
    // Prefetch de las páginas del sitio al hacer hover (navegación instantánea)
    const seen = new Set();
    document.addEventListener("pointerover", (e) => {
      const a = e.target.closest('a[href$=".html"], a[href="/"], a[href^="./"]');
      if (!a) return;
      const url = a.href;
      if (seen.has(url) || a.origin !== location.origin) return;
      seen.add(url);
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      document.head.appendChild(link);
    });

    // Transición suave con View Transitions API donde esté disponible
    if (!document.startViewTransition || prefersReduced) return;
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (
        !a ||
        a.target === "_blank" ||
        a.hasAttribute("download") ||
        a.origin !== location.origin ||
        a.getAttribute("href")?.startsWith("#") ||
        e.metaKey || e.ctrlKey || e.shiftKey
      )
        return;
      e.preventDefault();
      document.startViewTransition(() => {
        window.location.href = a.href;
      });
    });
  }

  /* ----------------------------------------------------------------------
     12. Reseñas: estrellas que se rellenan + drag para arrastrar
     ---------------------------------------------------------------------- */
  function initReviews() {
    const track = document.querySelector("[data-review-track]");
    if (!track) return;
    // Arrastre con ratón
    let down = false, startX = 0, scroll = 0;
    track.addEventListener("pointerdown", (e) => {
      down = true; startX = e.clientX; scroll = track.scrollLeft;
      track.style.cursor = "grabbing";
    });
    window.addEventListener("pointerup", () => { down = false; track.style.cursor = ""; });
    track.addEventListener("pointermove", (e) => {
      if (!down) return;
      track.scrollLeft = scroll - (e.clientX - startX);
    });
  }

  /* ----------------------------------------------------------------------
     13. Año dinámico en footer
     ---------------------------------------------------------------------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ----------------------------------------------------------------------
     14. Before / After slider (estética dental)
     ---------------------------------------------------------------------- */
  function initBeforeAfter() {
    document.querySelectorAll("[data-ba]").forEach((ba) => {
      const set = (clientX) => {
        const r = ba.getBoundingClientRect();
        const pos = Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100));
        ba.style.setProperty("--pos", pos + "%");
      };
      let dragging = false;
      ba.addEventListener("pointerdown", (e) => { dragging = true; set(e.clientX); ba.setPointerCapture(e.pointerId); });
      ba.addEventListener("pointermove", (e) => { if (dragging) set(e.clientX); });
      ba.addEventListener("pointerup", () => (dragging = false));
      ba.addEventListener("keydown", (e) => {
        const cur = parseFloat(getComputedStyle(ba).getPropertyValue("--pos")) || 50;
        if (e.key === "ArrowLeft") ba.style.setProperty("--pos", Math.max(4, cur - 4) + "%");
        if (e.key === "ArrowRight") ba.style.setProperty("--pos", Math.min(96, cur + 4) + "%");
      });
    });
  }

  /* ----------------------------------------------------------------------
     16. Mapa (Leaflet + OpenStreetMap, sin API key)
     ---------------------------------------------------------------------- */
  function initMap() {
    const el = document.querySelector("[data-map]");
    if (!el || typeof window.L === "undefined") return;
    const lat = 43.3382, lng = -1.7888;
    const map = L.map(el, { scrollWheelZoom: false, attributionControl: true }).setView([lat, lng], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    // Marcador custom indigo (divIcon, sin depender de imágenes)
    const icon = L.divIcon({
      className: "map-pin",
      html: '<svg viewBox="0 0 32 44" width="32" height="44" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.7 0 1 6.7 1 15c0 10.5 13.4 27.3 14 28a1.3 1.3 0 002 0c.6-.7 14-17.5 14-28C31 6.7 24.3 0 16 0z" fill="#3843ac"/><circle cx="16" cy="15" r="6" fill="#fff"/></svg>',
      iconSize: [32, 44],
      iconAnchor: [16, 44],
      popupAnchor: [0, -40],
    });
    L.marker([lat, lng], { icon, title: "Clínica Dental Elgorriaga" })
      .addTo(map)
      .bindPopup("<strong>Clínica Dental Elgorriaga</strong><br>San Pedro, 24 bajo · Irún")
      .openPopup();
    el.addEventListener("click", () => map.scrollWheelZoom.enable());
    el.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
  }

  /* ----------------------------------------------------------------------
     17. Índice lateral sticky — resalta la sección activa
     ---------------------------------------------------------------------- */
  function initScrollSpy() {
    const links = document.querySelectorAll("[data-spy] a");
    if (!links.length || !hasGSAP) return;
    links.forEach((link) => {
      const id = link.getAttribute("href");
      const target = id && id.startsWith("#") ? document.querySelector(id) : null;
      if (!target) return;
      ScrollTrigger.create({
        trigger: target,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => link.classList.toggle("is-active", self.isActive),
      });
    });
  }

  /* ----------------------------------------------------------------------
     Init
     ---------------------------------------------------------------------- */
  function init() {
    initLoader();
    initNav();
    initHeroCanvas();
    initCursor();
    initToTop();
    initSchedule();
    initReviews();
    initPageTransitions();
    initYear();
    initBeforeAfter();
    initScrollSpy();
    initMap();
    // Si no hay loader visible (no primera visita) los reveals arrancan ya
    if (!document.querySelector("[data-loader]")) startReveals();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
