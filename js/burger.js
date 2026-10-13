document.addEventListener('DOMContentLoaded', function() {
    // --- FAQ ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            if (!isActive) item.classList.add('active');
        });
    });

    // --- Main Accordion ---
    const mainAccordionItems = document.querySelectorAll('.main-accordion-item');

    mainAccordionItems.forEach(item => {
        const header = item.querySelector('.main-accordion-header');
        if (!header) return;

        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            mainAccordionItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            if (!isActive) item.classList.add('active');
        });
    });

    // --- Форма заказчика (может отсутствовать) ---
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
            this.reset();
        });
    }

    // --- Форма перевозчика (может отсутствовать) ---
    const carrierForm = document.getElementById('carrier-form');
    if (carrierForm) {
        carrierForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Заявка на партнёрство отправлена! Мы свяжемся с вами в ближайшее время.');
            this.reset();
        });
    }
});