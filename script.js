(() => {
    // Ensure body layout class is removed on full load
    window.addEventListener('load', () => {
        document.body.classList.remove('container');
    });

    const startReveal = () => {
        const lines = Array.from(document.querySelectorAll('.text .line'));
        if (!lines.length) return;
        const bloomTimeMs = 3500; // start a bit earlier
        const perLineDelay = 1200; // spacing between lines
        const totalPlanned = bloomTimeMs + lines.length * perLineDelay + 1200;
        setTimeout(() => {
            lines.forEach((line, idx) => {
                setTimeout(() => {
                    line.classList.add('show');
                }, idx * perLineDelay);
            });
        }, bloomTimeMs);

        // Fallback: if lines still hidden after planned time, show all at once
        setTimeout(() => {
            const anyVisible = lines.some(l => l.classList.contains('show'));
            if (!anyVisible) {
                lines.forEach(l => l.classList.add('show'));
            }
        }, totalPlanned);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startReveal);
    } else {
        startReveal();
    }
  
    // Gallery: open lightbox on thumbnail click
    const gallery = document.querySelector('.gallery');
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = document.querySelector('.lightbox-image');
    if (lightbox && lightboxImg) {
        // Home page thumbnails (if present)
        if (gallery) {
            gallery.addEventListener('click', (e) => {
                const btn = e.target.closest('.thumb');
                if (!btn) return;
                const src = btn.getAttribute('data-src') || btn.querySelector('img')?.src;
                if (!src) return;
                lightboxImg.src = src;
                lightbox.removeAttribute('hidden');
            });
        }

        // Photos page grid: click any <img> to open lightbox
        const photosGrid = document.querySelector('.photos-grid');
        if (photosGrid) {
            photosGrid.addEventListener('click', (e) => {
                const img = e.target.closest('img');
                if (!img) return;
                lightboxImg.src = img.src;
                lightbox.removeAttribute('hidden');
            });
        }

        // Photos slider: click any slide image to open lightbox
        const photosSlider = document.querySelector('.photos-slider');
        if (photosSlider) {
            photosSlider.addEventListener('click', (e) => {
                const img = e.target.closest('img');
                if (!img) return;
                lightboxImg.src = img.src;
                const captionEl = document.querySelector('.lightbox-caption');
                if (captionEl) {
                    captionEl.textContent = img.getAttribute('data-caption') || img.alt || '';
                }
                lightbox.removeAttribute('hidden');
            });
        }

        // Close on overlay click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.setAttribute('hidden', '');
                lightboxImg.removeAttribute('src');
                const captionEl = document.querySelector('.lightbox-caption');
                if (captionEl) captionEl.textContent = '';
            }
        });

        // Close on Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !lightbox.hasAttribute('hidden')) {
                lightbox.setAttribute('hidden', '');
                lightboxImg.removeAttribute('src');
                const captionEl = document.querySelector('.lightbox-caption');
                if (captionEl) captionEl.textContent = '';
            }
        });
    }

    // Shooting comets: occasionally 2-3 fall across the screen
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        const ensureCometLayer = () => {
            let layer = document.getElementById('comet-layer');
            if (!layer) {
                layer = document.createElement('div');
                layer.id = 'comet-layer';
                document.body.appendChild(layer);
            }
            return layer;
        };

        const rand = (min, max) => Math.random() * (max - min) + min;
        const active = { count: 0, max: 3 };

        const spawnComet = () => {
            const layer = ensureCometLayer();
            if (active.count >= active.max) return;

            const comet = document.createElement('div');
            comet.className = 'comet';

            // Start near top-right, end towards bottom-left
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const xStart = rand(vw * 0.65, vw * 1.05);
            const yStart = rand(-vh * 0.08, vh * 0.28);
            const xEnd = rand(-vw * 0.15, vw * 0.2);
            const yEnd = rand(vh * 0.65, vh * 1.1);
            const rot = rand(-65, -35);
            // Slow down comet travel: increase duration range
            const dur = rand(3.2, 5.0);
            const tail = rand(120, 200);

            comet.style.setProperty('--xStart', `${xStart}px`);
            comet.style.setProperty('--yStart', `${yStart}px`);
            comet.style.setProperty('--xEnd', `${xEnd}px`);
            comet.style.setProperty('--yEnd', `${yEnd}px`);
            comet.style.setProperty('--rot', `${rot}deg`);
            comet.style.setProperty('--dur', `${dur}s`);
            comet.style.setProperty('--tailLen', `${tail}px`);

            // Build a quadratic Bezier path for curvy travel
            const midX = (xStart + xEnd) / 2;
            const midY = (yStart + yEnd) / 2;
            const cx = midX + rand(-vw * 0.12, vw * 0.12);
            const cy = midY - rand(vh * 0.18, vh * 0.32); // arc outward a bit
            const path = `path('M ${xStart} ${yStart} Q ${cx} ${cy} ${xEnd} ${yEnd}')`;
            comet.style.setProperty('--path', path);
            // Also set explicit properties for broader compatibility
            comet.style.setProperty('offset-path', path);
            comet.style.setProperty('-webkit-offset-path', path);
            comet.style.setProperty('offset-rotate', 'auto');

            active.count++;
            layer.appendChild(comet);

            const cleanup = () => {
                comet.removeEventListener('animationend', cleanup);
                comet.remove();
                active.count = Math.max(0, active.count - 1);
            };
            comet.addEventListener('animationend', cleanup);
        };

        const schedule = () => {
            // Occasionally spawn 1-2 comets; vary intervals for natural feel
            const nextIn = rand(4200, 8200);
            setTimeout(() => {
                const batch = Math.random() < 0.6 ? 1 : 2;
                for (let i = 0; i < batch; i++) {
                    // Stagger a bit within the batch
                    setTimeout(spawnComet, i * rand(120, 360));
                }
                schedule();
            }, nextIn);
        };

        // Kick off
        schedule();
    }

    // Simple autoplay slider for photos.html
    const initPhotoSlider = () => {
        const slider = document.querySelector('.photos-slider');
        const track = slider?.querySelector('.slides');
        if (!slider || !track) return;
        const imgs = Array.from(track.querySelectorAll('img'));
        if (!imgs.length) return;

        // Infinite loop clones (seamless wrap): prepend last, append first
        const firstClone = imgs[0].cloneNode(true);
        const lastClone = imgs[imgs.length - 1].cloneNode(true);
        track.insertBefore(lastClone, track.firstChild);
        track.appendChild(firstClone);

        // Build dots for original slides only
        const dots = slider.querySelector('.dots');
        if (dots) {
            dots.innerHTML = '';
            imgs.forEach((_, i) => {
                const b = document.createElement('button');
                if (i === 0) b.classList.add('active');
                b.addEventListener('click', () => {
                    goToReal(i);
                });
                dots.appendChild(b);
            });
        }

        // Track index includes clones: real range is [1..imgs.length]
        let index = 1; // start at first real slide

        const setActiveDot = () => {
            const buttons = dots ? Array.from(dots.querySelectorAll('button')) : [];
            buttons.forEach((btn, i) => {
                const realIndex = (index - 1 + imgs.length) % imgs.length;
                btn.classList.toggle('active', i === realIndex);
            });
        };

        const applyTransform = () => {
            track.style.transform = `translateX(-${index * 100}%)`;
            setActiveDot();
        };

        const goToReal = (realI) => {
            // realI is 0..imgs.length-1, map to track index = realI + 1
            index = ((realI % imgs.length) + imgs.length) % imgs.length; // normalize
            index = index + 1;
            applyTransform();
        };

        const next = () => { index += 1; applyTransform(); };
        const prev = () => { index -= 1; applyTransform(); };

        // Snap after hitting clones
        track.addEventListener('transitionend', () => {
            if (index === imgs.length + 1) {
                // Moved to appended firstClone; snap to first real
                track.style.transition = 'none';
                index = 1;
                track.style.transform = `translateX(-${index * 100}%)`;
                // force reflow then restore transition
                void track.offsetHeight;
                track.style.transition = '';
            } else if (index === 0) {
                // Moved to prepended lastClone; snap to last real
                track.style.transition = 'none';
                index = imgs.length;
                track.style.transform = `translateX(-${index * 100}%)`;
                void track.offsetHeight;
                track.style.transition = '';
            }
            setActiveDot();
        });

        // Swipe support (discrete slides)
        let touchStartX = 0;
        let touchStartY = 0;
        slider.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
        }, { passive: true });
        slider.addEventListener('touchend', (e) => {
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                if (dx < 0) { next(); } else { prev(); }
            }
        }, { passive: true });

        // Keyboard arrows
        document.addEventListener('keydown', (e) => {
            if (!slider.isConnected) return;
            if (e.key === 'ArrowRight') { next(); }
            else if (e.key === 'ArrowLeft') { prev(); }
        });

        // Set initial position (first real slide)
        applyTransform();

        // Auto-advance every 3 seconds
        const autoMs = 3000;
        let autoTimer = setInterval(() => { next(); }, autoMs);

        // Reset auto timer on user interactions
        const resetAuto = () => {
            if (autoTimer) clearInterval(autoTimer);
            autoTimer = setInterval(() => { next(); }, autoMs);
        };
        slider.addEventListener('touchend', resetAuto, { passive: true });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') resetAuto();
        });
        if (dots) dots.addEventListener('click', resetAuto);

        // Press-and-hold to pause (WhatsApp/Instagram story-style)
        let isHeld = false;
        const holdStart = () => {
            isHeld = true;
            if (autoTimer) {
                clearInterval(autoTimer);
                autoTimer = null;
            }
        };
        const holdEnd = () => {
            if (!isHeld) return;
            isHeld = false;
            resetAuto();
        };
        // Use pointer events where available
        slider.addEventListener('pointerdown', holdStart);
        slider.addEventListener('pointerup', holdEnd);
        slider.addEventListener('pointerleave', holdEnd);
        // Fallbacks for broader compatibility
        slider.addEventListener('mousedown', holdStart);
        slider.addEventListener('mouseup', holdEnd);
        slider.addEventListener('mouseleave', holdEnd);
        // Touch-specific handlers for iOS/Android
        slider.addEventListener('touchstart', holdStart, { passive: true });
        slider.addEventListener('touchend', holdEnd, { passive: true });
        slider.addEventListener('touchcancel', holdEnd, { passive: true });
    };

    // Initialize slider after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPhotoSlider);
    } else {
        initPhotoSlider();
    }
})();