import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { DataRow, DataTable, SortHead } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { Toggle } from '@/components/ui/Toggle';
import { consoleActions, consoleStore } from '@/store/consoleStore';

beforeEach(() => consoleActions.resetSession());

describe('common components', () => {
  it('Button renders its label and fires clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button icon="plus" onClick={onClick}>
        New order
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'New order' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Pill renders the status text', () => {
    render(<Pill tone="green">Verified</Pill>);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('Toggle exposes switch semantics', async () => {
    const onClick = vi.fn();
    render(<Toggle on={false} label="Manual desk rate" onClick={onClick} />);
    const sw = screen.getByRole('switch', { name: 'Manual desk rate' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    expect(onClick).toHaveBeenCalled();
  });

  it('Chip reports its pressed state', () => {
    render(
      <Chip active onClick={() => undefined} count={12}>
        All stages
      </Chip>,
    );
    expect(screen.getByRole('button', { name: /All stages/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('SortHead cycles ascending → descending in the shared store', async () => {
    render(
      <DataTable label="t" cols="1fr" header={<SortHead mod="orders" k="id">ORDER ID</SortHead>}>
        <DataRow>row</DataRow>
      </DataTable>,
    );
    const head = screen.getByRole('columnheader', { name: /ORDER ID/ });
    await userEvent.click(head);
    expect(consoleStore.getState().sorts.orders).toEqual({ k: 'id', d: 1 });
    expect(head).toHaveAttribute('aria-sort', 'ascending');
    await userEvent.click(head);
    expect(consoleStore.getState().sorts.orders).toEqual({ k: 'id', d: -1 });
  });

  it('clickable DataRow responds to Enter', async () => {
    const onClick = vi.fn();
    render(
      <DataTable label="t" cols="1fr" header={null}>
        <DataRow onClick={onClick} label="Open order">
          row
        </DataRow>
      </DataTable>,
    );
    screen.getByRole('row', { name: 'Open order' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });
});
