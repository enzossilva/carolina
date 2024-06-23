document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');

    carousel.addEventListener('scroll', () => {
        const scrollLeft = carousel.scrollLeft;
        const scrollTop = carousel.scrollTop;
        
        console.log(`Scroll position - X: ${scrollLeft}, Y: ${scrollTop}`);
    });
});