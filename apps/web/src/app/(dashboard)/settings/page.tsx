import { auth, currentUser } from '@clerk/nextjs/server';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  Label,
  Button,
  Badge,
} from '@aaos/ui';
import { OrganizationProfile, UserProfile } from '@clerk/nextjs';

export default async function SettingsPage() {
  const { orgId } = await auth();
  const user = await currentUser();
  if (!orgId || !user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your agency and account settings." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfile
                appearance={{
                  elements: {
                    rootBox: 'w-full shadow-none',
                    card: 'shadow-none border-0 p-0',
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Manage your agency branding and details.</CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationProfile
                appearance={{
                  elements: {
                    rootBox: 'w-full shadow-none',
                    card: 'shadow-none border-0 p-0',
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="max-w-2xl space-y-4">
            {INTEGRATIONS.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Invite colleagues to your agency workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder="colleague@example.com" className="flex-1" />
                <Button>Invite</Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Team members are managed via your organization settings above.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const INTEGRATIONS = [
  {
    id: 'telnyx',
    name: 'Telnyx',
    description: 'SMS and voice communications for lead follow-up.',
    envKey: 'TELNYX_API_KEY',
    docsUrl: 'https://portal.telnyx.com',
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Transactional email delivery.',
    envKey: 'RESEND_API_KEY',
    docsUrl: 'https://resend.com/api-keys',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'AI-powered lead scoring and message generation.',
    envKey: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
];

function IntegrationCard({
  integration,
}: {
  integration: {
    id: string;
    name: string;
    description: string;
    envKey: string;
    docsUrl: string;
  };
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{integration.name}</p>
            <Badge variant="outline" className="text-xs">
              {integration.envKey}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {integration.description}
          </p>
        </div>
        <a
          href={integration.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm">
            Configure
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
