# MCP Elicitations Demo Server

A demonstration server that showcases **elicitations** across different Model Context Protocol (MCP) use cases. This server demonstrates how to collect user input dynamically using the MCP elicitation system.

## What are Elicitations?

Elicitations allow MCP servers to request structured input from users during tool execution, enabling interactive and dynamic workflows.

## Available MCP Components

### Tools
- **`greeting`** - Simple greeting tool that asks for your name
- **`contact-info`** - Collects structured contact information (name, email, age)

### Resources
- **`config://user`** - User greeting resource that dynamically requests your name

### Prompts
- **`greeting-prompt`** - Generates a personalized greeting prompt based on your name

## How It Works

Each component demonstrates elicitations in different contexts:

1. **Tools** show how to collect input during tool execution
2. **Resources** demonstrate dynamic content generation based on user input
3. **Prompts** showcase how to create personalized prompts using elicited data

## Running the Server

```bash
npm install
npm start
```

The server will run on `http://localhost:3000`

## Example Elicitation Schemas

### Simple Name Request
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the user"
    }
  },
  "required": ["name"]
}
```

### Contact Information Request
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Your full name"
    },
    "email": {
      "type": "string",
      "format": "email", 
      "description": "Your email address"
    },
    "age": {
      "type": "number",
      "minimum": 18,
      "description": "Your age"
    }
  },
  "required": ["name", "email"]
}
```

This demo showcases MCP elicitations for creating interactive, user-driven experiences across tools, resources, and prompts. 
