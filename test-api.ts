/**
 * Test script for the PDF Metadata Extraction API
 * Usage: npm run test
 */

import fs from "fs";

const API_URL = process.env.API_URL || "http://localhost:3001";
const TEST_PDF = "./acme-ai-policy.pdf";

async function main() {
  console.log(`Testing API at ${API_URL}\n`);

  const pdfBuffer = fs.readFileSync(TEST_PDF);
  const formData = new FormData();
  formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "acme-ai-policy.pdf");

  const response = await fetch(`${API_URL}/extract`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (response.ok) {
    fs.writeFileSync("output.json", JSON.stringify(data, null, 2));
    console.log("✓ Success! Results saved to output.json");
    console.log(`Stats: ${data.stats.pageCount} pages, ${data.stats.textLength} chars`);
  } else {
    console.log("✗ Error:", data.error);
  }
}

main();
