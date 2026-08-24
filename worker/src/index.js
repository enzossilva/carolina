const SITE_PATH = "data/site.json";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const list = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.includes(origin)) {
    return origin;
  }
  return list[0] || "*";
}

function corsHeaders(request, env) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(request, env),
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request, env),
    },
  });
}

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const left = enc.encode(a);
  const right = enc.encode(b);
  if (left.length !== right.length) {
    return false;
  }
  let out = 0;
  for (let i = 0; i < left.length; i += 1) {
    out |= left[i] ^ right[i];
  }
  return out === 0;
}

async function makeToken(env) {
  const exp = String(Date.now() + TOKEN_TTL_MS);
  const sig = await hmacHex(env.ADMIN_PASSWORD, exp);
  return `${exp}.${sig}`;
}

async function validToken(env, token) {
  if (!token || !env.ADMIN_PASSWORD) {
    return false;
  }
  const [exp, sig] = token.split(".");
  if (!exp || !sig) {
    return false;
  }
  if (Number(exp) < Date.now()) {
    return false;
  }
  const expected = await hmacHex(env.ADMIN_PASSWORD, exp);
  return timingSafeEqual(sig, expected);
}

function bearer(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function requireAuth(request, env) {
  if (!await validToken(env, bearer(request))) {
    return json(request, env, { error: "Não autorizado." }, 401);
  }
  return null;
}

async function github(env, method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "carolina-admin",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GitHub ${res.status}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function readSite(env) {
  const data = await github(
    env,
    "GET",
    `/repos/${env.GITHUB_REPO}/contents/${SITE_PATH}?ref=${env.GITHUB_BRANCH}`
  );
  return JSON.parse(base64ToUtf8(data.content));
}

async function commitFiles(env, files, message) {
  const branch = env.GITHUB_BRANCH;
  const repo = env.GITHUB_REPO;
  const ref = await github(env, "GET", `/repos/${repo}/git/ref/heads/${branch}`);
  const commit = await github(env, "GET", `/repos/${repo}/git/commits/${ref.object.sha}`);
  const treeItems = [];

  for (const file of files) {
    const blob = await github(env, "POST", `/repos/${repo}/git/blobs`, {
      content: file.contentBase64,
      encoding: "base64",
    });
    treeItems.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const tree = await github(env, "POST", `/repos/${repo}/git/trees`, {
    base_tree: commit.tree.sha,
    tree: treeItems,
  });
  const next = await github(env, "POST", `/repos/${repo}/git/commits`, {
    message,
    tree: tree.sha,
    parents: [commit.sha],
  });
  await github(env, "PATCH", `/repos/${repo}/git/refs/heads/${branch}`, {
    sha: next.sha,
  });
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = atob(String(b64 || "").replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (!env.ADMIN_PASSWORD || !env.GITHUB_TOKEN) {
      return json(request, env, { error: "Worker sem secrets. Configure ADMIN_PASSWORD e GITHUB_TOKEN." }, 500);
    }

    try {
      if (request.method === "POST" && url.pathname === "/login") {
        const body = await request.json().catch(() => ({}));
        if (!timingSafeEqual(String(body.password || ""), env.ADMIN_PASSWORD)) {
          return json(request, env, { error: "Senha incorreta." }, 401);
        }
        const token = await makeToken(env);
        return json(request, env, { token });
      }

      if (request.method === "GET" && url.pathname === "/site") {
        const denied = await requireAuth(request, env);
        if (denied) {
          return denied;
        }
        const site = await readSite(env);
        return json(request, env, { site });
      }

      if (request.method === "POST" && url.pathname === "/publish") {
        const denied = await requireAuth(request, env);
        if (denied) {
          return denied;
        }
        const body = await request.json();
        if (!body.site || !Array.isArray(body.site.essays)) {
          return json(request, env, { error: "JSON do site inválido." }, 400);
        }
        const files = Array.isArray(body.files) ? body.files : [];
        if (files.length > 35) {
          return json(request, env, { error: "Envie no máximo 35 fotos por publicação." }, 400);
        }
        for (const file of files) {
          if (!file.path || !file.contentBase64) {
            return json(request, env, { error: "Arquivo inválido." }, 400);
          }
          if (!String(file.path).startsWith("images/")) {
            return json(request, env, { error: "Só é permitido gravar em images/." }, 400);
          }
        }
        const payload = JSON.stringify(body.site, null, 2) + "\n";
        await commitFiles(
          env,
          [
            ...files.map((file) => ({
              path: file.path,
              contentBase64: file.contentBase64,
            })),
            { path: SITE_PATH, contentBase64: utf8ToBase64(payload) },
          ],
          body.message || "Publish essay from admin."
        );
        return json(request, env, { ok: true });
      }

      return json(request, env, { error: "Não encontrado." }, 404);
    } catch (error) {
      return json(request, env, { error: String(error.message || error) }, 500);
    }
  },
};
