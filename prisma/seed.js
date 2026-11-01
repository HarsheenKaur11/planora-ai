const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Planora AI demo database...");

  // Clean existing demo data if any
  const existingUser = await prisma.user.findFirst({
    where: { email: "demo@planora.ai" },
  });

  if (existingUser) {
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // Create demo user
  const user = await prisma.user.create({
    data: {
      name: "Aarav & Meera Sharma",
      email: "demo@planora.ai",
      location: "New Delhi, India",
      currency: "INR",
      language: "English",
      preferences: JSON.stringify({
        dietary: "North Indian & Punjabi vegetarian/non-vegetarian balance",
        themeStyle: "Royal, minimalist and floral",
        notifications: true,
      }),
    },
  });

  const now = new Date();
  const eventDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 75); // 75 days in the future

  // Create demo event
  const event = await prisma.event.create({
    data: {
      userId: user.id,
      name: "Aarav & Meera's Royal Punjabi Wedding",
      eventType: "Wedding",
      date: eventDate,
      location: "The Grand Pavilion, Chattarpur, New Delhi",
      guestCount: 250,
      budget: 1200000,
      description:
        "A traditional Punjabi wedding with royal yet minimal aesthetics, fragrant marigold & jasmine floral decors, gourmet North Indian feast, and live Sufi-Punjabi musical entertainment.",
      theme: "Royal Punjabi Elegance (Ivory, Plum & Antique Gold)",
      themeDescription:
        "A timeless celebration balancing Punjabi warmth and regal sophistication with antique brass artifacts, marigold chandeliers, pastel lehengas, and curated Sufi acoustic sets.",
      indoorOutdoor: "Both (Lawn & Banquet)",
      culturalPref: "Punjabi Traditional",
      dietaryPref: "North Indian Gourmet with Live Street Food Counter",
      isDemo: true,
      status: "planning",
    },
  });

  // Seed Expenses
  const expenses = [
    {
      category: "Venue",
      description: "The Grand Pavilion - Lawn & Banquet booking (including basic lighting)",
      estimatedAmount: 350000,
      actualAmount: 350000,
      paymentStatus: "Paid",
    },
    {
      category: "Catering",
      description: "Royal Feast for 250 pax @ ₹1,400 per plate + live counters",
      estimatedAmount: 350000,
      actualAmount: 325000,
      paymentStatus: "Partially Paid",
    },
    {
      category: "Decoration",
      description: "Mandap, Varmala stage, fairy lights, and mogra-marigold entrance",
      estimatedAmount: 180000,
      actualAmount: 190000,
      paymentStatus: "Partially Paid",
    },
    {
      category: "Photography",
      description: "2-Day Candid Photography, Drone Videography & Cinematic Teaser",
      estimatedAmount: 120000,
      actualAmount: 120000,
      paymentStatus: "Partially Paid",
    },
    {
      category: "Entertainment",
      description: "Live Dhol Troupe, DJ setup, and Sufi Acoustic Evening Band",
      estimatedAmount: 65000,
      actualAmount: 55000,
      paymentStatus: "Pending",
    },
    {
      category: "Clothing",
      description: "Bridal Lehenga, Groom Sherwani, and immediate family accessories",
      estimatedAmount: 80000,
      actualAmount: 75000,
      paymentStatus: "Paid",
    },
    {
      category: "Invitations",
      description: "Digital animated invites & custom luxury sweets boxes for close family",
      estimatedAmount: 30000,
      actualAmount: 28000,
      paymentStatus: "Paid",
    },
    {
      category: "Transportation",
      description: "Innova Crysta cabs for airport transfers of outstation guests",
      estimatedAmount: 15000,
      actualAmount: 12000,
      paymentStatus: "Pending",
    },
    {
      category: "Miscellaneous",
      description: "Emergency contingency, safety kits, and tips",
      estimatedAmount: 10000,
      actualAmount: 5000,
      paymentStatus: "Pending",
    },
  ];

  for (const exp of expenses) {
    await prisma.expense.create({
      data: {
        eventId: event.id,
        ...exp,
      },
    });
  }

  // Seed Vendors
  const vendors = [
    {
      name: "The Grand Pavilion Chattarpur",
      category: "Venue",
      contactPerson: "Vikram Malhotra",
      phone: "+91 98101 23456",
      email: "bookings@grandpavilion.in",
      quotation: 360000,
      finalQuotation: 350000,
      bookingStatus: "Booked",
      paymentStatus: "Fully Paid",
      rating: 4.9,
      notes: "Deposit paid. Includes 6 complimentary guest suites and green rooms.",
    },
    {
      name: "Royal Punjab Gourmet Caterers",
      category: "Caterer",
      contactPerson: "Chef Harpreet Singh",
      phone: "+91 98712 34567",
      email: "chefhsingh@royalpunjabcatering.com",
      quotation: 350000,
      finalQuotation: 325000,
      bookingStatus: "Booked",
      paymentStatus: "Advance Paid",
      rating: 4.8,
      notes: "Tasting session completed. Amritsari Kulcha and Dal Makhani were spectacular.",
    },
    {
      name: "Marigold & Petals Decor Studio",
      category: "Decorator",
      contactPerson: "Shreya Sen",
      phone: "+91 99100 87654",
      email: "hello@marigoldpetals.com",
      quotation: 180000,
      finalQuotation: 190000,
      bookingStatus: "Shortlisted",
      paymentStatus: "Unpaid",
      rating: 4.7,
      notes: "Reviewing floral mockups for the circular mandap. Waiting for final contract signoff.",
    },
    {
      name: "Drishti Wedding Films",
      category: "Photographer",
      contactPerson: "Kabir Verma",
      phone: "+91 98200 45678",
      email: "contact@drishtifilms.in",
      quotation: 130000,
      finalQuotation: 120000,
      bookingStatus: "Booked",
      paymentStatus: "Advance Paid",
      rating: 4.9,
      notes: "50% advance deposited. 3 camera operators + 1 drone pilot confirmed.",
    },
    {
      name: "DJ Sahil & Punjabi Dhol Troupe",
      category: "DJ",
      contactPerson: "Sahil Khurana",
      phone: "+91 98111 67890",
      email: "djsahil@beats.in",
      quotation: 65000,
      finalQuotation: 55000,
      bookingStatus: "Negotiating",
      paymentStatus: "Unpaid",
      rating: 4.6,
      notes: "Negotiating inclusion of high-bass sound system for Baraat procession.",
    },
  ];

  for (const v of vendors) {
    await prisma.vendor.create({
      data: {
        eventId: event.id,
        ...v,
      },
    });
  }

  // Seed Tasks
  const tasks = [
    {
      title: "Finalize and lock wedding venue contract",
      description: "Signed contract with The Grand Pavilion and verified curfew guidelines (11:30 PM)",
      category: "Venue",
      priority: "High",
      dueDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20),
      completed: true,
      completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 18),
    },
    {
      title: "Menu tasting session with caterer",
      description: "Sampled starters, main courses, and midnight dessert selections with family",
      category: "Catering",
      priority: "High",
      dueDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
      completed: true,
      completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 9),
    },
    {
      title: "Confirm floral selections for mandap & entrance",
      description: "Ensure fresh marigold, white mogra, and subtle baby's breath are locked in",
      category: "Decoration",
      priority: "Medium",
      dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),
      completed: false,
    },
    {
      title: "Send digital RSVP invitations to guests",
      description: "Broadcast WhatsApp interactive invitations and track guest headcounts",
      category: "Invitations",
      priority: "High",
      dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14),
      completed: false,
    },
    {
      title: "Final bridal lehenga & groom sherwani fitting",
      description: "Check footwear matching and alterations with boutique",
      category: "Outfits",
      priority: "Medium",
      dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 25),
      completed: false,
    },
    {
      title: "Assemble guest welcome hampers with sweets",
      description: "Box fresh Besan Laddoos, dry fruit jars, and personalized thank you note",
      category: "Favors",
      priority: "Low",
      dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 60),
      completed: false,
    },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: {
        eventId: event.id,
        ...t,
      },
    });
  }

  // Seed Timelines
  const timelines = [
    {
      title: "Venue & Master Date Finalization",
      description: "Chattarpur venue locked with lawn + banquet hall for 250 guests",
      date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20),
      status: "Completed",
      timeOfDay: "Morning",
    },
    {
      title: "Catering & Photography Team Booked",
      description: "Advances paid to Royal Punjab Caterers and Drishti Films",
      date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
      status: "Completed",
      timeOfDay: "Afternoon",
    },
    {
      title: "Decor Mockups & Floral Palette Approval",
      description: "Final review of antique brass artifacts and marigold chandeliers",
      date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      status: "In Progress",
      timeOfDay: "Evening",
    },
    {
      title: "Digital Invites & RSVP Confirmation",
      description: "Collect outstation travel dates and dietary preferences",
      date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 20),
      status: "Upcoming",
      timeOfDay: "All Day",
    },
    {
      title: "Event Day: Haldi & Chooda Ceremony",
      description: "Yellow floral lawn decor, dhol beats, and phoolon ki holi",
      date: new Date(eventDate.getTime() - 1000 * 60 * 60 * 4),
      status: "Upcoming",
      timeOfDay: "10:30 AM",
    },
    {
      title: "Event Day: Baraat Arrival & Milni",
      description: "Groom procession with live brass band followed by rose petal shower",
      date: eventDate,
      status: "Upcoming",
      timeOfDay: "06:30 PM",
    },
    {
      title: "Event Day: Varmala & Royal Dinner",
      description: "Rotating stage varmala, gourmet dinner buffet with live counters",
      date: eventDate,
      status: "Upcoming",
      timeOfDay: "08:30 PM",
    },
  ];

  for (const tl of timelines) {
    await prisma.timeline.create({
      data: {
        eventId: event.id,
        ...tl,
      },
    });
  }

  // Seed Ideas
  const ideas = [
    {
      category: "Decoration",
      title: "Antique Brass Urli & Diya Pathway",
      description: "Line the main lawn pathway with antique brass Urli bowls filled with fresh mogra, floating golden Diyas, and marigold petals for a warm Punjabi welcome.",
      tags: "Entrance, Floral, Traditional",
      saved: true,
    },
    {
      category: "Catering",
      title: "Live Amritsari Kulcha & Midnight Rabdi Jalebi",
      description: "An authentic clay tandoor counter serving chur-chur naan and piping hot jalebis with thick saffron rabdi during the late night pheras.",
      tags: "Food, Live Counter, Punjabi",
      saved: true,
    },
    {
      category: "Entertainment",
      title: "Sufi-Folk Acoustic Fusion for Cocktail Hour",
      description: "A 3-piece acoustic band blending Bulleh Shah poetry with soulful acoustic guitar and flute during the guest reception hour.",
      tags: "Music, Live Band, Sufi",
      saved: true,
    },
    {
      category: "Guest Experience",
      title: "Personalized Punjabi Jutti Valet",
      description: "A pop-up stall offering comfortable handcrafted Punjabi juttis in various sizes so guests can dance the night away without heel fatigue.",
      tags: "Hospitality, Dance, Favors",
      saved: true,
    },
  ];

  for (const idea of ideas) {
    await prisma.idea.create({
      data: {
        eventId: event.id,
        ...idea,
      },
    });
  }

  // Seed Chat Messages
  await prisma.chatMessage.create({
    data: {
      eventId: event.id,
      role: "assistant",
      content:
        "Sat Sri Akal! Welcome to your Royal Punjabi Wedding planning hub. I am your Planora AI assistant. Your budget is ₹12,00,000 for 250 guests. We currently have ₹11,60,000 in committed expenses with ₹40,000 in reserve. How can I assist you today? You can ask me to optimize catering costs, draft an itinerary, or recommend unique entertainment ideas!",
    },
  });

  console.log("Demo seed successfully completed! Demo event ID:", event.id);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
