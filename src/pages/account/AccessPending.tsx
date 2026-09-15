import { useNavigate } from 'react-router-dom';
import { useAccess } from '@/permissions/usePermissions';
import { EMPTY } from '@/format';
import { NO_ROLE_LABEL, USER_STATUS_LABEL } from '@/format/labels';
import { Button } from '@/ui/Button';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { PageHeader } from '@/ui/PageHeader';
import { Panel } from '@/ui/Panel';
import { RecordBanner, recordStyles as shell } from '@/ui/RecordTabs';

/**
 * The prototype's `noaccess` route: an Active account whose effective permission list is empty.
 * It is inside the shell, whose navigation is empty for such an account, because everything this
 * person can still do — their phone, their password, their email, their sessions — is theirs.
 */
export function AccessPending() {
  const { me } = useAccess();
  const navigate = useNavigate();

  return (
    <div className={shell.page}>
      <PageHeader title="Access pending" />

      <RecordBanner
        tone="info"
        icon="hourglass_top"
        title="Your account is active but has no business permissions"
        body="You are signed in. An administrator still has to grant a role before any operational area becomes available."
      />

      <Panel
        title="Your account"
        note="Nothing is wrong with your registration. You do not need to register again."
      >
        <FactGrid>
          <Fact label="Name">{me ? `${me.firstName} ${me.lastName}` : EMPTY}</Fact>
          <Fact label="Email">{me?.email ?? EMPTY}</Fact>
          <Fact label="Status">{me ? USER_STATUS_LABEL[me.status] : EMPTY}</Fact>
          <Fact label="Effective roles">{NO_ROLE_LABEL}</Fact>
          <Fact label="Effective permissions" mono>{me?.permissions.length ?? 0}</Fact>
        </FactGrid>
      </Panel>

      <Panel
        title="What you can do here"
        actions={<Button label="Open your account" icon="person" tone="primary" small onClick={() => navigate('/profile')} />}
      >
        <FactGrid>
          <Fact label="Update your phone number">Available</Fact>
          <Fact label="Change your password">Available</Fact>
          <Fact label="Change your login email">Available</Fact>
          <Fact label="Review your sessions">Available</Fact>
        </FactGrid>
      </Panel>
    </div>
  );
}
