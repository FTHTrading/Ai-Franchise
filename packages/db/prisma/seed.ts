import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Seed data ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // ── Agency organization ───────────────────────────────────────────────

  const org = await prisma.organization.upsert({
    where: { clerkOrgId: 'org_demo_apex_agency' },
    update: {},
    create: {
      clerkOrgId: 'org_demo_apex_agency',
      name: 'Apex Marketing Agency',
      slug: 'apex-marketing',
      brandSettings: {
        create: {
          primaryColor: '#6366f1',
          logoUrl: null,
          brandName: 'Apex Marketing Agency',
        },
      },
      onboardingState: {
        create: {
          completedSteps: ['brand', 'channel', 'template', 'client'],
          currentStep: 'done',
          isComplete: true,
        },
      },
      billingAccount: {
        create: {
          stripeId: 'cus_demo_apex',
          email: 'owner@apexmarketing.demo',
          name: 'Apex Marketing Agency',
        },
      },
    },
  });

  console.log(`  ✓ Organization: ${org.name}`);

  // ── Agency member ─────────────────────────────────────────────────────

  const user = await prisma.user.upsert({
    where: { clerkId: 'user_demo_owner' },
    update: {},
    create: {
      clerkId: 'user_demo_owner',
      email: 'owner@apexmarketing.demo',
      firstName: 'Alex',
      lastName: 'Owner',
      organizationMemberships: {
        create: {
          organizationId: org.id,
          role: 'ORGANIZATION_OWNER',
        },
      },
    },
  });

  console.log(`  ✓ User: ${user.email}`);

  // ── SMS channel ───────────────────────────────────────────────────────

  const channel = await prisma.communicationChannel.create({
    data: {
      organizationId: org.id,
      channel: 'SMS',
      name: 'Primary SMS',
      identifier: '+17705550100',
      provider: 'TELNYX',
      config: { telnyxPhoneNumberId: 'telnyx_demo_123' },
      isActive: true,
    },
  });

  console.log(`  ✓ Channel: ${channel.identifier}`);

  // ── Client accounts ───────────────────────────────────────────────────

  const clients = await Promise.all([
    prisma.clientAccount.upsert({
      where: { id: 'demo-client-001' },
      update: {},
      create: {
        id: 'demo-client-001',
        organizationId: org.id,
        name: 'Smith HVAC',
        slug: 'smith-hvac',
        email: 'tom@smithhvac.demo',
        phone: '+17705550201',
        industry: 'HOME_SERVICES',
        isActive: true,
      },
    }),
    prisma.clientAccount.upsert({
      where: { id: 'demo-client-002' },
      update: {},
      create: {
        id: 'demo-client-002',
        organizationId: org.id,
        name: 'Premier Dental',
        slug: 'premier-dental',
        email: 'maria@premierdental.demo',
        phone: '+17705550202',
        industry: 'DENTAL',
        isActive: true,
      },
    }),
    prisma.clientAccount.upsert({
      where: { id: 'demo-client-003' },
      update: {},
      create: {
        id: 'demo-client-003',
        organizationId: org.id,
        name: 'Cornerstone Law',
        slug: 'cornerstone-law',
        email: 'james@cornerstonelaw.demo',
        phone: '+17705550203',
        industry: 'LEGAL',
        isActive: true,
      },
    }),
  ]);

  console.log(`  ✓ Client accounts: ${clients.map((c) => c.name).join(', ')}`);

  // ── Leads ─────────────────────────────────────────────────────────────

  const leadsData = [
    // Smith HVAC leads
    { id: 'demo-lead-001', clientId: 'demo-client-001', first: 'John', last: 'Martinez', phone: '+17705551001', status: 'NEW' },
    { id: 'demo-lead-002', clientId: 'demo-client-001', first: 'Lisa', last: 'Johnson', phone: '+17705551002', status: 'CONTACTED' },
    { id: 'demo-lead-003', clientId: 'demo-client-001', first: 'Bob', last: 'Anderson', phone: '+17705551003', status: 'QUALIFIED' },
    { id: 'demo-lead-004', clientId: 'demo-client-001', first: 'Sarah', last: 'Williams', phone: '+17705551004', status: 'BOOKED' },
    { id: 'demo-lead-005', clientId: 'demo-client-001', first: 'Mike', last: 'Davis', phone: '+17705551005', status: 'WON' },
    // Premier Dental leads
    { id: 'demo-lead-006', clientId: 'demo-client-002', first: 'Amy', last: 'Lee', phone: '+17705551006', status: 'NEW' },
    { id: 'demo-lead-007', clientId: 'demo-client-002', first: 'Carlos', last: 'Garcia', phone: '+17705551007', status: 'CONTACTED' },
    { id: 'demo-lead-008', clientId: 'demo-client-002', first: 'Rachel', last: 'Brown', phone: '+17705551008', status: 'BOOKED' },
    // Cornerstone Law leads
    { id: 'demo-lead-009', clientId: 'demo-client-003', first: 'David', last: 'Miller', phone: '+17705551009', status: 'NEW' },
    { id: 'demo-lead-010', clientId: 'demo-client-003', first: 'Emma', last: 'Wilson', phone: '+17705551010', status: 'QUALIFIED' },
  ];

  for (const l of leadsData) {
    await prisma.lead.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        organizationId: org.id,
        clientAccountId: l.clientId,
        firstName: l.first,
        lastName: l.last,
        phone: l.phone,
        status: l.status as never,
        source: 'WEBSITE_FORM',
      },
    });
  }

  console.log(`  ✓ Leads: ${leadsData.length} leads across 3 clients`);

  // ── Conversations + messages ───────────────────────────────────────────

  const conv = await prisma.conversation.upsert({
    where: { id: 'demo-conv-001' },
    update: {},
    create: {
      id: 'demo-conv-001',
      organizationId: org.id,
      clientAccountId: 'demo-client-001',
      channel: 'SMS',
      leadId: 'demo-lead-002',
      channelId: channel.id,
      aiEnabled: true,
    },
  });

  await prisma.message.createMany({
    skipDuplicates: true,
    data: [
      {
        conversationId: conv.id,
        body: "Hi, I saw your ad online and I'm interested in getting my AC serviced.",
        direction: 'INBOUND',
        channel: 'SMS',
        status: 'READ',
      },
      {
        conversationId: conv.id,
        body: "Hi Lisa! Thanks for reaching out. We'd love to help. When would be a good time for a tech to come take a look?",
        direction: 'OUTBOUND',
        channel: 'SMS',
        isAiGenerated: true,
        status: 'DELIVERED',
      },
      {
        conversationId: conv.id,
        body: "Maybe Thursday afternoon between 2-5pm?",
        direction: 'INBOUND',
        channel: 'SMS',
        status: 'PENDING',
      },
    ],
  });

  console.log(`  ✓ Conversations: 1 demo conversation with 3 messages`);

  // ── Workflow template + instance ──────────────────────────────────────

  const tmpl = await prisma.template.create({
    data: {
      organizationId: org.id,
      name: '5-Step New Lead Follow-Up',
      description: 'Automated SMS drip sequence for new leads over 7 days.',
      category: 'LEAD_FOLLOWUP',
      triggerType: 'NEW_LEAD',
      isSystem: true,
      steps: [
        { id: 's1', type: 'SEND_SMS', label: 'Immediate followup', config: {} },
        { id: 's2', type: 'WAIT_DELAY', label: 'Wait 1 hour', config: {}, delayMs: 3600000 },
        { id: 's3', type: 'SEND_SMS', label: 'Day 1 followup', config: {} },
        { id: 's4', type: 'WAIT_DELAY', label: 'Wait to day 3', config: {}, delayMs: 172800000 },
        { id: 's5', type: 'SEND_SMS', label: 'Day 7 followup', config: {} },
      ],
    },
  });

  await prisma.workflow.create({
    data: {
      organizationId: org.id,
      templateId: tmpl.id,
      clientAccountId: 'demo-client-001',
      name: 'Smith HVAC — New Lead Follow-Up',
      triggerType: 'NEW_LEAD',
      triggerConfig: { type: 'NEW_LEAD' },
      steps: tmpl.steps as never,
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
  });

  console.log(`  ✓ Workflow: ${tmpl.name} installed for Smith HVAC`);

  // ── Appointment ───────────────────────────────────────────────────────

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const endAt = new Date(tomorrow);
  endAt.setHours(15, 0, 0, 0);

  await prisma.appointment.upsert({
    where: { id: 'demo-appt-001' },
    update: {},
    create: {
      id: 'demo-appt-001',
      organizationId: org.id,
      leadId: 'demo-lead-004',
      clientAccountId: 'demo-client-001',
      title: 'AC Service Consultation',
      startAt: tomorrow,
      endAt,
      status: 'CONFIRMED',
    },
  });

  console.log(`  ✓ Appointment: AC Service for Sarah Williams (tomorrow at 2pm)`);

  console.log('\n✅ Seed complete!');
  console.log('\nDemo credentials:');
  console.log('  Organization: apex-marketing');
  console.log('  Clients: Smith HVAC, Premier Dental, Cornerstone Law');
  console.log('  Leads: 10 demo leads across all stages');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
