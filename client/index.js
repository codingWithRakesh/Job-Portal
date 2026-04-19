 // --- DUMMY JOB DATA ---
        const dummyJobs = [
            { 
                _id: 'job_101', 
                title: 'Software Development Engineer', 
                company: 'Google',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
                location: ['Mountain View, CA'], 
                salaryRange: '20,000 - 50,000',
                jobType: 'Full-time', 
                workMode: 'Hybrid',
                experience: '0-2 Years',
                vacancies: 5,
                postedAt: '3d ago',
                ageRange: '21-35',
                qualifications: 'B.Tech/M.Tech in Computer Science or related field.',
                description: 'We are looking for passionate problem solvers to join our core search infrastructure team. You will be responsible for building highly scalable microservices, optimizing low-latency algorithms, and collaborating with cross-functional engineering teams to deliver world-class products.',
                requiredSkills: ['Java', 'C++', 'Data Structures', 'Algorithms', 'System Design']
            },
            { 
                _id: 'job_102', 
                title: 'Frontend Developer (React)', 
                company: 'Spotify',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg',
                location: ['Remote'], 
                salaryRange: '25,000 - 35,000',
                jobType: 'Contract', 
                workMode: 'Remote',
                experience: '2-5 Years',
                vacancies: 2,
                postedAt: '15d ago',
                ageRange: '22-35',
                qualifications: 'Bachelor\'s degree in IT, Computer Applications, or equivalent experience.',
                description: 'Join the team building the web player experience for millions of users worldwide. You will work extensively with React, Redux, and modern web APIs to create fluid, accessible, and highly performant audio playback interfaces.',
                requiredSkills: ['React.js', 'TypeScript', 'CSS/SASS', 'Redux', 'Web Audio API']
            },
            { 
                _id: 'job_103', 
                title: 'Data Analyst Intern', 
                company: 'Netflix',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
                location: ['Los Gatos, CA'], 
                salaryRange: '10,000 / month',
                jobType: 'Internship', 
                workMode: 'On-site',
                experience: 'Fresher',
                vacancies: 10,
                postedAt: '25d ago',
                ageRange: '21-28',
                qualifications: 'Currently pursuing a degree in Statistics, Mathematics, Computer Science, or Economics.',
                description: 'As a Data Analyst Intern, you will dive into massive datasets to uncover trends in user viewing behavior. You will build dashboards, write complex SQL queries, and present actionable insights to the content strategy team.',
                requiredSkills: ['SQL', 'Python', 'Tableau', 'Statistics', 'A/B Testing']
            }
        ];

        // --- ICONS (SVG Strings) ---
        const icons = {
            location: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
            salary: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-currency-rupee" viewBox="0 0 16 16">
  <path d="M4 3.06h2.726c1.22 0 2.12.575 2.325 1.724H4v1.051h5.051C8.855 7.001 8 7.558 6.788 7.558H4v1.317L8.437 14h2.11L6.095 8.884h.855c2.316-.018 3.465-1.476 3.688-3.049H12V4.784h-1.345c-.08-.778-.357-1.335-.793-1.732H12V2H4z"/>
</svg>`,
            briefcase: '<svg class="icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
            clock: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
            send: '<svg class="icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
            check: '<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            users: '<svg class="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            fileText: '<svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>'
        };

        // --- CORE LOGIC ---

        function toggleJobAccordion(jobId) {
            const card = document.getElementById(`job-card-${jobId}`);
            // Toggle expanded class
            card.classList.toggle('expanded');
        }

        function handleApply(buttonElement, event) {
            // Stop the click from bubbling up to the job card (which would close the accordion)
            event.stopPropagation();

            // Change button state
            buttonElement.innerHTML = `${icons.check} Applied Successfully`;
            buttonElement.classList.add('applied');
            buttonElement.disabled = true;
            
            // Optional: You could show a small toast notification here
        }

        function getPostedDays(postedAt) {
            return Number.parseInt(String(postedAt).match(/\d+/)?.[0], 10) || 0;
        }

        function getPostedBadgeClass(postedAt) {
            const days = getPostedDays(postedAt);

            if (days >= 1 && days <= 10) return "posted-at--green";
            if (days >= 11 && days <= 20) return "posted-at--yellow";
            return "posted-at--red";
        }

        function renderJobFeed() {
            const container = document.getElementById('job-feed-container');
            container.innerHTML = '';

            dummyJobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.className = 'job-card';
                jobCard.id = `job-card-${job._id}`;

                const skillsHtml = job.requiredSkills.map(skill => `<span class="skill-chip">${skill}</span>`).join('');
                const postedBadgeClass = getPostedBadgeClass(job.postedAt);

                jobCard.innerHTML = `
                    <!-- Summary Area (Always Visible) -->
                    <div class="job-summary" onclick="toggleJobAccordion('${job._id}')">
                        <div class="posted-at ${postedBadgeClass}">
                            ${icons.clock}
                            <span>Posted: ${job.postedAt}</span>
                        </div>
                        <div class="job-header-top">
                            <img src="${job.logo}" alt="${job.company} logo" class="company-logo">
                            <div class="job-title-group">
                                <h3 class="job-title">${job.title}</h3>
                                <div class="company-name">${job.company}</div>
                            </div>
                        </div>

                        <div class="job-quick-info">
                            <div class="info-tag" title="Experience">
                                ${icons.briefcase} ${job.experience}
                            </div>
                            <div class="info-tag" title="Job Type">
                                ${icons.fileText} ${job.jobType}
                            </div>
                            <div class="info-tag" title="Salary">
                                ${icons.salary} ${job.salaryRange}
                            </div>
                            <div class="info-tag" title="Location">
                                ${icons.location} ${job.location[0]} (${job.workMode})
                            </div>
                            <div class="info-tag" title="Vacancies">
                                ${icons.users} ${job.vacancies} Vacancies
                            </div>
                        </div>

                        <div class="expand-hint">
                            View Full Details 
                            <svg class="icon expand-icon" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>

                    <!-- Hidden Details Area (Expands on Click) -->
                    <div class="job-details">
                        <div class="detail-section">
                            <h4>Job Description</h4>
                            <p>${job.description}</p>
                        </div>

                        <div class="detail-section">
                            <h4>Qualifications</h4>
                            <p>${job.qualifications}</p>
                        </div>

                        <div class="detail-section">
                            <h4>Age Range</h4>
                            <p>(${job.ageRange})</p>
                        </div>

                        <div class="detail-section">
                            <h4>Skills Required</h4>
                            <div class="skills-container">
                                ${skillsHtml}
                            </div>
                        </div>

                        <!-- Apply Button inside details -->
                        <div class="action-area">
                            <button class="btn-apply" onclick="handleApply(this, event)">
                                Apply Now ${icons.send}
                            </button>
                        </div>
                    </div>
                `;

                container.appendChild(jobCard);
            });
        }

        // --- DRAWERS ---

        const API_BASE_URL = "http://localhost:8000/api/v1";

        function getStoredUserData() {
            try {
                return JSON.parse(localStorage.getItem("userData") || "{}");
            } catch (error) {
                return {};
            }
        }

        function getVisibleProfileData() {
            const storedUser = getStoredUserData();
            const profileName = document.querySelector(".profile-card .profile-name")?.textContent.trim();
            const profileSubtitle = (document.querySelector(".profile-card .profile-title")?.innerHTML || "")
                .replace(/<br\s*\/?>/gi, " at ")
                .replace(/\s+/g, " ")
                .trim();
            const profileImage = document.querySelector(".profile-card .profile-pic")?.getAttribute("src");
            const completionText = document.querySelector(".profile-card .profile-progress-badge")?.textContent.trim();
            const completion = Math.min(Math.max(Number.parseInt(completionText, 10) || 0, 0), 100);
            const performanceValues = document.querySelectorAll(".profile-card .perf-item-value");

            const topQualification = storedUser.qualifications?.[0];
            const storedSubtitle = topQualification
                ? `${topQualification.degree}${topQualification.department ? ` - ${topQualification.department}` : ""} at ${topQualification.institution}`
                : "";

            return {
                name: storedUser.name || profileName || "Name",
                subtitle: storedSubtitle || profileSubtitle || "Update Profile to stand out",
                imageUrl: storedUser.profilePicture?.url || profileImage || "",
                completion,
                searchAppearances: Number.parseInt(performanceValues[0]?.textContent, 10) || 0,
                recruiterActions: Number.parseInt(performanceValues[1]?.textContent, 10) || 0
            };
        }

        function getProgressColor(percentage) {
            if (percentage > 75) return "#2abf68";
            if (percentage > 50) return "#eab308";
            if (percentage > 25) return "#f97316";
            return "#ef4444";
        }

        function syncProfileDrawer() {
            const profile = getVisibleProfileData();
            const color = getProgressColor(profile.completion);
            const homeProfileRing = document.querySelector(".profile-pic-container");
            const homeProfileBadge = document.querySelector(".profile-progress-badge");
            const drawerName = document.getElementById("drawerProfileName");
            const drawerSubtitle = document.getElementById("drawerProfileSubtitle");
            const drawerPercentage = document.getElementById("drawerPercentage");
            const drawerRing = document.getElementById("drawerRing");
            const headerAvatar = document.getElementById("headerProfileAvatar");
            const drawerAvatarInner = document.querySelector(".profile-avatar-inner");
            const performanceValues = document.querySelectorAll(".profile-drawer .performance-value");

            if (drawerName) drawerName.textContent = profile.name;
            if (drawerSubtitle) drawerSubtitle.textContent = profile.subtitle;
            if (homeProfileRing) {
                homeProfileRing.style.setProperty("--profile-progress", `${profile.completion}%`);
                homeProfileRing.style.setProperty("--profile-ring-color", color);
            }
            if (homeProfileBadge) {
                homeProfileBadge.textContent = `${profile.completion}%`;
                homeProfileBadge.style.color = color;
            }
            if (drawerPercentage) {
                drawerPercentage.textContent = `${profile.completion}%`;
                drawerPercentage.style.color = color;
            }
            if (drawerRing) {
                drawerRing.style.background = `conic-gradient(from 180deg, ${color} 0 ${profile.completion}%, #e4e8f2 ${profile.completion}% 100%)`;
            }
            if (performanceValues[0]) performanceValues[0].textContent = profile.searchAppearances;
            if (performanceValues[1]) performanceValues[1].textContent = profile.recruiterActions;

            if (profile.imageUrl) {
                if (headerAvatar) {
                    headerAvatar.style.backgroundImage = `url("${profile.imageUrl}")`;
                    headerAvatar.classList.add("has-photo");
                }
                if (drawerAvatarInner) {
                    drawerAvatarInner.style.backgroundImage = `url("${profile.imageUrl}")`;
                    drawerAvatarInner.style.backgroundPosition = "center";
                    drawerAvatarInner.style.backgroundSize = "cover";
                    drawerAvatarInner.querySelectorAll("span").forEach(part => {
                        part.style.display = "none";
                    });
                }
            }
        }

        function hasOpenDrawer() {
            return Boolean(document.querySelector(".profile-overlay.open, .notifications-overlay.open"));
        }

        function openDrawer(id) {
            const drawer = document.getElementById(id);
            if (!drawer) return;

            if (id === "profileDrawerOverlay") {
                closeDrawer("notificationsOverlay");
                syncProfileDrawer();
            } else if (id === "notificationsOverlay") {
                closeDrawer("profileDrawerOverlay");
            }

            drawer.hidden = false;
            document.body.classList.add("modal-open");
            requestAnimationFrame(() => drawer.classList.add("open"));
        }

        function closeDrawer(id) {
            const drawer = document.getElementById(id);
            if (!drawer || drawer.hidden) return;

            drawer.classList.remove("open");
            setTimeout(() => {
                drawer.hidden = true;
                if (!hasOpenDrawer()) {
                    document.body.classList.remove("modal-open");
                }
            }, 250);
        }

        function closeAllDrawers() {
            closeDrawer("profileDrawerOverlay");
            closeDrawer("notificationsOverlay");
        }

        async function handleLogout() {
            try {
                await fetch(`${API_BASE_URL}/users/logout`, {
                    method: "POST",
                    credentials: "include"
                });
            } catch (error) {
                console.warn("Logout request failed. Clearing local session only.", error);
            } finally {
                localStorage.removeItem("userData");
                window.location.href = "authentication/login/login.html";
            }
        }

        function bindDrawerEvents() {
            document.querySelector(".icon-button")?.addEventListener("click", () => openDrawer("notificationsOverlay"));
            document.querySelector(".profile-menu")?.addEventListener("click", () => openDrawer("profileDrawerOverlay"));
            document.querySelector(".drawer-close")?.addEventListener("click", () => closeDrawer("profileDrawerOverlay"));
            document.querySelector(".notifications-close")?.addEventListener("click", () => closeDrawer("notificationsOverlay"));
            document.querySelector(".notifications-cta")?.addEventListener("click", () => {
                closeDrawer("notificationsOverlay");
                document.getElementById("job-feed-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            document.querySelector(".profile-link")?.addEventListener("click", (event) => {
                event.preventDefault();
                window.location.href = "candidate/profile/profile.html";
            });
            document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);

            document.querySelectorAll(".profile-overlay, .notifications-overlay").forEach(overlay => {
                overlay.addEventListener("click", event => {
                    if (event.target === overlay) {
                        closeDrawer(overlay.id);
                    }
                });
            });

            document.addEventListener("keydown", event => {
                if (event.key === "Escape") {
                    closeAllDrawers();
                }
            });
        }

        function initializeHomePage() {
            renderJobFeed();
            syncProfileDrawer();
            bindDrawerEvents();
        }

        // Initialize Feed and Drawers
        document.addEventListener("DOMContentLoaded", initializeHomePage);
