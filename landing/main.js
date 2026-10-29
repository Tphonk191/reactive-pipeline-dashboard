/* -----------------------------------------------------------------------------
   REACTIVE PIPELINE FRAMEWORK · INTERACTIVE TELEMETRY SCRIPT
   - Stage 1: Cycling Lit Specification Tokens
   - Stage 2: In-Browser Live Telemetry Engine (The Live Thing)
   - Stage 3: Interactive Command Menu with instant filtering
   - Stage 4: Motion Layer (Staggered Section Entrances)
----------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------------------------
  // 1. Cycling Lit Specification Tokens
  // ---------------------------------------------------------------------------
  const tokens = document.querySelectorAll(".spec-token");
  if (tokens.length > 0) {
    let activeIndex = 0;
    setInterval(() => {
      tokens[activeIndex].classList.remove("lit");
      activeIndex = (activeIndex + 1) % tokens.length;
      tokens[activeIndex].classList.add("lit");
    }, 2200);
  }

  // ---------------------------------------------------------------------------
  // 2. Interactive In-Browser Telemetry Engine (The Live Thing)
  // ---------------------------------------------------------------------------
  const rateSlider = document.getElementById("ingest-rate");
  const rateDisplay = document.getElementById("rate-display");
  const capacityButtons = document.querySelectorAll("[data-capacity]");
  const strategyButtons = document.querySelectorAll("[data-strategy]");

  const valThroughput = document.getElementById("val-throughput");
  const valDropped = document.getElementById("val-dropped");
  const valWindowAvg = document.getElementById("val-window-avg");
  const canvas = document.getElementById("stream-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  let currentRate = parseInt(rateSlider ? rateSlider.value : "50000", 10);
  let currentCapacity = 64;
  let currentStrategy = "DropOldest";

  let ringBuffer = [];
  let processedCount = 0;
  let droppedCount = 0;
  let windowSamples = [];
  let lastWindowCompute = performance.now();
  let currentWindowAvg = 27.50;

  // Rate Slider
  if (rateSlider && rateDisplay) {
    rateSlider.addEventListener("input", (e) => {
      currentRate = parseInt(e.target.value, 10);
      rateDisplay.textContent = currentRate.toLocaleString() + " /s";
    });
  }

  // Capacity Buttons
  capacityButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      capacityButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCapacity = parseInt(btn.dataset.capacity, 10);
      ringBuffer = ringBuffer.slice(0, currentCapacity);
    });
  });

  // Strategy Buttons
  strategyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      strategyButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentStrategy = btn.dataset.strategy;
    });
  });

  // Telemetry Visualization Loop
  let wavePoints = new Array(80).fill(48);
  let lastFrameTime = performance.now();

  function telemetryLoop(now) {
    const deltaMs = Math.max(1, now - lastFrameTime);
    lastFrameTime = now;

    // Simulate batch ingestion based on currentRate
    const itemsToIngest = Math.min(2000, Math.floor((currentRate * deltaMs) / 1000));
    let droppedInBatch = 0;
    let processedInBatch = 0;

    for (let i = 0; i < itemsToIngest; i++) {
      const temp = 20.0 + Math.random() * 15.0; // 20 - 35°C

      if (ringBuffer.length >= currentCapacity) {
        if (currentStrategy === "DropOldest") {
          ringBuffer.shift();
          ringBuffer.push(temp);
          droppedInBatch++;
        } else if (currentStrategy === "DropNewest") {
          droppedInBatch++;
        } else if (currentStrategy === "Block") {
          // Block producer; drop rate is zero, ingestion stalled
          break;
        }
      } else {
        ringBuffer.push(temp);
      }
      processedInBatch++;
    }

    // Process buffered items through Tumbling Window
    while (ringBuffer.length > 0) {
      const val = ringBuffer.shift();
      windowSamples.push(val);
    }

    processedCount += processedInBatch;
    droppedCount += droppedInBatch;

    // Flush Tumbling Window every 3000ms
    if (now - lastWindowCompute >= 3000) {
      if (windowSamples.length > 0) {
        const sum = windowSamples.reduce((a, b) => a + b, 0);
        currentWindowAvg = sum / windowSamples.length;
        windowSamples = [];
      }
      lastWindowCompute = now;
    }

    // Update UI HUD
    if (valThroughput) {
      const liveRate = Math.floor((processedInBatch * 1000) / deltaMs);
      valThroughput.textContent = liveRate.toLocaleString();
    }
    if (valDropped) {
      valDropped.textContent = droppedCount.toLocaleString();
    }
    if (valWindowAvg) {
      valWindowAvg.textContent = currentWindowAvg.toFixed(2);
    }

    // Draw Stream Canvas Wave
    if (ctx && canvas) {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Shift wave points left
      wavePoints.shift();
      const waveJitter = (Math.random() - 0.5) * (Math.min(100000, currentRate) / 2500);
      const targetY = 48 + waveJitter;
      wavePoints.push(Math.max(10, Math.min(86, targetY)));

      // Draw active telemetry wave
      ctx.beginPath();
      const step = width / (wavePoints.length - 1);
      ctx.moveTo(0, wavePoints[0]);
      for (let j = 1; j < wavePoints.length; j++) {
        ctx.lineTo(j * step, wavePoints[j]);
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ff4a1f";
      ctx.stroke();

      // Zero GC allocation indicator baseline
      ctx.strokeStyle = "#2b2e32";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height - 8);
      ctx.lineTo(width, height - 8);
      ctx.stroke();
    }

    requestAnimationFrame(telemetryLoop);
  }

  requestAnimationFrame(telemetryLoop);

  // ---------------------------------------------------------------------------
  // 3. Command Menu Filtering & Interaction
  // ---------------------------------------------------------------------------
  const searchInput = document.getElementById("command-search");
  const commandRows = document.querySelectorAll(".command-row");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      commandRows.forEach(row => {
        const name = (row.dataset.name || "").toLowerCase();
        const text = row.textContent.toLowerCase();
        if (!query || name.includes(query) || text.includes(query)) {
          row.style.display = "grid";
        } else {
          row.style.display = "none";
        }
      });
    });
  }

  commandRows.forEach(row => {
    row.addEventListener("click", () => {
      commandRows.forEach(r => r.classList.remove("active"));
      row.classList.add("active");
    });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        commandRows.forEach(r => r.classList.remove("active"));
        row.classList.add("active");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Motion Layer: Staggered Section Entrances & Colour by Chapter Header
  // ---------------------------------------------------------------------------
  const revealTargets = document.querySelectorAll(
    ".hero-title, .hero-statement, .hero-metrics-strip, .hero-action-cell, .section-title, .pipeline-bar, .sim-wrapper, .monumental-statement-box, .archival-media-block, .command-menu-wrapper, .media-duo-cell, .sentence-form-wrapper"
  );

  revealTargets.forEach(el => {
    el.classList.add("reveal-item");
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.1
    });

    revealTargets.forEach(el => observer.observe(el));

    // Chapter Header Sync: update sticky top-bar background based on intersecting section
    const topBar = document.querySelector(".top-bar");
    const surfaceSections = document.querySelectorAll(".stage-section, .proof-section, .video-section");

    const chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && topBar) {
          topBar.classList.add("on-surface");
        } else if (!entry.isIntersecting && topBar) {
          // If none of surface sections are in top bar area, revert to bg
          const anySurfaceActive = [...surfaceSections].some(sec => {
            const r = sec.getBoundingClientRect();
            return r.top <= 60 && r.bottom >= 60;
          });
          if (!anySurfaceActive) {
            topBar.classList.remove("on-surface");
          }
        }
      });
    }, {
      rootMargin: "-60px 0px -80% 0px"
    });

    surfaceSections.forEach(sec => chapterObserver.observe(sec));
  } else {
    revealTargets.forEach(el => el.classList.add("revealed"));
  }
});
