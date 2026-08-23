(function () {
    const page = document.body.dataset.page || "";

    function item(href, id, label, extraClass) {
        const current = page === id ? ' aria-current="page"' : "";
        const cls = extraClass ? ` class="${extraClass}"` : ` class="${id}"`;
        return `<li${cls}><a href="${href}"${current}>${label}</a></li>`;
    }

    const header = document.createElement("header");
    header.innerHTML = `
        <nav class="navbar">
            <ul>
                ${item("index.html", "home", "CAROLINA", "carolina")}
                ${item("work.html", "work", "WORK")}
                ${item("filmes.html", "films", "FILMS")}
                ${item("contact.html", "contact", "CONTACT")}
            </ul>
        </nav>
    `;
    document.body.prepend(header);
})();
