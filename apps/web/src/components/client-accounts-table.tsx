'use client';

import { useRouter } from 'next/navigation';
import type { ClientAccount } from '@aaos/types';
import {
  DataTable,
  Badge,
  Button,
  type ColumnDef,
  formatDate,
} from '@aaos/ui';
import { ExternalLink } from 'lucide-react';

const columns: ColumnDef<ClientAccount>[] = [
  {
    accessorKey: 'name',
    header: 'Business',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        {row.original.website && (
          <a
            href={row.original.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
          >
            {row.original.website}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Contact',
    cell: ({ row }) => (
      <div>
        <p className="text-sm">{row.original.email ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{row.original.phone ?? ''}</p>
      </div>
    ),
  },
  {
    accessorKey: 'industry',
    header: 'Industry',
    cell: ({ getValue }) => (
      <span className="text-sm capitalize">{String(getValue() ?? '—').toLowerCase().replace(/_/g, ' ')}</span>
    ),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ getValue }) =>
      getValue() ? (
        <Badge variant="success">Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Added',
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(String(getValue()))}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ClientActions id={row.original.id} />,
  },
];

function ClientActions({ id }: { id: string }) {
  const router = useRouter();
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/leads/${id}`)}
      >
        View Leads
      </Button>
    </div>
  );
}

export function ClientAccountsTable({ data }: { data: ClientAccount[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
    />
  );
}
