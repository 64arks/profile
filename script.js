/* =========================================
   SCROLL REVEAL
========================================= */

const animatedElements = document.querySelectorAll(
    ".section, .featured-project, .profile-card, .gallery-item"
);

const observer = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                observer.unobserve(entry.target);

            }

        });

    },
    {
        threshold: 0.12
    }
);


animatedElements.forEach((element) => {

    observer.observe(element);

});


/* =========================================
   NAVIGATION
========================================= */

const nav = document.querySelector(".navbar nav");
const navLinks = document.querySelectorAll(".navbar nav a");
const glass = document.querySelector(".nav-glass");


function moveGlass(link) {

    glass.style.left = `${link.offsetLeft}px`;
    glass.style.width = `${link.offsetWidth}px`;

}


navLinks.forEach((link) => {

    link.addEventListener("click", () => {

        navLinks.forEach((item) => {
            item.classList.remove("active");
        });

        link.classList.add("active");

        moveGlass(link);

    });

});


/* Set glass position on page load */

const activeLink = document.querySelector(
    ".navbar nav a.active"
);

if (activeLink) {
    moveGlass(activeLink);
}


/* Keep glass aligned when window changes size */

window.addEventListener("resize", () => {

    const activeLink = document.querySelector(
        ".navbar nav a.active"
    );

    if (activeLink) {
        moveGlass(activeLink);
    }

});
/* =========================================
   THEME TOGGLE
========================================= */

const themeToggle = document.getElementById("theme-toggle");

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add("dark-mode");
        if (themeToggle) {
            themeToggle.setAttribute("aria-pressed", "true");
            themeToggle.setAttribute("title", "Switch to light mode");
        }
    } else {
        document.body.classList.remove("dark-mode");
        if (themeToggle) {
            themeToggle.setAttribute("aria-pressed", "false");
            themeToggle.setAttribute("title", "Switch to dark mode");
        }
    }
}

// Initialize theme from localStorage
const savedTheme = localStorage.getItem("theme");
applyTheme(savedTheme === "dark");

if (themeToggle) {
    themeToggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isDarkNow = !document.body.classList.contains("dark-mode");
        localStorage.setItem("theme", isDarkNow ? "dark" : "light");
        applyTheme(isDarkNow);
    });
}



/* =========================================
   IMAGE FALLBACK
========================================= */

const images = document.querySelectorAll("img");

images.forEach((image) => {

    image.addEventListener("error", () => {

        image.style.display = "none";

        image.parentElement.classList.add("image-missing");

    });

});


/* =========================================
   VISITOR ANALYTICS & INTERACTIVITY
========================================= */

if (typeof DataStore !== "undefined") {
    // 1. Record Page Visit
    try {
        DataStore.recordVisit("Portfolio Home");
    } catch (e) {
        console.warn("Analytics recording error:", e);
    }

    // 2. Synchronize Profile Information
    try {
        const profile = DataStore.getProfile();
        if (profile) {
            const eyebrowEl = document.querySelector(".hero-content .eyebrow");
            if (eyebrowEl && profile.eyebrow) eyebrowEl.textContent = profile.eyebrow;

            const descEl = document.querySelector(".hero-description");
            if (descEl && profile.description) descEl.textContent = profile.description;
        }
    } catch (e) {
        console.warn("Profile sync error:", e);
    }

    // 3. Contact Form Submission
    const contactForm = document.getElementById("portfolio-contact-form");
    const contactSuccessMsg = document.getElementById("contact-success-msg");
    const contactSubmitBtn = document.getElementById("contact-submit-btn");

    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("contact-name").value.trim();
            const email = document.getElementById("contact-email").value.trim();
            const subject = document.getElementById("contact-subject").value.trim() || "Portfolio Contact Inquiry";
            const message = document.getElementById("contact-message").value.trim();

            if (!name || !email || !message) return;

            if (contactSubmitBtn) {
                contactSubmitBtn.disabled = true;
                contactSubmitBtn.innerHTML = `<span>Sending...</span>`;
            }

            setTimeout(() => {
                DataStore.addMessage({ name, email, subject, message });

                contactForm.reset();
                if (contactSubmitBtn) {
                    contactSubmitBtn.disabled = false;
                    contactSubmitBtn.innerHTML = `<span>Send Message</span><span>↗</span>`;
                }

                if (contactSuccessMsg) {
                    contactSuccessMsg.style.display = "block";
                    setTimeout(() => {
                        contactSuccessMsg.style.display = "none";
                    }, 6000);
                }
            }, 300);
        });
    }
}


/* =========================================
   DYNAMIC PHOTO GALLERY
========================================= */

document.addEventListener("DOMContentLoaded", function renderPublicGallery() {
    const galleryGrid = document.getElementById("public-gallery-grid");
    const seeMoreWrapper = document.getElementById("gallery-see-more");
    const seeMoreBtn = document.getElementById("gallery-see-more-btn");
    const PREVIEW_COUNT = 3;

    if (!galleryGrid) return;

    // DataStore is loaded before script.js so it's always available
    const photos = (typeof DataStore !== "undefined") ? DataStore.getGalleryPhotos() : [];

    if (photos.length === 0) {
        // Show a clear placeholder
        galleryGrid.innerHTML = `
            <div class="gallery-empty" style="
                grid-column: 1 / -1;
                padding: 60px 20px;
                text-align: center;
                color: #6e6e73;
                font-size: 15px;
                border: 2px dashed #d2d2d7;
                border-radius: 20px;
            ">
                <p>📸 No photos yet — upload photos in the <a href="admin-dashboard.html" style="color:inherit;text-decoration:underline;">admin panel</a> and toggle "Gallery" to show them here.</p>
            </div>`;
        return;
    }

    // Clear any placeholder
    galleryGrid.innerHTML = "";

    photos.forEach((photo, index) => {
        const item = document.createElement("div");
        item.className = "gallery-item" + (index === 0 ? " large" : "");
        if (index >= PREVIEW_COUNT) {
            item.classList.add("gallery-hidden");
        }
        item.innerHTML = `<img src="${photo.url}" alt="${photo.name || 'Photo'}" loading="lazy" onerror="this.parentElement.style.background='#f5f5f7';this.style.display='none';">`;
        galleryGrid.appendChild(item);
        observer.observe(item);
    });

    // Show "See more" button only if there are more than PREVIEW_COUNT photos
    if (photos.length > PREVIEW_COUNT && seeMoreWrapper && seeMoreBtn) {
        seeMoreWrapper.style.display = "flex";

        let expanded = false;
        seeMoreBtn.addEventListener("click", () => {
            expanded = !expanded;
            const arrowEl = seeMoreBtn.querySelector(".gallery-arrow");

            if (expanded) {
                galleryGrid.querySelectorAll(".gallery-hidden").forEach(el => {
                    el.classList.remove("gallery-hidden");
                    el.classList.add("gallery-revealed");
                });
                seeMoreBtn.firstChild.textContent = "Show less ";
                if (arrowEl) arrowEl.textContent = "↑";
            } else {
                galleryGrid.querySelectorAll(".gallery-revealed").forEach(el => {
                    el.classList.remove("gallery-revealed");
                    el.classList.add("gallery-hidden");
                });
                seeMoreBtn.firstChild.textContent = "See all photos ";
                if (arrowEl) arrowEl.textContent = "↓";
            }
        });
    }
});


