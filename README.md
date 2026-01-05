# PDF Metadata Extraction API

Simple API that extracts structured metadata from PDF documents using AI.

## Tech Stack

- **Hono** - Fast web framework
- **Vercel AI SDK 6** - Structured outputs
- **pdf-parse** - PDF text extraction
- **OpenAI gpt-5-mini** - AI model
- **Zod** - Schema validation

## Setup

```bash
# npm
npm install
npm run dev

# or faster with Bun (https://bun.sh/) OR pnpm https://pnpm.io/installation
bun install
bun run dev
```

Copy `.env.example` to `.env` and add your OpenAI API key.

## Usage

```bash
curl -X POST http://localhost:3001/extract -F "file=@document.pdf"
```

## Response

```json
{
  "success": true,
  "metadata": {
    "title": "...",
    "author": "...",
    "summary": "...",
    "topics": ["..."],
    "keywords": ["..."],
    "documentType": "report"
  },
  "rawText": "...",
  "stats": { "pageCount": 5, "textLength": 12345 }
}
```
