import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Basit yazılar: src/content/yazilar/<adres>.md. Dosya adı yazının adresidir
// (WordPress'teki gibi kökte: /haziran-ayi-enflasyon-rakamlari-aciklandi-2/).
// Görsel, yazının yanındaki gorseller/ klasöründen verilir; derlemede WebP'ye çevrilip boyutlandırılır.
const yazilar = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/yazilar' }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    kategori: z.array(z.string()).default([]),
    kaynak: z.url().optional(),
    gorsel: image().optional(),
    gorselAlt: z.string().optional(),
    taslak: z.boolean().default(false),
  }).refine(d => !d.gorsel || Boolean(d.gorselAlt), { message: 'Görseli olan yazıda gorselAlt zorunludur.', path: ['gorselAlt'] }),
});

export const collections = { yazilar };
