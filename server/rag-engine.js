import { pipeline } from "@xenova/transformers";
import {
  executeReadOnlyQuery,
  getSchemaOverviewForConnection,
} from "./query-runtime.js";
import { buildChatReply } from "./chat-engine.js";

// ---------------------------------------------------------------------------
// Embedding model — lazy-loaded, ~22MB download on first use
// ---------------------------------------------------------------------------

let _embedder = null;

async function getEmbedder() {
  if (!_embedder) {
    _embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
  }
  return _embedder;
}

async function embed(text) {
  const model = await getEmbedder();
  const out = await model(text, { pooling: "mean", normalize: true });
  return Array.from(out.data);
}

// Vectors are L2-normalised so dot product == cosine similarity
function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

// ---------------------------------------------------------------------------
// SQL dialect helpers
// ---------------------------------------------------------------------------

function getDialect(connection) {
  if (!connection || connection.databaseType === "sqlite") return "sqlite";
  return connection.databaseType;
}

function dateOnly(d, col) {
  return d === "sqlite" ? `date(${col})` : `DATE(${col})`;
}

function today(d) {
  return d === "sqlite" ? "date('now','localtime')" : "CURRENT_DATE";
}

function dateOffset(d, days) {
  if (d === "postgresql") return `CURRENT_DATE - INTERVAL '${days} day'`;
  if (d === "mysql")      return `CURRENT_DATE - INTERVAL ${days} DAY`;
  return `date('now','localtime','-${days} day')`;
}

function monthStart(d) {
  if (d === "postgresql") return "DATE_TRUNC('month', CURRENT_DATE)";
  if (d === "mysql")      return "DATE_FORMAT(CURRENT_DATE,'%Y-%m-01')";
  return "date('now','localtime','start of month')";
}

function prevMonthStart(d) {
  if (d === "postgresql") return "DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')";
  if (d === "mysql")      return "DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH,'%Y-%m-01')";
  return "date('now','localtime','start of month','-1 month')";
}

// ---------------------------------------------------------------------------
// Currency / number formatting
// ---------------------------------------------------------------------------

function Rs(value) {
  return `Rs ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
}

function pct(current, previous) {
  if (!Number(previous)) return null;
  const delta = ((Number(current) - Number(previous)) / Number(previous)) * 100;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Entity extraction helpers
// ---------------------------------------------------------------------------

const DATE_RANGE_PATTERNS = [
  { re: /\b(today|aaj)\b/i,                        range: "today" },
  { re: /\b(yesterday|kal)\b/i,                     range: "yesterday" },
  { re: /\b(this week|is hafte|last 7 days?)\b/i,   range: "week" },
  { re: /\b(this month|is mahine|current month)\b/i, range: "month" },
  { re: /\b(last month|pichle mahine)\b/i,           range: "last_month" },
  { re: /\b(last 30 days?|past month)\b/i,           range: "30days" },
];

function extractDateRange(msg) {
  for (const { re, range } of DATE_RANGE_PATTERNS) {
    if (re.test(msg)) return range;
  }
  return "week"; // sensible default
}

function extractLimit(msg) {
  const m = msg.match(/\btop\s*(\d+)\b/i) || msg.match(/\b(\d+)\s*(products?|customers?|items?|orders?)\b/i);
  return m ? Math.min(Math.max(Number(m[1]), 1), 20) : 5;
}

function rangeSql(d, range) {
  switch (range) {
    case "today":      return `${dateOnly(d, "ordered_at")} = ${today(d)}`;
    case "yesterday":  return `${dateOnly(d, "ordered_at")} = ${dateOffset(d, 1)}`;
    case "week":       return `${dateOnly(d, "ordered_at")} >= ${dateOffset(d, 6)}`;
    case "month":      return `${dateOnly(d, "ordered_at")} >= ${monthStart(d)}`;
    case "last_month":
      return `${dateOnly(d, "ordered_at")} >= ${prevMonthStart(d)} AND ${dateOnly(d, "ordered_at")} < ${monthStart(d)}`;
    case "30days":     return `${dateOnly(d, "ordered_at")} >= ${dateOffset(d, 29)}`;
    default:           return `${dateOnly(d, "ordered_at")} >= ${dateOffset(d, 6)}`;
  }
}

function rangeSqlOn(d, range, col) {
  switch (range) {
    case "today":      return `${dateOnly(d, col)} = ${today(d)}`;
    case "yesterday":  return `${dateOnly(d, col)} = ${dateOffset(d, 1)}`;
    case "week":       return `${dateOnly(d, col)} >= ${dateOffset(d, 6)}`;
    case "month":      return `${dateOnly(d, col)} >= ${monthStart(d)}`;
    case "last_month":
      return `${dateOnly(d, col)} >= ${prevMonthStart(d)} AND ${dateOnly(d, col)} < ${monthStart(d)}`;
    case "30days":     return `${dateOnly(d, col)} >= ${dateOffset(d, 29)}`;
    default:           return `${dateOnly(d, col)} >= ${dateOffset(d, 6)}`;
  }
}

function rangeLabel(range) {
  return { today: "today", yesterday: "yesterday", week: "last 7 days",
           month: "this month", last_month: "last month", "30days": "last 30 days" }[range] || "last 7 days";
}

// ---------------------------------------------------------------------------
// Intent library  (each intent: name, examples[], buildSql(d,msg), format(rows,msg))
// ---------------------------------------------------------------------------

const INTENTS = [

  // ── Sales snapshots ──────────────────────────────────────────────────────

  {
    name: "sales_snapshot",
    examples: [
      "what are my sales today",
      "today revenue and orders",
      "how much did I earn today",
      "aaj ki sales",
      "yesterday sales total",
      "kal ki kamai",
      "this week total revenue",
      "weekly sales summary",
      "is hafte ki sales",
      "this month revenue",
      "is mahine ka revenue",
      "last month earnings",
      "pichle mahine ki sales",
      "how much in last 30 days",
      "daily sales figure",
      "total orders and revenue",
    ],
    buildSql: (d, msg) => {
      const range = extractDateRange(msg);
      return `
        SELECT COUNT(*) AS orders_count,
               COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE ${rangeSql(d, range)}
      `;
    },
    format: (rows, msg) => {
      const range = extractDateRange(msg);
      const r = rows[0] || {};
      return [
        `Sales summary for ${rangeLabel(range)}:`,
        `Orders:  ${r.orders_count || 0}`,
        `Revenue: ${Rs(r.revenue)}`,
      ].join("\n");
    },
  },

  // ── Top products ─────────────────────────────────────────────────────────

  {
    name: "top_products",
    examples: [
      "what are my best selling products",
      "top 5 products by revenue",
      "top 10 products this week",
      "which products sell the most",
      "highest revenue products",
      "sabse zyada bikne wale products",
      "kaun se products popular hain",
      "best products this month",
      "most popular items",
      "product sales ranking",
      "product performance report",
    ],
    buildSql: (d, msg) => {
      const range = extractDateRange(msg);
      const limit = extractLimit(msg);
      return `
        SELECT p.name, p.category,
               SUM(oi.quantity) AS units_sold,
               COALESCE(SUM(oi.total_price), 0) AS revenue
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN orders o   ON o.id = oi.order_id
        WHERE ${rangeSqlOn(d, range, "o.ordered_at")}
        GROUP BY p.id, p.name, p.category
        ORDER BY revenue DESC, units_sold DESC
        LIMIT ${limit}
      `;
    },
    format: (rows, msg) => {
      if (!rows.length) return "No product sales found for that period.";
      const range = extractDateRange(msg);
      const lines = rows.map(
        (r, i) => `${i + 1}. ${r.name} (${r.category}) — ${r.units_sold} units, ${Rs(r.revenue)}`,
      );
      return [`Top products — ${rangeLabel(range)}:`, ...lines].join("\n");
    },
  },

  // ── Low stock / inventory ─────────────────────────────────────────────────

  {
    name: "low_stock",
    examples: [
      "which products are low on stock",
      "low stock alert",
      "items running out of stock",
      "inventory shortage warning",
      "stock kam hai kaun se products mein",
      "out of stock soon",
      "products need restocking",
      "check inventory levels",
      "which items to reorder",
      "kya stock khatam hone wala hai",
      "show me products below 10 units",
    ],
    buildSql: (_, msg) => {
      const threshold = (() => {
        const m = msg.match(/\b(\d+)\s*units?\b/i);
        return m ? Number(m[1]) : 15;
      })();
      return `
        SELECT name, category, stock, price
        FROM products
        WHERE stock <= ${threshold}
        ORDER BY stock ASC, price DESC
        LIMIT 15
      `;
    },
    format: (rows) => {
      if (!rows.length) return "All products are well stocked.";
      const lines = rows.map(
        (r) => `• ${r.name} (${r.category}) — ${r.stock} units left @ ${Rs(r.price)}`,
      );
      return ["Low stock items:", ...lines].join("\n");
    },
  },

  // ── Top customers ─────────────────────────────────────────────────────────

  {
    name: "top_customers",
    examples: [
      "who are my best customers",
      "top customers by spending",
      "highest value customers this month",
      "sabse zyada kharcha karne wale customers",
      "VIP customers",
      "loyal customers list",
      "repeat buyers",
      "customer revenue ranking",
      "kaun customers sabse zyada khareedte hain",
      "most valuable customers",
    ],
    buildSql: (d, msg) => {
      const range = extractDateRange(msg);
      const limit = extractLimit(msg);
      return `
        SELECT c.name, c.email,
               COUNT(o.id) AS orders_count,
               COALESCE(SUM(o.total_amount), 0) AS total_spent
        FROM customers c
        JOIN orders o ON o.customer_id = c.id
        WHERE ${rangeSqlOn(d, range, "o.ordered_at")}
        GROUP BY c.id, c.name, c.email
        ORDER BY total_spent DESC
        LIMIT ${limit}
      `;
    },
    format: (rows, msg) => {
      if (!rows.length) return "No customer orders found for that period.";
      const range = extractDateRange(msg);
      const lines = rows.map(
        (r, i) =>
          `${i + 1}. ${r.name} — ${r.orders_count} orders, ${Rs(r.total_spent)} spent`,
      );
      return [`Top customers — ${rangeLabel(range)}:`, ...lines].join("\n");
    },
  },

  // ── Profit / margin ───────────────────────────────────────────────────────

  {
    name: "profit_margin",
    examples: [
      "what is my profit margin",
      "gross margin percentage",
      "how profitable am I",
      "profit this month",
      "kitna profit ho raha hai",
      "revenue minus cost",
      "margin calculation",
      "how much do I earn after costs",
      "net earnings",
      "is mahine ka profit",
    ],
    buildSql: (d, msg) => {
      const range = extractDateRange(msg);
      return `
        SELECT
          ROUND(
            (COALESCE(SUM(oi.total_price),0) - COALESCE(SUM(oi.unit_cost * oi.quantity),0))
            * 100.0 / NULLIF(SUM(oi.total_price), 0), 2
          ) AS margin_percent,
          COALESCE(SUM(oi.total_price), 0) AS revenue,
          COALESCE(SUM(oi.unit_cost * oi.quantity), 0) AS cost
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE ${rangeSqlOn(d, range, "o.ordered_at")}
      `;
    },
    format: (rows, msg) => {
      const r = rows[0] || {};
      const range = extractDateRange(msg);
      const profit = Number(r.revenue || 0) - Number(r.cost || 0);
      return [
        `Gross margin — ${rangeLabel(range)}:`,
        `Revenue: ${Rs(r.revenue)}`,
        `Cost:    ${Rs(r.cost)}`,
        `Profit:  ${Rs(profit)}`,
        `Margin:  ${Number(r.margin_percent || 0).toFixed(2)}%`,
      ].join("\n");
    },
  },

  // ── Category breakdown ────────────────────────────────────────────────────

  {
    name: "category_breakdown",
    examples: [
      "revenue by category",
      "category wise sales breakdown",
      "which product category performs best",
      "sales by product type",
      "kaun si category zyada bik rahi hai",
      "category revenue split",
      "top categories this week",
      "product category analysis",
    ],
    buildSql: (d, msg) => {
      const range = extractDateRange(msg);
      return `
        SELECT p.category AS name,
               COALESCE(SUM(oi.total_price), 0) AS revenue,
               COALESCE(SUM(oi.quantity), 0) AS units_sold
        FROM products p
        JOIN order_items oi ON oi.product_id = p.id
        JOIN orders o       ON o.id = oi.order_id
        WHERE ${rangeSqlOn(d, range, "o.ordered_at")}
        GROUP BY p.category
        ORDER BY revenue DESC
      `;
    },
    format: (rows, msg) => {
      if (!rows.length) return "No category sales data found for that period.";
      const range = extractDateRange(msg);
      const total = rows.reduce((s, r) => s + Number(r.revenue || 0), 0);
      const lines = rows.map((r) => {
        const share = total > 0 ? ((Number(r.revenue) / total) * 100).toFixed(1) : "0.0";
        return `• ${r.name}: ${Rs(r.revenue)} (${share}%), ${r.units_sold} units`;
      });
      return [`Category breakdown — ${rangeLabel(range)}:`, ...lines].join("\n");
    },
  },

  // ── Month-over-month comparison ───────────────────────────────────────────

  {
    name: "month_comparison",
    examples: [
      "compare this month with last month",
      "this month vs last month sales",
      "is mahine aur pichle mahine mein farq",
      "month over month growth",
      "MoM revenue change",
      "how is this month performing vs last",
      "monthly growth comparison",
    ],
    buildSql: (d) => `
      SELECT
        CASE WHEN ${dateOnly(d, "ordered_at")} >= ${monthStart(d)}
             THEN 'current' ELSE 'previous' END AS bucket,
        COUNT(*) AS orders_count,
        COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE ${dateOnly(d, "ordered_at")} >= ${prevMonthStart(d)}
      GROUP BY bucket
    `,
    format: (rows) => {
      const cur  = rows.find((r) => r.bucket === "current")  || {};
      const prev = rows.find((r) => r.bucket === "previous") || {};
      const curRev  = Number(cur.revenue  || 0);
      const prevRev = Number(prev.revenue || 0);
      const growth = pct(curRev, prevRev);
      return [
        "Month-over-month comparison:",
        `This month: ${cur.orders_count  || 0} orders, ${Rs(curRev)}`,
        `Last month: ${prev.orders_count || 0} orders, ${Rs(prevRev)}`,
        `Revenue change: ${growth ?? "N/A"}`,
      ].join("\n");
    },
  },

  // ── Average order value ───────────────────────────────────────────────────

  {
    name: "average_order_value",
    examples: [
      "what is my average order value",
      "average order size",
      "mean order amount",
      "AOV this month",
      "average transaction value",
      "har order mein average kitna hota hai",
      "average spend per order",
    ],
    buildSql: (d, msg) => {
      const range = extractDateRange(msg);
      return `
        SELECT
          COUNT(*) AS orders_count,
          COALESCE(SUM(total_amount), 0) AS revenue,
          ROUND(COALESCE(AVG(total_amount), 0), 2) AS avg_order_value
        FROM orders
        WHERE ${rangeSql(d, range)}
      `;
    },
    format: (rows, msg) => {
      const r = rows[0] || {};
      const range = extractDateRange(msg);
      return [
        `Average order value — ${rangeLabel(range)}:`,
        `Orders: ${r.orders_count || 0}`,
        `Revenue: ${Rs(r.revenue)}`,
        `AOV: ${Rs(r.avg_order_value)}`,
      ].join("\n");
    },
  },

  // ── Recent orders ─────────────────────────────────────────────────────────

  {
    name: "recent_orders",
    examples: [
      "show me recent orders",
      "latest orders",
      "last 10 orders",
      "recent transactions",
      "haal ke orders dikhao",
      "new orders today",
      "what orders came in recently",
      "order history",
    ],
    buildSql: (d, msg) => {
      const limit = extractLimit(msg);
      return `
        SELECT o.id, c.name AS customer_name,
               o.total_amount AS total,
               o.ordered_at AS date
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        ORDER BY o.ordered_at DESC
        LIMIT ${limit}
      `;
    },
    format: (rows) => {
      if (!rows.length) return "No orders found.";
      const lines = rows.map((r) => {
        const d = r.date ? new Date(String(r.date)).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
        return `• ${r.customer_name} — ${Rs(r.total)} on ${d}`;
      });
      return ["Recent orders:", ...lines].join("\n");
    },
  },

  // ── Product lookup by name ────────────────────────────────────────────────

  {
    name: "product_lookup",
    examples: [
      "how much does this product cost",
      "show product details",
      "product price and stock",
      "tell me about a specific product",
      "is product ki details",
      "search for a product",
      "find product by name",
      "what is the stock of this item",
    ],
    buildSql: (_, __, keywords) => {
      if (!keywords) {
        return `SELECT name, category, price, stock FROM products ORDER BY name LIMIT 10`;
      }
      const safe = keywords.replace(/'/g, "''");
      return `
        SELECT name, category, price, stock
        FROM products
        WHERE LOWER(name) LIKE LOWER('%${safe}%')
           OR LOWER(category) LIKE LOWER('%${safe}%')
        ORDER BY name
        LIMIT 10
      `;
    },
    format: (rows) => {
      if (!rows.length) return "No matching products found.";
      const lines = rows.map(
        (r) => `• ${r.name} (${r.category}) — ${Rs(r.price)}, ${r.stock} in stock`,
      );
      return ["Product details:", ...lines].join("\n");
    },
  },

  // ── Customer lookup by name ───────────────────────────────────────────────

  {
    name: "customer_lookup",
    examples: [
      "find customer by name",
      "customer details",
      "how much has this customer spent",
      "customer purchase history",
      "is customer ne kitna kharcha kiya",
      "show customer info",
      "lookup a customer",
    ],
    buildSql: (d, _, keywords) => {
      const safe = (keywords || "").replace(/'/g, "''");
      return `
        SELECT c.name, c.email, c.phone,
               COUNT(o.id) AS orders_count,
               COALESCE(SUM(o.total_amount), 0) AS total_spent,
               MAX(o.ordered_at) AS last_order
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        WHERE LOWER(c.name) LIKE LOWER('%${safe}%')
           OR LOWER(c.email) LIKE LOWER('%${safe}%')
        GROUP BY c.id, c.name, c.email, c.phone
        ORDER BY total_spent DESC
        LIMIT 5
      `;
    },
    format: (rows) => {
      if (!rows.length) return "No matching customers found.";
      const lines = rows.map((r) => {
        const last = r.last_order
          ? new Date(String(r.last_order)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "no orders yet";
        return `• ${r.name} (${r.email}) — ${r.orders_count} orders, ${Rs(r.total_spent)} total, last order: ${last}`;
      });
      return ["Customer info:", ...lines].join("\n");
    },
  },

  // ── Total counts ──────────────────────────────────────────────────────────

  {
    name: "store_overview",
    examples: [
      "give me a store overview",
      "how many customers and products do I have",
      "total customers products orders",
      "store summary",
      "business overview",
      "mera store kaisa chal raha hai",
      "how big is my business",
      "overall store stats",
    ],
    buildSql: (d) => `
      SELECT
        (SELECT COUNT(*) FROM customers) AS total_customers,
        (SELECT COUNT(*) FROM products)  AS total_products,
        (SELECT COUNT(*) FROM orders WHERE ${dateOnly(d, "ordered_at")} >= ${monthStart(d)}) AS orders_this_month,
        (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE ${dateOnly(d, "ordered_at")} >= ${monthStart(d)}) AS revenue_this_month
    `,
    format: (rows) => {
      const r = rows[0] || {};
      return [
        "Store overview:",
        `Customers:          ${r.total_customers || 0}`,
        `Products in catalogue: ${r.total_products || 0}`,
        `Orders this month:  ${r.orders_this_month || 0}`,
        `Revenue this month: ${Rs(r.revenue_this_month)}`,
      ].join("\n");
    },
  },

  // ── Daily sales trend ─────────────────────────────────────────────────────

  {
    name: "daily_trend",
    examples: [
      "show me daily sales trend",
      "day by day revenue",
      "sales trend this week",
      "daily breakdown of orders",
      "har din ki sales",
      "daily revenue chart data",
      "weekly daily trend",
      "sales performance by day",
    ],
    buildSql: (d, msg) => {
      const range = extractDateRange(msg);
      return `
        SELECT ${dateOnly(d, "ordered_at")} AS day,
               COUNT(*) AS orders_count,
               COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE ${rangeSql(d, range)}
        GROUP BY day
        ORDER BY day ASC
      `;
    },
    format: (rows, msg) => {
      if (!rows.length) return "No sales data found for that period.";
      const range = extractDateRange(msg);
      const lines = rows.map((r) => {
        const label = new Date(String(r.day)).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
        return `  ${label}: ${r.orders_count} orders, ${Rs(r.revenue)}`;
      });
      return [`Daily sales trend — ${rangeLabel(range)}:`, ...lines].join("\n");
    },
  },

  // ── Out-of-stock products ─────────────────────────────────────────────────

  {
    name: "out_of_stock",
    examples: [
      "which products are out of stock",
      "zero stock products",
      "items not available",
      "khatam ho gaye products",
      "what is unavailable",
      "stockout alert",
      "show products with no inventory",
    ],
    buildSql: () => `
      SELECT name, category, price
      FROM products
      WHERE stock = 0
      ORDER BY name
    `,
    format: (rows) => {
      if (!rows.length) return "Great news — no products are out of stock right now.";
      const lines = rows.map((r) => `• ${r.name} (${r.category}) — ${Rs(r.price)}`);
      return ["Out of stock products:", ...lines].join("\n");
    },
  },

  // ── Repeat customers ──────────────────────────────────────────────────────

  {
    name: "repeat_customers",
    examples: [
      "how many repeat customers do I have",
      "customer retention rate",
      "returning customers count",
      "repeat buyer stats",
      "kitne customers dobara aate hain",
      "loyal buyer percentage",
    ],
    buildSql: () => `
      SELECT
        COUNT(*) AS total_customers,
        SUM(CASE WHEN orders_count > 1 THEN 1 ELSE 0 END) AS repeat_customers,
        SUM(CASE WHEN orders_count = 1 THEN 1 ELSE 0 END) AS one_time_customers
      FROM (
        SELECT customer_id, COUNT(*) AS orders_count
        FROM orders
        GROUP BY customer_id
      ) sub
    `,
    format: (rows) => {
      const r = rows[0] || {};
      const total = Number(r.total_customers || 0);
      const repeat = Number(r.repeat_customers || 0);
      const retention = total > 0 ? ((repeat / total) * 100).toFixed(1) : "0.0";
      return [
        "Customer retention:",
        `Total customers who ordered: ${total}`,
        `Repeat buyers: ${repeat} (${retention}%)`,
        `One-time buyers: ${r.one_time_customers || 0}`,
      ].join("\n");
    },
  },
];

// ---------------------------------------------------------------------------
// Embedding index — built once per process, cached in memory
// ---------------------------------------------------------------------------

let _index = null;

async function buildIndex() {
  if (_index) return _index;
  const entries = [];
  for (const intent of INTENTS) {
    for (const example of intent.examples) {
      const vec = await embed(example);
      entries.push({ intent, vec, example });
    }
  }
  _index = entries;
  return _index;
}

// ---------------------------------------------------------------------------
// Keyword extraction for name-entity queries
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","do","did","does","have","has","had",
  "show","tell","give","me","my","i","for","of","and","or","to","from","in",
  "how","what","which","who","when","where","much","many","some","all","any",
  "can","could","would","about","with","on","at","by","this","that","these",
  "those","it","its","we","us","you","your","their","them","he","she","they",
  "product","products","customer","customers","order","orders","revenue","sales",
  "aur","ka","ki","ke","mein","hai","hain","kya","kaun","kitna","kitne","dikhao",
  "se","ne","ko","tha","thi","the","please","find","search","lookup",
]);

function extractKeywords(msg) {
  return msg
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Top-K voting — blend scores from top 3 matches to pick the intent
// ---------------------------------------------------------------------------

async function matchIntent(message) {
  const index = await buildIndex();
  const queryVec = await embed(message);

  // Score every example
  const scored = index.map((entry) => ({
    intent: entry.intent,
    score: cosineSimilarity(queryVec, entry.vec),
  }));

  // Group by intent name and take the max score for each intent
  const byName = new Map();
  for (const { intent, score } of scored) {
    const existing = byName.get(intent.name);
    if (!existing || score > existing.score) {
      byName.set(intent.name, { intent, score });
    }
  }

  const ranked = [...byName.values()].sort((a, b) => b.score - a.score);

  // Weighted blend of top-3 (0.6 / 0.3 / 0.1) to dampen noise
  const [first, second, third] = ranked;
  const blendedTop = first ? first.score * 0.6
    + (second ? second.score * 0.3 : 0)
    + (third  ? third.score  * 0.1 : 0)
    : 0;

  return {
    intent: first?.intent || null,
    score: first?.score || 0,
    blendedScore: blendedTop,
  };
}

// ---------------------------------------------------------------------------
// Dynamic fallback: build an ad-hoc query from the schema for custom tables
// ---------------------------------------------------------------------------

async function tryDynamicQuery(message, connection) {
  const overview = await getSchemaOverviewForConnection(connection);
  const schema = overview.schema;
  if (!schema || schema.length === 0) return null;

  const msg = message.toLowerCase();
  const BUILT_IN = new Set(["customers","orders","order_items","products"]);

  // Look for an imported/custom table name in the question
  const customTable = schema.find(
    (t) => !BUILT_IN.has(t.table) && msg.includes(t.table.toLowerCase()),
  );

  const targetTable = customTable
    || (msg.includes("product") ? schema.find((t) => t.table === "products") : null)
    || (msg.includes("customer") ? schema.find((t) => t.table === "customers") : null)
    || (msg.includes("order") ? schema.find((t) => t.table === "orders") : null)
    || null;

  if (!targetTable) return null;

  const numericCols = targetTable.columns.filter((c) => {
    const t = String(c.type || "").toUpperCase();
    return t.includes("INT") || t.includes("REAL") || t.includes("NUM") || t.includes("FLOAT") || t.includes("DECIMAL");
  });

  const labelCols = targetTable.columns.filter((c) => {
    const t = String(c.type || "").toUpperCase();
    return (t.includes("TEXT") || t.includes("CHAR") || t.includes("VARCHAR")) && c.name.toLowerCase() !== "id";
  });

  const quoteId = (s) => `"${String(s).replace(/"/g, '""')}"`;

  let sql;
  let replyPrefix;

  if (msg.includes("count") || msg.includes("how many") || msg.includes("total rows") || msg.includes("kitne")) {
    sql = `SELECT COUNT(*) AS row_count FROM ${quoteId(targetTable.table)}`;
    replyPrefix = `Row count for ${targetTable.table}:`;
  } else if ((msg.includes("top") || msg.includes("highest") || msg.includes("most") || msg.includes("zyada")) && numericCols.length) {
    const metricCol = numericCols[0];
    const labelCol = labelCols[0] || targetTable.columns[0];
    const limit = extractLimit(message);
    sql = `SELECT ${quoteId(labelCol.name)} AS label, ${quoteId(metricCol.name)} AS metric FROM ${quoteId(targetTable.table)} ORDER BY ${quoteId(metricCol.name)} DESC LIMIT ${limit}`;
    replyPrefix = `Top rows from ${targetTable.table} by ${metricCol.name}:`;
  } else if ((msg.includes("sum") || msg.includes("total") || msg.includes("kul")) && numericCols.length) {
    const metricCol = numericCols[0];
    sql = `SELECT SUM(${quoteId(metricCol.name)}) AS total_value FROM ${quoteId(targetTable.table)}`;
    replyPrefix = `Total ${metricCol.name} from ${targetTable.table}:`;
  } else if ((msg.includes("average") || msg.includes("avg") || msg.includes("mean")) && numericCols.length) {
    const metricCol = numericCols[0];
    sql = `SELECT ROUND(AVG(${quoteId(metricCol.name)}), 2) AS avg_value FROM ${quoteId(targetTable.table)}`;
    replyPrefix = `Average ${metricCol.name} from ${targetTable.table}:`;
  } else {
    // Preview
    const previewCols = targetTable.columns.slice(0, 5).map((c) => quoteId(c.name)).join(", ");
    sql = `SELECT ${previewCols} FROM ${quoteId(targetTable.table)} LIMIT 5`;
    replyPrefix = `Sample rows from ${targetTable.table}:`;
  }

  try {
    const rows = await executeReadOnlyQuery(connection, sql);
    let reply;

    if (replyPrefix.startsWith("Row count")) {
      reply = `${replyPrefix} ${rows[0]?.row_count ?? 0}`;
    } else if (replyPrefix.startsWith("Total")) {
      reply = `${replyPrefix} ${Number(rows[0]?.total_value || 0).toLocaleString("en-IN")}`;
    } else if (replyPrefix.startsWith("Average")) {
      reply = `${replyPrefix} ${Number(rows[0]?.avg_value || 0).toFixed(2)}`;
    } else if (replyPrefix.startsWith("Top")) {
      const lines = rows.map((r, i) => `${i + 1}. ${r.label} — ${Number(r.metric || 0).toLocaleString("en-IN")}`);
      reply = [replyPrefix, ...lines].join("\n");
    } else {
      const lines = rows.map((r) =>
        Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(", "),
      );
      reply = [replyPrefix, ...lines].join("\n");
    }

    return { mode: "rag_dynamic", sql: sql.trim(), rows, reply };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

const CONFIDENCE_HIGH   = 0.52;   // trust the intent fully
const CONFIDENCE_LOW    = 0.38;   // try dynamic query, then rule-based
// below CONFIDENCE_LOW → skip straight to rule-based

export async function buildRagChatReply(message, options = {}) {
  const connection = options.connection || null;
  const keywords   = extractKeywords(message);

  const { intent, score } = await matchIntent(message);

  if (intent && score >= CONFIDENCE_HIGH) {
    const dialect = getDialect(connection);
    try {
      const sql  = intent.buildSql(dialect, message, keywords).trim();
      const rows = await executeReadOnlyQuery(connection, sql);
      const reply = intent.format(rows, message);
      return { mode: "rag", sql, rows, reply, intentName: intent.name, score: Math.round(score * 100) / 100 };
    } catch {
      // SQL failed — try dynamic
    }
  }

  if (score >= CONFIDENCE_LOW) {
    const dynamic = await tryDynamicQuery(message, connection);
    if (dynamic) return dynamic;
  }

  // Final fallback: original rule-based engine
  return buildChatReply(message, options);
}

// Pre-warm: download model + build index in the background on server start
export function warmupRagEngine() {
  buildIndex().catch(() => undefined);
}
