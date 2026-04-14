'use client';

import type { WorkflowInstance } from '@aaos/types';
import { WorkflowStatus } from '@aaos/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  formatDate,
} from '@aaos/ui';
import { Play, Pause, Zap } from 'lucide-react';

const statusVariant: Record<WorkflowStatus, 'success' | 'secondary' | 'warning' | 'default'> = {
  [WorkflowStatus.ACTIVE]: 'success',
  [WorkflowStatus.PAUSED]: 'secondary',
  [WorkflowStatus.ARCHIVED]: 'secondary',
  [WorkflowStatus.DRAFT]: 'warning',
};

function WorkflowCard({ workflow }: { workflow: WorkflowInstance }) {
  const isActive = workflow.status === WorkflowStatus.ACTIVE;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{workflow.name}</CardTitle>
              {workflow.description && (
                <CardDescription className="text-xs mt-0.5">
                  {workflow.description}
                </CardDescription>
              )}
            </div>
          </div>
          <Badge variant={statusVariant[workflow.status] ?? 'default'}>
            {workflow.status.toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Installed {formatDate(String(workflow.createdAt))}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              {isActive ? (
                <>
                  <Pause className="h-3 w-3" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkflowsGrid({ workflows }: { workflows: WorkflowInstance[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {workflows.map((w) => (
        <WorkflowCard key={w.id} workflow={w} />
      ))}
    </div>
  );
}
