import { z } from 'zod';

export const RegistrationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

export type RegistrationData = z.infer<typeof RegistrationSchema>;
