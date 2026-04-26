document.addEventListener('DOMContentLoaded', () => {
    // --- Splash Screen Logic ---
    const splash = document.getElementById('splash-screen');
    const appContainer = document.getElementById('app-container');

    // Simulate loading/initialization for 2.5 seconds
    setTimeout(() => {
        splash.classList.add('hidden');
        appContainer.classList.add('visible');
    }, 2500);

    // --- Calculator Logic ---
    const amountSlider = document.getElementById('loan-amount-slider');
    const amountInput = document.getElementById('loan-amount');
    const amountDisplay = document.getElementById('amount-display');
    
    const tenureSlider = document.getElementById('loan-tenure-slider');
    const tenureInput = document.getElementById('loan-tenure');
    const tenureDisplay = document.getElementById('tenure-display');
    
    const repaymentDisplay = document.getElementById('monthly-repayment');
    
    // Constant interest rate for estimation (15% p.a.)
    const ANNUAL_INTEREST_RATE = 0.15;

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function calculateRepayment() {
        const principal = parseFloat(amountInput.value);
        const months = parseInt(tenureInput.value);
        
        amountDisplay.textContent = formatNumber(principal);
        tenureDisplay.textContent = months;

        // Basic EMI calculation: P x R x (1+R)^N / [(1+R)^N-1]
        const monthlyInterestRate = ANNUAL_INTEREST_RATE / 12;
        const emi = principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, months) / (Math.pow(1 + monthlyInterestRate, months) - 1);
        
        repaymentDisplay.textContent = `$${formatNumber(emi.toFixed(2))}`;
    }

    // Sync sliders and inputs
    amountSlider.addEventListener('input', (e) => {
        amountInput.value = e.target.value;
        calculateRepayment();
    });

    tenureSlider.addEventListener('input', (e) => {
        tenureInput.value = e.target.value;
        calculateRepayment();
    });

    // Initial calculation
    calculateRepayment();

    // --- Navigation Logic ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');

    function navigateTo(targetId) {
        pages.forEach(page => {
            if (page.id === targetId) {
                page.classList.add('active-page');
            } else {
                page.classList.remove('active-page');
            }
        });
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            if (targetId) {
                // Clear inputs if going back to calculator from success
                if (targetId === 'calculator-section' && btn.textContent.trim() === 'Done') {
                     document.querySelectorAll('input[type="tel"], .box-input').forEach(input => input.value = '');
                }
                navigateTo(targetId);
            }
        });
    });

    // --- OTP and PIN Input Auto-Advance Logic ---
    function setupBoxInputs(selector) {
        const inputs = document.querySelectorAll(selector);
        inputs.forEach((input, index) => {
            // Auto advance on typing
            input.addEventListener('input', (e) => {
                // Ensure only numbers are entered
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                
                if (e.target.value.length === 1) {
                    if (index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                }
            });

            // Auto go back on backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value === '') {
                    if (index > 0) {
                        inputs[index - 1].focus();
                    }
                }
            });
            
            // Highlight text on focus for easy replacement
            input.addEventListener('focus', (e) => {
                e.target.select();
            });
        });
    }

    setupBoxInputs('.otp-input');
    setupBoxInputs('.pin-input');
});