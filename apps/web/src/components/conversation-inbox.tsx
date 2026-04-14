'use client';

import { useState } from 'react';
import type { Conversation } from '@aaos/types';
import { cn, formatRelativeTime, Badge, Avatar, AvatarFallback, initials } from '@aaos/ui';
import { MessageSquare } from 'lucide-react';

function ConversationRow({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const lastMsg = conversation.messages?.[0];
  const unread = !conversation.resolvedAt && conversation.messages?.some((message) => message.direction === 'INBOUND' && message.status !== 'READ');

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b transition-colors hover:bg-accent/50',
        active && 'bg-accent',
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
          <AvatarFallback className="text-xs">
            {initials(conversation.lead?.firstName ?? '', conversation.lead?.lastName ?? '')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('text-sm truncate', unread ? 'font-semibold' : 'font-medium')}>
              {conversation.lead?.firstName} {conversation.lead?.lastName}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {lastMsg ? formatRelativeTime(String(lastMsg.createdAt)) : ''}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {lastMsg?.body ?? 'No messages yet'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {conversation.resolvedAt ? (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">Resolved</Badge>
            ) : unread ? (
              <Badge variant="default" className="text-[10px] px-1 py-0">Unread</Badge>
            ) : null}
            {conversation.aiEnabled && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">AI on</Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageThread({ conversation }: { conversation: Conversation }) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold">
          {conversation.lead?.firstName} {conversation.lead?.lastName}
        </h2>
        <p className="text-sm text-muted-foreground">{conversation.lead?.phone}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation.messages?.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            No messages yet
          </p>
        )}
        {conversation.messages?.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
              msg.direction === 'OUTBOUND'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-muted',
            )}
          >
            <p>{msg.body}</p>
            <p className={cn('text-[10px] mt-1', msg.direction === 'OUTBOUND' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {formatRelativeTime(String(msg.createdAt))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConversationInbox({ conversations }: { conversations: Conversation[] }) {
  const [selected, setSelected] = useState<Conversation | null>(
    conversations[0] ?? null,
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] border rounded-lg overflow-hidden">
      {/* List panel */}
      <div className="w-80 flex-shrink-0 border-r overflow-y-auto">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </h3>
        </div>
        {conversations.map((c) => (
          <ConversationRow
            key={c.id}
            conversation={c}
            active={selected?.id === c.id}
            onClick={() => setSelected(c)}
          />
        ))}
      </div>

      {/* Thread panel */}
      <div className="flex-1">
        {selected ? (
          <MessageThread conversation={selected} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
