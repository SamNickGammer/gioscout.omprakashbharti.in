import { z } from 'zod';
import { USER_ROLES } from './status';

/** Admin creating a teammate from the in-app Team page. */
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8, 'Use at least 8 characters').max(200),
  role: z.enum(USER_ROLES).optional().default('member'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const addCommentSchema = z.object({
  body: z.string().min(1).max(4000),
});
export type AddCommentInput = z.infer<typeof addCommentSchema>;

/** Public-safe shape of a user (never includes passwordHash/apiKey). */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: (typeof USER_ROLES)[number];
}
