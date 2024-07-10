document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');

    carousel.addEventListener('wheel', (event) => {
        const isTrackpad = Math.abs(event.deltaY) < 50;

        if (!isTrackpad) {
            event.preventDefault();
            carousel.scrollLeft += event.deltaY * 7;
        }
    });
    // Forçar o scroll para a primeira imagem após um pequeno atraso
    setTimeout(() => {
        carousel.scrollLeft = 0;
    }, 100);
});
