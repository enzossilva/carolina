document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const images = carousel.querySelectorAll('img');

    carousel.scrollLeft = 0;

    const loadImage = (img) => {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
        }
    };

    loadImage(images[0]);

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadImage(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: carousel,
        threshold: 0.1
    });

    images.forEach(img => {
        observer.observe(img);
    });

    carousel.addEventListener('wheel', (event) => {
        const isTrackpad = Math.abs(event.deltaY) < 50;

        if (!isTrackpad) {
            event.preventDefault();
            carousel.scrollLeft += event.deltaY * 7;
        }
    });
});
