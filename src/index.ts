import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const app = express();
app.use(express.json());

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

app.post("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId: string) => {
        transports[sessionId] = transport;
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    const server = new McpServer({
      name: "elicitation-server",
      version: "1.0.0",
    });

    server.registerTool(
      "greeting",
      {
        title: "Greeting Tool",
        description: "Greet the user",
        inputSchema: {},
      },
      async () => {
        const elicitationMessage = "Please input your name";

        const result = await server.server.elicitInput({
          message: elicitationMessage,
          requestedSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The name of the user",
              },
            },
            required: ["name"],
          },
        });

        console.log(`Elicitation Result: ${JSON.stringify(result)}`);

        return {
          content: [
            {
              type: "text",
              text: `Hello ${result.content?.name ?? "Stranger"}`,
            },
          ],
        };
      }
    );

    server.registerResource(
      "greeting",
      "config://user",
      {
        title: "User Greeting",
        description: "Greet the user",
        mimeType: "text/plain",
      },
      async (uri: any) => {
        const elicitationMessage = "Please input your name";

        const result = await server.server.elicitInput({
          message: elicitationMessage,
          requestedSchema: {
            type: "object",
            properties: { name: { type: "string" } },
          },
        });

        console.log(`Elicitation Result: ${JSON.stringify(result)}`);
        const name = result.content?.name ?? "Stranger";

        return {
          contents: [
            {
              uri: uri.href,
              text: `Hello there, ${name}`,
            },
          ],
        };
      }
    );

    server.registerPrompt(
      "greeting-prompt",
      {
        title: "User greeting",
        description: "Greet the user by their name",
        argsSchema: {},
      },
      async () => {
        const elicitationMessage = "Please input your name";
        const result = await server.server.elicitInput({
          message: elicitationMessage,
          requestedSchema: {
            type: "object",
            properties: { name: { type: "string" } },
          },
        });

        const greetingPrompt = result?.content?.name
          ? `Please greet me by my name:\n\n${result.content.name}`
          : `I am unnamed :p`;

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: greetingPrompt,
              },
            },
          ],
        };
      }
    );
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (
  req: express.Request,
  res: express.Response
) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get("/mcp", handleSessionRequest);

app.delete("/mcp", handleSessionRequest);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
