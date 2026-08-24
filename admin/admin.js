(function () {
    const TOKEN_KEY = "carolina-admin-token";
    const MAX_SIDE = 2800;
    const JPEG_QUALITY = 0.9;
    const MAX_NEW_FILES = 35;

    const loginView = document.getElementById("login-view");
    const listView = document.getElementById("list-view");
    const editView = document.getElementById("edit-view");
    const logoutBtn = document.getElementById("logout");
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");
    const essayList = document.getElementById("essay-list");
    const photoGrid = document.getElementById("photo-grid");
    const editStatus = document.getElementById("edit-status");
    const editError = document.getElementById("edit-error");
    const editHeading = document.getElementById("edit-title");
    const titleInput = document.getElementById("essay-name");
    const onHome = document.getElementById("on-home");
    const onWork = document.getElementById("on-work");
    const photoInput = document.getElementById("photo-input");
    const saveBtn = document.getElementById("save-essay");
    const deleteBtn = document.getElementById("delete-essay");

    let site = null;
    let editing = null;
    let photos = [];
    let photoSeq = 0;

    function apiBase() {
        return String(window.ADMIN_API || "").replace(/\/$/, "");
    }

    function token() {
        return sessionStorage.getItem(TOKEN_KEY) || "";
    }

    function setToken(value) {
        if (value) {
            sessionStorage.setItem(TOKEN_KEY, value);
        } else {
            sessionStorage.removeItem(TOKEN_KEY);
        }
    }

    function show(el, on) {
        el.hidden = !on;
    }

    function setText(el, message) {
        if (!message) {
            el.hidden = true;
            el.textContent = "";
            return;
        }
        el.hidden = false;
        el.textContent = message;
    }

    async function api(path, options) {
        if (!apiBase()) {
            throw new Error("Configure a URL do Worker em admin/config.js.");
        }
        const headers = Object.assign(
            { Accept: "application/json" },
            options && options.headers
        );
        if (token()) {
            headers.Authorization = "Bearer " + token();
        }
        const res = await fetch(apiBase() + path, Object.assign({}, options, { headers }));
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
            setToken("");
            showApp();
        }
        if (!res.ok) {
            throw new Error(data.error || "Não deu para falar com o servidor.");
        }
        return data;
    }

    function slugify(title) {
        const slug = title
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "");
        return slug || "ensaio";
    }

    const RESERVED_SLUGS = new Set([
        "work", "filmes", "contact", "admin", "index", "404", "home", "worker",
    ]);

    function uniqueFile(base) {
        const used = new Set((site.essays || []).map((item) => item.file));
        if (editing && editing.file) {
            used.delete(editing.file);
        }
        function blocked(file) {
            const name = file.replace(/\.html$/, "");
            return used.has(file) || RESERVED_SLUGS.has(name);
        }
        let file = base + ".html";
        let n = 2;
        while (blocked(file)) {
            file = base + "_" + n + ".html";
            n += 1;
        }
        return file;
    }

    function folderFor(file, currentPhotos) {
        const existing = (currentPhotos || []).find((photo) => photo.path && photo.path.startsWith("images/"));
        if (existing) {
            return existing.path.split("/").slice(0, -1).join("/");
        }
        if (editing && editing.images && editing.images[0]) {
            return editing.images[0].split("/").slice(0, -1).join("/");
        }
        return "images/" + slugify(String(file || "ensaio").replace(/\.html$/, "")).toUpperCase();
    }

    function showApp() {
        const in_ = Boolean(token());
        show(loginView, !in_);
        show(logoutBtn, in_);
        if (!in_) {
            show(listView, false);
            show(editView, false);
            return;
        }
        if (editing) {
            show(listView, false);
            show(editView, true);
        } else {
            show(listView, true);
            show(editView, false);
        }
    }

    function renderList() {
        essayList.innerHTML = "";
        (site.essays || []).forEach((essay, index) => {
            const row = document.createElement("button");
            row.type = "button";
            row.className = "essay-row";
            const img = document.createElement("img");
            img.src = "/" + String(essay.cover || "").replace(/^\//, "");
            img.alt = "";
            const text = document.createElement("div");
            const title = document.createElement("span");
            title.textContent = essay.title;
            const meta = document.createElement("small");
            const flags = [];
            if ((site.featured || []).includes(essay.file)) {
                flags.push("home");
            }
            if ((site.work || []).includes(essay.file)) {
                flags.push("WORK");
            }
            meta.textContent = flags.length ? flags.join(" · ") : "fora da home e do WORK";
            text.append(title, meta);
            row.append(img, text);
            row.addEventListener("click", () => openEdit(index));
            essayList.appendChild(row);
        });
    }

    function newEssay() {
        return {
            file: "",
            title: "",
            cover: "",
            images: [],
            isNew: true,
        };
    }

    function openEdit(index) {
        editing = index === "new" ? newEssay() : Object.assign({}, site.essays[index]);
        editing.index = index === "new" ? -1 : index;
        photos = (editing.images || []).map((path) => ({
            id: "p" + (photoSeq += 1),
            path: path,
            preview: "/" + String(path).replace(/^\//, ""),
            contentBase64: null,
        }));
        titleInput.value = editing.title || "";
        onHome.checked = Boolean(editing.file) && (site.featured || []).includes(editing.file);
        onWork.checked = Boolean(editing.file) && (site.work || []).includes(editing.file);
        editHeading.textContent = editing.isNew ? "Novo ensaio" : editing.title;
        deleteBtn.hidden = Boolean(editing.isNew);
        setText(editStatus, "");
        setText(editError, "");
        renderPhotos();
        showApp();
    }

    function renderPhotos() {
        photoGrid.innerHTML = "";
        photos.forEach((photo, index) => {
            const card = document.createElement("div");
            card.className = "photo-card" + (photo.path === editing.cover || (!editing.cover && index === 0) ? " is-cover" : "");
            const img = document.createElement("img");
            img.src = photo.preview;
            img.alt = "";
            const tools = document.createElement("div");
            tools.className = "photo-tools";
            function tool(label, fn) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = label;
                btn.addEventListener("click", fn);
                return btn;
            }
            tools.append(
                tool("Capa", () => {
                    editing.cover = photo.path;
                    renderPhotos();
                }),
                tool("↑", () => movePhoto(index, -1)),
                tool("↓", () => movePhoto(index, 1)),
                tool("Apagar", () => removePhoto(index))
            );
            card.append(img, tools);
            photoGrid.appendChild(card);
        });
    }

    function movePhoto(index, delta) {
        const next = index + delta;
        if (next < 0 || next >= photos.length) {
            return;
        }
        const item = photos.splice(index, 1)[0];
        photos.splice(next, 0, item);
        renderPhotos();
    }

    function removePhoto(index) {
        const photo = photos[index];
        if (photo.preview.startsWith("blob:")) {
            URL.revokeObjectURL(photo.preview);
        }
        photos.splice(index, 1);
        if (editing.cover === photo.path) {
            editing.cover = photos[0] ? photos[0].path : "";
        }
        renderPhotos();
    }

    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Não deu para ler uma das fotos."));
            };
            img.src = url;
        });
    }

    function toJpegBlob(img) {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const longest = Math.max(w, h);
        const scale = longest > MAX_SIDE ? MAX_SIDE / longest : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Não deu para compactar a foto."));
                        return;
                    }
                    resolve(blob);
                },
                "image/jpeg",
                JPEG_QUALITY
            );
        });
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function addFiles(fileList) {
        const incoming = Array.from(fileList || []);
        const alreadyNew = photos.filter((photo) => photo.contentBase64).length;
        if (alreadyNew + incoming.length > MAX_NEW_FILES) {
            setText(editError, "Envie no máximo " + MAX_NEW_FILES + " fotos novas por publicação.");
            return;
        }
        setText(editError, "");
        const folder = folderFor(editing.file || uniqueFile(slugify(titleInput.value || "ensaio")), photos);
        for (let i = 0; i < incoming.length; i += 1) {
            const img = await loadImage(incoming[i]);
            const blob = await toJpegBlob(img);
            const contentBase64 = await blobToBase64(blob);
            const path = folder + "/" + Date.now() + "_" + i + ".jpg";
            const preview = URL.createObjectURL(blob);
            photos.push({
                id: "p" + (photoSeq += 1),
                path: path,
                preview: preview,
                contentBase64: contentBase64,
            });
        }
        if (!editing.cover && photos[0]) {
            editing.cover = photos[0].path;
        }
        renderPhotos();
    }

    function setList(list, file, include) {
        const next = (list || []).filter((item) => item !== file);
        if (include) {
            next.push(file);
        }
        return next;
    }

    async function saveEssay() {
        const title = titleInput.value.trim();
        if (!title) {
            setText(editError, "Escreva um título.");
            return;
        }
        if (!photos.length) {
            setText(editError, "Coloque pelo menos uma foto.");
            return;
        }

        const files = photos
            .filter((photo) => photo.contentBase64)
            .map((photo) => ({ path: photo.path, contentBase64: photo.contentBase64 }));
        if (files.length > MAX_NEW_FILES) {
            setText(editError, "Envie no máximo " + MAX_NEW_FILES + " fotos novas por publicação.");
            return;
        }

        if (editing.isNew || !editing.file) {
            editing.file = uniqueFile(slugify(title));
            const folder = folderFor(editing.file, photos);
            photos.forEach((photo) => {
                if (photo.contentBase64) {
                    const name = photo.path.split("/").pop();
                    photo.path = folder + "/" + name;
                }
            });
            files.forEach((file) => {
                const name = file.path.split("/").pop();
                file.path = folder + "/" + name;
            });
        }

        const images = photos.map((photo) => photo.path);
        const cover = images.includes(editing.cover) ? editing.cover : images[0];
        const essay = {
            file: editing.file,
            title: title,
            cover: cover,
            images: images,
        };

        const next = JSON.parse(JSON.stringify(site));
        if (editing.index >= 0) {
            next.essays[editing.index] = essay;
        } else {
            next.essays.push(essay);
        }
        next.featured = setList(next.featured, essay.file, onHome.checked);
        next.work = setList(next.work, essay.file, onWork.checked);

        saveBtn.disabled = true;
        deleteBtn.disabled = true;
        setText(editError, "");
        setText(editStatus, "Publicando… o site atualiza em 1–2 minutos.");
        try {
            await api("/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    site: next,
                    files: files,
                    message: "Publish " + essay.title + " from admin.",
                }),
            });
            site = next;
            editing = null;
            renderList();
            showApp();
        } catch (error) {
            setText(editStatus, "");
            setText(editError, error.message);
        } finally {
            saveBtn.disabled = false;
            deleteBtn.disabled = false;
        }
    }

    async function deleteEssay() {
        if (!editing || editing.isNew) {
            return;
        }
        if (!window.confirm("Excluir “" + editing.title + "” do site?")) {
            return;
        }
        const next = JSON.parse(JSON.stringify(site));
        next.essays = next.essays.filter((item) => item.file !== editing.file);
        next.featured = (next.featured || []).filter((item) => item !== editing.file);
        next.work = (next.work || []).filter((item) => item !== editing.file);
        saveBtn.disabled = true;
        deleteBtn.disabled = true;
        setText(editError, "");
        setText(editStatus, "Publicando…");
        try {
            await api("/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    site: next,
                    files: [],
                    message: "Remove " + editing.title + " from admin.",
                }),
            });
            site = next;
            editing = null;
            renderList();
            showApp();
        } catch (error) {
            setText(editStatus, "");
            setText(editError, error.message);
        } finally {
            saveBtn.disabled = false;
            deleteBtn.disabled = false;
        }
    }

    async function loadSite() {
        const data = await api("/site");
        site = data.site;
        renderList();
        showApp();
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setText(loginError, "");
        try {
            const data = await api("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: document.getElementById("password").value }),
            });
            setToken(data.token);
            await loadSite();
        } catch (error) {
            setText(loginError, error.message);
        }
    });

    logoutBtn.addEventListener("click", () => {
        setToken("");
        site = null;
        editing = null;
        showApp();
    });

    document.getElementById("new-essay").addEventListener("click", () => openEdit("new"));
    document.getElementById("back-list").addEventListener("click", () => {
        editing = null;
        setText(editError, "");
        setText(editStatus, "");
        showApp();
    });
    photoInput.addEventListener("change", async (event) => {
        try {
            await addFiles(event.target.files);
        } catch (error) {
            setText(editError, error.message);
        }
        event.target.value = "";
    });
    saveBtn.addEventListener("click", () => {
        saveEssay().catch((error) => setText(editError, error.message));
    });
    deleteBtn.addEventListener("click", () => {
        deleteEssay().catch((error) => setText(editError, error.message));
    });

    showApp();
    if (token()) {
        loadSite().catch((error) => {
            setToken("");
            showApp();
            setText(loginError, error.message);
        });
    }
})();
