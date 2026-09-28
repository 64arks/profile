/**
 * Admin Dashboard Controller
 * Full interaction for Projects CRUD, Visitor Analytics, Messages Inbox, Image Assets & Settings.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Auth Guard
    if (!DataStore.isAuthenticated()) {
        window.location.href = "admin-login.html";
        return;
    }

    // 2. State & Cache
    let currentTab = "dashboard";
    let editingProjectId = null;
    let deletingProjectId = null;
    let activeMessageId = null;

    // 3. UI References
    const navItems = document.querySelectorAll(".nav-item[data-tab]");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const topbarTitle = document.getElementById("topbar-title");
    const topbarSubtitle = document.getElementById("topbar-subtitle");
    const logoutBtn = document.getElementById("logout-btn");
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const toastContainer = document.getElementById("toast-container");

    // Modal References
    const projectModal = document.getElementById("project-modal");
    const projectModalTitle = document.getElementById("project-modal-title");
    const projectForm = document.getElementById("project-form");
    const projectImageInput = document.getElementById("proj-image-file");
    const projectImagePreview = document.getElementById("proj-image-preview");
    const projectImageUrl = document.getElementById("proj-image-url");

    const deleteModal = document.getElementById("delete-modal");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

    const messageModal = document.getElementById("message-modal");

    // Theme initialization
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
            showToast("Theme switched");
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to sign out of the Admin Dashboard?")) {
                DataStore.logout();
                window.location.href = "admin-login.html";
            }
        });
    }

    // Tab Switching
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute("data-tab");
            switchTab(targetTab);
        });
    });

    function switchTab(tabId) {
        currentTab = tabId;
        navItems.forEach(item => {
            if (item.getAttribute("data-tab") === tabId) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        tabPanes.forEach(pane => {
            if (pane.id === `tab-${tabId}`) {
                pane.classList.add("active");
            } else {
                pane.classList.remove("active");
            }
        });

        // Update Top Bar
        const titles = {
            dashboard: { title: "Dashboard", subtitle: "Overview of your portfolio and audience." },
            work: { title: "My Work", subtitle: "Manage, publish, and organize your projects." },
            analytics: { title: "Visitor Analytics", subtitle: "Track web profile views and traffic sources." },
            messages: { title: "Messages", subtitle: "Client inquiries and contact form submissions." },
            images: { title: "Image Assets", subtitle: "Manage and upload images for your projects." },
            settings: { title: "Settings", subtitle: "Configure admin password and portfolio profile details." }
        };

        if (titles[tabId]) {
            topbarTitle.textContent = titles[tabId].title;
            topbarSubtitle.textContent = titles[tabId].subtitle;
        }

        // Render tab content
        refreshCurrentTab();
    }

    function refreshCurrentTab() {
        renderGlobalBadges();
        if (currentTab === "dashboard") {
            renderDashboardOverview();
        } else if (currentTab === "work") {
            renderProjectsList();
        } else if (currentTab === "analytics") {
            renderAnalytics();
        } else if (currentTab === "messages") {
            renderMessages();
        } else if (currentTab === "images") {
            renderImages();
        } else if (currentTab === "settings") {
            loadSettings();
        }
    }

    // ==========================================
    // BADGES & STATS
    // ==========================================
    function renderGlobalBadges() {
        const messages = DataStore.getMessages();
        const unreadCount = messages.filter(m => !m.read).length;
        const msgBadge = document.getElementById("sidebar-msg-badge");
        if (msgBadge) {
            if (unreadCount > 0) {
                msgBadge.textContent = unreadCount;
                msgBadge.style.display = "inline-block";
            } else {
                msgBadge.style.display = "none";
            }
        }
    }

    // ==========================================
    // TAB 1: DASHBOARD OVERVIEW
    // ==========================================
    function renderDashboardOverview() {
        const projects = DataStore.getProjects();
        const analytics = DataStore.getAnalytics();
        const messages = DataStore.getMessages();
        const images = DataStore.getImages();

        // Stat Cards
        document.getElementById("stat-total-projects").textContent = projects.length;
        document.getElementById("stat-published-projects").textContent = `${projects.filter(p => p.status === "Published").length} published`;

        document.getElementById("stat-total-visitors").textContent = analytics.totalViews || 0;
        document.getElementById("stat-today-visitors").textContent = `${analytics.todayViews || 0} today`;

        document.getElementById("stat-total-messages").textContent = messages.length;
        const unread = messages.filter(m => !m.read).length;
        document.getElementById("stat-unread-messages").textContent = `${unread} unread`;

        document.getElementById("stat-total-images").textContent = images.length;

        // Recent Projects Preview
        const recentWorkGrid = document.getElementById("recent-work-grid");
        if (recentWorkGrid) {
            recentWorkGrid.innerHTML = "";
            const recent = projects.slice(0, 3);
            if (recent.length === 0) {
                recentWorkGrid.innerHTML = `<div class="empty-state"><span>▣</span><p>No projects yet. Click "+ Add New Work" to create one.</p></div>`;
            } else {
                recent.forEach(proj => {
                    recentWorkGrid.appendChild(createProjectCardElement(proj, false));
                });
            }
        }

        // Recent Visits Preview
        const recentVisitsList = document.getElementById("recent-visits-list");
        if (recentVisitsList) {
            recentVisitsList.innerHTML = "";
            const recentVisits = (analytics.visits || []).slice(0, 5);
            if (recentVisits.length === 0) {
                recentVisitsList.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--light-grey);padding:20px;">No visits recorded yet.</td></tr>`;
            } else {
                recentVisits.forEach(v => {
                    const row = document.createElement("tr");
                    const timeAgo = formatTimeAgo(new Date(v.time));
                    row.innerHTML = `
                        <td><strong>${v.page}</strong></td>
                        <td>${v.device}</td>
                        <td>${v.browser}</td>
                        <td style="color:var(--light-grey)">${timeAgo}</td>
                    `;
                    recentVisitsList.appendChild(row);
                });
            }
        }
    }

    // ==========================================
    // TAB 2: MY WORK (PROJECTS)
    // ==========================================
    const searchWorkInput = document.getElementById("search-work");
    const filterStatusSelect = document.getElementById("filter-status");

    if (searchWorkInput) searchWorkInput.addEventListener("input", renderProjectsList);
    if (filterStatusSelect) filterStatusSelect.addEventListener("change", renderProjectsList);

    function renderProjectsList() {
        const projectsContainer = document.getElementById("projects-grid");
        if (!projectsContainer) return;

        let projects = DataStore.getProjects();
        const search = (searchWorkInput ? searchWorkInput.value.toLowerCase().trim() : "");
        const statusFilter = (filterStatusSelect ? filterStatusSelect.value : "all");

        if (search) {
            projects = projects.filter(p => 
                p.title.toLowerCase().includes(search) || 
                (p.subtitle && p.subtitle.toLowerCase().includes(search)) ||
                (p.category && p.category.toLowerCase().includes(search))
            );
        }

        if (statusFilter !== "all") {
            projects = projects.filter(p => p.status.toLowerCase() === statusFilter.toLowerCase());
        }

        projectsContainer.innerHTML = "";

        if (projects.length === 0) {
            projectsContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <span>▣</span>
                    <p>No projects match your filter or search.</p>
                </div>
            `;
            return;
        }

        projects.forEach(proj => {
            projectsContainer.appendChild(createProjectCardElement(proj, true));
        });
    }

    function createProjectCardElement(proj, showActions = true) {
        const article = document.createElement("article");
        article.className = "project-card";

        const statusClass = proj.status === "Published" ? "published" : "draft";

        let techBadges = "";
        if (proj.tech && proj.tech.length > 0) {
            techBadges = `<div class="project-tech-tags">` + 
                proj.tech.map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("") + 
                `</div>`;
        }

        article.innerHTML = `
            <div class="project-image">
                <img src="${escapeHtml(proj.image || 'Test.jpg')}" alt="${escapeHtml(proj.title)}" onerror="this.src='Test.jpg';">
            </div>

            <div class="project-info">
                <div>
                    <small style="color:var(--light-grey);font-size:11px;font-weight:600;">${escapeHtml(proj.number || '')}</small>
                    <h3>${escapeHtml(proj.title)}</h3>
                    <p>${escapeHtml(proj.subtitle || '')}</p>
                </div>

                <span class="status ${statusClass}" data-id="${proj.id}" title="Click to toggle Published / Draft">
                    ${proj.status}
                </span>
            </div>

            ${techBadges}

            ${showActions ? `
                <div class="project-actions">
                    <button class="edit-btn" data-edit="${proj.id}">Edit</button>
                    <button class="delete-btn" data-delete="${proj.id}">Delete</button>
                </div>
            ` : ''}
        `;

        // Status Toggle Click
        const statusBadge = article.querySelector(".status");
        if (statusBadge) {
            statusBadge.addEventListener("click", () => {
                const updated = DataStore.toggleProjectStatus(proj.id);
                if (updated) {
                    showToast(`Project marked as ${updated.status}`);
                    renderProjectsList();
                    renderDashboardOverview();
                }
            });
        }

        // Edit Click
        const editBtn = article.querySelector("[data-edit]");
        if (editBtn) {
            editBtn.addEventListener("click", () => openEditProjectModal(proj.id));
        }

        // Delete Click
        const deleteBtn = article.querySelector("[data-delete]");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => openDeleteModal(proj.id));
        }

        return article;
    }

    // Modal: Add / Edit Project
    const addWorkBtn = document.querySelectorAll(".trigger-add-work");
    addWorkBtn.forEach(btn => {
        btn.addEventListener("click", () => openAddProjectModal());
    });

    function openAddProjectModal() {
        editingProjectId = null;
        projectModalTitle.textContent = "Add New Work";
        projectForm.reset();
        projectImageUrl.value = "Test.jpg";
        projectImagePreview.src = "Test.jpg";
        projectModal.classList.add("active");
    }

    function openEditProjectModal(id) {
        editingProjectId = id;
        const projects = DataStore.getProjects();
        const proj = projects.find(p => p.id === id);
        if (!proj) return;

        projectModalTitle.textContent = "Edit Project";
        document.getElementById("proj-title").value = proj.title || "";
        document.getElementById("proj-category").value = proj.category || "Website";
        document.getElementById("proj-subtitle").value = proj.subtitle || "";
        document.getElementById("proj-tech").value = Array.isArray(proj.tech) ? proj.tech.join(", ") : (proj.tech || "");
        document.getElementById("proj-status").value = proj.status || "Published";
        document.getElementById("proj-link").value = proj.link || "#";

        projectImageUrl.value = proj.image || "Test.jpg";
        projectImagePreview.src = proj.image || "Test.jpg";

        projectModal.classList.add("active");
    }

    // Close Modals
    document.querySelectorAll(".close-modal").forEach(btn => {
        btn.addEventListener("click", () => {
            projectModal.classList.remove("active");
            deleteModal.classList.remove("active");
            messageModal.classList.remove("active");
        });
    });

    // Image file upload preview
    if (projectImageInput) {
        projectImageInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    projectImageUrl.value = dataUrl;
                    projectImagePreview.src = dataUrl;
                    // Also save to image library
                    DataStore.addImage(file.name, dataUrl, formatBytes(file.size));
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (projectImageUrl) {
        projectImageUrl.addEventListener("input", (e) => {
            projectImagePreview.src = e.target.value || "Test.jpg";
        });
    }

    // Save Project Form
    if (projectForm) {
        projectForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const projectData = {
                title: document.getElementById("proj-title").value.trim(),
                category: document.getElementById("proj-category").value.trim(),
                subtitle: document.getElementById("proj-subtitle").value.trim(),
                tech: document.getElementById("proj-tech").value.trim(),
                status: document.getElementById("proj-status").value,
                link: document.getElementById("proj-link").value.trim() || "#",
                image: projectImageUrl.value.trim() || "Test.jpg"
            };

            if (editingProjectId) {
                DataStore.updateProject(editingProjectId, projectData);
                showToast("Project updated successfully!");
            } else {
                DataStore.addProject(projectData);
                showToast("New project added to portfolio!");
            }

            projectModal.classList.remove("active");
            renderProjectsList();
            renderDashboardOverview();
        });
    }

    // Delete Modal Actions
    function openDeleteModal(id) {
        deletingProjectId = id;
        deleteModal.classList.add("active");
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", () => {
            if (deletingProjectId) {
                DataStore.deleteProject(deletingProjectId);
                showToast("Project deleted");
                deleteModal.classList.remove("active");
                renderProjectsList();
                renderDashboardOverview();
            }
        });
    }

    // ==========================================
    // TAB 3: VISITOR ANALYTICS
    // ==========================================
    function renderAnalytics() {
        const analytics = DataStore.getAnalytics();
        const visits = analytics.visits || [];

        document.getElementById("analytics-total-views").textContent = analytics.totalViews || 0;
        document.getElementById("analytics-unique-visitors").textContent = analytics.uniqueVisitors || 0;
        document.getElementById("analytics-today-views").textContent = analytics.todayViews || 0;

        // Device Breakdown
        let desktop = 0, mobile = 0, tablet = 0;
        visits.forEach(v => {
            if (v.device === "Mobile") mobile++;
            else if (v.device === "Tablet") tablet++;
            else desktop++;
        });

        const totalTracked = Math.max(1, visits.length);
        const desktopPct = Math.round((desktop / totalTracked) * 100);
        const mobilePct = Math.round((mobile / totalTracked) * 100);
        const tabletPct = Math.round((tablet / totalTracked) * 100);

        document.getElementById("device-desktop-pct").textContent = `${desktopPct}%`;
        document.getElementById("device-desktop-bar").style.width = `${desktopPct}%`;

        document.getElementById("device-mobile-pct").textContent = `${mobilePct}%`;
        document.getElementById("device-mobile-bar").style.width = `${mobilePct}%`;

        document.getElementById("device-tablet-pct").textContent = `${tabletPct}%`;
        document.getElementById("device-tablet-bar").style.width = `${tabletPct}%`;

        // Browser Breakdown
        let browsers = {};
        visits.forEach(v => {
            browsers[v.browser] = (browsers[v.browser] || 0) + 1;
        });

        const browserList = document.getElementById("browser-breakdown-list");
        if (browserList) {
            browserList.innerHTML = "";
            Object.keys(browsers).forEach(name => {
                const count = browsers[name];
                const pct = Math.round((count / totalTracked) * 100);
                const item = document.createElement("div");
                item.className = "breakdown-row";
                item.innerHTML = `
                    <div class="breakdown-label">
                        <span>${name}</span>
                        <strong>${pct}% (${count})</strong>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${pct}%"></div>
                    </div>
                `;
                browserList.appendChild(item);
            });
        }

        // Live Log Table
        const fullLogsTable = document.getElementById("analytics-full-logs");
        if (fullLogsTable) {
            fullLogsTable.innerHTML = "";
            if (visits.length === 0) {
                fullLogsTable.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--light-grey)">No visitor records yet. Visit your homepage to generate live visits.</td></tr>`;
            } else {
                visits.forEach((v, index) => {
                    const row = document.createElement("tr");
                    const dateFormatted = new Date(v.time).toLocaleString();
                    row.innerHTML = `
                        <td>#${visits.length - index}</td>
                        <td><strong>${escapeHtml(v.page)}</strong></td>
                        <td><span class="tech-tag">${escapeHtml(v.device)}</span></td>
                        <td>${escapeHtml(v.browser)}</td>
                        <td style="color:var(--light-grey)">${dateFormatted}</td>
                    `;
                    fullLogsTable.appendChild(row);
                });
            }
        }
    }

    const resetAnalyticsBtn = document.getElementById("reset-analytics-btn");
    if (resetAnalyticsBtn) {
        resetAnalyticsBtn.addEventListener("click", () => {
            if (confirm("Reset all visitor analytics and history?")) {
                DataStore.clearAnalytics();
                showToast("Analytics reset successfully");
                renderAnalytics();
                renderDashboardOverview();
            }
        });
    }

    // ==========================================
    // TAB 4: MESSAGES INBOX
    // ==========================================
    function renderMessages() {
        const messagesList = document.getElementById("messages-list");
        if (!messagesList) return;

        const messages = DataStore.getMessages();
        messagesList.innerHTML = "";

        if (messages.length === 0) {
            messagesList.innerHTML = `
                <div class="empty-state">
                    <span>✉</span>
                    <p>No messages received yet.</p>
                    <small>When visitors submit the contact form on your portfolio, their messages appear here.</small>
                </div>
            `;
            return;
        }

        messages.forEach(msg => {
            const item = document.createElement("div");
            item.className = `message-item ${msg.read ? '' : 'unread'}`;
            const timeAgo = formatTimeAgo(new Date(msg.date));

            item.innerHTML = `
                <div class="msg-sender">
                    <strong>${escapeHtml(msg.name)}</strong>
                    <div style="font-size:12px;color:var(--light-grey);">${escapeHtml(msg.email)}</div>
                </div>

                <div class="msg-preview">
                    <strong>${escapeHtml(msg.subject)}</strong> — ${escapeHtml(msg.message)}
                </div>

                <div class="msg-date">
                    ${timeAgo}
                </div>

                <div class="msg-actions">
                    <button class="btn-icon view-msg" data-view="${msg.id}" title="View Message">👁</button>
                    <a href="mailto:${encodeURIComponent(msg.email)}?subject=Re: ${encodeURIComponent(msg.subject)}" class="btn-icon" title="Reply via Email">↩</a>
                    <button class="btn-icon delete delete-msg" data-delete-msg="${msg.id}" title="Delete Message">🗑</button>
                </div>
            `;

            // View Click
            item.querySelector(".view-msg").addEventListener("click", (e) => {
                e.stopPropagation();
                openMessageModal(msg.id);
            });

            // Delete Click
            item.querySelector(".delete-msg").addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm(`Delete message from ${msg.name}?`)) {
                    DataStore.deleteMessage(msg.id);
                    showToast("Message deleted");
                    renderMessages();
                    renderGlobalBadges();
                }
            });

            item.addEventListener("click", () => {
                openMessageModal(msg.id);
            });

            messagesList.appendChild(item);
        });
    }

    function openMessageModal(id) {
        activeMessageId = id;
        DataStore.markMessageRead(id, true);
        renderGlobalBadges();

        const messages = DataStore.getMessages();
        const msg = messages.find(m => m.id === id);
        if (!msg) return;

        document.getElementById("msg-modal-from").textContent = `${msg.name} (${msg.email})`;
        document.getElementById("msg-modal-subject").textContent = msg.subject;
        document.getElementById("msg-modal-date").textContent = new Date(msg.date).toLocaleString();
        document.getElementById("msg-modal-body").textContent = msg.message;

        const replyBtn = document.getElementById("msg-modal-reply");
        replyBtn.href = `mailto:${encodeURIComponent(msg.email)}?subject=Re: ${encodeURIComponent(msg.subject)}`;

        messageModal.classList.add("active");
        renderMessages();
    }

    const deleteActiveMsgBtn = document.getElementById("msg-modal-delete");
    if (deleteActiveMsgBtn) {
        deleteActiveMsgBtn.addEventListener("click", () => {
            if (activeMessageId) {
                DataStore.deleteMessage(activeMessageId);
                showToast("Message deleted");
                messageModal.classList.remove("active");
                renderMessages();
                renderGlobalBadges();
            }
        });
    }

    // ==========================================
    // TAB 5: IMAGE ASSETS
    // ==========================================
    const uploadDropzone = document.getElementById("upload-dropzone");
    const galleryFileInput = document.getElementById("gallery-file-input");

    if (uploadDropzone && galleryFileInput) {
        uploadDropzone.addEventListener("click", () => galleryFileInput.click());

        uploadDropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadDropzone.classList.add("dragover");
        });

        uploadDropzone.addEventListener("dragleave", () => {
            uploadDropzone.classList.remove("dragover");
        });

        uploadDropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            uploadDropzone.classList.remove("dragover");
            const files = e.dataTransfer.files;
            handleImageUploadFiles(files);
        });

        galleryFileInput.addEventListener("change", (e) => {
            handleImageUploadFiles(e.target.files);
        });
    }

    function handleImageUploadFiles(files) {
        if (!files || files.length === 0) return;
        Array.from(files).forEach(file => {
            if (!file.type.startsWith("image/")) {
                showToast("Please upload image files only", true);
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                DataStore.addImage(file.name, event.target.result, formatBytes(file.size));
                showToast(`Uploaded ${file.name}`);
                renderImages();
                renderDashboardOverview();
            };
            reader.readAsDataURL(file);
        });
    }

    function renderImages() {
        const galleryGrid = document.getElementById("gallery-grid");
        if (!galleryGrid) return;

        const images = DataStore.getImages();
        galleryGrid.innerHTML = "";

        if (images.length === 0) {
            galleryGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span>▧</span><p>No images uploaded yet. Drag &amp; drop photos above to get started.</p></div>`;
            return;
        }

        images.forEach(img => {
            const inGallery = DataStore.isInGallery(img.id);
            const card = document.createElement("div");
            card.className = "gallery-card";
            if (inGallery) card.classList.add("in-gallery");

            card.innerHTML = `
                <div class="gallery-card-img">
                    <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.name)}" onerror="this.src='Test.jpg';">
                    ${inGallery ? `<div class="gallery-badge">📸 In Gallery</div>` : ''}
                </div>
                <div class="gallery-card-body">
                    <div>
                        <span title="${escapeHtml(img.name)}">${escapeHtml(img.name)}</span>
                        <div style="font-size:11px;color:var(--light-grey);">${img.size || ''}</div>
                    </div>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;">
                        <button class="btn-gallery-toggle ${inGallery ? 'active' : ''}" title="${inGallery ? 'Remove from public gallery' : 'Show in public gallery'}">
                            ${inGallery ? '👁 In Gallery' : '+ Gallery'}
                        </button>
                        <button class="btn-icon copy-url" title="Copy Image Reference">📋</button>
                        <button class="btn-icon delete delete-img" title="Delete Image">🗑</button>
                    </div>
                </div>
            `;

            card.querySelector(".btn-gallery-toggle").addEventListener("click", () => {
                if (DataStore.isInGallery(img.id)) {
                    DataStore.removeGalleryPhoto(img.id);
                    showToast(`Removed "${img.name}" from public gallery`);
                } else {
                    DataStore.addGalleryPhoto(img.id);
                    showToast(`"${img.name}" now shows in public gallery ✓`);
                }
                renderImages();
            });

            card.querySelector(".copy-url").addEventListener("click", () => {
                navigator.clipboard.writeText(img.url);
                showToast("Image URL copied to clipboard!");
            });

            card.querySelector(".delete-img").addEventListener("click", () => {
                if (confirm(`Delete "${img.name}"? This will also remove it from the public gallery.`)) {
                    DataStore.deleteImage(img.id);
                    showToast("Image deleted");
                    renderImages();
                    renderDashboardOverview();
                }
            });

            galleryGrid.appendChild(card);
        });
    }

    // ==========================================
    // TAB 6: SETTINGS
    // ==========================================
    function loadSettings() {
        const profile = DataStore.getProfile();
        document.getElementById("profile-name").value = profile.name || "";
        document.getElementById("profile-eyebrow").value = profile.eyebrow || "";
        document.getElementById("profile-headline").value = profile.headline || "";
        document.getElementById("profile-description").value = profile.description || "";
        document.getElementById("profile-email").value = profile.email || "";
        document.getElementById("profile-github").value = profile.github || "";
        document.getElementById("profile-linkedin").value = profile.linkedin || "";
    }

    const profileForm = document.getElementById("profile-form");
    if (profileForm) {
        profileForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const updated = {
                name: document.getElementById("profile-name").value.trim(),
                eyebrow: document.getElementById("profile-eyebrow").value.trim(),
                headline: document.getElementById("profile-headline").value.trim(),
                description: document.getElementById("profile-description").value.trim(),
                email: document.getElementById("profile-email").value.trim(),
                github: document.getElementById("profile-github").value.trim(),
                linkedin: document.getElementById("profile-linkedin").value.trim()
            };
            DataStore.updateProfile(updated);
            showToast("Portfolio profile updated successfully!");
        });
    }

    const passwordForm = document.getElementById("password-form");
    if (passwordForm) {
        passwordForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const currentPass = document.getElementById("curr-password").value;
            const newPass = document.getElementById("new-password").value;
            const confirmPass = document.getElementById("confirm-password").value;

            if (newPass !== confirmPass) {
                showToast("New passwords do not match", true);
                return;
            }

            const result = DataStore.updatePassword(currentPass, newPass);
            if (result.success) {
                showToast("Password updated successfully!");
                passwordForm.reset();
            } else {
                showToast(result.error || "Failed to update password", true);
            }
        });
    }

    const resetFactoryBtn = document.getElementById("reset-factory-btn");
    if (resetFactoryBtn) {
        resetFactoryBtn.addEventListener("click", () => {
            if (confirm("WARNING: This will reset all projects, visitor stats, messages, and settings back to factory defaults! Are you sure?")) {
                DataStore.resetAll();
                showToast("System reset to defaults.");
                setTimeout(() => window.location.reload(), 800);
            }
        });
    }

    // ==========================================
    // UTILITIES
    // ==========================================
    function showToast(message, isError = false) {
        if (!toastContainer) return;
        const toast = document.createElement("div");
        toast.className = "toast";
        if (isError) {
            toast.style.background = "#d32f2f";
            toast.style.color = "#ffffff";
        }
        toast.innerHTML = `<span>${isError ? '⚠️' : '✓'}</span> <span>${escapeHtml(message)}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(40px)";
            toast.style.transition = "0.3s";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHr / 24);

        if (diffSec < 60) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDays === 1) return "Yesterday";
        return `${diffDays}d ago`;
    }

    function formatBytes(bytes) {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initial render
    switchTab("dashboard");
});
