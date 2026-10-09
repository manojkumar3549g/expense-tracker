
const ALLOWED_ORIGINS = [
  "https://expense-tracker-65y.pages.dev",
  "http://127.0.0.1:5500",
  "http://localhost:5500"
];
const encoder = new TextEncoder();


function json(data, status = 200, origin = "") {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };

  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}


function error(message, status = 400) {
  return Object.assign(new Error(message), { status });
}


function cors(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Setup-Secret",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };

  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}


function respond(data, status, origin) {
  const response = json(data, status, origin);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(cors(origin))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    headers
  });
}

function b64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function unb64(value) {
  const text = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(
    atob(text + "=".repeat((4 - text.length % 4) % 4)),
    c => c.charCodeAt(0)
  );
}

async function sign(text, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(text))
  );
}

async function tokenFor(user, secret) {
  const payload = b64(encoder.encode(JSON.stringify({
    sub: user.username,
    exp: Math.floor(Date.now() / 1000) + 86400
  })));
  return `${payload}.${b64(await sign(payload, secret))}`;
}

async function currentUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const parts = token.split(".");

  if (parts.length !== 2 || !env.AUTH_SECRET) {
    throw error("Please log in again.", 401);
  }

  let payload;
  try {
    const expected = await sign(parts[0], env.AUTH_SECRET);
    const actual = unb64(parts[1]);
    let diff = expected.length ^ actual.length;
    for (let i = 0; i < Math.min(expected.length, actual.length); i++) {
      diff |= expected[i] ^ actual[i];
    }
    if (diff !== 0) throw new Error("Invalid token");

    payload = JSON.parse(new TextDecoder().decode(unb64(parts[0])));
  } catch {
    throw error("Invalid session. Please log in again.", 401);
  }

  if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
    throw error("Session expired. Please log in again.", 401);
  }

  const user = await env.DB.prepare(
    "SELECT username,name,role,enabled FROM users WHERE username=?"
  ).bind(payload.sub).first();

  if (!user || !user.enabled) throw error("Account unavailable.", 401);
  return user;
}

function admin(user) {
  if (user.role !== "admin") throw error("Admin access required.", 403);
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    throw error("A valid JSON request body is required.");
  }
}

function paise(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100000000) {
    throw error("Enter a valid non-negative amount.");
  }
  return Math.round(n * 100);
}

function rupees(value) {
  return Number(value || 0) / 100;
}

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const result = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt,
    iterations: 100000,
    hash: "SHA-256"
  }, key, 256);
  return b64(new Uint8Array(result));
}

async function newHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$100000$${b64(salt)}$${await passwordHash(password, salt)}`;
}

async function checkPassword(password, stored) {
  try {
    const [scheme, rounds, salt, expected] = stored.split("$");
    if (scheme !== "pbkdf2" || rounds !== "100000") return false;
    const actual = await passwordHash(password, unb64(salt));
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) {
      diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

async function allExpenses(env) {
  const { results: expenses } = await env.DB.prepare(
    "SELECT * FROM expenses ORDER BY expense_date DESC,id DESC"
  ).all();

  const { results: splits } = await env.DB.prepare(
    "SELECT expense_id,username,amount FROM expense_splits"
  ).all();

  const grouped = {};
  for (const split of splits) {
    (grouped[split.expense_id] ||= []).push(split);
  }

  return expenses.map(e => {
    const parts = grouped[e.id] || [];
    return {
      id: e.id,
      category: e.category,
      name: e.name,
      date: e.expense_date,
      totalAmount: rupees(e.total_amount),
      spentBy: e.spent_by,
      details: e.details || "",
      splitWith: parts.map(p => p.username),
      splits: Object.fromEntries(
        parts.map(p => [p.username, rupees(p.amount)])
      ),
      createdAt: e.created_at,
      updatedAt: e.updated_at
    };
  });
}

async function saveExpense(env, data, id = null) {
  const category = String(data.category || "").trim();
  const name = String(data.name || "").trim();
  const date = String(data.date || data.expense_date || "");
  const spentBy = String(data.spentBy || data.spent_by || "").toLowerCase().trim();
  const details = String(data.details || "").trim();
  const total = paise(data.totalAmount ?? data.total_amount);

  if (!category || !name || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw error("Category, name and valid date are required.");
  }

  const payer = await env.DB.prepare(
    "SELECT username FROM users WHERE username=? AND role='person' AND enabled=1"
  ).bind(spentBy).first();
  if (!payer) throw error("Choose an active person for Spent By.");

  const splits = data.splits && typeof data.splits === "object"
    ? Object.entries(data.splits).map(([u, a]) => [u.toLowerCase(), paise(a)])
        .filter(([, amount]) => amount > 0)
    : [];

  if (!splits.length) throw error("Enter at least one split amount.");
  if (new Set(splits.map(([u]) => u)).size !== splits.length) {
    throw error("Duplicate split users are not allowed.");
  }
  if (splits.reduce((sum, [, amount]) => sum + amount, 0) !== total) {
    throw error("Split amounts must equal the total expense exactly.");
  }

  for (const [username] of splits) {
    const valid = await env.DB.prepare(
      "SELECT username FROM users WHERE username=? AND role='person' AND enabled=1"
    ).bind(username).first();
    if (!valid) throw error(`Invalid or inactive person: ${username}`);
  }

  if (id !== null) {
    const existing = await env.DB.prepare(
      "SELECT id FROM expenses WHERE id=?"
    ).bind(id).first();
    if (!existing) throw error("Expense not found.", 404);

    await env.DB.prepare(
      "UPDATE expenses SET category=?,name=?,expense_date=?,total_amount=?,spent_by=?,details=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(category, name, date, total, spentBy, details, id).run();

    await env.DB.prepare(
      "DELETE FROM expense_splits WHERE expense_id=?"
    ).bind(id).run();
  } else {
    const result = await env.DB.prepare(
      "INSERT INTO expenses (category,name,expense_date,total_amount,spent_by,details) VALUES (?,?,?,?,?,?)"
    ).bind(category, name, date, total, spentBy, details).run();
    id = result.meta.last_row_id;
  }

  const statements = splits.map(([username, amount]) =>
    env.DB.prepare(
      "INSERT INTO expense_splits (expense_id,username,amount) VALUES (?,?,?)"
    ).bind(id, username, amount)
  );
  if (statements.length) await env.DB.batch(statements);

  return (await allExpenses(env)).find(e => e.id === id);
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method;

  if (method === "GET" && path === "/") {
    return json({ name: "Expense Tracker API", status: "ok" });
  }

  if (method === "GET" && path === "/api/health") {
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM users"
    ).first();
    return json({ status: "ok", initialized: row.count > 0 });
  }

  
if (method === "POST" && path === "/api/setup") {
  if (!env.SETUP_SECRET ||
      request.headers.get("X-Setup-Secret") !== env.SETUP_SECRET) {
    throw error("Setup not authorized.", 403);
  }

  const count = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM users"
  ).first();

  if (count.count > 0) {
    throw error("Setup already completed.", 409);
  }

  const data = await readBody(request);
  const accounts = [
    { username: "vetri", name: "Vetrivel", role: "person" },
    { username: "nitheen", name: "Nitheen", role: "person" },
    { username: "yash", name: "Yaswanth", role: "person" },
    { username: "dharshu", name: "Dharshini", role: "person" },
    { username: "mano", name: "ManojKumar", role: "person" },
    { username: "admin", name: "Admin", role: "admin" }
  ];

  if (!data.passwords || typeof data.passwords !== "object") {
    throw error("Provide a password for each account.");
  }

  const statements = [];

  for (const account of accounts) {
    const password = String(data.passwords[account.username] || "");

    if (password.length < 12) {
      throw error(
        `Password for ${account.username} must be at least 12 characters.`
      );
    }

    statements.push(
      env.DB.prepare(
        "INSERT INTO users (username,name,password_hash,role,enabled) VALUES (?,?,?,?,1)"
      ).bind(
        account.username,
        account.name,
        await newHash(password),
        account.role
      )
    );
  }

  await env.DB.batch(statements);

  return json({
    ok: true,
    message: "Initial accounts created successfully."
  }, 201);
}

if (method === "POST" && path === "/api/reset-admin-password") {
    if (
        !env.SETUP_SECRET ||
        request.headers.get("X-Setup-Secret") !== env.SETUP_SECRET
    ) {
        throw error("Password reset not authorized.", 403);
    }

    const data = await readBody(request);
    const password = String(data.password || "");

    if (password.length < 8) {
        throw error("Password must be at least 8 characters.", 400);
    }

    const user = await env.DB.prepare(
        "SELECT username FROM users WHERE username = ? AND role = ?"
    ).bind("admin", "admin").first();

    if (!user) {
        throw error("Admin account not found.", 404);
    }

    const passwordHashValue = await newHash(password);

    await env.DB.prepare(
        "UPDATE users SET password_hash = ? WHERE username = ? AND role = ?"
    ).bind(passwordHashValue, "admin", "admin").run();

    return json({
        ok: true,
        message: "Admin password updated successfully."
    });
}



  if (method === "POST" && path === "/api/login") {
    const data = await readBody(request);
    const username = String(data.username || "").trim().toLowerCase();
    const password = String(data.password || "");

    const user = await env.DB.prepare(
      "SELECT username,name,password_hash,role,enabled FROM users WHERE username=?"
    ).bind(username).first();

    if (!user || !user.enabled ||
        !(await checkPassword(password, user.password_hash))) {
      throw error("Invalid username or password.", 401);
    }

    return json({
      token: await tokenFor(user, env.AUTH_SECRET),
      user: { username: user.username, name: user.name, role: user.role }
    });
  }

  const user = await currentUser(request, env);

  if (method === "GET" && path === "/api/me") {
    return json({ username: user.username, name: user.name, role: user.role });
  }

  if (method === "GET" && path === "/api/people") {
    const { results } = await env.DB.prepare(
      "SELECT username,name,role,enabled,created_at FROM users WHERE role='person' ORDER BY name"
    ).all();
    return json(results);
  }

  if (method === "GET" && path === "/api/expenses") {
    return json(await allExpenses(env));
  }

  if (method === "POST" && path === "/api/expenses") {
    admin(user);
    return json(await saveExpense(env, await readBody(request)), 201);
  }

  const expenseMatch = path.match(/^\/api\/expenses\/(\d+)$/);
  if (expenseMatch && method === "PUT") {
    admin(user);
    return json(await saveExpense(env, await readBody(request), Number(expenseMatch[1])));
  }

  if (expenseMatch && method === "DELETE") {
    admin(user);
    const id = Number(expenseMatch[1]);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM expense_splits WHERE expense_id=?").bind(id),
      env.DB.prepare("DELETE FROM change_requests WHERE expense_id=?").bind(id),
      env.DB.prepare("DELETE FROM expenses WHERE id=?").bind(id)
    ]);
    return json({ ok: true });
  }

  if (method === "POST" && path === "/api/change-requests") {
    if (user.role !== "person") throw error("Only people can submit requests.", 403);

    const d = await readBody(request);
    const expenseId = Number(d.expenseId);
    const field = String(d.field || "");
    const value = String(d.requestedValue ?? "");
    const reason = String(d.reason || "").trim();

    if (!Number.isInteger(expenseId) ||
        !["myGivenAmount", "spentBy", "details", "date"].includes(field) ||
        !value.trim() || !reason) {
      throw error("Complete all change request fields.");
    }

    const expense = await env.DB.prepare(
      "SELECT * FROM expenses WHERE id=?"
    ).bind(expenseId).first();
    if (!expense) throw error("Expense not found.", 404);

    let current;
    if (field === "myGivenAmount") {
      const split = await env.DB.prepare(
        "SELECT amount FROM expense_splits WHERE expense_id=? AND username=?"
      ).bind(expenseId, user.username).first();
      if (!split) throw error("You are not included in this expense.", 403);
      paise(value);
      current = rupees(split.amount);
    } else if (field === "spentBy") {
      const valid = await env.DB.prepare(
        "SELECT username FROM users WHERE username=? AND role='person' AND enabled=1"
      ).bind(value.toLowerCase()).first();
      if (!valid) throw error("Choose a valid person.");
      current = expense.spent_by;
    } else if (field === "date") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw error("Invalid date.");
      current = expense.expense_date;
    } else {
      current = expense.details || "";
    }

    const result = await env.DB.prepare(
      "INSERT INTO change_requests (expense_id,requested_by,field,current_value,requested_value,reason,status) VALUES (?,?,?,?,?,?,'pending')"
    ).bind(expenseId, user.username, field, String(current), value, reason).run();

    return json({ id: result.meta.last_row_id, status: "pending" }, 201);
  }

  if (method === "GET" && path === "/api/change-requests") {
    const sql = `SELECT cr.*, e.name AS expense_name, u.name AS requester_name
      FROM change_requests cr
      JOIN expenses e ON e.id=cr.expense_id
      JOIN users u ON u.username=cr.requested_by
      ${user.role === "admin" ? "" : "WHERE cr.requested_by=?"}
      ORDER BY cr.created_at DESC`;

    const result = user.role === "admin"
      ? await env.DB.prepare(sql).all()
      : await env.DB.prepare(sql).bind(user.username).all();
    return json(result.results);
  }

  const reviewMatch = path.match(/^\/api\/change-requests\/(\d+)\/(approve|reject)$/);
  if (method === "POST" && reviewMatch) {
    admin(user);
    const id = Number(reviewMatch[1]);
    const action = reviewMatch[2];

    const req = await env.DB.prepare(
      "SELECT * FROM change_requests WHERE id=? AND status='pending'"
    ).bind(id).first();
    if (!req) throw error("Pending request not found.", 404);

    if (action === "reject") {
      await env.DB.prepare(
        "UPDATE change_requests SET status='rejected',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?"
      ).bind(user.username, id).run();
      return json({ ok: true, status: "rejected" });
    }

    const expense = await env.DB.prepare(
      "SELECT * FROM expenses WHERE id=?"
    ).bind(req.expense_id).first();

    if (req.field === "myGivenAmount") {
      const old = await env.DB.prepare(
        "SELECT amount FROM expense_splits WHERE expense_id=? AND username=?"
      ).bind(req.expense_id, req.requested_by).first();
      if (!old) throw error("Split entry not found.");

      const amount = paise(req.requested_value);
      const sum = await env.DB.prepare(
        "SELECT COALESCE(SUM(amount),0) AS total FROM expense_splits WHERE expense_id=?"
      ).bind(req.expense_id).first();

      if (sum.total - old.amount + amount !== expense.total_amount) {
        throw error("This amount would make the split total incorrect. The request remains pending.");
      }

      await env.DB.prepare(
        "UPDATE expense_splits SET amount=? WHERE expense_id=? AND username=?"
      ).bind(amount, req.expense_id, req.requested_by).run();
    } else if (req.field === "spentBy") {
      const payer = await env.DB.prepare(
        "SELECT username FROM users WHERE username=? AND role='person' AND enabled=1"
      ).bind(req.requested_value.toLowerCase()).first();
      if (!payer) throw error("Requested payer is invalid.");
      await env.DB.prepare(
        "UPDATE expenses SET spent_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
      ).bind(req.requested_value.toLowerCase(), req.expense_id).run();
    } else if (req.field === "details") {
      await env.DB.prepare(
        "UPDATE expenses SET details=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
      ).bind(req.requested_value, req.expense_id).run();
    } else if (req.field === "date") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.requested_value)) throw error("Invalid requested date.");
      await env.DB.prepare(
        "UPDATE expenses SET expense_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
      ).bind(req.requested_value, req.expense_id).run();
    }

    await env.DB.prepare(
      "UPDATE change_requests SET status='approved',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(user.username, id).run();

    return json({ ok: true, status: "approved" });
  }

  if (method === "GET" && path === "/api/dashboard") {
    const expenses = await allExpenses(env);
    const pending = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM change_requests WHERE status='pending'"
    ).first();
    const people = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role='person' AND enabled=1"
    ).first();

    return json({
      people: people.count,
      expenseCount: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + e.totalAmount, 0),
      pendingRequests: pending.count,
      expenses: user.role === "admin"
        ? expenses
        : expenses.filter(e => e.spentBy === user.username ||
            (e.splits[user.username] || 0) > 0)
    });
  }

  if (method === "POST" && path === "/api/people") {
    admin(user);
    const d = await readBody(request);
    const username = String(d.username || "").trim().toLowerCase();
    const name = String(d.name || "").trim();
    const password = String(d.password || "");

    if (!/^[a-z0-9_]+$/.test(username) || !name || password.length < 8) {
      throw error("Use a valid username, name and password of at least 8 characters.");
    }

    await env.DB.prepare(
      "INSERT INTO users (username,name,password_hash,role,enabled) VALUES (?,?,?,'person',1)"
    ).bind(username, name, await newHash(password)).run();

    return json({ ok: true }, 201);
  }

  return json({ error: "Endpoint not found." }, 404);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    try {
      
const response = await route(request, env);
const headers = new Headers(response.headers);

for (const [key, value] of Object.entries(cors(origin))) {
  headers.set(key, value);
}

return new Response(response.body, {
  status: response.status,
  headers
});

    } catch (err) {
      console.error("Expense Tracker API:", err.message || err);
      return respond(
        { error: err.message || "Internal server error." },
        err.status || 500,
        origin
      );
    }
  }
};
