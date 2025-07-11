import { z } from 'zod';

export const EventTypeUuidSchema = z.string()
  .uuid()
  .describe('UUID of the Calendly event type');

export const DateTimeSchema = z.string()
  .datetime()
  .describe('ISO 8601 datetime string');

export const EmailSchema = z.string()
  .email()
  .describe('Valid email address');

export const UserUriSchema = z.string()
  .url()
  .describe('Calendly user URI (e.g., https://api.calendly.com/users/AAAAAAAAAAAAAAAA)');

// Calendly API response schemas for better type safety
export const CalendlyUserSchema = z.object({
  uri: z.string(),
  name: z.string(),
  slug: z.string(),
  email: z.string(),
  scheduling_url: z.string(),
  timezone: z.string(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CalendlyEventTypeSchema = z.object({
  uri: z.string(),
  name: z.string(),
  active: z.boolean(),
  slug: z.string(),
  scheduling_url: z.string(),
  duration: z.number(),
  kind: z.string(),
  pooling_type: z.string().nullable(),
  type: z.string(),
  color: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  internal_note: z.string().nullable(),
  description_plain: z.string().nullable(),
  description_html: z.string().nullable(),
});

export type CalendlyUser = z.infer<typeof CalendlyUserSchema>;
export type CalendlyEventType = z.infer<typeof CalendlyEventTypeSchema>;