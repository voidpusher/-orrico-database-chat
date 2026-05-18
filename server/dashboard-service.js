import {
  executeReadOnlyQuery,
  getSchemaOverviewForConnection,
} from "./query-runtime.js";

const REQUIRED_TABLES = [
  "customers",
  "orders",
  "order_items",
  "products",
];

function buildUnavailableDashboardResponse(overview) {
  return {
    available: false,
    reason:
      "Dashboard analytics need the retail schema tables: customers, orders, order_items, and products.",
    schema: overview.schema.map((entry) => entry.table),
  };
}

function getDialect(connection) {
  if (!connection || connection.databaseType === "sqlite") {
    return "sqlite";
  }

  if (connection.databaseType === "postgresql") {
    return "postgresql";
  }

  if (connection.databaseType === "mysql") {
    return "mysql";
  }

  return "unknown";
}

function getCurrentDateExpression(dialect) {
  if (dialect === "postgresql") {
    return "CURRENT_DATE";
  }

  if (dialect === "mysql") {
    return "CURRENT_DATE";
  }

  return "date('now', 'localtime')";
}

function getDateOffsetExpression(dialect, days) {
  if (dialect === "postgresql") {
    return `CURRENT_DATE - INTERVAL '${days} day'`;
  }

  if (dialect === "mysql") {
    return `CURRENT_DATE - INTERVAL ${days} DAY`;
  }

  return `date('now', 'localtime', '-${days} day')`;
}

function getDateOnlyExpression(dialect, column) {
  if (dialect === "postgresql") {
    return `DATE(${column})`;
  }

  if (dialect === "mysql") {
    return `DATE(${column})`;
  }

  return `date(${column})`;
}

function getOrderItemsSummaryExpression(dialect) {
  if (dialect === "postgresql") {
    return "STRING_AGG(CAST(oi.quantity AS TEXT) || 'x ' || p.name, ', ')";
  }

  if (dialect === "mysql") {
    return "GROUP_CONCAT(CONCAT(CAST(oi.quantity AS CHAR), 'x ', p.name) SEPARATOR ', ')";
  }

  return "GROUP_CONCAT(CAST(oi.quantity AS TEXT) || 'x ' || p.name, ', ')";
}

function formatCurrency(value) {
  return `Rs ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
}

function formatPercentChange(currentValue, previousValue) {
  if (!previousValue) {
    return {
      text: "+0.0%",
      positive: true,
    };
  }

  const delta =
    ((Number(currentValue || 0) - Number(previousValue || 0)) /
      Number(previousValue || 0)) *
    100;

  return {
    text: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
    positive: delta >= 0,
  };
}

function hasRetailSchema(schema) {
  const tableNames = new Set(
    schema.map((entry) => entry.table.toLowerCase()),
  );

  return REQUIRED_TABLES.every((table) => tableNames.has(table));
}

export async function getDashboardSummary(connection) {
  const overview = await getSchemaOverviewForConnection(connection);

  if (!hasRetailSchema(overview.schema)) {
    return buildUnavailableDashboardResponse(overview);
  }

  const dialect = getDialect(connection);
  const dateOnly = (column) =>
    getDateOnlyExpression(dialect, column);
  const currentDate = getCurrentDateExpression(dialect);
  const sevenDaysAgo = getDateOffsetExpression(dialect, 6);
  const yesterday = getDateOffsetExpression(dialect, 1);

  const [
    todayRow,
    yesterdayRow,
    totalCustomersRow,
    totalProductsSoldRow,
    topProductsRows,
    recentCustomersRows,
    categoryRows,
    salesRows,
  ] = await Promise.all([
    executeReadOnlyQuery(
      connection,
      `
        SELECT
          COUNT(*) AS orders_count,
          COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE ${dateOnly("ordered_at")} = ${currentDate}
      `,
    ),
    executeReadOnlyQuery(
      connection,
      `
        SELECT
          COUNT(*) AS orders_count,
          COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE ${dateOnly("ordered_at")} = ${yesterday}
      `,
    ),
    executeReadOnlyQuery(
      connection,
      `
        SELECT COUNT(*) AS total_customers
        FROM customers
      `,
    ),
    executeReadOnlyQuery(
      connection,
      `
        SELECT COALESCE(SUM(quantity), 0) AS total_products_sold
        FROM order_items
      `,
    ),
    executeReadOnlyQuery(
      connection,
      `
        SELECT
          p.id,
          p.name,
          p.category,
          p.price,
          p.stock,
          COALESCE(SUM(oi.quantity), 0) AS sold,
          COALESCE(SUM(oi.total_price), 0) AS revenue
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON o.id = oi.order_id
        WHERE o.id IS NULL OR ${dateOnly("o.ordered_at")} >= ${sevenDaysAgo}
        GROUP BY p.id, p.name, p.category, p.price, p.stock
        ORDER BY revenue DESC, sold DESC
        LIMIT 5
      `,
    ),
    executeReadOnlyQuery(
      connection,
      `
        SELECT
          c.id,
          c.name,
          c.email,
          c.phone,
          COUNT(o.id) AS orders,
          COALESCE(SUM(o.total_amount), 0) AS total_spent,
          MAX(o.ordered_at) AS last_order_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id, c.name, c.email, c.phone
        ORDER BY last_order_at DESC NULLS LAST, total_spent DESC
        LIMIT 5
      `.replace("NULLS LAST", dialect === "mysql" ? "" : "NULLS LAST"),
    ),
    executeReadOnlyQuery(
      connection,
      `
        SELECT
          p.category AS name,
          COALESCE(SUM(oi.total_price), 0) AS revenue
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON o.id = oi.order_id
        WHERE o.id IS NULL OR ${dateOnly("o.ordered_at")} >= ${sevenDaysAgo}
        GROUP BY p.category
        ORDER BY revenue DESC
      `,
    ),
    executeReadOnlyQuery(
      connection,
      `
        SELECT
          ${dateOnly("ordered_at")} AS bucket,
          COALESCE(SUM(total_amount), 0) AS revenue,
          COUNT(*) AS orders
        FROM orders
        WHERE ${dateOnly("ordered_at")} >= ${sevenDaysAgo}
        GROUP BY bucket
        ORDER BY bucket ASC
      `,
    ),
  ]);

  const today = todayRow[0] || {};
  const previousDay = yesterdayRow[0] || {};
  const revenueChange = formatPercentChange(
    today.revenue,
    previousDay.revenue,
  );
  const ordersChange = formatPercentChange(
    today.orders_count,
    previousDay.orders_count,
  );

  const metrics = [
    {
      title: "Today's Revenue",
      value: formatCurrency(today.revenue),
      change: revenueChange.text,
      positive: revenueChange.positive,
      key: "revenue",
    },
    {
      title: "Today's Orders",
      value: String(today.orders_count || 0),
      change: ordersChange.text,
      positive: ordersChange.positive,
      key: "orders",
    },
    {
      title: "Total Customers",
      value: String(totalCustomersRow[0]?.total_customers || 0),
      change: "+0.0%",
      positive: true,
      key: "customers",
    },
    {
      title: "Products Sold",
      value: Number(
        totalProductsSoldRow[0]?.total_products_sold || 0,
      ).toLocaleString("en-IN"),
      change: "+0.0%",
      positive: true,
      key: "products_sold",
    },
  ];

  const categoryTotalRevenue = categoryRows.reduce(
    (sum, row) => sum + Number(row.revenue || 0),
    0,
  );
  const categoryPalette = [
    "#4f46e5",
    "#10b981",
    "#f59e0b",
    "#f97316",
    "#06b6d4",
  ];

  const salesData = salesRows.map((row) => ({
    date: new Date(String(row.bucket)).toLocaleDateString(
      "en-IN",
      { weekday: "short" },
    ),
    revenue: Number(row.revenue || 0),
    orders: Number(row.orders || 0),
  }));

  const categoryData = categoryRows.map((row, index) => ({
    name: row.name,
    revenue: Number(row.revenue || 0),
    value:
      categoryTotalRevenue > 0
        ? Math.round(
            (Number(row.revenue || 0) / categoryTotalRevenue) * 100,
          )
        : 0,
    color: categoryPalette[index % categoryPalette.length],
  }));

  const topProducts = topProductsRows.map((row) => ({
    id: String(row.id),
    name: row.name,
    category: row.category,
    price: Number(row.price || 0),
    sold: Number(row.sold || 0),
    revenue: Number(row.revenue || 0),
    stock: Number(row.stock || 0),
  }));

  const recentCustomers = recentCustomersRows.map((row) => ({
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    orders: Number(row.orders || 0),
    totalSpent: Number(row.total_spent || 0),
    lastOrder: row.last_order_at
      ? new Date(String(row.last_order_at)).toLocaleString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          },
        )
      : "No orders yet",
  }));

  return {
    available: true,
    metrics,
    salesData,
    categoryData,
    topProducts,
    recentCustomers,
  };
}

export async function getDashboardDetails(connection) {
  const overview = await getSchemaOverviewForConnection(connection);

  if (!hasRetailSchema(overview.schema)) {
    return buildUnavailableDashboardResponse(overview);
  }

  const [productRows, customerRows] = await Promise.all([
    executeReadOnlyQuery(
      connection,
      `
        SELECT
          p.id,
          p.name,
          p.category,
          p.price,
          p.stock,
          COALESCE(SUM(oi.quantity), 0) AS sold,
          COALESCE(SUM(oi.total_price), 0) AS revenue
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        GROUP BY p.id, p.name, p.category, p.price, p.stock
        ORDER BY revenue DESC, sold DESC, p.name ASC
      `,
    ),
    executeReadOnlyQuery(
      connection,
      `
        SELECT
          c.id,
          c.name,
          c.email,
          c.phone,
          COUNT(o.id) AS orders,
          COALESCE(SUM(o.total_amount), 0) AS total_spent,
          MAX(o.ordered_at) AS last_order_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id, c.name, c.email, c.phone
        ORDER BY MAX(o.ordered_at) DESC, COALESCE(SUM(o.total_amount), 0) DESC, c.name ASC
      `,
    ),
  ]);

  const products = productRows.map((row) => ({
    id: String(row.id),
    name: row.name,
    category: row.category,
    price: Number(row.price || 0),
    sold: Number(row.sold || 0),
    revenue: Number(row.revenue || 0),
    stock: Number(row.stock || 0),
  }));

  const customers = customerRows.map((row) => ({
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    orders: Number(row.orders || 0),
    totalSpent: Number(row.total_spent || 0),
    lastOrder: row.last_order_at
      ? new Date(String(row.last_order_at)).toLocaleString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          },
        )
      : "No orders yet",
  }));

  const inStockProducts = products.filter((product) => product.stock > 0);
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock < 10,
  );
  const inventoryValue = inStockProducts.reduce(
    (sum, product) => sum + product.stock * product.price,
    0,
  );

  return {
    available: true,
    products,
    customers,
    inventory: {
      availableProducts: inStockProducts.length,
      lowStockItems: lowStockProducts.length,
      totalStockValue: inventoryValue,
      products: inStockProducts,
    },
  };
}

export async function getDashboardCustomers(connection) {
  const details = await getDashboardDetails(connection);

  return {
    available: details.available,
    reason: details.reason,
    schema: details.schema,
    customers: details.customers || [],
  };
}

export async function getDashboardOrders(connection, limit = 50) {
  const overview = await getSchemaOverviewForConnection(connection);

  if (!hasRetailSchema(overview.schema)) {
    return buildUnavailableDashboardResponse(overview);
  }

  const safeLimit = Math.max(
    1,
    Math.min(Number.parseInt(String(limit || 50), 10) || 50, 200),
  );
  const dialect = getDialect(connection);
  const orderRows = await executeReadOnlyQuery(
    connection,
    `
      SELECT
        o.id,
        o.customer_id,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        ${getOrderItemsSummaryExpression(dialect)} AS product_name,
        COALESCE(SUM(oi.quantity), 0) AS quantity,
        o.total_amount AS total,
        o.ordered_at AS date
      FROM orders o
      INNER JOIN customers c ON c.id = o.customer_id
      INNER JOIN order_items oi ON oi.order_id = o.id
      INNER JOIN products p ON p.id = oi.product_id
      GROUP BY
        o.id,
        o.customer_id,
        c.name,
        c.email,
        c.phone,
        o.total_amount,
        o.ordered_at
      ORDER BY o.ordered_at DESC
      LIMIT ${safeLimit}
    `,
  );

  const orders = orderRows.map((row) => ({
    id: String(row.id),
    customerId: String(row.customer_id),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone || "",
    productId: "",
    productName: row.product_name || "",
    quantity: Number(row.quantity || 0),
    total: Number(row.total || 0),
    date: row.date
      ? new Date(String(row.date)).toLocaleString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          },
        )
      : "",
  }));

  return {
    available: true,
    orders,
  };
}
