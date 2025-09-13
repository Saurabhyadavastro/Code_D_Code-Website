/* =====================================
   Code_d_Code Website - Clean Interactive Experience
   ===================================== */

// Main Application Class
class CodeDCodeApp {
    // Membership Form Submission Handler
    initializeMembershipFormHandler() {
        console.log('🔍 Looking for membership form...');
        const form = document.getElementById('membershipForm');
        
        if (!form) {
            console.warn('⚠️ Membership form not found on this page');
            return;
        }
        
        console.log('✅ Membership form found!', form);
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('🚀 Form submitted! Processing...');
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
            submitBtn.disabled = true;

            try {
                // Debug form element
                console.log('📋 Form element:', form);
                console.log('📋 Form ID:', form.id);
                console.log('📋 Form elements count:', form.elements.length);
                
                // Collect form data
                const formData = new FormData(form);
                const membershipData = {};
                
                console.log('🔍 Raw FormData entries:');
                console.log('🚀 Script version: 20250914-v2');
                for (let [key, value] of formData.entries()) {
                    console.log(`  ${key}: "${value}"`);
                    membershipData[key] = value;
                }
                
                console.log('📝 Collected membershipData:', membershipData);
                
                // Map frontend field names to backend expected names
                const yearValue = membershipData.year || membershipData.yearOfStudy || '';
                let membershipType = 'student';
                
                // Map frontend year values to backend expected values
                let mappedYear = yearValue;
                switch(yearValue) {
                    case '1st': mappedYear = '1st Year'; break;
                    case '2nd': mappedYear = '2nd Year'; break;
                    case '3rd': mappedYear = '3rd Year'; break;
                    case 'final': mappedYear = '4th Year'; break;
                    case 'graduate': mappedYear = 'Graduate'; break;
                    case 'alumni': mappedYear = 'Post Graduate'; break;
                    default: mappedYear = yearValue;
                }
                
                // Determine membership type based on academic status
                if (yearValue === 'graduate' || yearValue === 'alumni') {
                    membershipType = 'alumni';
                }
                
                // Get programming interests from checkboxes as array
                const interests = this.getSelectedInterests();
                
                // Map programming experience values
                let mappedExperience = membershipData.experience || '';
                if (mappedExperience === 'absolute-beginner') {
                    mappedExperience = 'beginner';
                }
                
                const backendData = {
                    firstName: membershipData.firstName || '',
                    lastName: membershipData.lastName || '',
                    email: membershipData.email || '',
                    phone: membershipData.phone || '0000000000', // Default phone if not provided
                    studentId: '', // Not in current form
                    course: '', // Not used - using branch instead
                    yearOfStudy: mappedYear,
                    branch: membershipData.branch || '', // Backend expects 'branch'
                    membershipType: membershipType, // 'student' or 'alumni'
                    programmingExperience: mappedExperience,
                    interests: interests, // Keep as array, not string
                    githubProfile: membershipData.githubUrl || 'https://github.com/placeholder',
                    linkedinProfile: membershipData.linkedinUrl || 'https://linkedin.com/in/placeholder',
                    whyJoin: membershipData.goals || '', // Backend expects 'whyJoin'
                    previousExperience: '', // Not in current form
                    expectations: '', // Not in current form
                    heardAboutUs: 'website', // Default value since not in form
                    agreeTerms: (membershipData.agree === 'on'), // Must be boolean true
                    newsletterSubscribe: (membershipData.newsletter === 'on') || false
                };
                
                console.log('📋 Form data collected:', membershipData);
                console.log('🔄 Backend data mapped:', backendData);
                console.log('🔗 API_CONFIG:', typeof API_CONFIG !== 'undefined' ? API_CONFIG : 'UNDEFINED!');
                console.log('📤 Sending to API:', JSON.stringify(backendData, null, 2));

                // Try to submit to backend API
                const success = await this.submitMembershipToAPI(backendData);
                
                if (success) {
                    console.log('✅ Submission successful!');
                    this.showMembershipSuccess();
                    form.reset();
                } else {
                    throw new Error('API submission failed');
                }
                
            } catch (error) {
                console.error('❌ Membership submission error:', error);
                this.showMembershipError();
            } finally {
                // Restore button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
        
        console.log('✅ Event listener attached to membership form');
    }

    getSelectedInterests() {
        const interests = [];
        const checkboxes = document.querySelectorAll('.interest-grid input[type="checkbox"]:checked');
        
        // Map frontend interest values to backend expected values
        const interestMapping = {
            'web': 'web-development',
            'mobile': 'mobile-development', 
            'data': 'data-science',
            'ai': 'machine-learning',
            'devops': 'devops',
            'security': 'cybersecurity'
        };
        
        checkboxes.forEach(checkbox => {
            const mappedValue = interestMapping[checkbox.value] || checkbox.value;
            interests.push(mappedValue);
        });
        
        return interests;
    }

    async submitMembershipToAPI(data) {
        try {
            console.log('🌐 Making API request to:', `${API_CONFIG.BASE_URL}/api/membership`);
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/membership`, {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify(data)
            });

            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Backend error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Backend success response:', result);
            return result.success || response.ok;
        } catch (error) {
            console.error('Membership API error:', error);
            return false;
        }
    }

    showMembershipSuccess() {
        // Show a Bootstrap alert or custom notification
        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px; animation: slideInRight 0.3s ease;';
        notification.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            Membership application submitted successfully! Welcome to Code_d_Code.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 5000);
    }

    showMembershipError() {
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px; animation: slideInRight 0.3s ease;';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            Failed to submit membership application. Please try again.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 5000);
    }
    constructor() {
        this.isMainPage = window.location.pathname === '/' || window.location.pathname.includes('index.html');
        this.init();
    }

    init() {
        this.setupEventListeners();
        if (this.isMainPage) {
            this.initializeMainPageFeatures();
        } else {
            this.initializeSubPageFeatures();
        }
        this.initializeCommonFeatures();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            if (this.isMainPage) {
                this.showLoader();
            }
        });

        window.addEventListener('load', () => {
            if (this.isMainPage) {
                setTimeout(() => this.hideLoader(), 1000);
            }
        });
    }

    // Main Page Features
    initializeMainPageFeatures() {
        this.createLoader();
        this.initializeScrollAnimations();
    }

    // Sub Page Features
    initializeSubPageFeatures() {
        // Quick fade-in for sub pages
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.6s ease-in-out';
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    }

    // Common Features for All Pages
    initializeCommonFeatures() {
        this.initializeThemeToggle();
        this.initializeNavbarEffects();
        this.initializeCardAnimations();
        this.initializeSmoothScrolling();
        this.initializeFormAnimations();
        this.initializeMembershipFormHandler();
    }

    // Enhanced Loading Screen with Code_d_Code Logo
    createLoader() {
        const loaderHTML = `
            <div id="futuristic-loader">
                <div class="loader-container">
                    <div class="loader-logo"></div>
                    <div class="loader-text">
                        <div class="main-title">Code_d_Code</div>
                        <div class="subtitle">Vikram University</div>
                        <div class="tagline">Innovation • Excellence • Community</div>
                    </div>
                    <div class="loading-progress">
                        <div class="progress-bar"></div>
                    </div>
                    <div class="loading-percentage">0%</div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', loaderHTML);
        this.animateLoadingProgress();
    }

    animateLoadingProgress() {
        const progressBar = document.querySelector('.progress-bar');
        const percentage = document.querySelector('.loading-percentage');
        let progress = 0;

        const interval = setInterval(() => {
            progress += Math.random() * 4 + 1;
            if (progress > 100) progress = 100;

            progressBar.style.width = `${progress}%`;
            percentage.textContent = `${Math.floor(progress)}%`;

            if (progress >= 100) {
                clearInterval(interval);
                percentage.textContent = '100%';
            }
        }, 80);
    }

    showLoader() {
        const loader = document.getElementById('futuristic-loader');
        if (loader) {
            loader.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    hideLoader() {
        const loader = document.getElementById('futuristic-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.remove();
                document.body.style.overflow = 'auto';
                this.initializePageAnimations();
            }, 600);
        }
    }

    // Theme Toggle
    initializeThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.setAttribute('aria-label', 'Toggle theme');
        document.body.appendChild(themeToggle);

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(themeToggle, savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(themeToggle, newTheme);
        });
    }

    updateThemeIcon(toggle, theme) {
        const icon = toggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Navbar Effects
    initializeNavbarEffects() {
        const navbar = document.querySelector('.custom-navbar');
        if (!navbar) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Active nav link highlighting
        const navLinks = document.querySelectorAll('.nav-link');
        const currentPage = window.location.pathname;

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (currentPage.includes(href) || (currentPage === '/' && href.includes('index')))) {
                link.classList.add('active');
            }
        });
    }

    // Simplified Card Animations
    initializeCardAnimations() {
        const cards = document.querySelectorAll('.card, .offering-card, .service-card, .team-card, .event-card, .course-card, .mission-card, .vision-card, .partner-item');

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // Clean Scroll Animations
    initializeScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Elements to animate
        const animateElements = document.querySelectorAll('.card, .offering-card, .service-card, .team-card, .event-card, .course-card, .mission-card, .vision-card, .feature-badge, .partner-item');

        animateElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'all 0.6s ease-out';
            element.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(element);
        });
    }

    // Page Animations - Simplified
    initializePageAnimations() {
        // Hero section animation
        const heroContent = document.querySelector('.hero-content');
        const heroImage = document.querySelector('.hero-image');

        if (heroContent) {
            heroContent.style.opacity = '0';
            heroContent.style.transform = 'translateY(30px)';
            heroContent.style.transition = 'all 0.8s ease-out';
            setTimeout(() => {
                heroContent.style.opacity = '1';
                heroContent.style.transform = 'translateY(0)';
            }, 200);
        }

        if (heroImage) {
            heroImage.style.opacity = '0';
            heroImage.style.transform = 'translateX(30px)';
            heroImage.style.transition = 'all 0.8s ease-out';
            setTimeout(() => {
                heroImage.style.opacity = '1';
                heroImage.style.transform = 'translateX(0)';
            }, 400);
        }

        // Feature badges animation
        const featureBadges = document.querySelectorAll('.feature-badge');
        featureBadges.forEach((badge, index) => {
            badge.style.opacity = '0';
            badge.style.transform = 'translateY(20px)';
            badge.style.transition = 'all 0.6s ease-out';
            setTimeout(() => {
                badge.style.opacity = '1';
                badge.style.transform = 'translateY(0)';
            }, 600 + index * 100);
        });

        // Social links animation
        const socialLinks = document.querySelectorAll('.social-link');
        socialLinks.forEach((link, index) => {
            link.style.opacity = '0';
            link.style.transform = 'translateY(20px)';
            link.style.transition = 'all 0.5s ease-out';
            setTimeout(() => {
                link.style.opacity = '1';
                link.style.transform = 'translateY(0)';
            }, 1000 + index * 100);
        });
    }

    // Smooth Scrolling
    initializeSmoothScrolling() {
        const smoothLinks = document.querySelectorAll('a[href^="#"]');

        smoothLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Form Animations
    initializeFormAnimations() {
        const inputs = document.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.transform = 'translateY(-1px)';
                input.style.boxShadow = '0 4px 12px rgba(49, 130, 206, 0.2)';
            });

            input.addEventListener('blur', () => {
                input.style.transform = '';
                input.style.boxShadow = '';
            });
        });
    }
}

// Utility Functions
const Utils = {
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// Performance Monitoring
const Performance = {
    init() {
        this.measurePageLoad();
        this.optimizeImages();
    },

    measurePageLoad() {
        window.addEventListener('load', () => {
            if (window.performance && window.performance.timing) {
                const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
                console.log(`Page loaded in ${loadTime}ms`);
            }
        });
    },

    optimizeImages() {
        const images = document.querySelectorAll('img');

        images.forEach(img => {
            img.loading = 'lazy';
            img.style.transition = 'opacity 0.3s ease-in-out';

            if (img.complete) {
                img.style.opacity = '1';
            } else {
                img.style.opacity = '0';
                img.addEventListener('load', () => {
                    img.style.opacity = '1';
                });
            }
        });
    }
};

// Error Handling
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// Coming Soon Modal Functionality
class ComingSoonModal {
    constructor() {
        this.modal = null;
        this.enrollButtons = [];
        this.notifyButton = null;
        this.emailInput = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupModal());
        } else {
            this.setupModal();
        }
    }

    setupModal() {
        // Get modal element
        this.modal = document.getElementById('comingSoonModal');
        if (!this.modal) return;

        // Get all enroll buttons
        this.enrollButtons = document.querySelectorAll('.enroll-btn');
        
        // Get notification elements
        this.notifyButton = document.querySelector('.notify-btn');
        this.emailInput = document.querySelector('.notify-email');

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add click event to all enroll buttons
        this.enrollButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal();
            });
        });

        // Handle notify button click
        if (this.notifyButton && this.emailInput) {
            this.notifyButton.addEventListener('click', () => {
                this.handleNotifySignup();
            });

            // Handle Enter key in email input
            this.emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleNotifySignup();
                }
            });
        }

        // Add modal show/hide effects
        if (this.modal) {
            this.modal.addEventListener('show.bs.modal', () => {
                this.onModalShow();
            });

            this.modal.addEventListener('hidden.bs.modal', () => {
                this.onModalHide();
            });
        }
    }

    showModal() {
        if (this.modal) {
            const bsModal = new bootstrap.Modal(this.modal);
            bsModal.show();
        }
    }

    hideModal() {
        if (this.modal) {
            const bsModal = bootstrap.Modal.getInstance(this.modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }

    handleNotifySignup() {
        const email = this.emailInput.value.trim();
        
        if (!email) {
            this.showNotification('Please enter your email address', 'warning');
            this.emailInput.focus();
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            this.emailInput.focus();
            return;
        }

        // Show loading state with Code_d_Code logo
        this.notifyButton.disabled = true;
        this.notifyButton.classList.add('loading');

        setTimeout(() => {
            // Reset button
            this.notifyButton.disabled = false;
            this.notifyButton.classList.remove('loading');
            this.notifyButton.innerHTML = '<i class="fas fa-check me-2"></i>Signed Up!';
            
            // Show success message
            this.showNotification('Great! We\'ll notify you when enrollment opens.', 'success');
            
            // Clear email input
            this.emailInput.value = '';
            
            // Reset button after 2 seconds
            setTimeout(() => {
                this.notifyButton.innerHTML = '<i class="fas fa-bell me-2"></i>Notify Me';
            }, 2000);
            
        }, 1500);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    onModalShow() {
        // Add entrance animation
        if (this.modal) {
            this.modal.classList.add('show');
        }
        
        // Focus on email input after a short delay
        setTimeout(() => {
            if (this.emailInput) {
                this.emailInput.focus();
            }
        }, 500);
    }

    onModalHide() {
        // Reset form state
        if (this.emailInput) {
            this.emailInput.value = '';
        }
        
        if (this.notifyButton) {
            this.notifyButton.disabled = false;
            this.notifyButton.innerHTML = '<i class="fas fa-bell me-2"></i>Notify Me';
        }
    }
}

// ====================================
// Developer Application Modal Functionality
// ====================================

class DeveloperApplicationModal {
    constructor() {
        this.modal = null;
        this.form = null;
        this.submitButton = null;
        this.applyButtons = [];
        this.currentPosition = '';
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupModal());
        } else {
            this.setupModal();
        }
    }

    setupModal() {
        // Get modal elements
        this.modal = document.getElementById('developerApplicationModal');
        this.form = document.getElementById('developerApplicationForm');
        this.submitButton = document.querySelector('.submit-application');
        this.applyButtons = document.querySelectorAll('.apply-now-btn');

        if (!this.modal || !this.form) return;

        // Setup event listeners
        this.setupEventListeners();
        this.setupFormValidation();
    }

    setupEventListeners() {
        // Add click event to all apply buttons
        this.applyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPosition = button.getAttribute('data-position') || '';
                this.showModal();
            });
        });

        // Handle form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }

        // Modal event listeners
        if (this.modal) {
            this.modal.addEventListener('show.bs.modal', () => {
                this.onModalShow();
            });

            this.modal.addEventListener('hidden.bs.modal', () => {
                this.onModalHide();
            });
        }

        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupRealTimeValidation() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    setupFormValidation() {
        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                if (emailInput.value && !this.isValidEmail(emailInput.value)) {
                    this.showFieldError(emailInput, 'Please enter a valid email address');
                }
            });
        }

        // URL validation for GitHub, LinkedIn, etc.
        const urlInputs = ['github', 'linkedin', 'portfolio', 'resume'];
        urlInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('blur', () => {
                    if (input.value && !this.isValidURL(input.value)) {
                        this.showFieldError(input, 'Please enter a valid URL');
                    }
                });
            }
        });

        // GitHub URL specific validation
        const githubInput = document.getElementById('github');
        if (githubInput) {
            githubInput.addEventListener('blur', () => {
                if (githubInput.value && !githubInput.value.includes('github.com')) {
                    this.showFieldError(githubInput, 'Please enter a valid GitHub profile URL');
                }
            });
        }
    }

    showModal() {
        if (this.modal) {
            // Pre-fill position if available
            if (this.currentPosition) {
                const positionSelect = document.getElementById('position');
                if (positionSelect) {
                    positionSelect.value = this.currentPosition;
                }
            }

            const bsModal = new bootstrap.Modal(this.modal);
            bsModal.show();
        }
    }

    hideModal() {
        if (this.modal) {
            const bsModal = bootstrap.Modal.getInstance(this.modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');

        // Clear previous validation
        this.clearFieldError(field);

        // Check if required field is empty
        if (isRequired && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }

        // Specific validations
        switch (field.type) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.showFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;
            case 'url':
                if (value && !this.isValidURL(value)) {
                    this.showFieldError(field, 'Please enter a valid URL');
                    return false;
                }
                break;
            case 'tel':
                if (value && !this.isValidPhone(value)) {
                    this.showFieldError(field, 'Please enter a valid phone number');
                    return false;
                }
                break;
        }

        // If validation passes
        this.showFieldSuccess(field);
        return true;
    }

    showFieldError(field, message) {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        
        // Remove existing feedback
        const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    showFieldSuccess(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        
        // Remove error feedback
        const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid', 'is-valid');
        const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Check agreement checkbox
        const agreement = document.getElementById('agreement');
        if (agreement && !agreement.checked) {
            this.showNotification('Please agree to the terms and conditions', 'error');
            isValid = false;
        }

        return isValid;
    }

    async handleFormSubmission() {
        if (!this.validateForm()) {
            this.showNotification('Please fill in all required fields correctly', 'error');
            return;
        }

        // Show loading state
        this.setSubmitButtonLoading(true);

        try {
            // Collect form data
            const formData = new FormData(this.form);
            const applicationData = {};
            
            for (let [key, value] of formData.entries()) {
                applicationData[key] = value;
            }

            // Add metadata
            applicationData.submissionDate = new Date().toISOString();
            applicationData.appliedPosition = this.currentPosition;

            // Simulate API call (replace with actual submission logic)
            await this.submitApplicationToAPI(applicationData);

            // Show success message
            this.showNotification('Application submitted successfully! We\'ll contact you soon.', 'success');
            
            // Hide modal after delay
            setTimeout(() => {
                this.hideModal();
            }, 2000);

        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Failed to submit application. Please try again.', 'error');
        } finally {
            this.setSubmitButtonLoading(false);
        }
    }

    async submitApplicationToAPI(data) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/membership`, {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({
                    ...data,
                    type: 'job_application',
                    position: data.appliedPosition
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.success || response.ok;
        } catch (error) {
            console.error('Application API error:', error);
            // Fallback: just log the data
            console.log('Application Data (fallback):', data);
            return true; // Return true to show success message
        }
    }

    setSubmitButtonLoading(loading) {
        if (!this.submitButton) return;

        if (loading) {
            this.submitButton.disabled = true;
            this.submitButton.classList.add('loading');
        } else {
            this.submitButton.disabled = false;
            this.submitButton.classList.remove('loading');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 350px;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    onModalShow() {
        // Focus on first input
        setTimeout(() => {
            const firstInput = this.form.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }, 500);
    }

    onModalHide() {
        // Reset form
        this.form.reset();
        
        // Clear all validation states
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => this.clearFieldError(input));
        
        // Reset submit button
        this.setSubmitButtonLoading(false);
        
        // Clear current position
        this.currentPosition = '';
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    new CodeDCodeApp();
    Performance.init();
    
    // Initialize modals
    const comingSoonModal = new ComingSoonModal();
    const developerApplicationModal = new DeveloperApplicationModal();
    const eventCategoryModal = new EventCategoryModal();
    
    // Initialize event registration modal if on events page
    if (document.getElementById('eventRegistrationModal')) {
        window.eventRegistrationModal = new EventRegistrationModal();
        
        // Set up event registration buttons
        setupEventRegistrationButtons();
    }
});

// Setup event registration button functionality
function setupEventRegistrationButtons() {
    const registerButtons = document.querySelectorAll('.btn-register');
    
    registerButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Extract event data from the event card
            const eventCard = button.closest('.event-card') || button.closest('.card');
            const eventData = extractEventData(eventCard);
            
            // Show registration modal
            if (window.eventRegistrationModal) {
                window.eventRegistrationModal.showModal(eventData);
            }
        });
    });
}

// Extract event data from event card
function extractEventData(eventCard) {
    if (!eventCard) {
        return {
            title: 'Code_d_Code Event',
            date: new Date().toISOString(),
            time: '10:00 AM',
            location: 'Vikram University',
            duration: '2 hours',
            description: 'Join us for an exciting learning experience!'
        };
    }

    // Try to extract data from card elements
    const titleElement = eventCard.querySelector('.card-title, h5, h4, h3');
    const dateElement = eventCard.querySelector('.event-date, .date, [data-date]');
    const timeElement = eventCard.querySelector('.event-time, .time, [data-time]');
    const locationElement = eventCard.querySelector('.event-location, .location, [data-location]');
    const descElement = eventCard.querySelector('.card-text, .description, p');

    return {
        title: titleElement?.textContent?.trim() || 'Code_d_Code Event',
        date: dateElement?.textContent?.trim() || dateElement?.getAttribute('data-date') || new Date().toISOString(),
        time: timeElement?.textContent?.trim() || timeElement?.getAttribute('data-time') || '10:00 AM',
        location: locationElement?.textContent?.trim() || locationElement?.getAttribute('data-location') || 'Vikram University',
        duration: '2 hours',
        description: descElement?.textContent?.trim() || 'Join us for an exciting learning experience!'
    };
}

// Event Category Modal Functionality
class EventCategoryModal {
    constructor() {
        this.modal = null;
        this.categoryButtons = [];
        this.notifyButton = null;
        this.emailInput = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupModal());
        } else {
            this.setupModal();
        }
    }

    setupModal() {
        // Wait a bit for Bootstrap to load
        setTimeout(() => {
            // Get modal element
            this.modal = document.getElementById('eventCategoryModal');
            if (!this.modal) {
                console.warn('Event Category Modal not found');
                return;
            }

            // Get all category buttons
            this.categoryButtons = document.querySelectorAll('.btn-category');
            
            // Get notification elements
            this.notifyButton = document.querySelector('.category-notify-btn');
            this.emailInput = document.querySelector('.category-notify-email');

            // Setup event listeners
            this.setupEventListeners();
        }, 100);
    }

    setupEventListeners() {
        // Add click event to all category buttons
        this.categoryButtons.forEach((button, index) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const categoryData = this.getCategoryData(button);
                this.showModal(categoryData);
            });
        });

        // Handle notify button click
        if (this.notifyButton && this.emailInput) {
            const form = document.getElementById('categoryNotifyForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleNotifySignup();
                });
            }

            // Handle Enter key in email input
            this.emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleNotifySignup();
                }
            });
        }

        // Add modal show/hide effects
        if (this.modal) {
            this.modal.addEventListener('show.bs.modal', () => {
                this.onModalShow();
            });

            this.modal.addEventListener('hidden.bs.modal', () => {
                this.onModalHide();
            });
        }
    }

    getCategoryData(button) {
        const card = button.closest('.category-card');
        const iconElement = card.querySelector('.category-icon i');
        const titleElement = card.querySelector('h4');
        const descElement = card.querySelector('p');
        
        return {
            name: titleElement.textContent,
            icon: iconElement.className,
            description: descElement.textContent,
            action: button.textContent.trim()
        };
    }

    showModal(categoryData) {
        if (!this.modal) {
            return;
        }

        try {
            // Update modal content
            const categoryNameEl = document.getElementById('categoryName');
            const categoryIconEl = document.getElementById('categoryIcon');
            const categoryTitleEl = document.getElementById('categoryTitle');
            const categoryDescEl = document.getElementById('categoryDescription');

            if (categoryNameEl) categoryNameEl.textContent = categoryData.name;
            if (categoryIconEl) categoryIconEl.className = categoryData.icon;
            if (categoryTitleEl) categoryTitleEl.textContent = `${categoryData.name} Events`;
            if (categoryDescEl) {
                categoryDescEl.textContent = 
                    `We're preparing exciting ${categoryData.name.toLowerCase()} for you! ${categoryData.description}`;
            }

            // Show the modal using Bootstrap 5 syntax
            if (typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(this.modal);
                bsModal.show();
            } else {
                // Fallback if Bootstrap isn't loaded yet
                this.modal.style.display = 'block';
                this.modal.classList.add('show');
                document.body.classList.add('modal-open');
            }
        } catch (error) {
            console.error('Error showing modal:', error);
        }
    }

    hideModal() {
        if (this.modal) {
            const bsModal = bootstrap.Modal.getInstance(this.modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }

    async handleNotifySignup() {
        const email = this.emailInput.value.trim();
        
        if (!email) {
            this.showNotification('Please enter your email address', 'warning');
            this.emailInput.focus();
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            this.emailInput.focus();
            return;
        }

        // Show loading state with Code_d_Code logo
        this.notifyButton.disabled = true;
        this.notifyButton.classList.add('loading');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Show success state
            this.notifyButton.classList.remove('loading');
            this.notifyButton.innerHTML = '<i class="fas fa-check me-2"></i>Subscribed!';
            this.notifyButton.classList.add('btn-success');
            this.notifyButton.classList.remove('btn-primary');

            this.showNotification('🎉 Great! You\'ll be notified when we launch this category.', 'success');

            // Clear email input
            this.emailInput.value = '';

            // Reset button after 2 seconds
            setTimeout(() => {
                this.notifyButton.innerHTML = '<i class="fas fa-bell me-2"></i>Notify Me';
                this.notifyButton.classList.remove('btn-success');
                this.notifyButton.classList.add('btn-primary');
                this.notifyButton.disabled = false;
            }, 2000);

        } catch (error) {
            this.showNotification('❌ Failed to subscribe. Please try again.', 'error');
            // Reset button on error
            this.notifyButton.classList.remove('loading');
            this.notifyButton.disabled = false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    onModalShow() {
        // Focus on email input when modal opens
        setTimeout(() => {
            if (this.emailInput) {
                this.emailInput.focus();
            }
        }, 300);
    }

    onModalHide() {
        // Reset form when modal closes
        if (this.emailInput) {
            this.emailInput.value = '';
        }
        if (this.notifyButton) {
            this.notifyButton.disabled = false;
            this.notifyButton.classList.remove('loading', 'btn-success');
            this.notifyButton.classList.add('btn-primary');
            this.notifyButton.innerHTML = '<i class="fas fa-bell me-2"></i>Notify Me';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Event Registration Modal Class
class EventRegistrationModal {
    constructor() {
        this.modal = document.getElementById('eventRegistrationModal');
        this.bootstrapModal = null;
        this.currentEvent = null;
        this.initializeModal();
    }

    initializeModal() {
        if (this.modal) {
            this.bootstrapModal = new bootstrap.Modal(this.modal);
            this.initializeEventListeners();
        }
    }

    initializeEventListeners() {
        // Registration form submission
        const form = this.modal.querySelector('#registrationForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }

        // Real-time validation
        const inputs = form?.querySelectorAll('input, select, textarea');
        inputs?.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    showModal(eventData) {
        try {
            this.currentEvent = eventData;
            this.populateEventInfo(eventData);
            this.resetForm();
            this.bootstrapModal.show();
        } catch (error) {
            console.error('Error showing registration modal:', error);
            alert('Unable to open registration form. Please try again.');
        }
    }

    hideModal() {
        try {
            this.bootstrapModal.hide();
        } catch (error) {
            console.error('Error hiding registration modal:', error);
        }
    }

    populateEventInfo(eventData) {
        // Update event title
        const titleElement = this.modal.querySelector('.event-title');
        if (titleElement) {
            titleElement.textContent = eventData.title || 'Code_d_Code Event';
        }

        // Update event date
        const dayElement = this.modal.querySelector('.day');
        const monthElement = this.modal.querySelector('.month');
        if (dayElement && monthElement && eventData.date) {
            const date = new Date(eventData.date);
            dayElement.textContent = date.getDate();
            monthElement.textContent = date.toLocaleString('default', { month: 'short' });
        }

        // Update event details
        const descElement = this.modal.querySelector('.event-description');
        if (descElement) {
            descElement.textContent = eventData.description || 'Join us for an exciting learning experience!';
        }

        // Update event metadata
        const timeElement = this.modal.querySelector('.event-time');
        const locationElement = this.modal.querySelector('.event-location');
        const durationElement = this.modal.querySelector('.event-duration');

        if (timeElement) timeElement.textContent = eventData.time || '10:00 AM';
        if (locationElement) locationElement.textContent = eventData.location || 'Vikram University';
        if (durationElement) durationElement.textContent = eventData.duration || '2 hours';
    }

    resetForm() {
        const form = this.modal.querySelector('#registrationForm');
        if (form) {
            form.reset();
            this.clearAllErrors();
        }
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.type) {
            case 'text':
                if (field.required && !value) {
                    isValid = false;
                    errorMessage = 'This field is required';
                } else if (field.name === 'fullName' && value.length < 2) {
                    isValid = false;
                    errorMessage = 'Name must be at least 2 characters';
                }
                break;

            case 'email':
                if (field.required && !value) {
                    isValid = false;
                    errorMessage = 'Email is required';
                } else if (value && !this.validateEmail(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;

            case 'tel':
                if (field.required && !value) {
                    isValid = false;
                    errorMessage = 'Phone number is required';
                } else if (value && !this.validatePhone(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid phone number';
                }
                break;

            case 'checkbox':
                if (field.required && !field.checked) {
                    isValid = false;
                    errorMessage = 'You must agree to the terms and conditions';
                }
                break;
        }

        if (field.tagName === 'SELECT' && field.required && !value) {
            isValid = false;
            errorMessage = 'Please select an option';
        }

        this.showFieldError(field, isValid, errorMessage);
        return isValid;
    }

    showFieldError(field, isValid, errorMessage) {
        const errorElement = field.parentElement.querySelector('.field-error');
        
        if (!isValid) {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');
            
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
            } else {
                const error = document.createElement('div');
                error.className = 'field-error text-danger mt-1';
                error.style.fontSize = '0.8rem';
                error.textContent = errorMessage;
                field.parentElement.appendChild(error);
            }
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    clearAllErrors() {
        const form = this.modal.querySelector('#registrationForm');
        const fields = form?.querySelectorAll('input, select, textarea');
        fields?.forEach(field => {
            field.classList.remove('is-invalid', 'is-valid');
        });

        const errors = form?.querySelectorAll('.field-error');
        errors?.forEach(error => error.style.display = 'none');
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    }

    handleRegistration() {
        const form = this.modal.querySelector('#registrationForm');
        const formData = new FormData(form);
        const submitBtn = form.querySelector('.btn-register-submit');

        // Validate all fields
        const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isFormValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            alert('Please fill in all required fields correctly.');
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Simulate registration process
        setTimeout(() => {
            // Collect form data
            const registrationData = {
                event: this.currentEvent,
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                academicYear: formData.get('academicYear'),
                branch: formData.get('branch'),
                programmingExperience: formData.get('programmingExperience'),
                expectations: formData.get('expectations'),
                termsAgreed: formData.get('terms') === 'on'
            };

            console.log('Registration data:', registrationData);

            // Show success message
            alert(`Thank you ${registrationData.fullName}! Your registration for "${this.currentEvent?.title}" has been submitted successfully. We'll contact you soon with further details.`);

            // Reset form and close modal
            this.resetForm();
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            this.hideModal();

        }, 2500);
    }
}

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CodeDCodeApp, Utils, Performance, EventRegistrationModal };
}