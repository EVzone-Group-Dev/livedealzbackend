import { PrismaClient, UserRole, SessionStatus, SellMode, SessionKind, GiveawayStatus, ChatMessageKind, PollStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // 1. Create Creators/Hosts
  const creator1 = await prisma.user.upsert({
    where: { email: 'creator@evzone.com' },
    update: {},
    create: {
      email: 'creator@evzone.com',
      handle: 'ev_master',
      fullName: 'Alex Strom',
      role: UserRole.CREATOR,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    },
  });

  const creator2 = await prisma.user.upsert({
    where: { email: 'creator2@evzone.com' },
    update: {},
    create: {
      email: 'creator2@evzone.com',
      handle: 'tech_guru',
      fullName: 'Sarah Chen',
      role: UserRole.CREATOR,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
  });

  const creator3 = await prisma.user.upsert({
    where: { email: 'creator3@evzone.com' },
    update: {},
    create: {
      email: 'creator3@evzone.com',
      handle: 'urban_rider',
      fullName: 'Marcus Vane',
      role: UserRole.CREATOR,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    },
  });

  // 1.5 Create Buyers
  const buyer1 = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      handle: 'buyer_one',
      fullName: 'John Buyer',
      role: UserRole.CREATOR, // Just for demo
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    },
  });

  const buyer2 = await prisma.user.upsert({
    where: { email: 'buyer2@example.com' },
    update: {},
    create: {
      email: 'buyer2@example.com',
      handle: 'shopaholic',
      fullName: 'Emily Smith',
      role: UserRole.CREATOR,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    },
  });

  const buyer3 = await prisma.user.upsert({
    where: { email: 'buyer3@example.com' },
    update: {},
    create: {
      email: 'buyer3@example.com',
      handle: 'gadget_fan',
      fullName: 'David Miller',
      role: UserRole.CREATOR,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    },
  });


  // 2. Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'EV Zone Global',
      note: 'Primary hardware and service provider',
      ownerId: creator1.id,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'ElectroGear Ltd',
      note: 'Specialized in charging solutions and accessories',
      ownerId: creator2.id,
    },
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      name: 'Urban Mobility Co',
      note: 'Alternative transport solutions',
      ownerId: creator3.id,
    },
  });


  // 3. Create a Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Tech Gala 2026',
      note: 'Annual flagship product launch event',
      supplierId: supplier1.id,
    },
  });

  // 4. Create Products with Goals
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'EV-1 Smart Scooter',
        description: 'Next-gen electric urban mobility',
        price: 1200000,
        currency: 'UGX',
        image: 'https://images.unsplash.com/photo-1595433707802-6806f3f00a98',
        sellMode: SellMode.RETAIL,
        campaignId: campaign.id,
        kind: 'product',
        goalMetric: 'sold',
        goalTarget: 25,
        shippingFlag: '🇹🇷',
        shippingCode: 'TR',
        shippingEta: '4-6 Days',
        availability: 'Ready to ship',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hyper-Charger Pro',
        description: 'Ultra-fast 200W home charger',
        price: 350000,
        currency: 'UGX',
        image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7',
        sellMode: SellMode.RETAIL,
        campaignId: campaign.id,
        kind: 'product',
        goalMetric: 'combined',
        goalTarget: 50,
        shippingFlag: '🇨🇳',
        shippingCode: 'CN',
        shippingEta: '8-12 Days',
        availability: 'In Stock',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Maintenance Service',
        description: 'Professional 12-month checkup',
        price: 50000,
        currency: 'UGX',
        image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
        sellMode: SellMode.RETAIL,
        campaignId: campaign.id,
        kind: 'service',
        goalMetric: 'booked',
        goalTarget: 15,
        shippingFlag: '🇺🇬',
        shippingCode: 'UG',
        shippingEta: '1-2 Days',
        availability: 'Available Now',
      },
    }),

  ]);

  // 5. Create a Live Session
  const session = await prisma.session.create({
    data: {
      name: 'Tech Gala Main Stage',
      note: 'The main event keynote and live selling',
      campaignId: campaign.id,
      hostId: creator1.id,
      status: SessionStatus.LIVE,
      scheduledStart: new Date(),
      actualStart: new Date(),
      totalMinutes: 45,
      connection: 'Excellent',
      coupon: 'GALA2026',
      teleprompter: `Welcome everyone to the Tech Gala 2026! 🚀
Today we are redefining urban mobility with the EV-1 Smart Scooter.
Use code GALA2026 for an instant 15% discount on checkout.
Let's dive into the Hyper-Charger Pro demo.
Repeat: Check the pinned product for live specs.`,
      focusProductId: products[0].id,
    },
  });

  // 6. Create Session Plan and Segments (Run-of-Show)
  const plan = await prisma.sessionPlan.create({
    data: {
      sessionId: session.id,
      liveWideNote: 'Keep the energy high, focus on the scooter value proposition.',
      segments: {
        create: [
          {
            title: 'Event Kickoff',
            type: 'intro',
            durationMin: 5,
            teleprompterNote: 'Lead with the mission statement and event overview.',
            order: 1,
          },
          {
            title: 'Hyper-Charger Demo',
            type: 'demo',
            durationMin: 10,
            teleprompterNote: 'Show the fast-charge capability live on camera.',
            order: 2,
          },
          {
            title: 'EV-1 Scooter Deep Dive',
            type: 'hero',
            durationMin: 20,
            teleprompterNote: 'Feature focus: Battery range and smart app integration.',
            order: 3,
          },
          {
            title: 'Q&A & Final CTA',
            type: 'outro',
            durationMin: 10,
            teleprompterNote: 'Answer community questions and push the coupon code.',
            order: 4,
          },
        ],
      },
    },
  });

  // 7. Initialize Chat Room
  await prisma.chatRoom.create({
    data: {
      sessionId: session.id,
    },
  });

  // 8. Create Scenes
  const scenes = await Promise.all([
    prisma.scene.create({
      data: {
        sessionId: session.id,
        name: 'Intro + Host',
        sources: 4,
        config: { layout: 'wide' },
      },
    }),
    prisma.scene.create({
      data: {
        sessionId: session.id,
        name: 'Product Close-up',
        sources: 2,
        config: { layout: 'split' },
      },
    }),
  ]);

  // 9. Update Session with active scene and filters
  await prisma.session.update({
    where: { id: session.id },
    data: {
      activeSceneId: scenes[0].id,
      activeFilters: {
        beauty: 'soft-glam',
        background: 'blur-medium',
      },
    },
  });

  // 10. Seed Audience Content (Giveaway & Q&A)
  const mainGiveaway = await prisma.giveaway.create({
    data: {
      title: 'Main Event Giveaway',
      prizeName: 'EV-1 Smart Scooter (1-Month Lease)',
      prizeImage: 'https://images.unsplash.com/photo-1595433707802-6806f3f00a98',
      count: 1,
      sessionId: session.id,
      status: GiveawayStatus.OPEN,
    },
  });

  await prisma.qAQuestion.createMany({
    data: [
      {
        sessionId: session.id,
        userId: buyer1.id,
        content: 'What is the maximum range of the EV-1 on a single charge?',
        isPinned: true,
      },
      {
        sessionId: session.id,
        userId: buyer2.id,
        content: 'Is there a student discount available?',
        isAnswered: true,
      },
    ],
  });

  // 11. Seed Chat Messages
  const chatRoom = await prisma.chatRoom.findUnique({ where: { sessionId: session.id } });
  if (chatRoom) {
    await prisma.chatMessage.createMany({
      data: [
        {
          roomId: chatRoom.id,
          userId: buyer1.id,
          content: 'Wow, that scooter looks amazing! 🔥',
          createdAt: new Date(Date.now() - 1000 * 60 * 5),
        },
        {
          roomId: chatRoom.id,
          userId: buyer2.id,
          content: 'Can we see the storage compartment?',
          createdAt: new Date(Date.now() - 1000 * 60 * 4),
        },
        {
          roomId: chatRoom.id,
          userId: creator1.id,
          content: 'Welcome everyone! We will show the storage in just a minute.',
          createdAt: new Date(Date.now() - 1000 * 60 * 3),
        },
        {
          roomId: chatRoom.id,
          userId: buyer3.id,
          content: 'Joined the giveaway! Fingers crossed 🤞',
          kind: ChatMessageKind.GIVEAWAY_ENTRY,
          createdAt: new Date(Date.now() - 1000 * 60 * 2),
        },
      ],
    });
  }

  // 12. Seed Polls
  const poll1 = await prisma.poll.create({
    data: {
      question: 'Which color of the EV-1 do you prefer?',
      sessionId: session.id,
      status: PollStatus.ACTIVE,
      options: {
        create: [
          { label: 'Matte Black' },
          { label: 'Electric Blue' },
          { label: 'Solar White' },
        ],
      },
    },
    include: { options: true },
  });

  // Add some mock votes
  await prisma.pollVote.createMany({
    data: [
      { optionId: poll1.options[0].id, userId: buyer1.id },
      { optionId: poll1.options[0].id, userId: buyer2.id },
      { optionId: poll1.options[1].id, userId: buyer3.id },
    ],
  });

  const poll2 = await prisma.poll.create({
    data: {
      question: 'Should we do a midnight launch event?',
      sessionId: session.id,
      status: PollStatus.DRAFT,
      options: {
        create: [
          { label: 'Yes, absolutely!' },
          { label: 'No, morning is better.' },
        ],
      },
    },
  });

  // 13. Create a Shoppable Ad
  const shoppableAd = await prisma.session.create({
    data: {
      kind: SessionKind.AD,
      name: 'Summer Glow Skincare Teaser',
      note: 'High-production value teaser for upcoming drop',
      campaignId: campaign.id,
      hostId: creator1.id,
      status: SessionStatus.SCHEDULED,
      scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h from now
      heroImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881',
      teaserVideo: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      customCta: 'TRANSFORM YOUR SKIN. THE COUNTDOWN TO RADIANCE BEGINS.',
    },
  });


  await prisma.follow.upsert({

    where: { followerId_followingId: { followerId: buyer1.id, followingId: creator1.id } },
    update: {},
    create: { followerId: buyer1.id, followingId: creator1.id },
  });

  await prisma.savedSession.upsert({
    where: { userId_sessionId: { userId: buyer1.id, sessionId: shoppableAd.id } },
    update: {},
    create: { userId: buyer1.id, sessionId: shoppableAd.id },
  });

  // 14. Addresses for Buyer
  await prisma.address.createMany({
    data: [
      {
        userId: buyer1.id,
        label: 'Home (Primary)',
        recipient: 'John Buyer',
        line1: 'Plot 12, Acacia Avenue',
        city: 'Kampala',
        country: 'Uganda',
        isDefault: true,
      },
      {
        userId: buyer1.id,
        label: 'Office',
        recipient: 'John Buyer',
        line1: 'Innovation Hub, Victoria Road',
        city: 'Entebbe',
        country: 'Uganda',
        isDefault: false,
      },
    ],
  });

  // 15. Watch History
  await prisma.watchHistory.upsert({
    where: { userId_sessionId: { userId: buyer1.id, sessionId: session.id } },
    update: {},
    create: { userId: buyer1.id, sessionId: session.id },
  });


  // 16. Giveaway Winners
  await prisma.giveawayWinner.upsert({
    where: { userId_giveawayId: { userId: buyer1.id, giveawayId: mainGiveaway.id } },
    update: {},
    create: { 
      userId: buyer1.id, 
      giveawayId: mainGiveaway.id,
      status: 'Claimed'
    },
  });


  // 17. Supplier Performance
  await prisma.supplierPerformance.upsert({

    where: { supplierId: supplier1.id },
    update: {},
    create: {
      supplierId: supplier1.id,
      onTimeDelivery: 0.98,
      responseTime: 5,
      refundRate: 0.01,
      overallScore: 4.9,
    },
  });


  console.log('✅ Seed complete!');
  console.log(`   - Live Session ID: ${session.id}`);
  console.log(`   - Shoppable Ad ID: ${shoppableAd.id}`);
  console.log(`   - Main Buyer ID: ${buyer1.id}`);
  console.log(`   - More Creators seeded: creator2, creator3`);
  console.log(`   - More Suppliers seeded: supplier2, supplier3`);
  console.log(`   - More Buyers seeded: buyer2, buyer3`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
