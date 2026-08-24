/// <reference types="astro/client" />

import type { AuthUser } from '@platform/auth/authService';

declare global {
  namespace App {
    interface Locals {
      user?: AuthUser;
    }
  }
}
