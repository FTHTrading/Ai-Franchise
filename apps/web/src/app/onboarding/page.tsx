'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  cn,
} from '@aaos/ui';
import {
  Building2,
  MessageSquare,
  Workflow,
  Users,
  UserPlus,
  Check,
  ChevronRight,
} from 'lucide-react';

type Step = 'brand' | 'channel' | 'template' | 'client' | 'team' | 'done';

const STEPS: { id: Step; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'brand', label: 'Brand', icon: Building2, description: 'Set up your agency identity' },
  { id: 'channel', label: 'Channel', icon: MessageSquare, description: 'Connect your SMS number' },
  { id: 'template', label: 'Template', icon: Workflow, description: 'Install your first automation' },
  { id: 'client', label: 'Client', icon: Users, description: 'Add your first client' },
  { id: 'team', label: 'Team', icon: UserPlus, description: 'Invite a team member' },
];

function StepIndicator({ current, steps }: { current: Step; steps: typeof STEPS }) {
  const currentIdx = steps.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = step.id === current;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors text-xs font-semibold',
                done ? 'bg-primary border-primary text-primary-foreground' :
                active ? 'border-primary text-primary' :
                'border-muted text-muted-foreground',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-0.5 w-8', done ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step screens ────────────────────────────────────────────────────────────

function BrandStep({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState('');
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="agency-name">Agency Name</Label>
        <Input
          id="agency-name"
          placeholder="Apex Marketing Agency"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="brand-color">Brand Color</Label>
        <Input id="brand-color" type="color" defaultValue="#6366f1" className="h-10 w-20 p-1" />
      </div>
      <Button onClick={onNext} disabled={!name} className="w-full">
        Continue <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ChannelStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [phone, setPhone] = useState('');
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect a Telnyx phone number to send and receive SMS messages from your clients&apos; leads.
      </p>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (E.164 format)</Label>
        <Input
          id="phone"
          placeholder="+17705551234"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="flex gap-3">
        <Button onClick={onNext} className="flex-1" disabled={!phone}>
          Connect Number
        </Button>
        <Button onClick={onSkip} variant="outline" className="flex-1">
          Skip for now
        </Button>
      </div>
    </div>
  );
}

const FEATURED_TEMPLATES = [
  { id: 'new-lead-5step', name: '5-Step New Lead Follow-Up', description: 'SMS drip over 7 days' },
  { id: 'appointment-reminder', name: 'Appointment Reminder', description: '24h + 1h reminders' },
  { id: 'reactivation', name: 'Lead Reactivation', description: 'Win back cold leads' },
];

function TemplateStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Install a pre-built automation to get running immediately.</p>
      <div className="space-y-2">
        {FEATURED_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(t.id)}
            className={cn(
              'w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent',
              selected === t.id && 'border-primary bg-primary/5',
            )}
          >
            <p className="font-medium text-sm">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.description}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <Button onClick={onNext} className="flex-1" disabled={!selected}>Install &amp; Continue</Button>
        <Button onClick={onSkip} variant="outline" className="flex-1">Skip</Button>
      </div>
    </div>
  );
}

function ClientStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [biz, setBiz] = useState('');
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Add your first client account to start managing their leads.</p>
      <div className="space-y-2">
        <Label htmlFor="biz-name">Business Name</Label>
        <Input id="biz-name" placeholder="Smith HVAC" value={biz} onChange={(e) => setBiz(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <Button onClick={onNext} className="flex-1" disabled={!biz}>Add Client</Button>
        <Button onClick={onSkip} variant="outline" className="flex-1">Skip</Button>
      </div>
    </div>
  );
}

function TeamStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [email, setEmail] = useState('');
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Invite a team member to collaborate in your workspace.</p>
      <div className="space-y-2">
        <Label htmlFor="team-email">Email Address</Label>
        <Input id="team-email" type="email" placeholder="partner@youragency.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <Button onClick={onNext} className="flex-1" disabled={!email}>Send Invite</Button>
        <Button onClick={onSkip} variant="outline" className="flex-1">Skip</Button>
      </div>
    </div>
  );
}

function DoneStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold">You&apos;re all set!</h3>
      <p className="text-muted-foreground">Your agency workspace is ready. Let&apos;s go to your dashboard.</p>
      <Button onClick={onFinish} size="lg" className="w-full">Go to Dashboard</Button>
    </div>
  );
}

// ── Main wizard ─────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('brand');

  const advance = () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1].id);
    } else {
      setStep('done');
    }
  };

  const current = STEPS.find((s) => s.id === step);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to AgencyOS</h1>
          <p className="text-muted-foreground">Let&apos;s get your agency set up in 5 minutes.</p>
        </div>

        {/* Progress */}
        {step !== 'done' && (
          <div className="flex justify-center">
            <StepIndicator current={step} steps={STEPS} />
          </div>
        )}

        {/* Card */}
        <Card>
          <CardHeader>
            {step !== 'done' && current && (
              <>
                <CardTitle className="flex items-center gap-2">
                  <current.icon className="h-5 w-5 text-primary" />
                  {current.label}
                </CardTitle>
                <CardDescription>{current.description}</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {step === 'brand' && <BrandStep onNext={advance} />}
            {step === 'channel' && <ChannelStep onNext={advance} onSkip={advance} />}
            {step === 'template' && <TemplateStep onNext={advance} onSkip={advance} />}
            {step === 'client' && <ClientStep onNext={advance} onSkip={advance} />}
            {step === 'team' && <TeamStep onNext={advance} onSkip={advance} />}
            {step === 'done' && <DoneStep onFinish={() => router.push('/dashboard')} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
