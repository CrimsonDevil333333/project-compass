import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { orchestrator } from "./core/Orchestrator.js";

const server = new Server(
  {
    name: "project-compass",
    version: "5.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_projects",
        description: "List all projects in the current workspace with metadata and available commands",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Path to scan (defaults to cwd)" },
            depth: { type: "integer", description: "Scan depth (default 7)" }
          }
        },
      },
      {
        name: "run_project_command",
        description: "Execute a predefined command for a specific project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "The ID of the project" },
            commandId: { type: "string", description: "The ID of the command (e.g. build, test, run)" }
          },
          required: ["projectId", "commandId"]
        },
      },
      {
        name: "get_task_status",
        description: "Get the status and output logs of a running or completed task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "string", description: "The ID of the task" }
          },
          required: ["taskId"]
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list_projects") {
      const projects = await orchestrator.scan(args.path || process.cwd(), args.depth || 7);
      return {
        content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
      };
    }

    if (name === "run_project_command") {
      const taskId = orchestrator.runCommand(args.projectId, args.commandId);
      return {
        content: [{ type: "text", text: `Task started: ${taskId}` }],
      };
    }

    if (name === "get_task_status") {
      const task = orchestrator.getTask(args.taskId);
      if (!task) throw new Error("Task not found");
      return {
        content: [{ type: "text", text: JSON.stringify({
          status: task.status,
          output: task.output.slice(-2000) // Send last 2000 chars
        }, null, 2) }],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Compass MCP Server running on stdio");
}
