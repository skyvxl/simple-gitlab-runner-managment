import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const user = locals.user;

  // If the user is not logged in and is trying to access a protected route
  if (!user && url.pathname !== '/login' && url.pathname !== '/register') {
    throw redirect(303, '/login');
  }

  // If the user is logged in and tries to access login/register, redirect to home
  if (user && (url.pathname === '/login' || url.pathname === '/register')) {
    throw redirect(303, '/');
  }

  return {
    user,
  };
};
