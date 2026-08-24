"""Generate static pages from essay HTML + editorial lists."""

from __future__ import annotations

import json
import re
from collections import OrderedDict
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "site.json"
SITE_URL = "https://carolinacristine.com.br"
SITE_DESCRIPTION = (
    "Carolina Cristine — fotógrafa e diretora em São Paulo. "
    "Cultura urbana, lifestyle e projetos autorais."
)

TITLES = {
    "alumbramento.html": "Alumbramento",
    "asco.html": "Asco",
    "atelie.html": "Ateliê",
    "b2b.html": "B2B",
    "boma.html": "Boma",
    "camping_song.html": "2050 — Camping Song",
    "captive_havana.html": "Captive Havana",
    "contra.html": "Contra",
    "devora.html": "Devora",
    "fogueirinhas.html": "Fogueirinhas",
    "frufru.html": "Frufru",
    "gemeos.html": "Gêmeos",
    "hand_to_hand.html": "Hand to Hand x Esteves Club",
    "havana.html": "Havana",
    "havana_captive.html": "Captive x Havana Festa",
    "havana_still.html": "Havana — Still",
    "internus.html": "Internüs",
    "mar_salgado.html": "Mar Salgado",
    "me_ensina_viver.html": "Ensinando a Viver",
    "namaria.html": "Namaria",
    "nem.html": "Nem",
    "never_ending_shift.html": "Never Ending Shi(f)t",
    "nina_marinho.html": "Nina Marinho",
    "pequeno_bo.html": "Pequeno Bo",
    "pra_todo_sempre.html": "Pra Todo Sempre",
    "rarekidd.html": "Rarekidd",
    "rizoma.html": "Rizoma",
    "ruback_danca.html": "Ruback Dança",
    "ruback_escritorio.html": "Ruback Escritório",
    "ruback_mar.html": "Ruback Mar",
    "ruback_vermelho.html": "Ruback Vermelho",
    "samuca_e_a_selva.html": "Samuca e a Selva",
    "serena.html": "Serena — Ivyson",
    "suramu.html": "Suramu",
    "sutura.html": "Sutura",
    "talvez_sonho.html": "Talvez Sonho",
    "tenta_me.html": "Tenta-me",
    "the_green_room.html": "The Green Room",
    "versa.html": "Versa",
    "vulgofk_&_kayblack.html": "Intensidade — Vulgo FK, Wey, 2050 e Kayblack",
    "zziper.html": "Zziper",
}

FEATURED = [
    "rizoma.html",
    "alumbramento.html",
    "contra.html",
    "mar_salgado.html",
    "gemeos.html",
    "pra_todo_sempre.html",
    "talvez_sonho.html",
    "zziper.html",
    "fogueirinhas.html",
    "tenta_me.html",
]

WORK = [
    "ruback_escritorio.html",
    "never_ending_shift.html",
    "internus.html",
    "asco.html",
    "b2b.html",
    "devora.html",
    "the_green_room.html",
    "havana_still.html",
    "havana_captive.html",
    "captive_havana.html",
    "ruback_mar.html",
    "nina_marinho.html",
    "versa.html",
    "frufru.html",
    "camping_song.html",
    "suramu.html",
    "namaria.html",
    "samuca_e_a_selva.html",
    "pequeno_bo.html",
    "nem.html",
    "ruback_danca.html",
    "ruback_vermelho.html",
    "sutura.html",
    "hand_to_hand.html",
    "boma.html",
    "vulgofk_&_kayblack.html",
    "serena.html",
    "havana.html",
    "rarekidd.html",
    "atelie.html",
    "me_ensina_viver.html",
]

COVERS = {
    "ruback_escritorio.html": "images/RUBACK1/ruback1-5.JPG",
    "never_ending_shift.html": "images/NEVERENDINGSHIFT/26556.JPG",
    "internus.html": "images/INTERNUS/internus.JPG",
    "asco.html": "images/ASCO/ASCO29.JPG",
    "b2b.html": "images/B2B/26.JPG",
    "devora.html": "images/DEVORA/52.JPG",
    "the_green_room.html": "images/THEGREEMROOM/571.JPG",
    "havana_still.html": "images/HAVANASTILL/00129374002716.JPG",
    "havana_captive.html": "images/HAVANAECAPTIVE/9857.JPG",
    "captive_havana.html": "images/CAPTIVEEHAVANA/8839.JPG",
    "ruback_mar.html": "images/RUBACK3/ruback1-14.JPG",
    "nina_marinho.html": "images/NINAMARINHO/36.JPG",
    "versa.html": "images/VERSA/VERSA16.JPG",
    "frufru.html": "images/FRUFRU/84.JPG",
    "camping_song.html": "images/CAMPINGSONG/75.JPG",
    "suramu.html": "images/SURAMU/68.JPG",
    "namaria.html": "images/NAMARIA/4816.JPG",
    "samuca_e_a_selva.html": "images/SAMUCAEASELVA/99.JPG",
    "pequeno_bo.html": "images/PEQUENOBO/0F24.JPG",
    "nem.html": "images/NEM/28398.JPG",
    "ruback_danca.html": "images/RUBACK4/ruback1-3.JPG",
    "ruback_vermelho.html": "images/RUBACK2/ruback1.JPG",
    "sutura.html": "images/SUTURA/sutura.JPG",
    "hand_to_hand.html": "images/HANDTOHAND/48.JPG",
    "boma.html": "images/BOMA/boma.JPG",
    "vulgofk_&_kayblack.html": "images/VULGOFKKAYBLACK/kayblack.JPG",
    "serena.html": "images/SERENA/SERENA23.JPG",
    "havana.html": "images/HAVANA/havana.JPG",
    "rarekidd.html": "images/RAREKIDD/126.JPG",
    "atelie.html": "images/ATELIE/7979.JPG",
    "rizoma.html": "images/RIZOMA/8548.JPG",
    "alumbramento.html": "images/ALUMBRAMENTO/39.JPG",
    "contra.html": "images/CONTRA/151.jpg.JPG",
    "mar_salgado.html": "images/MARSALGADO/9071.JPG",
    "gemeos.html": "images/GEMEOS/1139.JPG",
    "pra_todo_sempre.html": "images/PRATODOSEMPRE/4.JPG",
    "talvez_sonho.html": "images/TALVEZSONHO/5832.JPG",
    "zziper.html": "images/ZZIPER/9803.JPG",
    "fogueirinhas.html": "images/FOGUEIRINHAS/6251.JPG",
    "tenta_me.html": "images/TENTAMEDENOVO/73.JPG",
    "me_ensina_viver.html": "images/ENSINANDOAVIVER/3050.JPG",
}

FILMS = [
    {"title": "Rizoma", "src": "videos/rizoma.mp4"},
    {"title": "Mar Salgado", "src": "videos/mar_salgado.mp4"},
    {"title": "Zziper", "src": "videos/zipper.mp4"},
]

SKIP_PAGES = {"index.html", "work.html", "filmes.html", "contact.html", "404.html"}


def unique(items: list[str]) -> list[str]:
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


def extract_images(html: str) -> list[str]:
    found = re.findall(r"src=[\"']([^\"']+)[\"']", html)
    found += re.findall(r"src=([^\s>\"']+)", html)
    images = []
    for src in found:
        src = src.strip()
        if src.startswith("images/") and not src.endswith(".png"):
            images.append(src)
    return unique(images)


def collect_essays() -> OrderedDict[str, dict]:
    essays = OrderedDict()
    for path in sorted(ROOT.glob("*.html")):
        if path.name in SKIP_PAGES:
            continue
        images = extract_images(path.read_text(encoding="utf-8"))
        title = TITLES.get(path.name, path.stem.replace("_", " ").title())
        cover = COVERS.get(path.name, images[0] if images else "")
        essays[path.name] = {
            "file": path.name,
            "title": title,
            "cover": cover,
            "images": images,
        }
    return essays


def head(title: str, description: str, image: str = "", page: str = "") -> str:
    if not page or page == "index.html":
        canonical = f"{SITE_URL}/"
    else:
        canonical = f"{SITE_URL}/{page}"
    og_image = f"{SITE_URL}/{image}" if image else f"{SITE_URL}/images/RIZOMA/8548.JPG"
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{escape(description, quote=True)}">
    <meta property="og:title" content="{escape(title, quote=True)}">
    <meta property="og:description" content="{escape(description, quote=True)}">
    <meta property="og:image" content="{escape(og_image, quote=True)}">
    <meta property="og:url" content="{escape(canonical, quote=True)}">
    <meta property="og:type" content="website">
    <link rel="canonical" href="{escape(canonical, quote=True)}">
    <link rel="icon" href="favicon.svg" type="image/svg+xml">
    <title>{escape(title)}</title>
    <link rel="stylesheet" href="style.css">
"""


def write(path: Path, html: str) -> None:
    path.write_text(html.replace("\r\n", "\n"), encoding="utf-8")


def render_essay(essay: dict) -> str:
    slides = []
    for src in essay["images"]:
        slides.append(
            f'            <div class="carousel-slide">\n'
            f'                <img src="{escape(src, quote=True)}" alt="{escape(essay["title"], quote=True)}">\n'
            f"            </div>"
        )
    return f"""{head(f'{essay["title"]} — Carolina Cristine', f'{essay["title"]} — ensaio de Carolina Cristine.', essay["cover"], essay["file"])}    <link rel="stylesheet" href="carousel.css">
</head>
<body data-page="work">
    <script src="nav.js"></script>
    <div class="carousel">
        <div class="carousel-container">
{chr(10).join(slides)}
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
"""


def render_index(essays: OrderedDict[str, dict], featured: list[str]) -> str:
    slides = []
    for filename in featured:
        essay = essays[filename]
        slides.append(
            f'            <div class="carousel-slide">\n'
            f'                <a href="{escape(essay["file"], quote=True)}">\n'
            f'                    <div class="image-container">\n'
            f'                        <img src="{escape(essay["cover"], quote=True)}" alt="{escape(essay["title"], quote=True)}">\n'
            f'                        <div class="overlay">{escape(essay["title"])}</div>\n'
            f"                    </div>\n"
            f"                </a>\n"
            f"            </div>"
        )
    return f"""{head("Carolina Cristine", SITE_DESCRIPTION, essays["rizoma.html"]["cover"], "index.html")}    <link rel="stylesheet" href="carousel.css">
</head>
<body data-page="home">
    <script src="nav.js"></script>
    <div class="carousel">
        <div class="carousel-container">
{chr(10).join(slides)}
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
"""


def render_work(essays: OrderedDict[str, dict], work: list[str]) -> str:
    cards = []
    for filename in work:
        essay = essays[filename]
        cards.append(
            f'        <a href="{escape(essay["file"], quote=True)}">\n'
            f'            <div class="image-container">\n'
            f'                <img loading="lazy" src="{escape(essay["cover"], quote=True)}" alt="{escape(essay["title"], quote=True)}">\n'
            f'                <div class="overlay">{escape(essay["title"])}</div>\n'
            f"            </div>\n"
            f"        </a>"
        )
    return f"""{head("Work — Carolina Cristine", "Ensaios e trabalhos de Carolina Cristine.", essays[work[0]]["cover"], "work.html")}</head>
<body data-page="work">
    <script src="nav.js"></script>
    <div class="gallery">
{chr(10).join(cards)}
    </div>
</body>
</html>
"""


def render_films(films: list[dict]) -> str:
    items = []
    for film in films:
        items.append(
            f'            <article class="film">\n'
            f"                <h2>{escape(film['title'])}</h2>\n"
            f'                <video src="{escape(film["src"], quote=True)}" controls playsinline preload="metadata"></video>\n'
            f"            </article>"
        )
    return f"""{head("Films — Carolina Cristine", "Filmes de Carolina Cristine.", "", "filmes.html")}</head>
<body data-page="films">
    <script src="nav.js"></script>
    <main class="films-page">
        <div class="films-grid">
{chr(10).join(items)}
        </div>
    </main>
</body>
</html>
"""


def render_contact() -> str:
    return f"""{head("Contact — Carolina Cristine", "Contato de Carolina Cristine, fotógrafa e diretora em São Paulo.", "", "contact.html")}</head>
<body data-page="contact">
    <script src="nav.js"></script>
    <main class="contact-page">
        <div class="contact-info">
            <p>Carolina Cristine é fotógrafa, diretora e idealizadora de projetos criativos, residente em São Paulo.</p>
            <p>Seu trabalho explora a criatividade e a essência das experiências de vida, transmitindo autenticidade e emoção em suas criações. Carolina foca em temas de cultura urbana e lifestyle, e os atos de experiências vividos sozinha e em coletivo ao longo desses processos são unidos por um tecido de “sinais intuitivos”, permanência que só está na reiteração incessante da mesma questão: fotografia é observação e é essa arte que coloca no mundo.</p>
            <p>Ela já colaborou com marcas como Havana Club, Cosmos, Ruback, Syntese SNTS, Versa, 2050, BOMA, Cartel 011, Fort, Entourage, Trap Hits, Rap Falando e Soho House.</p>
            <ul class="contact-links">
                <li><a href="mailto:carolinacristine.ferreira@gmail.com">carolinacristine.ferreira@gmail.com</a></li>
                <li><a href="https://www.instagram.com/cacristine___" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="https://wa.me/5511944649361" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            </ul>
            <div class="contact-social">
                <a href="https://wa.me/5511944649361" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                    <img src="images/whatsapp.png" alt="">
                </a>
                <a href="https://www.instagram.com/cacristine___" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <img src="images/instagram.png" alt="">
                </a>
                <a href="mailto:carolinacristine.ferreira@gmail.com" aria-label="E-mail">
                    <img src="images/gmail.png" alt="">
                </a>
            </div>
        </div>
        <footer>
            <p>&copy; 2026 Carolina Cristine. Todos os direitos reservados.</p>
        </footer>
    </main>
</body>
</html>
"""


def render_404() -> str:
    return f"""{head("Página não encontrada — Carolina Cristine", SITE_DESCRIPTION, "", "404.html")}</head>
<body data-page="home">
    <script src="nav.js"></script>
    <main class="contact-page">
        <div class="contact-info">
            <p>Página não encontrada.</p>
            <ul class="contact-links">
                <li><a href="index.html">Voltar ao início</a></li>
                <li><a href="work.html">Ver trabalhos</a></li>
            </ul>
        </div>
    </main>
</body>
</html>
"""


def render_sitemap(essays: OrderedDict[str, dict]) -> str:
    pages = ["index.html", "work.html", "filmes.html", "contact.html", *essays.keys()]
    urls = []
    for page in pages:
        loc = f"{SITE_URL}/" if page == "index.html" else f"{SITE_URL}/{page}"
        urls.append(f"  <url><loc>{escape(loc)}</loc></url>")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )


def load_from_json() -> tuple[OrderedDict[str, dict], list[str], list[str], list[dict]]:
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    essays = OrderedDict((item["file"], item) for item in payload["essays"])
    return essays, payload["featured"], payload["work"], payload["films"]


def main() -> None:
    if DATA.exists():
        essays, featured, work, films = load_from_json()
    else:
        essays = collect_essays()
        featured, work, films = FEATURED, WORK, FILMS
        DATA.parent.mkdir(exist_ok=True)
        payload = {
            "site": {
                "name": "Carolina Cristine",
                "url": SITE_URL,
                "description": SITE_DESCRIPTION,
            },
            "featured": featured,
            "work": work,
            "films": films,
            "essays": list(essays.values()),
        }
        DATA.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    missing = [name for name in featured + work if name not in essays]
    if missing:
        raise SystemExit(f"missing essays: {missing}")

    empty = [name for name, essay in essays.items() if not essay["images"]]
    if empty:
        raise SystemExit(f"essays without images: {empty}")

    for essay in essays.values():
        write(ROOT / essay["file"], render_essay(essay))

    write(ROOT / "index.html", render_index(essays, featured))
    write(ROOT / "work.html", render_work(essays, work))
    write(ROOT / "filmes.html", render_films(films))
    write(ROOT / "contact.html", render_contact())
    write(ROOT / "404.html", render_404())
    write(ROOT / "sitemap.xml", render_sitemap(essays))
    write(ROOT / "robots.txt", f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n")
    print(f"built {len(essays)} essays")


if __name__ == "__main__":
    main()
