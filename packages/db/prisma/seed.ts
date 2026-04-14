import { PrismaClient } from '@prisma/client';
import { hash } from 'crypto';

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────

function uuid() {
  return crypto.randomUUID();
}

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
      plan: 'GROWTH',
      brandSettings: {
        create: {
          primaryColor: '#6366f1',
          logoUrl: null,
          companyName: 'Apex Marketing Agency',
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
          stripeCustomerId: 'cus_demo_apex',
          stripePriceId: 'price_demo_growth',
          plan: 'GROWTH',
          status: 'ACTIVE',
        },
      },
    },
  });

  console.log(`  ✓ Organization: ${org.name}`);

  // ── Agency member ─────────────────────────────────────────────────────

  const user = await prisma.user.upsert({
    where: { clerkUserId: 'user_demo_owner' },
    update: {},
    create: {
      clerkUserId: 'user_demo_owner',
      email: 'owner@apexmarketing.demo',
      firstName: 'Alex',
      lastName: 'Owner',
      memberships: {
        create: {
          organizationId: org.id,
          role: 'ORGANIZATION_OWNER',
        },
      },
    },
  });

  console.log(`  ✓ User: ${user.email}`);

  // ── SMS channel ───────────────────────────────────────────────────────

  const channel = await prisma.communicationChannel.upsert({
    where: {
      organizationId_phoneNumber: {
        organizationId: org.id,
        phoneNumber: '+17705550100',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      type: 'SMS',
      phoneNumber: '+17705550100',
      telnyxPhoneNumberId: 'telnyx_demo_123',
      isActive: true,
    },
  });

  console.log(`  ✓ Channel: ${channel.phoneNumber}`);

  // ── Client accounts ───────────────────────────────────────────────────

  const clients = await Promise.all([
    prisma.clientAccount.upsert({
      where: { id: 'demo-client-001' },
      update: {},
      create: {
        id: 'demo-client-001',
        organizationId: org.id,
        businessName: 'Smith HVAC',
        contactName: 'Tom Smith',
        contactEmail: 'tom@smithhvac.demo',
        contactPhone: '+17705550201',
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
        businessName: 'Premier Dental',
        contactName: 'Dr. Maria Chen',
        contactEmail: 'maria@premierdental.demo',
        contactPhone: '+17705550202',
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
        businessName: 'Cornerstone Law',
        contactName: 'James Williams',
        contactEmail: 'james@cornerstonelaw.demo',
        contactPhone: '+17705550203',
        industry: 'LEGAL',
        isActive: true,
      },
    }),
  ]);

  console.log(`  ✓ Client accounts: ${clients.map((c) => c.businessName).join(', ')}`);

  // ── Leads ─────────────────────────────────────────────────────────────

  const leadsData = [
    // Smith HVAC leads
    { id: 'demo-lead-001', clientId: 'demo-client-001', first: 'John', last: 'Martinez', phone: '+17705551001', status: 'NEW', score: 45 },
    { id: 'demo-lead-002', clientId: 'demo-client-001', first: 'Lisa', last: 'Johnson', phone: '+17705551002', status: 'CONTACTED', score: 62 },
    { id: 'demo-lead-003', clientId: 'demo-client-001', first: 'Bob', last: 'Anderson', phone: '+17705551003', status: 'QUALIFIED', score: 78 },
    { id: 'demo-lead-004', clientId: 'demo-client-001', first: 'Sarah', last: 'Williams', phone: '+17705551004', status: 'BOOKED', score: 88 },
    { id: 'demo-lead-005', clientId: 'demo-client-001', first: 'Mike', last: 'Davis', phone: '+17705551005', status: 'WON', score: 95 },
    // Premier Dental leads
    { id: 'demo-lead-006', clientId: 'demo-client-002', first: 'Amy', last: 'Lee', phone: '+17705551006', status: 'NEW', score: 30 },
    { id: 'demo-lead-007', clientId: 'demo-client-002', first: 'Carlos', last: 'Garcia', phone: '+17705551007', status: 'CONTACTED', score: 55 },
    { id: 'demo-lead-008', clientId: 'demo-client-002', first: 'Rachel', last: 'Brown', phone: '+17705551008', status: 'BOOKED', score: 82 },
    // Cornerstone Law leads
    { id: 'demo-lead-009', clientId: 'demo-client-003', first: 'David', last: 'Miller', phone: '+17705551009', status: 'NEW', score: 40 },
    { id: 'demo-lead-010', clientId: 'demo-client-003', first: 'Emma', last: 'Wilson', phone: '+17705551010', status: 'QUALIFIED', score: 71 },
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
        score: l.score,
        source: 'WEBSITE',
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
        content: "Hi, I saw your ad online and I'm interested in getting my AC serviced.",
        direction: 'INBOUND',
        channel: 'SMS',
        read: true,
      },
      {
        conversationId: conv.id,
        content: "Hi Lisa! Thanks for reaching out. We'd love to help. When would be a good time for a tech to come take a look?",
        direction: 'OUTBOUND',
        channel: 'SMS',
        aiGenerated: true,
        read: true,
      },
      {
        conversationId: conv.id,
        content: "Maybe Thursday afternoon between 2-5pm?",
        direction: 'INBOUND',
        channel: 'SMS',
        read: false,
      },
    ],
  });

  console.log(`  ✓ Conversations: 1 demo conversation with 3 messages`);

  // ── Workflow template + instance ──────────────────────────────────────

  const template = await prisma.workflowTemplate.upsert({
    where: { slug: 'new-lead-5step-followup' },
    update: {},
    create: {
      slug: 'new-lead-5step-followup',
      name: '5-Step New Lead Follow-Up',
      description: 'Automated SMS drip sequence for new leads over 7 days.',
      category: 'LEAD_FOLLOWUP',
      isBuiltIn: true,
      stepCount: 5,
      definition: {
        trigger: 'lead.created',
        steps: [
          { delay: 0, type: 'sms', template: 'immediate_followup' },
          { delay: 3600, type: 'sms', template: 'first_hour' },
          { delay: 86400, type: 'sms', template: 'day_1' },
          { delay: 259200, type: 'sms', template: 'day_3' },
          { delay: 604800, type: 'sms', template: 'day_7' },
        ],
      },
    },
  });

  await prisma.workflowInstance.upsert({
    where: { id: 'demo-workflow-001' },
    update: {},
    create: {
      id: 'demo-workflow-001',
      organizationId: org.id,
      templateId: template.id,
      clientAccountId: 'demo-client-001',
      name: 'Smith HVAC — New Lead Follow-Up',
      status: 'ACTIVE',
    },
  });

  console.log(`  ✓ Workflow: ${template.name} installed for Smith HVAC`);

  // ── Appointment ───────────────────────────────────────────────────────

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  await prisma.appointment.upsert({
    where: { id: 'demo-appt-001' },
    update: {},
    create: {
      id: 'demo-appt-001',
      organizationId: org.id,
      leadId: 'demo-lead-004',
      clientAccountId: 'demo-client-001',
      title: 'AC Service Consultation',
      scheduledAt: tomorrow,
      durationMinutes: 60,
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
