import { NextResponse, type NextRequest } from 'next/server';
import { AFTER_LOGIN, routes } from '@/core/config/routes';

/**
 * Coarse route guard — guide §5, last checklist item.
 *
 * Next 16 renamed the `middleware.ts` convention to `proxy.ts`; the guide
 * predates that. Same file, same execution point, current name.
 *
 * It runs on the server and can see neither the in-memory access token
 * nor localStorage, so it keys off the `hirs-session` presence cookie. That
 * cookie is a marker, not a credential: it carries no token and grants nothing.
 * Its only job is to avoid flashing the shell at a signed-out visitor, and to
 * keep a signed-in one off the login page.
 *
 * The real guard is the boot-time refresh in AuthProvider plus the API itself,
 * which is the only thing that ever decides whether a request is authorised.
 */

const SESSION_COOKIE = 'hirs-session';

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get(SESSION_COOKIE)?.value === '1';

  if (pathname === '/') {
    return NextResponse.redirect(new URL(hasSession ? AFTER_LOGIN : routes.login, request.url));
  }

  const isLoginPage = pathname === routes.login;

  if (!hasSession && !isLoginPage) {
    const url = new URL(routes.login, request.url);
    // Remember where they were headed, so sign-in can return them there.
    if (pathname !== '/') url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL(AFTER_LOGIN, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
