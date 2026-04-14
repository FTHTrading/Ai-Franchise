import { auth } from '@clerk/nextjs/server';
import { PageHeader, Button, EmptyState } from '@aaos/ui';
import { Suspense } from 'react';
import { LoadingPage } from '@aaos/ui';
import { MessageSquare } from 'lucide-react';
import { ConversationInbox } from '@/components/conversation-inbox';
import { getConversations } from '@/lib/api';

export default async function ConversationsPage() {
  const { orgId } = await auth();
  if (!orgId) return null;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader title="Inbox" description="All active conversations" />
      <Suspense fallback={<LoadingPage />}>
        <InboxContent orgId={orgId} />
      </Suspense>
    </div>
  );
}

async function InboxContent({ orgId }: { orgId: string }) {
  const { conversations } = await getConversations(orgId);

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No open conversations"
        description="When leads reply via SMS or email, they'll show up here."
      />
    );
  }

  return <ConversationInbox conversations={conversations} />;
}
