// Configuration
const CONFIG = {
    API_BASE_URL: 'https://agrictech-3rfg.onrender.com/api',
    MAIN_APP_URL: 'https://agrictech01.netlify.app/',
    STORAGE_KEY: 'agrictech_auth_token'
};

// DOM Elements
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loadingOverlay = document.getElementById('loadingOverlay');

// Modal Functions
function showLoginModal() {
    loginModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    loginModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showRegisterModal() {
    registerModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeRegisterModal() {
    registerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function switchToRegister() {
    closeLoginModal();
    showRegisterModal();
}

function switchToLogin() {
    closeRegisterModal();
    showLoginModal();
}

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('mobile-active');
}

// Authentication Functions
async function makeApiRequest(endpoint, method = 'GET', data = null) {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, config);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }
        
        return result;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showError(message, formElement) {
    // Remove any existing error messages
    const existingError = formElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem; padding: 0.5rem; background: #fee2e2; border-radius: 0.25rem; border: 1px solid #fecaca;';
    errorDiv.textContent = message;
    
    formElement.appendChild(errorDiv);
    
    // Auto-remove error after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function redirectToMainApp(token = null) {
    showLoading();
    
    // Store authentication token if provided
    if (token) {
        localStorage.setItem(CONFIG.STORAGE_KEY, token);
        // Also store other common auth keys that your main app might use
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('isAuthenticated', 'true');
    }
    
    // Add a small delay for better UX
    setTimeout(() => {
        // Clear the current page and redirect
        window.location.replace(CONFIG.MAIN_APP_URL);
    }, 1500);
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const email = formData.get('email').trim();
    const password = formData.get('password');
    
    // Validate inputs
    if (!email || !password) {
        showError('Please fill in all fields', form);
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Please enter a valid email address', form);
        return;
    }
    
    if (!validatePassword(password)) {
        showError('Password must be at least 6 characters long', form);
        return;
    }
    
    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    try {
        const result = await makeApiRequest('/auth/login', 'POST', {
            email,
            password
        });
        
        console.log('Login successful:', result);
        
        // Success - redirect to main app
        closeLoginModal();
        redirectToMainApp(result.token || result.accessToken || result.authToken);
        
    } catch (error) {
        let errorMessage = 'Login failed. Please check your credentials and try again.';
        
        if (error.message.includes('Invalid credentials')) {
            errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('User not found')) {
            errorMessage = 'No account found with this email address.';
        } else if (error.message.includes('Network Error')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        showError(errorMessage, form);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle Registration
async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const fullName = formData.get('fullName').trim();
    const email = formData.get('email').trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validate inputs
    if (!fullName || !email || !password || !confirmPassword) {
        showError('Please fill in all fields', form);
        return;
    }
    
    if (fullName.length < 2) {
        showError('Full name must be at least 2 characters long', form);
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Please enter a valid email address', form);
        return;
    }
    
    if (!validatePassword(password)) {
        showError('Password must be at least 6 characters long', form);
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match', form);
        return;
    }
    
    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    try {
        const result = await makeApiRequest('/auth/register', 'POST', {
            name: fullName,
            email,
            password
        });
        
        console.log('Registration successful:', result);
        
        // Success - redirect to main app
        closeRegisterModal();
        redirectToMainApp(result.token || result.accessToken || result.authToken);
        
    } catch (error) {
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.message.includes('User already exists')) {
            errorMessage = 'An account with this email already exists. Please try logging in instead.';
        } else if (error.message.includes('Invalid email')) {
            errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password')) {
            errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Network Error')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        showError(errorMessage, form);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Check if user is already authenticated (disabled for landing page)
function checkExistingAuth() {
    // Commented out automatic redirect - let users choose when to login
    // const token = localStorage.getItem(CONFIG.STORAGE_KEY);
    // if (token) {
    //     // User might already be authenticated, redirect to main app
    //     redirectToMainApp();
    // }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing authentication (disabled for landing page)
    // checkExistingAuth();
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            closeLoginModal();
        }
        if (event.target === registerModal) {
            closeRegisterModal();
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeLoginModal();
            closeRegisterModal();
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Update current date in hero section
    const currentDate = new Date().toLocaleDateString('en-GB');
    const dateElement = document.querySelector('.stat-item span');
    if (dateElement && dateElement.textContent.includes('/')) {
        dateElement.textContent = currentDate;
    }
});

// Demo mode - For testing without backend
const DEMO_MODE = false; // Set to true for demo/testing

if (DEMO_MODE) {
    // Override authentication functions for demo
    window.handleLogin = async function(event) {
        event.preventDefault();
        showLoading();
        setTimeout(() => {
            window.location.href = CONFIG.MAIN_APP_URL;
        }, 2000);
    };
    
    window.handleRegister = async function(event) {
        event.preventDefault();
        showLoading();
        setTimeout(() => {
            window.location.href = CONFIG.MAIN_APP_URL;
        }, 2000);
    };
}