import {
  getSchemaOverview as getSqliteSchemaOverview,
  openRetailDatabase,
} from "./demo-retail-db.js";
import {
  getRelationalSchemaOverview,
} from "./live-relational-db.js";
import mysql from "mysql2/promise";
import pg from "pg";

const { Client: PostgresClient } = pg;

function getPort(connection, fallbackPort) {
  const parsedPort = Number.parseInt(
    String(connection?.port || ""),
    10,
  );

  return Number.isFinite(parsedPort)
    ? parsedPort
    : fallbackPort;
}

export async function getSchemaOverviewForConnection(connection) {
  if (
    connection &&
    ["postgresql", "mysql"].includes(connection.databaseType)
  ) {
    return getRelationalSchemaOverview(connection);
  }

  return getSqliteSchemaOverview(connection);
}

const SLOW_QUERY_THRESHOLD_MS = 500;

function logSlowQuery(sql, durationMs) {
  console.warn(`[slow-query] ${durationMs}ms — ${sql.slice(0, 120).replace(/\s+/g, " ")}`);
}

export async function executeReadOnlyQuery(connection, sql) {
  const normalizedSql = String(sql || "").trim();

  if (
    !/^(select|with)\b/i.test(normalizedSql)
  ) {
    throw new Error("Only read-only SELECT queries are allowed.");
  }

  const start = Date.now();

  let rows;

  if (
    connection &&
    connection.databaseType === "postgresql"
  ) {
    const client = new PostgresClient({
      host: connection.host,
      port: getPort(connection, 5432),
      user: connection.username,
      password: connection.password,
      database: connection.databaseName,
      ssl: connection.ssl
        ? { rejectUnauthorized: false }
        : undefined,
      connectionTimeoutMillis: 8000,
    });

    await client.connect();

    try {
      const result = await client.query(normalizedSql);
      rows = result.rows;
    } finally {
      await client.end();
    }
  } else if (
    connection &&
    connection.databaseType === "mysql"
  ) {
    const client = await mysql.createConnection({
      host: connection.host,
      port: getPort(connection, 3306),
      user: connection.username,
      password: connection.password,
      database: connection.databaseName,
      connectTimeout: 8000,
      ssl: connection.ssl
        ? { rejectUnauthorized: false }
        : undefined,
    });

    try {
      const [result] = await client.query(normalizedSql);
      rows = result;
    } finally {
      await client.end();
    }
  } else {
    const { database } = openRetailDatabase(connection);

    try {
      rows = database.prepare(normalizedSql).all();
    } finally {
      database.close();
    }
  }

  const duration = Date.now() - start;
  if (duration >= SLOW_QUERY_THRESHOLD_MS) {
    logSlowQuery(normalizedSql, duration);
  }

  return rows;
}
