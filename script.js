document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const images = carousel.querySelectorAll('img');

    // Função para garantir que o carrossel comece na primeira imagem
    const ensureFirstImageVisible = () => {
        // Ajusta a rolagem para o início do carrossel
        carousel.scrollLeft = 0;
    };

    const loadImage = (img) => {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
        }
    };

    // Carregar a primeira imagem imediatamente
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

    // Assegurar que a primeira imagem esteja visível após todas as imagens serem carregadas
    window.addEventListener('load', ensureFirstImageVisible);

    // Assegurar que a primeira imagem esteja visível após uma mudança de tamanho da janela (útil para dispositivos móveis)
    window.addEventListener('resize', ensureFirstImageVisible);

    // Assegurar que a primeira imagem esteja visível após um breve atraso (útil para renderizações lentas)
    setTimeout(ensureFirstImageVisible, 100);

    // Usar MutationObserver para garantir que o carrossel seja redefinido após qualquer mudança no DOM
    const mutationObserver = new MutationObserver(() => {
        ensureFirstImageVisible();
    });

    mutationObserver.observe(carousel, { childList: true, subtree: true });

    // Forçar a primeira imagem a ser visível repetidamente em intervalos para dispositivos móveis lentos
    let forceScrollInterval = setInterval(ensureFirstImageVisible, 1000);
    setTimeout(() => clearInterval(forceScrollInterval), 5000);  // Parar após 5 segundos
});
