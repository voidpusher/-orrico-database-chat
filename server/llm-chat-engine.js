import Anthropic from "@anthropic-ai/sdk";
import {
  executeReadOnlyQuery,
  getSchemaOverviewForConnection,
} from "./query-runtime.js";

const MODEL = "claude-opus-4-8";
const MAX_TOOL_ROUNDS = 6;

function buildSystemPrompt(schemaText) {
  return `You are Orrico, a concise retail business data assistant. You answer questions about the user's connected database using SELECT queries only.

Database schema:
${schemaText}

Rules:
- Only run SELECT or WITH queries — never INSERT, UPDATE, DELETE, DROP, or DDL.
- Keep answers short and direct. Use plain text, no markdown headers.
- If a question cannot be answered from the data, say so in one sentence.
- Format currency as "Rs X" with Indian number formatting when relevant.
- For date ranges, use the current date as reference.`;
}

function schemaToText(schema) {
  return schema
    .map((table) => {
      const cols = table.columns.map((c) => c.name).join(", ");
      return `${table.table}(${cols})`;
    })
    .join("\n");
}

const executeQueryTool = {
  name: "execute_query",
  description: "Run a read-only SELECT query against the connected database and return the rows as JSON.",
  input_schema: {
    type: "object",
    properties: {
      sql: {
        type: "string",
        description: "A valid SELECT or WITH SQL query.",
      },
    },
    required: ["sql"],
  },
};

export async function buildLlmChatReply(message, connection) {
  const overview = await getSchemaOverviewForConnection(connection);
  const schemaText = schemaToText(overview.schema);
  const systemPrompt = buildSystemPrompt(schemaText);

  const client = new Anthropic();

  const messages = [{ role: "user", content: String(message).trim() }];

  let lastSql = null;
  let lastRows = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      tools: [executeQueryTool],
      messages,
    });

    const finalMessage = await stream.finalMessage();
    messages.push({ role: "assistant", content: finalMessage.content });

    if (finalMessage.stop_reason === "end_turn") {
      const textBlock = finalMessage.content.find((b) => b.type === "text");
      return {
        mode: lastSql ? "sql" : "llm",
        sql: lastSql,
        rows: lastRows,
        reply: textBlock?.text || "I ran the query but had no text to return.",
      };
    }

    if (finalMessage.stop_reason !== "tool_use") {
      break;
    }

    const toolResults = [];
    for (const block of finalMessage.content) {
      if (block.type !== "tool_use") continue;

      let resultContent;
      try {
        const rows = await executeReadOnlyQuery(connection, block.input.sql);
        lastSql = String(block.input.sql).trim();
        lastRows = rows;
        resultContent = JSON.stringify(rows.slice(0, 200));
      } catch (error) {
        resultContent = JSON.stringify({
          error: error instanceof Error ? error.message : "Query failed.",
        });
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: resultContent,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return {
    mode: "llm",
    sql: lastSql,
    rows: lastRows,
    reply: "I was unable to complete this query. Please try rephrasing your question.",
  };
}
