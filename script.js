document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const images = carousel.querySelectorAll('img');

    // Função para carregar imagens quando elas estão prestes a entrar na visualização
    const loadImages = () => {
        images.forEach(img => {
            if (img.getBoundingClientRect().left < window.innerWidth) {
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                }
            }
        });
    };

    // Função de debouncing para a rolagem do carrossel
    const debounce = (func, wait = 10, immediate = true) => {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    carousel.addEventListener('scroll', debounce(() => {
        const scrollLeft = carousel.scrollLeft;
        console.log(`Scroll position - X: ${scrollLeft}`);
        loadImages();
    }));

    carousel.addEventListener('wheel', (event) => {
        // Detecta se o evento de rolagem é de um mouse ou trackpad
        const isTrackpad = Math.abs(event.deltaY) < 50;

        if (!isTrackpad) {
            event.preventDefault(); // Impede a rolagem vertical padrão para mouses
            carousel.scrollLeft += event.deltaY * 7; // Rola horizontalmente para mouses, multiplicando para maior sensibilidade
        }
    });

    // Carregar imagens iniciais
    loadImages();
});
