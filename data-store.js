/**
 * DataStore - Central LocalStorage State Management
 * Handles Authentication, Projects, Visitor Analytics, Messages, and Settings.
 */

const STORAGE_KEYS = {
    AUTH: "portfolio_admin_auth",
    PROJECTS: "portfolio_projects",
    ANALYTICS: "portfolio_analytics",
    MESSAGES: "portfolio_messages",
    IMAGES: "portfolio_images",
    PROFILE: "portfolio_profile",
    GALLERY: "portfolio_gallery_photos"
};

// Default Initial Projects
const DEFAULT_PROJECTS = [
    {
        id: "proj-1",
        number: "01 / WEBSITE",
        title: "Banking, simplified.",
        name: "Banking Website",
        subtitle: "A clean banking website concept focused on simplicity, accessibility and a modern financial experience.",
        category: "Website",
        tech: ["HTML", "CSS", "JavaScript", "UI / UX"],
        status: "Published",
        image: "Test.jpg",
        link: "#",
        featured: true,
        createdAt: "2026-01-15"
    },
    {
        id: "proj-2",
        number: "02 / PLATFORM",
        title: "UniSync.",
        name: "UniSync",
        subtitle: "A centralized academic platform designed to connect students, lecturers and administrators.",
        category: "Platform",
        tech: ["UI / UX", "Web", "Database"],
        status: "Published",
        image: "logo2.jpg",
        link: "#",
        featured: true,
        createdAt: "2026-02-10"
    },
    {
        id: "proj-3",
        number: "03 / MOBILE APP",
        title: "Mpepo POS.",
        name: "Mpepo POS",
        subtitle: "A point-of-sale system designed for modern business operations.",
        category: "Mobile App",
        tech: ["Flutter", "Python", "FastAPI", "SQLite"],
        status: "Published",
        image: "logo4.jpg",
        link: "#",
        featured: true,
        createdAt: "2026-03-05"
    },
    {
        id: "proj-4",
        number: "04 / API",
        title: "Student API",
        name: "Student API",
        subtitle: "Student grades and records management backend API built with FastAPI.",
        category: "API",
        tech: ["Python", "FastAPI", "PostgreSQL"],
        status: "Draft",
        image: "Test.jpg",
        link: "#",
        featured: false,
        createdAt: "2026-03-18"
    }
];

// Default Profile Settings
const DEFAULT_PROFILE = {
    name: "Acme Tembo",
    eyebrow: "COMPUTER SCIENCE · DEVELOPER",
    headline: "I build things people can use.",
    description: "I design and build simple digital experiences, websites and software with a focus on clarity.",
    email: "acme.tembo@example.com",
    github: "https://github.com",
    linkedin: "https://linkedin.com"
};

// Default Credentials (can be updated from Admin Settings)
const DEFAULT_AUTH = {
    username: "admin",
    password: "admin123", // In production hash, for local admin panel configurable
    sessionToken: null,
    remember: false
};

const DataStore = {
    // ==========================================
    // INITIALIZATION
    // ==========================================
    init() {
        // Migration: if gallery key doesn't exist yet, we need to seed it
        // (handles existing sessions from before the gallery feature was added)
        const needsGalleryMigration = !localStorage.getItem(STORAGE_KEYS.GALLERY);

        if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ANALYTICS)) {
            const initialAnalytics = {
                totalViews: 1284,
                uniqueVisitors: 412,
                todayViews: 24,
                lastVisitDate: new Date().toISOString().split("T")[0],
                visits: [
                    { id: "v-1", time: new Date(Date.now() - 3600000).toISOString(), page: "Portfolio Home", device: "Desktop", browser: "Chrome" },
                    { id: "v-2", time: new Date(Date.now() - 7200000).toISOString(), page: "Portfolio Home", device: "Mobile", browser: "Safari" },
                    { id: "v-3", time: new Date(Date.now() - 14400000).toISOString(), page: "Projects", device: "Desktop", browser: "Firefox" }
                ],
                visitorIds: {}
            };
            localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(initialAnalytics));
        }
        if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
            const sampleMessages = [
                {
                    id: "msg-1",
                    name: "Sarah Mwamba",
                    email: "sarah.m@example.com",
                    subject: "Web Development Inquiry",
                    message: "Hi Acme, I came across your portfolio and love the minimal aesthetic. Are you available for a freelance mobile app project next month?",
                    date: new Date(Date.now() - 86400000).toISOString(),
                    read: false
                },
                {
                    id: "msg-2",
                    name: "David Phiri",
                    email: "dphiri@fintech.zm",
                    subject: "Job Opportunity",
                    message: "Greetings Acme, we're building a new financial platform in Lusaka and looking for a developer with Flutter & FastAPI expertise. Let's connect!",
                    date: new Date(Date.now() - 172800000).toISOString(),
                    read: true
                }
            ];
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(sampleMessages));
        }
        if (!localStorage.getItem(STORAGE_KEYS.IMAGES)) {
            const sampleImages = [
                { id: "img-1", name: "Test.jpg", url: "Test.jpg", size: "16 KB", date: "2026-03-01" },
                { id: "img-2", name: "logo2.jpg", url: "logo2.jpg", size: "10 KB", date: "2026-03-05" },
                { id: "img-3", name: "logo4.jpg", url: "logo4.jpg", size: "907 KB", date: "2026-03-12" },
                { id: "img-4", name: "profile.jpg", url: "profile.jpg", size: "20 KB", date: "2026-03-15" }
            ];
            localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(sampleImages));
        }
        if (!localStorage.getItem(STORAGE_KEYS.GALLERY) || needsGalleryMigration) {
            // Pre-populate gallery with the existing profile photos so the public
            // gallery section always has something to show out of the box.
            const defaultGallery = [
                { id: "img-3", name: "logo4.jpg", url: "logo4.jpg", addedAt: new Date().toISOString() },
                { id: "img-1", name: "Test.jpg",   url: "Test.jpg",   addedAt: new Date().toISOString() },
                { id: "img-4", name: "profile.jpg",url: "profile.jpg",addedAt: new Date().toISOString() }
            ];
            localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(defaultGallery));
        }
    },

    // ==========================================
    // AUTHENTICATION
    // ==========================================
    getAuthConfig() {
        const stored = localStorage.getItem(STORAGE_KEYS.AUTH);
        if (!stored) {
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(DEFAULT_AUTH));
            return DEFAULT_AUTH;
        }
        return JSON.parse(stored);
    },

    login(username, password, remember = false) {
        const auth = this.getAuthConfig();
        if ((username === auth.username || username === "acme") && password === auth.password) {
            const token = "auth_" + Math.random().toString(36).substring(2) + Date.now();
            auth.sessionToken = token;
            auth.remember = remember;
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
            if (remember) {
                localStorage.setItem("portfolio_session", token);
            } else {
                sessionStorage.setItem("portfolio_session", token);
            }
            return { success: true };
        }
        return { success: false, error: "Invalid username or password" };
    },

    logout() {
        const auth = this.getAuthConfig();
        auth.sessionToken = null;
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
        localStorage.removeItem("portfolio_session");
        sessionStorage.removeItem("portfolio_session");
    },

    isAuthenticated() {
        const auth = this.getAuthConfig();
        const activeToken = localStorage.getItem("portfolio_session") || sessionStorage.getItem("portfolio_session");
        return !!(activeToken && auth.sessionToken && activeToken === auth.sessionToken);
    },

    updatePassword(currentPassword, newPassword) {
        const auth = this.getAuthConfig();
        if (currentPassword !== auth.password) {
            return { success: false, error: "Current password does not match" };
        }
        if (!newPassword || newPassword.length < 4) {
            return { success: false, error: "New password must be at least 4 characters long" };
        }
        auth.password = newPassword;
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
        return { success: true };
    },

    // ==========================================
    // VISITOR ANALYTICS
    // ==========================================
    recordVisit(pageName = "Portfolio Home") {
        this.init();
        let analytics = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYTICS) || "{}");
        if (!analytics.visits) analytics.visits = [];
        if (!analytics.visitorIds) analytics.visitorIds = {};

        const today = new Date().toISOString().split("T")[0];
        if (analytics.lastVisitDate !== today) {
            analytics.todayViews = 0;
            analytics.lastVisitDate = today;
        }

        analytics.totalViews = (analytics.totalViews || 0) + 1;
        analytics.todayViews = (analytics.todayViews || 0) + 1;

        // Track unique visitor
        let visitorId = localStorage.getItem("portfolio_uid");
        if (!visitorId) {
            visitorId = "uid_" + Math.random().toString(36).substring(2, 10);
            localStorage.setItem("portfolio_uid", visitorId);
            analytics.uniqueVisitors = (analytics.uniqueVisitors || 0) + 1;
        }

        // Detect device & browser
        const ua = navigator.userAgent;
        let device = "Desktop";
        if (/Mobi|Android/i.test(ua)) device = "Mobile";
        else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

        let browser = "Chrome";
        if (ua.indexOf("Firefox") > -1) browser = "Firefox";
        else if (ua.indexOf("Edg") > -1) browser = "Edge";
        else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) browser = "Safari";

        analytics.visits.unshift({
            id: "v-" + Date.now(),
            time: new Date().toISOString(),
            page: pageName,
            device: device,
            browser: browser
        });

        // Keep last 100 visits
        if (analytics.visits.length > 100) {
            analytics.visits = analytics.visits.slice(0, 100);
        }

        localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
        return analytics;
    },

    getAnalytics() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYTICS) || "{}");
    },

    clearAnalytics() {
        const fresh = {
            totalViews: 0,
            uniqueVisitors: 0,
            todayViews: 0,
            lastVisitDate: new Date().toISOString().split("T")[0],
            visits: [],
            visitorIds: {}
        };
        localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(fresh));
        return fresh;
    },

    // ==========================================
    // PROJECTS (WORK)
    // ==========================================
    getProjects() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || "[]");
    },

    addProject(project) {
        const projects = this.getProjects();
        const newProject = {
            id: "proj-" + Date.now(),
            number: project.number || `0${projects.length + 1} / ${project.category.toUpperCase()}`,
            title: project.title,
            name: project.name || project.title,
            subtitle: project.subtitle || project.description || "",
            category: project.category || "Project",
            tech: Array.isArray(project.tech) ? project.tech : (project.tech ? project.tech.split(",").map(t => t.trim()) : []),
            status: project.status || "Published",
            image: project.image || "Test.jpg",
            link: project.link || "#",
            featured: project.featured !== undefined ? project.featured : true,
            createdAt: new Date().toISOString().split("T")[0]
        };
        projects.unshift(newProject);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
        return newProject;
    },

    updateProject(id, updatedFields) {
        let projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        if (index === -1) return null;

        if (updatedFields.tech && typeof updatedFields.tech === "string") {
            updatedFields.tech = updatedFields.tech.split(",").map(t => t.trim()).filter(Boolean);
        }

        projects[index] = { ...projects[index], ...updatedFields };
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
        return projects[index];
    },

    deleteProject(id) {
        let projects = this.getProjects();
        projects = projects.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
        return true;
    },

    toggleProjectStatus(id) {
        let projects = this.getProjects();
        const proj = projects.find(p => p.id === id);
        if (proj) {
            proj.status = proj.status === "Published" ? "Draft" : "Published";
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            return proj;
        }
        return null;
    },

    // ==========================================
    // MESSAGES
    // ==========================================
    getMessages() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || "[]");
    },

    addMessage(msg) {
        const messages = this.getMessages();
        const newMessage = {
            id: "msg-" + Date.now(),
            name: msg.name,
            email: msg.email,
            subject: msg.subject || "Portfolio Contact Inquiry",
            message: msg.message,
            date: new Date().toISOString(),
            read: false
        };
        messages.unshift(newMessage);
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
        return newMessage;
    },

    markMessageRead(id, isRead = true) {
        let messages = this.getMessages();
        const msg = messages.find(m => m.id === id);
        if (msg) {
            msg.read = isRead;
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
        }
        return messages;
    },

    deleteMessage(id) {
        let messages = this.getMessages();
        messages = messages.filter(m => m.id !== id);
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
        return true;
    },

    // ==========================================
    // IMAGES
    // ==========================================
    getImages() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.IMAGES) || "[]");
    },

    addImage(name, url, size = "Custom") {
        const images = this.getImages();
        const newImg = {
            id: "img-" + Date.now(),
            name: name,
            url: url,
            size: size,
            date: new Date().toISOString().split("T")[0]
        };
        images.unshift(newImg);
        localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
        return newImg;
    },

    deleteImage(id) {
        let images = this.getImages();
        images = images.filter(img => img.id !== id);
        localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
        // Also remove from gallery if it was there
        this.removeGalleryPhoto(id);
        return true;
    },

    // ==========================================
    // GALLERY PHOTOS (public portfolio gallery)
    // ==========================================
    getGalleryPhotos() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.GALLERY) || "[]");
    },

    addGalleryPhoto(imageId) {
        const images = this.getImages();
        const img = images.find(i => i.id === imageId);
        if (!img) return false;
        const gallery = this.getGalleryPhotos();
        if (gallery.find(g => g.id === imageId)) return false; // already in gallery
        gallery.push({ id: imageId, name: img.name, url: img.url, addedAt: new Date().toISOString() });
        localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(gallery));
        return true;
    },

    removeGalleryPhoto(imageId) {
        let gallery = this.getGalleryPhotos();
        gallery = gallery.filter(g => g.id !== imageId);
        localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(gallery));
        return true;
    },

    isInGallery(imageId) {
        return this.getGalleryPhotos().some(g => g.id === imageId);
    },

    // ==========================================
    // PROFILE SETTINGS
    // ==========================================
    getProfile() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || JSON.stringify(DEFAULT_PROFILE));
    },

    updateProfile(updated) {
        const current = this.getProfile();
        const merged = { ...current, ...updated };
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(merged));
        return merged;
    },

    // ==========================================
    // RESET TO DEFAULTS
    // ==========================================
    resetAll() {
        localStorage.removeItem(STORAGE_KEYS.PROJECTS);
        localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
        localStorage.removeItem(STORAGE_KEYS.MESSAGES);
        localStorage.removeItem(STORAGE_KEYS.IMAGES);
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        localStorage.removeItem(STORAGE_KEYS.GALLERY);
        localStorage.removeItem("portfolio_session");
        this.init();
    }
};

// Auto initialize on load
DataStore.init();

// Export to window
if (typeof window !== "undefined") {
    window.DataStore = DataStore;
}
