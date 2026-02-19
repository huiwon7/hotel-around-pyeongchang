import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as unknown as { role: string }).role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminPage = nextUrl.pathname.startsWith('/admin') && !nextUrl.pathname.startsWith('/admin/login');
      const isAdminApi = nextUrl.pathname.startsWith('/api/admin');

      if (isAdminPage || isAdminApi) {
        return isLoggedIn;
      }

      return true;
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  providers: [], // providers are added in auth.ts
};
