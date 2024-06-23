document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');

    carousel.addEventListener('scroll', () => {
        const scrollLeft = carousel.scrollLeft;
        
        console.log(`Scroll position - X: ${scrollLeft}`);
    });

    carousel.addEventListener('wheel', (event) => {
        // Detecta se o evento de rolagem é de um mouse ou trackpad
        const isTrackpad = Math.abs(event.deltaY) < 50;
        
        if (!isTrackpad) {
            event.preventDefault(); // Impede a rolagem vertical padrão para mouses
            carousel.scrollLeft += event.deltaY * 7; // Rola horizontalmente para mouses, multiplicando para maior sensibilidade
        }
    });
});
