import { z } from "zod";

const authorsSchema = z
  .array(
    z
      .object({
        name: z.string().trim().min(1),
        url: z.url().optional().catch(undefined)
      })
      .transform(({ name, url }) => ({ name, url: url || `https://github.com/${name}` }))
      .nullable()
      .catch(null)
  )
  .transform((authors) => authors.filter((author) => author !== null));

const tagsSchema = z.union([z.array(z.string()), z.string().transform((tag) => [tag])]);

export const manifestSchema = z.looseObject({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  main: z.string().trim().min(1).optional(),
  usercss: z.string().trim().min(1).optional(),
  authors: authorsSchema.catch([]),
  preview: z
    .string()
    .nullish()
    .transform((preview) => preview || ""),
  readme: z
    .string()
    .nullish()
    .transform((readme) => readme || ""),
  tags: tagsSchema.catch([]),
  branch: z.string().trim().min(1).optional(),
  schemes: z.string().optional(),
  include: z.array(z.string()).optional().catch(undefined)
});

export const storedCardItemSchema = z.looseObject({
  title: z.string(),
  user: z.string().optional().catch(undefined),
  authors: authorsSchema.optional().catch(undefined),
  tags: tagsSchema.optional().catch(undefined)
});
