/**
 * PDF Metadata Extraction API
 *
 * Yksinkertainen API joka:
 * 1. Vastaanottaa PDF-tiedoston
 * 2. Parsii tekstin pdf-parse-kirjastolla
 * 3. Kayttaa OpenAI:ta analysoimaan tekstin ja poimimaan strukturoidun metadatan
 * 4. Palauttaa metadatan JSON-muodossa
 */

// Lataa ymparistomuuttujat .env-tiedostosta
import "dotenv/config";

// Hono framework ja Node.js-serveri
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";

// Vercel AI SDK strukturoituja vastauksia varten
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

// PDF-parsintakirjasto
import pdf from "pdf-parse";

// Oma schema dokumentin metadatalle
import { documentMetadataSchema } from "./schema.js";

// Luo uusi Hono-sovellus
const app = new Hono();

// OpenAPI spec
const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "PDF Metadata Extraction API",
    version: "1.0.0",
    description:
      "API that extracts structured metadata from PDF documents using AI",
  },
  paths: {
    "/": {
      get: {
        summary: "Health check",
        responses: {
          "200": { description: "API status" },
        },
      },
    },
    "/extract": {
      post: {
        summary: "Extract metadata from PDF",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "PDF file to analyze",
                  },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Extracted metadata",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    metadata: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        author: { type: "string", nullable: true },
                        summary: { type: "string" },
                        topics: { type: "array", items: { type: "string" } },
                        keywords: { type: "array", items: { type: "string" } },
                        documentType: { type: "string" },
                      },
                    },
                    rawText: { type: "string" },
                    stats: {
                      type: "object",
                      properties: {
                        pageCount: { type: "number" },
                        textLength: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid request" },
          "422": { description: "Could not extract text from PDF" },
          "500": { description: "Server error" },
        },
      },
    },
  },
};

// OpenAPI JSON endpoint
app.get("/openapi.json", (c) => c.json(openApiSpec));

// Swagger UI
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

/**
 * Health check endpoint
 * Kayta tata varmistaaksesi etta serveri toimii
 */
app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "PDF Metadata Extraction API",
    endpoints: {
      "POST /extract": "Upload a PDF to extract metadata",
      "GET /docs": "Swagger UI documentation",
    },
  });
});

/**
 * PDF Metadata Extraction Endpoint
 *
 * Vastaanottaa: multipart/form-data 'file'-kentalla joka sisaltaa PDF:n
 * Palauttaa: Strukturoitu JSON-metadata PDF:sta
 */
app.post("/extract", async (c) => {
  try {
    // Vaihe 1: Parsitaan multipart form data
    // Honon parseBody() kasittelee tiedostolataukset automaattisesti
    const body = await c.req.parseBody();
    const file = body["file"];

    // Vaihe 2: Validoidaan etta tiedosto ladattiin
    if (!file || typeof file === "string") {
      return c.json(
        {
          error:
            'No PDF file uploaded. Please upload a file with field name "file".',
        },
        400
      );
    }

    // Vaihe 3: Validoidaan tiedostotyyppi (perustarkistus)
    if (!file.name?.toLowerCase().endsWith(".pdf")) {
      return c.json(
        { error: "Only PDF files are accepted. Please upload a .pdf file." },
        400
      );
    }

    // Vaihe 4: Muunnetaan ladattu tiedosto Bufferiksi pdf-parsea varten
    // File API tarjoaa arrayBuffer() metodin raakojen tavujen hakemiseen
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Vaihe 5: Poimitaan teksti PDF:sta pdf-parse-kirjastolla
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;

    // Tarkistetaan saatiinko tekstia
    if (!extractedText || extractedText.trim().length === 0) {
      return c.json(
        {
          error:
            "Could not extract text from PDF. The file may be scanned or image-based.",
        },
        422
      );
    }

    // Vaihe 6: Kaytetaan OpenAI:ta analysoimaan teksti ja poimimaan strukturoitu metadata
    // generateObject varmistaa etta vastaus vastaa Zod-schemaamme
    console.log("Calling OpenAI...");
    const result = await generateObject({
      model: openai("gpt-5-mini-2025-08-07"),
      schema: documentMetadataSchema,
      prompt: `Analyze the following document text and extract metadata.

Document text:
---
${extractedText.slice(0, 15000)}
---`,
    });
    console.log("OpenAI response:", JSON.stringify(result.object, null, 2));

    // Vaihe 7: Palautetaan strukturoitu metadata
    // Object on jo validoitu schemaamme vastaan
    return c.json({
      success: true,
      metadata: result.object,
      rawText: extractedText,
      stats: {
        pageCount: pdfData.numpages,
        textLength: extractedText.length,
      },
    });
  } catch (error) {
    // Kasitellaan virheet siististi
    console.error("Error processing PDF:", error);

    // Palautetaan hyodyllinen virheilmoitus
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return c.json({ error: `Failed to process PDF: ${message}` }, 500);
  }
});

// Kaynnistetaan serveri
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
    console.log(`Swagger UI: http://localhost:${info.port}/docs`);
    console.log("");
    console.log("Tip: Install Bun for faster startup: https://bun.sh");
  }
);
