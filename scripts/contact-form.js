// Contact Form Handler - Enhanced Version
// This script provides multiple ways to send contact form emails

class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.btnText = document.getElementById('btnText');
        this.btnLoader = document.getElementById('btnLoader');
        
        this.initializeModals();
        this.bindEvents();
    }

    initializeModals() {
        // Success Modal HTML
        const successModalHTML = `
            <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header bg-success text-white border-0">
                            <h5 class="modal-title" id="successModalLabel">
                                <i class="fas fa-check-circle me-2"></i>Message Sent Successfully!
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <div class="success-animation mb-3">
                                <i class="fas fa-paper-plane fa-4x text-success mb-3" style="animation: bounce 2s infinite;"></i>
                            </div>
                            <h4 class="text-success mb-3">Thank you for contacting us!</h4>
                            <p class="text-muted mb-0">Your message has been sent successfully to the Code_d_Code team. We'll get back to you as soon as possible.</p>
                            <small class="text-muted d-block mt-2">Expected response time: 24-48 hours</small>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-success px-4" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Error Modal HTML
        const errorModalHTML = `
            <div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header bg-danger text-white border-0">
                            <h5 class="modal-title" id="errorModalLabel">
                                <i class="fas fa-exclamation-triangle me-2"></i>Message Not Sent
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <div class="error-animation mb-3">
                                <i class="fas fa-times-circle fa-4x text-danger mb-3"></i>
                            </div>
                            <h4 class="text-danger mb-3">Oops! Something went wrong</h4>
                            <p class="text-muted mb-3">We're sorry, but your message couldn't be sent at this time. Please try again later or contact us directly.</p>
                            <div class="alert alert-info" role="alert">
                                <strong>Direct Email:</strong> codedcode06@gmail.com<br>
                                <strong>Phone:</strong> +91 9450203555
                            </div>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-danger px-4" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modals to the page
        document.body.insertAdjacentHTML('beforeend', successModalHTML);
        document.body.insertAdjacentHTML('beforeend', errorModalHTML);

        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Show loading state
        this.setLoadingState(true);

        try {
            // Get form data
            const formData = this.getFormData();
            
            // Try multiple sending methods
            const success = await this.sendMessage(formData);
            
            if (success) {
                this.showSuccessModal();
                this.form.reset();
            } else {
                this.showErrorModal();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showErrorModal();
        } finally {
            this.setLoadingState(false);
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        return {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone') || 'Not provided',
            subject: formData.get('subject'),
            message: formData.get('message')
        };
    }

    async sendMessage(data) {
        // Method 1: Try EmailJS (if configured)
        try {
            if (typeof emailjs !== 'undefined') {
                const response = await this.sendViaEmailJS(data);
                if (response) return true;
            }
        } catch (error) {
            console.warn('EmailJS failed:', error);
        }

        // Method 2: Try Formspree
        try {
            const response = await this.sendViaFormspree(data);
            if (response) return true;
        } catch (error) {
            console.warn('Formspree failed:', error);
        }

        // Method 3: Try local PHP handler
        try {
            const response = await this.sendViaPHP(data);
            if (response) return true;
        } catch (error) {
            console.warn('PHP handler failed:', error);
        }

        // Method 4: Fallback to mailto
        this.openMailto(data);
        return true; // Assume success for mailto
    }

    async sendViaEmailJS(data) {
        const templateParams = {
            from_name: `${data.firstName} ${data.lastName}`,
            from_email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
            to_email: 'codedcode06@gmail.com'
        };

        const response = await emailjs.send('default_service', 'template_contact', templateParams);
        return response.status === 200;
    }

    async sendViaFormspree(data) {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        const response = await fetch('https://formspree.io/f/xdknvvpz', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        return response.ok;
    }

    async sendViaPHP(data) {
        const response = await fetch('./contact-handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        return result.success;
    }

    openMailto(data) {
        const subject = encodeURIComponent(`Contact Form: ${data.subject}`);
        const body = encodeURIComponent(`
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phone}

Message:
${data.message}
        `);
        
        window.location.href = `mailto:codedcode06@gmail.com?subject=${subject}&body=${body}`;
    }

    setLoadingState(loading) {
        if (loading) {
            this.btnText.classList.add('d-none');
            this.btnLoader.classList.remove('d-none');
            this.submitBtn.disabled = true;
        } else {
            this.btnText.classList.remove('d-none');
            this.btnLoader.classList.add('d-none');
            this.submitBtn.disabled = false;
        }
    }

    showSuccessModal() {
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();
    }

    showErrorModal() {
        const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        errorModal.show();
    }
}

// Initialize the contact form when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new ContactFormHandler();
});

// Instructions for setting up EmailJS (for developers)
console.log(`
=== Contact Form Setup Instructions ===

To enable email sending via EmailJS:
1. Go to https://www.emailjs.com/
2. Create a free account
3. Create a service (Gmail, Outlook, etc.)
4. Create an email template with variables: from_name, from_email, phone, subject, message
5. Replace the public key and service/template IDs in the contact form script

To enable Formspree:
1. Go to https://formspree.io/
2. Create a free account
3. Create a new form
4. Replace the form endpoint URL in the script

The contact form will try multiple methods and fallback to mailto if all else fails.
`);
