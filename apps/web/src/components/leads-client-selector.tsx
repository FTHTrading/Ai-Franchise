'use client';

import { useRouter } from 'next/navigation';
import type { ClientAccount } from '@aaos/types';
import { Card, CardContent } from '@aaos/ui';
import { Building2, ChevronRight } from 'lucide-react';

export function LeadsClientSelector({ clients }: { clients: ClientAccount[] }) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <button
          key={client.id}
          type="button"
          className="text-left"
          onClick={() => router.push(`/leads/${client.id}`)}
        >
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground">
                  {client.email ?? client.phone ?? 'No contact'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
