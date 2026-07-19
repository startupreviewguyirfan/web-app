declare global {
  namespace Express {
    interface User {
      email: string;
      name: string | null;
      picture: string | null;
    }
  }
}

export {};
