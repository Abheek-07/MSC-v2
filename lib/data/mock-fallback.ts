export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  type: string;
  status: 'upcoming' | 'completed';
  date_start: string;
  date_end: string;
  image_url: string;
  banner_url?: string;
  registration_open: boolean;
  show_opening_soon: boolean;
  is_published: boolean;
  max_capacity: number;
  form_requirements: {
    event_pricing: 'free' | 'paid';
    registration_fee?: number; // in INR
    charge_type?: 'per_person' | 'per_team';
    allow_teams?: boolean;
    max_team_size?: number;
    allow_external_students?: boolean;
    req_reg_num?: boolean;
    req_branch?: boolean;
    req_spec?: boolean;
    provide_certificates?: boolean;
    agenda?: { time: string; title: string; desc: string }[];
    speakers?: { name: string; title: string; company: string; image_url?: string }[];
  };
  certificate_html?: string;
  gallery_urls: string[];
}

export interface TeamMemberItem {
  id: string;
  name: string;
  role: string;
  tier: 'chief' | 'board' | 'lead' | 'member';
  category: string;
  email?: string;
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  portfolio_url?: string;
  image_url?: string;
  display_order?: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image_url: string;
  alt_text: string;
}

export const FALLBACK_EVENTS: EventItem[] = [
  {
    id: 'e1000000-0000-0000-0000-000000000001',
    title: "SYNORA '26 — National Hackathon",
    slug: 'synora-26',
    description:
      "MSC SRM AP's flagship national hackathon. Formula-1 pit stop engineering meets distributed systems, agentic AI, and Azure cloud computing. 36 hours of non-stop building, industry mentorship, and real-world deployment.",
    location: 'Central Block Auditorium, SRM University AP',
    type: 'Hackathon',
    status: 'upcoming',
    date_start: '2026-10-15T09:00:00Z',
    date_end: '2026-10-16T21:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    banner_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80',
    registration_open: true,
    show_opening_soon: false,
    is_published: true,
    max_capacity: 400,
    form_requirements: {
      event_pricing: 'free',
      registration_fee: 0,
      charge_type: 'per_team',
      allow_teams: true,
      max_team_size: 4,
      allow_external_students: true,
      req_reg_num: true,
      req_branch: true,
      req_spec: true,
      provide_certificates: true,
      agenda: [
        { time: '09:00 AM', title: 'Check-in & Pitstop Breakfast', desc: 'Badge scan and team kit distribution' },
        { time: '10:30 AM', title: 'Opening Keynote & Problem Statements', desc: 'Azure AI challenges and sponsor tracks reveal' },
        { time: '12:00 PM', title: 'Hacking Commences', desc: 'Sprint Round 1 with cloud mentors' },
        { time: '06:00 PM', title: 'Checkpoint Mentorship', desc: 'Technical architecture review with industry engineers' },
        { time: '10:00 AM Next Day', title: 'Code Freeze & Grand Finale Pitches', desc: 'Final prototype demonstrations' },
      ],
      speakers: [
        { name: 'Dr. Murali Krishna Enduri', title: 'Faculty Advisor & Head of Dept', company: 'SRM University AP' },
        { name: 'Dr. CV Tomy', title: 'Faculty Advisor & Professor', company: 'SRM University AP' },
        { name: 'Jayanth Ramakrishnan', title: 'MSC Founder & Cloud Engineer', company: 'MSC Alumni' },
      ],
    },
    certificate_html: `
      <div style="width: 1000px; height: 700px; padding: 50px; background: #fffdfb; border: 12px solid #0067b8; font-family: 'Segoe UI', system-ui, sans-serif; box-sizing: border-box; position: relative;">
        <div style="border: 2px solid #dceef8; height: 100%; padding: 40px; box-sizing: border-box; text-align: center; position: relative;">
          <h4 style="color: #0067b8; letter-spacing: 4px; text-transform: uppercase; margin: 0; font-size: 14px;">Microsoft Student Community &bull; SRM University AP</h4>
          <h1 style="color: #17253d; font-size: 44px; margin: 20px 0 10px 0; font-weight: 600;">CERTIFICATE OF PARTICIPATION</h1>
          <p style="color: #616161; font-size: 16px; margin-bottom: 30px;">This certificate is proudly awarded to</p>
          <h2 style="color: #0067b8; font-size: 38px; border-bottom: 2px solid #0067b8; display: inline-block; padding-bottom: 8px; margin: 0 0 20px 0;">{{NAME}}</h2>
          <p style="color: #17253d; font-size: 17px; max-width: 700px; margin: 0 auto; line-height: 1.6;">
            for successfully participating and engineering cutting-edge solutions at <strong>{{EVENT_TITLE}}</strong>, representing <strong>{{COLLEGE_NAME}}</strong> held on <strong>{{EVENT_DATE}}</strong>.
          </p>
          <div style="position: absolute; bottom: 30px; left: 40px; right: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="text-align: center;">
              <p style="border-top: 1px solid #737373; width: 180px; padding-top: 6px; font-size: 13px; color: #17253d; margin: 0;">Faculty Advisor<br/><strong>Dr. Murali Krishna Enduri</strong></p>
            </div>
            <div style="text-align: center;">
              <span style="font-size: 12px; color: #737373;">Official MSC Chapter '26 Verification</span>
            </div>
            <div style="text-align: center;">
              <p style="border-top: 1px solid #737373; width: 180px; padding-top: 6px; font-size: 13px; color: #17253d; margin: 0;">Faculty Advisor<br/><strong>Dr. CV Tomy</strong></p>
            </div>
          </div>
        </div>
      </div>
    `,
    gallery_urls: [
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    id: 'e1000000-0000-0000-0000-000000000002',
    title: 'Azure Cloud & Distributed Systems BootCamp',
    slug: 'azure-cloud-bootcamp',
    description:
      'A hands-on intensive workshop navigating microservices architectures, Azure Kubernetes Service (AKS), and serverless event-driven designs. Build and deploy real-world APIs with CI/CD.',
    location: 'Lab 4, AL & ML Block, SRM University AP',
    type: 'Workshop',
    status: 'upcoming',
    date_start: '2026-11-05T14:00:00Z',
    date_end: '2026-11-05T18:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    registration_open: true,
    show_opening_soon: false,
    is_published: true,
    max_capacity: 120,
    form_requirements: {
      event_pricing: 'free',
      registration_fee: 0,
      allow_teams: false,
      allow_external_students: true,
      req_reg_num: true,
      req_branch: true,
      provide_certificates: true,
      agenda: [
        { time: '02:00 PM', title: 'Azure Fundamentals & Core Compute', desc: 'VMs vs Containers vs Serverless' },
        { time: '03:15 PM', title: 'Hands-on: Deploying Microservices', desc: 'Azure Container Apps and Traffic Routing' },
        { time: '05:00 PM', title: 'Q&A and Cloud Certifications Roadmap', desc: 'AZ-900 & AZ-204 guidance' },
      ],
    },
    gallery_urls: [],
  },
  {
    id: 'e1000000-0000-0000-0000-000000000003',
    title: 'Generative AI & Agentic Workflows Summit',
    slug: 'genai-agentic-summit',
    description:
      'Deep dive into Azure OpenAI, Semantic Kernel, and autonomous multi-agent software development. From prompt engineering to fine-tuning and retrieval augmented generation (RAG).',
    location: 'Mini Auditorium, SRM AP',
    type: 'Summit',
    status: 'completed',
    date_start: '2026-03-10T10:00:00Z',
    date_end: '2026-03-10T17:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    registration_open: false,
    show_opening_soon: false,
    is_published: true,
    max_capacity: 250,
    form_requirements: {
      event_pricing: 'free',
      registration_fee: 0,
      provide_certificates: true,
    },
    gallery_urls: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    ],
  },
];

export const FALLBACK_TEAM: TeamMemberItem[] = [
  // Chief Board
  {
    id: 'tm-1',
    name: 'Jayanth Ramakrishnan',
    role: 'Founder & Community Advisor',
    tier: 'chief',
    category: 'Leadership',
    linkedin_url: 'https://linkedin.com',
    github_url: 'https://github.com',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    display_order: 1,
  },
  {
    id: 'tm-2',
    name: 'Aravind S.',
    role: 'Chapter President',
    tier: 'chief',
    category: 'Leadership',
    linkedin_url: 'https://linkedin.com',
    github_url: 'https://github.com',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    display_order: 2,
  },
  {
    id: 'tm-3',
    name: 'Sneha Reddy',
    role: 'Vice President & Operations Lead',
    tier: 'chief',
    category: 'Leadership',
    linkedin_url: 'https://linkedin.com',
    github_url: 'https://github.com',
    image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    display_order: 3,
  },
  {
    id: 'tm-4',
    name: 'Rohit Verma',
    role: 'General Secretary',
    tier: 'chief',
    category: 'Leadership',
    linkedin_url: 'https://linkedin.com',
    github_url: 'https://github.com',
    image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    display_order: 4,
  },

  // Board Members
  {
    id: 'tm-5',
    name: 'Karthik Rao',
    role: 'Technical Head',
    tier: 'board',
    category: 'Technical',
    linkedin_url: 'https://linkedin.com',
    github_url: 'https://github.com',
    image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    display_order: 5,
  },
  {
    id: 'tm-6',
    name: 'Divya Nair',
    role: 'Design & Brand Director',
    tier: 'board',
    category: 'Design',
    linkedin_url: 'https://linkedin.com',
    instagram_url: 'https://instagram.com',
    image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    display_order: 6,
  },
  {
    id: 'tm-7',
    name: 'Manoj Kumar',
    role: 'Cloud & Infrastructure Lead',
    tier: 'board',
    category: 'Technical',
    linkedin_url: 'https://linkedin.com',
    github_url: 'https://github.com',
    image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
    display_order: 7,
  },

  // Team Members
  {
    id: 'tm-8',
    name: 'Ananya Sharma',
    role: 'Full Stack Developer',
    tier: 'member',
    category: 'Technical',
    github_url: 'https://github.com',
    image_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    display_order: 8,
  },
  {
    id: 'tm-9',
    name: 'Varun Teja',
    role: 'Events & Logistics Coordinator',
    tier: 'member',
    category: 'Operations',
    linkedin_url: 'https://linkedin.com',
    image_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
    display_order: 9,
  },
  {
    id: 'tm-10',
    name: 'Pooja Iyer',
    role: 'Community Outreach Lead',
    tier: 'member',
    category: 'Community',
    linkedin_url: 'https://linkedin.com',
    twitter_url: 'https://twitter.com',
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    display_order: 10,
  },
];

export const FALLBACK_GALLERY: GalleryItem[] = [
  {
    id: 'g-1',
    title: 'SYNORA Hackathon Opening Ceremony',
    category: 'hackathons',
    image_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1000&q=80',
    alt_text: 'Students at the opening keynote of MSC flagship hackathon',
  },
  {
    id: 'g-2',
    title: 'Midnight Coding Sprint',
    category: 'hackathons',
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80',
    alt_text: 'Engineers debugging distributed services at 2 AM',
  },
  {
    id: 'g-3',
    title: 'Azure Cloud Architecture Workshop',
    category: 'workshops',
    image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80',
    alt_text: 'Interactive workshop on Azure Kubernetes Service in the lab',
  },
  {
    id: 'g-4',
    title: 'Campus Tech Festival & Showcase',
    category: 'festivals',
    image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
    alt_text: 'Tech exhibition stalls showcasing student innovation at SRM AP',
  },
  {
    id: 'g-5',
    title: 'Community Team Review & Chapter Milestone',
    category: 'community',
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80',
    alt_text: 'MSC core leads and members reviewing roadmap goals',
  },
  {
    id: 'g-6',
    title: 'Generative AI Prompt & Code Sprint',
    category: 'workshops',
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80',
    alt_text: 'Hands-on session using Azure OpenAI models',
  },
  {
    id: 'g-7',
    title: 'MLSA Regional Chapter Excellence Award',
    category: 'awards',
    image_url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=1000&q=80',
    alt_text: 'SRM AP chapter receiving official Microsoft Learn Student Ambassador distinction',
  },
  {
    id: 'g-8',
    title: "SYNORA '26 Grand Prize Podium Ceremony",
    category: 'awards',
    image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
    alt_text: 'Top national hackathon teams awarded Rs 1,50,000 pooled cash prize',
  },
];

