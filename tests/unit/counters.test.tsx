import { Component, type ReactNode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, isApiError } from '@/lib/apiClient';
import { Sidebar } from '@/layouts/AdminLayout/Sidebar';
import { sessionStore } from '@/modules/auth/hooks/useSession';
import { badgesFromCounters, loadCounters } from '@/services/shell/counters';

class SessionBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state: { error: unknown } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  render() {
    if (isApiError(this.state.error) && this.state.error.status === 401) return <h1>Your session has ended</h1>;
    return this.props.children;
  }
}

const FULL = {
  orders: { active: 184 },
  listings: { live: 9 },
  pricing: { offersPending: 6 },
  auctions: { live: 7, upcoming: 2, endedThisQuarter: 38 },
  lc: { attention: 4 },
  collab: { active: 23 },
  verification: { kycQueue: 27, expiringDocs: 9 },
  disputes: { open: 5 },
  support: { openTickets: 12 },
  users: { total: 2, tierRequests: 0 },
  notifications: { unread: 1 },
};

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
}

function nav() {
  return within(screen.getByRole('navigation', { name: 'Primary' }));
}

function ordersLink() {
  return nav().getByRole('link', { name: /Orders/ });
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', '');
  sessionStore.setState({ stage: 'app' });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.stubEnv('VITE_API_BASE_URL', '');
});

describe('dashboard counter mapping', () => {
  it('maps each sidebar badge to the operational counter', () => {
    expect(badgesFromCounters(FULL)).toEqual({
      orders: 184,
      listings: 9,
      pricing: 6,
      auctions: 7,
      lc: 4,
      collab: 23,
      verification: 27,
      disputes: 5,
      support: 12,
    });
  });

  it('keeps a real zero instead of dropping it', () => {
    expect(badgesFromCounters({ orders: { active: 0 }, auctions: { live: 0, upcoming: 4 }, support: { openTickets: 0 } })).toEqual({
      orders: 0,
      auctions: 0,
      support: 0,
    });
  });

  it('omits a counter field the response does not include', () => {
    expect(badgesFromCounters({ orders: { attention: 3 }, listings: { live: 1 }, pricing: {} })).toEqual({ listings: 1 });
  });

  it('omits modules the staff role cannot view', () => {
    expect(badgesFromCounters({ orders: { active: 2 }, notifications: { unread: 9 } })).toEqual({ orders: 2 });
  });

  it('does not invent badges from an unrelated payload', () => {
    expect(badgesFromCounters({ me: { name: 'Platform CEO' }, redirectTo: '/overview' })).toEqual({});
  });

  it('loads counters from the authenticated dashboard endpoint', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://ops.mineralbridge.test');
    const calls: string[] = [];
    vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
      calls.push(String(input));
      return Promise.resolve(new Response(JSON.stringify({ orders: { active: 0 }, listings: { live: 3 } }), { status: 200, headers: { 'content-type': 'application/json' } }));
    });

    await expect(loadCounters()).resolves.toEqual({ orders: 0, listings: 3 });
    expect(calls[0]).toContain('/admin/v1/dashboard/counters');
  });

  it('rejects a failed counter request without a fallback count', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://ops.mineralbridge.test');
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ code: 'server/unavailable', message: 'down' }), { status: 503 })));

    await expect(loadCounters()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('sidebar badges', () => {
  it('shows the design badges only while the API base URL is empty', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    renderSidebar();
    expect(ordersLink()).toHaveTextContent('184');
    expect(nav().getByRole('link', { name: /Enquiries & Support/ })).toHaveTextContent('12');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows a zero returned by the API', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://ops.mineralbridge.test');
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ orders: { active: 0 }, listings: { live: 0 } }), { status: 200 })));
    renderSidebar();
    await waitFor(() => expect(ordersLink()).toHaveTextContent('0'));
    expect(nav().getByRole('link', { name: /Catalog Listings/ })).toHaveTextContent('0');
  });

  it('hides a badge while counters are still loading', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://ops.mineralbridge.test');
    vi.stubGlobal('fetch', () => new Promise(() => undefined));
    renderSidebar();
    expect(ordersLink().textContent?.replace(/\s+/g, ' ').trim()).toBe('Orders');
  });

  it('hides badges when the counter request fails', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://ops.mineralbridge.test');
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ message: 'down' }), { status: 503 })));
    renderSidebar();
    await waitFor(() => expect(ordersLink().textContent?.replace(/\s+/g, ' ').trim()).toBe('Orders'));
  });

  it('hides badges for modules missing from a permission-scoped response', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://ops.mineralbridge.test');
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ orders: { active: 2 } }), { status: 200 })));
    renderSidebar();
    await waitFor(() => expect(ordersLink()).toHaveTextContent('2'));
    expect(nav().getByRole('link', { name: /Catalog Listings/ }).textContent?.replace(/\s+/g, ' ').trim()).toBe('Catalog Listings');
  });

  it('surfaces an expired session instead of a fabricated count', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://ops.mineralbridge.test');
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ code: 'auth/session-expired', message: 'Sign in again' }), { status: 401 })));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <SessionBoundary>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </SessionBoundary>,
    );
    expect(await screen.findByRole('heading', { name: /Your session has ended/ })).toBeInTheDocument();
    expect(sessionStore.getState().stage).toBe('app');
  });
});
