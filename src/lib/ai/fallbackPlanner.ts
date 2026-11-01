import { EventInput, PlanOutput } from "./types";

interface CategoryAllocation {
  category: string;
  share: number; // percentage
  vendorTitle: string;
  notes: string;
}

const CATEGORY_DISTRIBUTION: Record<string, CategoryAllocation[]> = {
  Wedding: [
    { category: "Venue", share: 30, vendorTitle: "Heritage Banquet or Palace Lawn", notes: "Indoor AC hall + open lawn for reception and mandap" },
    { category: "Catering", share: 30, vendorTitle: "Royal Indian & Continental Feast Caterers", notes: "Multi-cuisine live counters, chaat street, sweets counter" },
    { category: "Decoration", share: 15, vendorTitle: "Floral & Thematic Stage Designers", notes: "Mandap flowers, fairy lights, floral pathway, photo-ops" },
    { category: "Photography", share: 10, vendorTitle: "Cinematic Wedding & Candid Studio", notes: "2-day photo+video, drone coverage, teaser video" },
    { category: "Entertainment", share: 5, vendorTitle: "DJ Setup & Live Punjabi/Folk Dhol Artists", notes: "Sound setup, dance floor, live performers" },
    { category: "Clothing", share: 5, vendorTitle: "Designer Outfits & Bridal Trouseau", notes: "Bridal lehenga, groom sherwani, styling" },
    { category: "Invitations", share: 2.5, vendorTitle: "Bespoke Invitation & E-Card Designers", notes: "Luxury boxed invites or animated interactive save-the-dates" },
    { category: "Miscellaneous", share: 2.5, vendorTitle: "Logistics & Emergency Contingency", notes: "Tips, local transport cabs, emergency kit buffer" },
  ],
  Birthday: [
    { category: "Venue", share: 25, vendorTitle: "Boutique Party Hall or Rooftop Cafe", notes: "Air-conditioned party space with seating and sound" },
    { category: "Catering", share: 35, vendorTitle: "Gourmet Party Buffet & Live Snacks", notes: "Finger foods, main course, mocktail bar" },
    { category: "Decoration", share: 15, vendorTitle: "Theme Balloon & LED Backdrop Decorators", notes: "Balloon arches, neon signage, custom cake table" },
    { category: "Cake & Desserts", share: 10, vendorTitle: "Custom Themed Artisanal Baker", notes: "Multi-tier thematic designer cake and cupcakes" },
    { category: "Entertainment", share: 10, vendorTitle: "Emcee, Magic/Game Show & DJ", notes: "Kids interactive games, sound system, party music" },
    { category: "Gifts", share: 5, vendorTitle: "Return Favors & Souvenirs", notes: "Personalized curated return gift hampers" },
  ],
  Corporate: [
    { category: "Venue", share: 35, vendorTitle: "Executive Conference Center or 5-Star Hotel", notes: "Audio-visual equipped conference ballroom" },
    { category: "Catering", share: 30, vendorTitle: "Executive Buffet & High-Tea Caterer", notes: "Morning coffee break, gourmet luncheon, evening canapes" },
    { category: "Audio-Visual & Tech", share: 15, vendorTitle: "AV Production & Stage Tech", notes: "LED wall, wireless podium mics, live streaming" },
    { category: "Branding & Collateral", share: 10, vendorTitle: "Event Collateral & Signage Printers", notes: "Standees, badges, stage backdrops, delegate kits" },
    { category: "Entertainment/Speakers", share: 10, vendorTitle: "Keynote Speaker or Corporate Host", notes: "Professional moderator and team engagement" },
  ],
  Anniversary: [
    { category: "Venue", share: 30, vendorTitle: "Intimate Garden Lounge or Lakeside Venue", notes: "Romantic ambience with private dining area" },
    { category: "Catering", share: 30, vendorTitle: "Curated Multi-Course Gourmet Dining", notes: "Cocktail appetizers, plated main course, dessert buffet" },
    { category: "Decoration", share: 15, vendorTitle: "Warm Vintage Fairy Light & Floral Stylists", notes: "Candlelit tables, photo memory wall, fairy lights" },
    { category: "Photography", share: 15, vendorTitle: "Couple Portrait & Candid Photographer", notes: "Memory video screening, couple shoot, guest portraits" },
    { category: "Entertainment", share: 10, vendorTitle: "Acoustic Live Band or Violinist", notes: "Soothing live acoustic melodies and romantic hits" },
  ],
};

export function generateDeterministicPlan(input: EventInput): PlanOutput {
  const eventType = input.eventType;
  const budget = typeof input.budget === "number" && input.budget >= 0 ? input.budget : 500000;
  const guestCount = input.guestCount || 100;
  const location = input.location || "India";
  const distribution = CATEGORY_DISTRIBUTION[eventType] || CATEGORY_DISTRIBUTION.Wedding;

  // Calculate days until event
  const eventDate = new Date(input.date);
  const now = new Date();
  const diffDays = Math.max(1, Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Theme recommendations
  let themeName = input.preferredTheme || "Royal Ivory & Champagne Elegance";
  let themeDescription = `A tasteful, premium aesthetic tailored for ${eventType} in ${location}, marrying warm ivory palettes with deep plum and champagne gold accents.`;

  if (eventType === "Birthday") {
    themeName = input.preferredTheme || "Starry Enchantment / Vibrant Carnival";
    themeDescription = `An immersive, joyous celebration featuring vibrant pastel hues, sparkling fairy lights, and interactive celebratory elements designed for ${guestCount} guests.`;
  } else if (eventType === "Corporate event") {
    themeName = input.preferredTheme || "Executive Modern Horizon";
    themeDescription = `A sleek, high-impact corporate aesthetic highlighting minimalist lines, ergonomic delegate comfort, and sharp audio-visual stagecraft.`;
  } else if (eventType === "Anniversary") {
    themeName = input.preferredTheme || "Golden Timeless Romance";
    themeDescription = `An intimate candlelit ambience reflecting years of love, adorned with warm florals, memory gallery corners, and acoustic melodies.`;
  }

  // Budget Breakdown
  const budget_breakdown = distribution.map((item) => {
    const allocated = Math.round((budget * item.share) / 100);
    return {
      category: item.category,
      allocated_amount: allocated,
      percentage: item.share,
      description: `${item.share}% allocated for ${item.category.toLowerCase()} (${item.notes}). Target budget: ₹${allocated.toLocaleString("en-IN")}.`,
    };
  });

  // Vendors
  const vendor_categories = distribution.map((item) => ({
    name: `${item.vendorTitle} (${location})`,
    category: item.category,
    estimated_budget: Math.round((budget * item.share) / 100),
    notes: item.notes,
  }));

  // Intelligent Timeline adaptation based on diffDays
  const preparation_timeline: PlanOutput["preparation_timeline"] = [];
  if (diffDays >= 90) {
    preparation_timeline.push(
      {
        title: "Lock Venue & Finalize Event Date",
        timeframe: `${Math.round(diffDays * 0.8)} days before`,
        days_before_event: Math.round(diffDays * 0.8),
        description: "Inspect top 3 shortlisted venues, verify parking capacity, and place initial booking deposit.",
        time_of_day: "Morning",
      },
      {
        title: "Book Lead Caterer & Photo/Cinema Team",
        timeframe: `${Math.round(diffDays * 0.6)} days before`,
        days_before_event: Math.round(diffDays * 0.6),
        description: "Conduct menu tastings, confirm catering plate counts, and schedule pre-event photo sessions.",
        time_of_day: "Afternoon",
      },
      {
        title: "Theme & Decor Production Sign-off",
        timeframe: `${Math.round(diffDays * 0.4)} days before`,
        days_before_event: Math.round(diffDays * 0.4),
        description: "Approve stage 3D renders, floral arrangements, light styling, and seating floor plans.",
        time_of_day: "Evening",
      },
      {
        title: "Digital Invites & RSVP Rollout",
        timeframe: `${Math.round(diffDays * 0.25)} days before`,
        days_before_event: Math.round(diffDays * 0.25),
        description: "Send personalized WhatsApp/Email invitations with location links and collect meal preferences.",
        time_of_day: "All Day",
      },
      {
        title: "Final Vendor Rehearsal & Logistics Check",
        timeframe: "7 days before",
        days_before_event: 7,
        description: "Verify payment milestones, vendor call-times, sound check permissions, and emergency kits.",
        time_of_day: "Morning",
      }
    );
  } else if (diffDays >= 30) {
    preparation_timeline.push(
      {
        title: "Urgent Venue & Caterer Confirmation",
        timeframe: `${Math.round(diffDays * 0.7)} days before`,
        days_before_event: Math.round(diffDays * 0.7),
        description: "Fast-track venue and food vendor lock-in to secure calendar slot.",
        time_of_day: "Morning",
      },
      {
        title: "Decor & Photography Contracting",
        timeframe: `${Math.round(diffDays * 0.5)} days before`,
        days_before_event: Math.round(diffDays * 0.5),
        description: "Finalize photo crew and agree upon expedited decoration layouts.",
        time_of_day: "Afternoon",
      },
      {
        title: "Send Instant E-Invites",
        timeframe: `${Math.round(diffDays * 0.3)} days before`,
        days_before_event: Math.round(diffDays * 0.3),
        description: "Broadcast invitations to guests and begin tracking confirmations.",
        time_of_day: "All Day",
      },
      {
        title: "Comprehensive Final Dry-Run",
        timeframe: "3 days before",
        days_before_event: 3,
        description: "Synchronize all vendor delivery schedules and backup contingencies.",
        time_of_day: "Evening",
      }
    );
  } else {
    // Short notice event (under 30 days)
    preparation_timeline.push(
      {
        title: "Day 1: Instant Venue & Catering Lock",
        timeframe: `${Math.round(diffDays * 0.8)} days before`,
        days_before_event: Math.round(diffDays * 0.8),
        description: "Reserve all-inclusive venue package with in-house catering to compress turnaround.",
        time_of_day: "Morning",
      },
      {
        title: "Day 2: Ready-Made Decor & Sound Pack",
        timeframe: `${Math.round(diffDays * 0.5)} days before`,
        days_before_event: Math.round(diffDays * 0.5),
        description: "Select pre-configured floral and lighting kits for rapid setup.",
        time_of_day: "Afternoon",
      },
      {
        title: "Day 3: Digital Broadcast Invitations",
        timeframe: `${Math.round(diffDays * 0.3)} days before`,
        days_before_event: Math.round(diffDays * 0.3),
        description: "Direct phone call and WhatsApp RSVP tracking for immediate attendance count.",
        time_of_day: "All Day",
      },
      {
        title: "24 Hours Before: Final Countdown & Arrival Sync",
        timeframe: "1 day before",
        days_before_event: 1,
        description: "Confirm arrival times of key family, vendors, and audio technician.",
        time_of_day: "Evening",
      }
    );
  }

  // Checklist Tasks
  const checklist = [
    {
      title: `Finalize venue contract & deposit (${location})`,
      category: "Venue",
      priority: "High" as const,
      days_before_event: Math.min(diffDays, 60),
      description: "Ensure written confirmation of hall timings, power backup, and air conditioning.",
    },
    {
      title: `Confirm guest list (${guestCount} guests planned)`,
      category: "Guest Management",
      priority: "High" as const,
      days_before_event: Math.min(diffDays, 45),
      description: "Segregate outstation guests requiring transport or hotel rooms.",
    },
    {
      title: "Menu tasting and dietary checks",
      category: "Catering",
      priority: "High" as const,
      days_before_event: Math.min(diffDays, 30),
      description: `Validate options for ${input.dietaryPreferences || "vegetarian and non-vegetarian selections"}.`,
    },
    {
      title: "Confirm stage, lighting, and floral theme mockups",
      category: "Decoration",
      priority: "Medium" as const,
      days_before_event: Math.min(diffDays, 20),
      description: `Align colors with ${themeName}.`,
    },
    {
      title: "Coordinate sound system, playlist, and emcee schedule",
      category: "Entertainment",
      priority: "Medium" as const,
      days_before_event: Math.min(diffDays, 14),
      description: "Review microphone count, entrance song, and background dinner ambience.",
    },
    {
      title: "Prepare emergency day-of kit and cash envelopes",
      category: "Operations",
      priority: "Low" as const,
      days_before_event: Math.min(diffDays, 3),
      description: "Pack safety pins, extra phone chargers, medical kit, and vendor settlement cash.",
    },
  ];

  // Event Day Schedule
  const event_day_schedule = [
    {
      time: "09:00 AM",
      activity: "Vendor Access & Decor Installation",
      description: "Florists, stage lighting technicians, and backdrop setup begin on site.",
    },
    {
      time: "01:00 PM",
      activity: "Audio-Visual & Soundcheck",
      description: "DJ and sound engineers test wireless microphones, speakers, and power backups.",
    },
    {
      time: "04:30 PM",
      activity: "Catering Setup & Live Station Prep",
      description: "Beverage stations, appetizer live counters, and banquet table settings arranged.",
    },
    {
      time: "06:30 PM",
      activity: "Guest Welcome & Welcome Drinks",
      description: "Welcome hostesses, traditional music, refreshing mocktails, and pass-around canapes.",
    },
    {
      time: "07:45 PM",
      activity: "Main Ceremony / Highlight Program",
      description: "Key milestone ceremony, couple entry, speeches, or thematic cake cutting.",
    },
    {
      time: "08:45 PM",
      activity: "Grand Dinner Buffet Opens",
      description: "Multi-course feast served with live culinary counters and dessert stations.",
    },
    {
      time: "10:30 PM",
      activity: "Dance Floor & Celebrations",
      description: "High-energy music, photo booth sessions, and celebratory dancing.",
    },
  ];

  // Personalized Ideas
  const personalized_ideas = [
    {
      category: "Decoration",
      title: "Warm Ivory & Champagne Floral Canopy",
      description: `Design a statement focal point using cascading white flowers, warm Edison bulbs, and brass accents to complement ${themeName}.`,
      tags: ["Floral", "Lighting", "Atmosphere"],
    },
    {
      category: "Catering",
      title: "Interactive Regional Live Tasting Station",
      description: `Feature signature delicacies reflecting ${input.culturalPreferences || "Indian heritage"} with live artisanal cooking that keeps guests engaged.`,
      tags: ["Food", "Live Counter", "Crowd Pleaser"],
    },
    {
      category: "Guest Experience",
      title: "Digital Memory Wall & Polaroid Guestbook",
      description: "Set up a warm nook with instant cameras where guests snap photos, write heartfelt messages, and clip them to fairy light ropes.",
      tags: ["Memories", "Interactive", "Keepsake"],
    },
    {
      category: "Entertainment",
      title: "Surprise Acoustic Entry & Curated Playlist",
      description: "Welcome guests with soothing acoustic instruments (violin or flute) before switching to high-energy celebratory beats.",
      tags: ["Music", "Live Band", "Vibe"],
    },
  ];

  const recommendations = [
    `Lock your venue in ${location} as early as possible to guarantee your preferred date.`,
    `Budget reserve: Keep 5% (approx ₹${Math.round(budget * 0.05).toLocaleString("en-IN")}) unallocated for last-minute guest additions.`,
    `Schedule a comprehensive vendor dry-run 3 days prior to avoid event-day miscommunication.`,
    `Designate a trusted family member or day-of coordinator as the single point of contact for vendor payments.`,
  ];

  return {
    event_summary: `Personalized plan for "${input.name}", an exquisite ${eventType} in ${location} for ${guestCount} guests with an allocated budget of ₹${budget.toLocaleString("en-IN")}.`,
    recommended_theme: themeName,
    theme_description: themeDescription,
    estimated_budget: budget,
    budget_breakdown,
    preparation_timeline,
    vendor_categories,
    checklist,
    event_day_schedule,
    personalized_ideas,
    recommendations,
  };
}
