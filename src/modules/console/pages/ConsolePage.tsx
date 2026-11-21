import { pageView } from '../engine/shell';
import { KpiGrid } from '../components/KpiGrid';
import { ChipToolbar, TabBar } from '../components/PageToolbar';
import { SettingsPanel } from '../components/SettingsPanel';
import { DataTable } from '../components/DataTable';
import { MiniLists } from '../components/MiniLists';
import type { ConsoleController } from '../../../types/console';

/** Any list screen (overview, orders, auctions, customers… settings), built from its sections. */
export function ConsolePage({ c }: { c: ConsoleController }) {
  const pg = pageView(c);
  return (
    <>
      {pg.hasKpis && <KpiGrid kpis={pg.kpis || []} />}
      {pg.hasTabs && <TabBar tabs={pg.tabs || []} />}
      {pg.hasChipsOrTools && <ChipToolbar chips={pg.chips || []} tools={pg.tools || []} />}
      {pg.isSettings && <SettingsPanel settings={pg.settings} />}
      {pg.hasTable && <DataTable table={pg.table} />}
      {pg.hasMinis && <MiniLists minis={pg.minis || []} />}
    </>
  );
}
