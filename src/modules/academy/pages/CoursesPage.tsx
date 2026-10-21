import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataRow, DataTable } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { useQueryMatch } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { useLiveList } from '@/hooks/useLiveList';
import { CATEGORIES, getCourseCategories } from '@/services/academy';
import layout from '@/styles/layout.module.css';

const COLS = 'minmax(0,2.2fr) .8fr 1fr 1.5fr .9fr';

/** Course catalogue grouped by Academy category, with certified-track toggles. */
export default function CoursesPage() {
  const match = useQueryMatch();
  const toggles = useConsole((s) => s.toggles);
  const live = useLiveList(getCourseCategories, CATEGORIES);

  return (
    <div className={layout.stack14}>
      {live.rows.map((g) => (
        <Card key={g.category} clip>
          <section aria-label={g.category}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 20px', background: 'var(--surf2)', borderBottom: '1px solid var(--line)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
                <Text as="h2" font="display" size={14} weight={700} tone="ink" style={{ margin: 0 }}>
                  {g.category}
                </Text>
                <Text size={10.5} weight={800} ls={0.8} tone="ink3">
                  {g.courses.reduce((a, c) => a + c.lessons, 0)} lessons
                </Text>
              </span>
              <Button variant="secondaryBrand" h={32} px={12} r={11} fs={11.5} gap={6} icon="plus" onClick={() => consoleActions.notify(`New lesson drafted in ${g.category}`)}>
                Add lesson
              </Button>
            </div>
            <DataTable label={`${g.category} courses`} cols={COLS} gap={14} minWidth={760} header={null}>
              {g.courses
                .filter((c) => match([c.title, g.category]))
                .map((c) => {
                  const key = `${g.category}|${c.title}`;
                  const on = toggles[key] === undefined ? c.certified : toggles[key];
                  return (
                    <DataRow key={c.title}>
                      <Text size={13} weight={700} tone="ink">
                        {c.title}
                      </Text>
                      <Text size={12} weight={600} tone="ink2">
                        {c.lessons} lessons
                      </Text>
                      <Pill tone={c.status === 'Published' ? 'green' : 'gray'}>{c.status}</Pill>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Toggle
                          on={on}
                          onColor="var(--chGold)"
                          label={`Certified track: ${c.title}`}
                          onClick={() => {
                            consoleActions.set((s) => ({ toggles: { ...s.toggles, [key]: !on } }));
                            consoleActions.notify(`“${c.title}” ${!on ? 'marked as a certified track' : 'removed from certified tracks'}`);
                          }}
                        />
                        <Text size={11.5} weight={700} tone="ink2">
                          Certified track
                        </Text>
                      </span>
                      <span style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                        <Button
                          variant="secondary"
                          h={32}
                          px={12}
                          r={11}
                          fs={11.5}
                          gap={6}
                          icon="edit"
                          onClick={() =>
                            consoleActions.openDrawer({
                              title: c.title,
                              sub: `${g.category} · ${c.lessons} lessons · ${c.status}`,
                              fields: [{ label: 'COURSE TITLE', value: c.title }, { label: 'CATEGORY', value: g.category }, { label: 'STATUS', value: c.status }, { label: 'SUMMARY', kind: 'area' }],
                              cta: 'Save course',
                              done: `“${c.title}” updated`,
                              draft: 'Changes saved as a draft',
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          h={32}
                          px={12}
                          r={11}
                          fs={11.5}
                          gap={6}
                          icon="plus"
                          onClick={() =>
                            consoleActions.openDrawer({
                              title: 'Add lesson',
                              sub: `Adding to “${c.title}” in ${g.category}.`,
                              fields: [{ label: 'LESSON TITLE' }, { label: 'POSITION', value: 'End of course' }, { label: 'MEDIA', value: 'Video + transcript' }, { label: 'LESSON BODY', kind: 'area' }],
                              cta: 'Add lesson',
                              done: `Lesson added to “${c.title}”`,
                              draft: 'Lesson saved as a draft',
                            })
                          }
                        >
                          Lesson
                        </Button>
                      </span>
                    </DataRow>
                  );
                })}
            </DataTable>
          </section>
        </Card>
      ))}
    </div>
  );
}
