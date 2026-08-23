document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.querySelector(".carousel");

    if (!carousel) {
        return;
    }

    carousel.querySelectorAll("img").forEach((img, index) => {
        img.loading = index === 0 ? "eager" : "lazy";
        img.decoding = "async";
        if (index === 0) {
            img.fetchPriority = "high";
        }
    });

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "carousel-arrow carousel-arrow-prev";
    prev.setAttribute("aria-label", "Foto anterior");
    prev.innerHTML = '<svg viewBox="0 0 24 48" aria-hidden="true"><path class="arrow-glow" d="M18 4 6 24l12 20"/><path d="M18 4 6 24l12 20"/></svg>';

    const next = document.createElement("button");
    next.type = "button";
    next.className = "carousel-arrow carousel-arrow-next";
    next.setAttribute("aria-label", "Próxima foto");
    next.innerHTML = '<svg viewBox="0 0 24 48" aria-hidden="true"><path class="arrow-glow" d="M6 4l12 20L6 44"/><path d="M6 4l12 20L6 44"/></svg>';

    document.body.append(prev, next);

    const slideStep = () => {
        const slide = carousel.querySelector(".carousel-slide");
        if (!slide) {
            return 320;
        }
        const styles = getComputedStyle(slide);
        return slide.getBoundingClientRect().width + parseFloat(styles.marginRight || "0");
    };

    const updateArrows = () => {
        const maxScroll = carousel.scrollWidth - carousel.clientWidth - 8;
        prev.disabled = carousel.scrollLeft <= 8;
        next.disabled = carousel.scrollLeft >= maxScroll;
    };

    const scrollBySlide = (direction) => {
        carousel.scrollBy({ left: direction * slideStep(), behavior: "smooth" });
    };

    prev.addEventListener("click", () => scrollBySlide(-1));
    next.addEventListener("click", () => scrollBySlide(1));
    carousel.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            scrollBySlide(-1);
        }
        if (event.key === "ArrowRight") {
            scrollBySlide(1);
        }
    });
    updateArrows();

    carousel.addEventListener("wheel", (event) => {
        const isTrackpad = Math.abs(event.deltaY) < 50;

        if (!isTrackpad) {
            event.preventDefault();
            carousel.scrollLeft += event.deltaY * 7;
        }
    }, { passive: false });

    requestAnimationFrame(() => {
        carousel.scrollLeft = 0;
        updateArrows();
    });
});
