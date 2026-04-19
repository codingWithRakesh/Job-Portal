 // --- DUMMY DATA ---
        
        // 1. Current User
        const currentUser = {
            _id: 'u1',
            name: 'Alice Smith',
            email: 'alice.smith@example.com',
            phoneNumber: '+1 415 555 0198',
            profilePicture: { url: 'https://i.pravatar.cc/150?img=5' },
            profileCompletePercentage: 78,
            searchAppearances: 42,
            recruiterActions: 9,
            qualifications: [
                {
                    degree: 'B.S. Computer Science',
                    department: 'Software Engineering',
                    institution: 'Stanford University',
                    year: 2024
                }
            ]
        };

        // 2. Companies (Mocking the ref: "Company")
        const companies = {
            'comp_A': { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' },
            'comp_B': { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg' },
            'comp_C': { name: 'Stripe', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg' }
        };

        // 3. Jobs
        const dummyJobs = [
            { 
                _id: 'job_1', 
                title: 'Senior Frontend Engineer', 
                company: 'comp_A',
                description: 'We are looking for an experienced Frontend Engineer to build modern, scalable web applications using React and TypeScript. You will work closely with product and design teams.',
                location: ['Mountain View, CA', 'Remote'], 
                salaryRange: '30,000 - 40,000',
                jobType: 'Full-time', 
                workMode: 'Hybrid',
                experiences: { years: 4 },
                qualifications: [{ degree: 'B.S. in Computer Science or related' }],
                requiredSkills: ['React.js', 'TypeScript', 'Redux', 'CSS Architecture'],
                applicationDeadline: new Date('2026-05-15T00:00:00')
            },
            { 
                _id: 'job_2', 
                title: 'Full Stack Developer', 
                company: 'comp_B',
                description: 'Join our Azure cloud tools team. You will be developing backend APIs in Node.js and frontend dashboards. A strong understanding of scalable cloud architecture is required.',
                location: ['Seattle, WA'], 
                salaryRange: '50,000 - 75,000',
                jobType: 'Full-time', 
                workMode: 'On-site', 
                experiences: { years: 3 },
                qualifications: [{ degree: 'B.Tech / M.Tech' }],
                requiredSkills: ['Node.js', 'React', 'Azure', 'MongoDB', 'System Design'],
                applicationDeadline: new Date('2026-06-01T00:00:00')
            },
            { 
                _id: 'job_3', 
                title: 'Web Developer Intern', 
                company: 'comp_C',
                description: 'Looking for an enthusiastic intern to help maintain our internal billing dashboards. Great learning opportunity in a fast-paced fintech environment.',
                location: ['San Francisco, CA', 'Remote'], 
                salaryRange: '12,000/month',
                jobType: 'Internship', 
                workMode: 'Remote', 
                experiences: { years: 0 },
                qualifications: [{ degree: 'Currently enrolled in University' }],
                requiredSkills: ['HTML', 'CSS', 'JavaScript Basics'],
                applicationDeadline: new Date('2026-04-30T00:00:00')
            }
        ];

        // 4. Current User's Applied Jobs
        const myAppliedJobs = [
            { _id: 'app_1', job: 'job_1', applicant: 'u1', status: 'Pending', createdAt: new Date('2026-03-20T10:00:00') },
            { _id: 'app_2', job: 'job_2', applicant: 'u1', status: 'Shortlisted', createdAt: new Date('2026-03-10T14:30:00') },
            { _id: 'app_3', job: 'job_3', applicant: 'u1', status: 'Rejected', createdAt: new Date('2026-02-15T09:15:00') }
        ];

        // --- ICONS (SVG Strings) ---
        const icons = {
            location: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
            salary: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-currency-rupee" viewBox="0 0 16 16">
  <path d="M4 3.06h2.726c1.22 0 2.12.575 2.325 1.724H4v1.051h5.051C8.855 7.001 8 7.558 6.788 7.558H4v1.317L8.437 14h2.11L6.095 8.884h.855c2.316-.018 3.465-1.476 3.688-3.049H12V4.784h-1.345c-.08-.778-.357-1.335-.793-1.732H12V2H4z"/>
</svg>`,
            briefcase: '<svg class="icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
            clock: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
            calendar: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
            info: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            check: '<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            x: '<svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
            pending: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 15 15"></polyline></svg>'
        };


        // --- CORE LOGIC ---

        function initDashboard() {
            renderApplicantProfile();
            updateStatistics();
            renderApplicationList();
            bindDrawerEvents();
        }

        function renderApplicantProfile() {
            const headerAvatar = document.getElementById('headerProfileAvatar');
            const drawerName = document.getElementById('drawerProfileName');
            const drawerSubtitle = document.getElementById('drawerProfileSubtitle');
            const drawerPercentage = document.getElementById('drawerPercentage');
            const drawerRing = document.getElementById('drawerRing');
            const drawerAvatarInner = document.querySelector('.profile-avatar-inner');
            const performanceValues = document.querySelectorAll('.performance-value');
            const topQualification = currentUser.qualifications?.[0];
            const completion = currentUser.profileCompletePercentage || 0;
            const completionColor = getCompletionColor(completion);

            if (headerAvatar && currentUser.profilePicture?.url) {
                headerAvatar.style.backgroundImage = `url("${currentUser.profilePicture.url}")`;
                headerAvatar.classList.add('has-photo');
            }

            if (drawerAvatarInner && currentUser.profilePicture?.url) {
                drawerAvatarInner.style.backgroundImage = `url("${currentUser.profilePicture.url}")`;
                drawerAvatarInner.style.backgroundPosition = 'center';
                drawerAvatarInner.style.backgroundSize = 'cover';
                drawerAvatarInner.querySelectorAll('span').forEach(part => {
                    part.style.display = 'none';
                });
            }

            if (drawerName) drawerName.textContent = currentUser.name;

            if (drawerSubtitle) {
                drawerSubtitle.textContent = topQualification
                    ? `${topQualification.degree} - ${topQualification.department} at ${topQualification.institution}`
                    : currentUser.email;
            }

            if (drawerPercentage) {
                drawerPercentage.textContent = `${completion}%`;
                drawerPercentage.style.color = completionColor;
            }

            if (drawerRing) {
                drawerRing.style.background = `conic-gradient(from 220deg, ${completionColor} 0 ${completion}%, #e4e8f2 ${completion}% 100%)`;
            }

            if (performanceValues.length >= 2) {
                performanceValues[0].textContent = currentUser.searchAppearances || 0;
                performanceValues[1].textContent = currentUser.recruiterActions || 0;
            }
        }

        function getCompletionColor(percentage) {
            if (percentage > 75) return '#2abf68';
            if (percentage > 50) return '#eab308';
            if (percentage > 25) return '#f97316';
            return '#ef4444';
        }

        function updateStatistics() {
            const totalApplied = myAppliedJobs.length;
            const shortlisted = myAppliedJobs.filter(app => app.status === 'Shortlisted').length;
            const rejected = myAppliedJobs.filter(app => app.status === 'Rejected').length;

            document.getElementById('stat-applied').innerText = totalApplied;
            document.getElementById('stat-selected').innerText = shortlisted;
            document.getElementById('stat-rejected').innerText = rejected;
        }

        function toggleAccordion(appId) {
            const card = document.getElementById(`app-card-${appId}`);
            card.classList.toggle('expanded');
        }

        function formatDate(date) {
            return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }

        function renderApplicationList() {
            const container = document.getElementById('application-list-container');
            container.innerHTML = '';

            // Sort by applied date descending
            const sortedApps = [...myAppliedJobs].sort((a, b) => b.createdAt - a.createdAt);

            sortedApps.forEach(application => {
                const job = dummyJobs.find(j => j._id === application.job);
                if(!job) return; // safety check
                
                const company = companies[job.company];
                
                // Status Icon matching
                let statusIcon = icons.pending;
                if(application.status === 'Shortlisted') statusIcon = icons.check;
                if(application.status === 'Rejected') statusIcon = icons.x;

                const appCard = document.createElement('div');
                appCard.className = 'app-card';
                appCard.id = `app-card-${application._id}`;

                // --- 1. Summary Header (Always visible) ---
                const appSummary = document.createElement('div');
                appSummary.className = 'app-summary';
                appSummary.onclick = () => toggleAccordion(application._id);

                appSummary.innerHTML = `
                    <div class="app-header-top">
                        <div class="company-info">
                            <img src="${company.logo}" alt="${company.name} logo" class="company-logo">
                            <div class="job-title-group">
                                <h3>${job.title}</h3>
                                <div class="company-name">${company.name}</div>
                            </div>
                        </div>
                        <div class="status-badge status-${application.status}">
                            ${statusIcon} ${application.status}
                        </div>
                    </div>

                    <div class="quick-info">
                        <div class="info-item" title="Location & Work Mode">
                            ${icons.location}
                            <span>${job.location[0]} (${job.workMode})</span>
                        </div>
                        <div class="info-item" title="Salary">
                            ${icons.salary}
                            <span>${job.salaryRange || 'Not specified'}</span>
                        </div>
                        <div class="info-item" title="Applied On">
                            ${icons.calendar}
                            <span>Applied: ${formatDate(application.createdAt)}</span>
                        </div>
                        
                        <div class="expand-hint">
                            View Details
                            <svg class="icon expand-icon" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>
                `;

                // --- 2. Full Job Details (Expanded View) ---
                const appDetails = document.createElement('div');
                appDetails.className = 'app-details';

                const skillsHtml = job.requiredSkills.map(s => `<span class="skill-tag">${s}</span>`).join('');
                
                appDetails.innerHTML = `
                    <div class="details-section">
                        <h4>${icons.info} Job Description</h4>
                        <p>${job.description}</p>
                    </div>

                    <div class="details-section">
                        <h4>Required Skills</h4>
                        <div class="skills-container">
                            ${skillsHtml}
                        </div>
                    </div>

                    <div class="meta-grid">
                        <div class="meta-box">
                            <span class="meta-box-label">Experience Req.</span>
                            <span class="meta-box-value">${job.experiences.years}+ Years</span>
                        </div>
                        <div class="meta-box">
                            <span class="meta-box-label">Job Type</span>
                            <span class="meta-box-value">${job.jobType}</span>
                        </div>
                        <div class="meta-box">
                            <span class="meta-box-label">Min Qualification</span>
                            <span class="meta-box-value">${job.qualifications[0]?.degree || 'Not specified'}</span>
                        </div>
                        <div class="meta-box">
                            <span class="meta-box-label">App Deadline</span>
                            <span class="meta-box-value">${formatDate(job.applicationDeadline)}</span>
                        </div>
                    </div>
                `;

                appCard.appendChild(appSummary);
                appCard.appendChild(appDetails);
                container.appendChild(appCard);
            });
        }

        function bindDrawerEvents() {
            const profileButton = document.querySelector('.profile-menu');
            const notificationButton = document.querySelector('.icon-button');
            const profileOverlay = document.getElementById('profileDrawerOverlay');
            const notificationsOverlay = document.getElementById('notificationsOverlay');
            const profileClose = document.querySelector('.drawer-close');
            const notificationsClose = document.querySelector('.notifications-close');
            const notificationsCta = document.querySelector('.notifications-cta');
            const profileLink = document.querySelector('.profile-link');
            const logoutButton = document.getElementById('logoutBtn');

            profileButton?.addEventListener('click', () => openDrawer(profileOverlay));
            notificationButton?.addEventListener('click', () => openDrawer(notificationsOverlay));
            profileClose?.addEventListener('click', () => closeDrawer(profileOverlay));
            notificationsClose?.addEventListener('click', () => closeDrawer(notificationsOverlay));
            notificationsCta?.addEventListener('click', () => closeDrawer(notificationsOverlay));

            profileOverlay?.addEventListener('click', event => {
                if (event.target === profileOverlay) closeDrawer(profileOverlay);
            });

            notificationsOverlay?.addEventListener('click', event => {
                if (event.target === notificationsOverlay) closeDrawer(notificationsOverlay);
            });

            document.addEventListener('keydown', event => {
                if (event.key !== 'Escape') return;
                closeDrawer(profileOverlay);
                closeDrawer(notificationsOverlay);
            });

            profileLink?.addEventListener('click', event => {
                event.preventDefault();
                window.location.href = '../profile/profile.html';
            });

            logoutButton?.addEventListener('click', () => {
                localStorage.removeItem('userData');
                window.location.href = '../authentication/login/login.html';
            });
        }

        function openDrawer(drawer) {
            if (!drawer) return;
            document.body.classList.add('modal-open');
            drawer.hidden = false;
            requestAnimationFrame(() => drawer.classList.add('open'));
        }

        function closeDrawer(drawer) {
            if (!drawer || drawer.hidden) return;
            drawer.classList.remove('open');
            setTimeout(() => {
                drawer.hidden = true;

                const hasOpenDrawer = document.querySelector('.profile-overlay.open, .notifications-overlay.open');
                if (!hasOpenDrawer) document.body.classList.remove('modal-open');
            }, 250);
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', initDashboard);
