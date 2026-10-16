import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routerFuture, routes } from '@/app/router/router';
import { sessionStore } from '@/modules/auth/hooks/useSession';
import { consoleActions, consoleStore } from '@/store/consoleStore';

function renderAt(path: string, stage: 'login' | 'app' = 'app') {
  sessionStore.setState({ stage, roleIndex: 0, authError: null, credsOpen: false });
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture });
  return render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
}

beforeEach(() => consoleActions.resetSession());

describe('sign-in flow', () => {
  it('shows validation errors and moves to 2FA with valid demo credentials', async () => {
    renderAt('/login', 'login');
    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your work email and password.');

    await userEvent.type(screen.getByPlaceholderText('firstname.lastname@mineralbridge.co.ke'), 'grace.kioko@mineralbridge.co.ke');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'Desk2026!');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: "Verify it's you" })).toBeInTheDocument();
    expect(sessionStore.getState().stage).toBe('otp');
  });

  it('redirects unauthenticated users from console routes to sign-in', async () => {
    renderAt('/orders', 'login');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });
});

describe('orders list', () => {
  it('filters by side and stage chips and paginates', async () => {
    renderAt('/orders');
    const table = await screen.findByRole('table', { name: 'Orders' });
    expect(within(table).getAllByRole('row')).toHaveLength(7); // header + 6 per page
    expect(screen.getByText(/Showing 6 of 12 matching orders · page 1 of 2/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/page 2 of 2/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Buy' }));
    expect(screen.getByText(/Showing 5 of 5 matching orders/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Verification/ }));
    expect(screen.getByText(/Showing 1 of 1 matching orders/)).toBeInTheDocument();
  });

  it('applies the header search query and offers a reset when nothing matches', async () => {
    renderAt('/orders');
    await screen.findByRole('table', { name: 'Orders' });
    await userEvent.type(screen.getByRole('textbox', { name: /Search orders/ }), 'zzz-no-match');
    expect(await screen.findByText('No orders match this filter or search.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters and search' }));
    expect(consoleStore.getState().query).toBe('');
    expect(screen.getByText(/Showing 6 of 12/)).toBeInTheDocument();
  });

  it('opens the order drawer and confirms with a toast', async () => {
    renderAt('/orders');
    await userEvent.click(await screen.findByRole('button', { name: 'New order' }));
    const dialog = await screen.findByRole('dialog', { name: 'New order' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create order' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByText('Order created at Verification')).toBeInTheDocument();
  });
});

describe('order detail', () => {
  it('advances the order stage', async () => {
    renderAt('/orders/MB-SELL-41982');
    await userEvent.click(await screen.findByRole('button', { name: 'Advance to Payment released' }));
    expect(await screen.findByText('MB-SELL-41982 advanced to Payment released')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Advance to Custody transfer' })).toBeInTheDocument();
  });
});
