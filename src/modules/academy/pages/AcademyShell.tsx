import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TabBar } from '@/components/ui/Tabs';
import { ROUTES } from '@/constants/routes';
import { consoleActions } from '@/store/consoleStore';
import layout from '@/styles/layout.module.css';

export default function AcademyShell() {
  return (
    <div className={layout.page}>
      <TabBar
        label="Academy views"
        tabs={[
          { label: 'Course CMS', to: ROUTES.academy },
          { label: 'Completion analytics', to: ROUTES.academyAnalytics },
        ]}
        actions={
          <Button
            variant="primary"
            h={36}
            px={14}
            r={12}
            icon="plus"
            onClick={() =>
              consoleActions.openDrawer({
                title: 'New course',
                sub: 'Courses group lessons under one of the six Academy categories.',
                fields: [
                  { label: 'COURSE TITLE', hint: 'Shown in the learner app' },
                  { label: 'CATEGORY', value: 'Getting Started' },
                  { label: 'LESSON COUNT', value: '4' },
                  { label: 'CERTIFIED TRACK', value: 'No' },
                  { label: 'SUMMARY', kind: 'area' },
                ],
                cta: 'Create course',
                done: 'Course created as a draft',
                draft: 'Course saved without publishing',
              })
            }
          >
            New course
          </Button>
        }
      />
      <Outlet />
    </div>
  );
}
