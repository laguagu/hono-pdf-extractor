/**
 * Zod Schema for Document Metadata Extraction
 *
 * Tama tiedosto maarittelee rakenteen datalle, jonka AI poimi PDF-dokumenteista.
 * Zod tarjoaa runtime-validoinnin JA TypeScript-tyypit.
 */

import { z } from 'zod';

/**
 * Dokumentin metadata schema
 *
 * AI analysoi PDF:n tekstin ja palauttaa datan taman rakenteen mukaisesti.
 * .describe() auttaa AI:ta ymmartamaan mita kunkin kentan tulisi sisaltaa.
 */
export const documentMetadataSchema = z.object({
  // Dokumentin perustiedot
  title: z
    .string()
    .describe('The title of the document. If not explicitly stated, infer from content.'),

  author: z
    .string()
    .nullable()
    .describe('The author or authors of the document. Return null if not found.'),

  // Sisaltoanalyysi
  summary: z
    .string()
    .describe('A 2-3 sentence summary of the document main content and purpose.'),

  topics: z
    .array(z.string())
    .describe('3-5 main topics or themes discussed in the document.'),

  keywords: z
    .array(z.string())
    .describe('5-10 important keywords or key phrases from the document.'),

  // Luokittelu
  documentType: z
    .enum([
      'report',
      'article',
      'letter',
      'contract',
      'manual',
      'presentation',
      'academic_paper',
      'invoice',
      'resume',
      'other'
    ])
    .describe('The type or category of document.')
});

// Vie TypeScript-tyyppi schemasta
// Tama antaa tyyppiturvallisuuden kun tyoskennellaan poimitun datan kanssa
export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;
