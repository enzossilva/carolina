// Coloque todo o seu código dentro de uma função para ser executada após o carregamento do DOM
function setupCarousel() {
    const container = document.querySelector('.carousel-container');
    const slides = document.querySelectorAll('.carousel-slide');
    const slideWidth = slides[0].clientWidth;
    let isScrolling = false;
    let scrollTimeout;

    // Ajustar o tamanho do container baseado nos slides
    container.style.width = `${slides.length * slideWidth}px`;

    // Adicionar evento de rolagem com a roda do mouse
    container.addEventListener('wheel', function (event) {
        event.preventDefault();
        if (!isScrolling) {
            isScrolling = true;
            container.scrollLeft += event.deltaX;

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function () {
                isScrolling = false;
            }, 30); // Ajuste o tempo conforme necessário para evitar rolagem excessiva
        }
    });

    // Variáveis para controle de arraste
    let startX, scrollLeft;

    // Evento de toque inicial
    container.addEventListener('touchstart', function (e) {
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    // Evento de movimento de toque
    container.addEventListener('touchmove', function (e) {
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5; // Ajuste a velocidade de rolagem conforme necessário
        container.scrollLeft = scrollLeft - walk;
    });

    // Evento de fim de toque
    container.addEventListener('touchend', function () {
        // Nenhuma ação necessária aqui, apenas remover o estado de rolagem é suficiente
    });
}

// Esperar o DOM estar completamente carregado para executar o código
document.addEventListener('DOMContentLoaded', function () {
    setupCarousel(); // Chamar a função para configurar o carrossel
});
