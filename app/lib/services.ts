import { FileText, Zap, Calculator, Move, Megaphone, Video, Camera, Sparkles, Key, FileCheck, Landmark, Palette, Armchair, Ruler, Compass, Hammer, Truck, HardHat } from 'lucide-react';

export interface Service {
    title: string;
    slug: string;
    description: string;
    icon: any; // Using any for LucideIcon compat in server/client
    fullDescription: string;
    benefits: string[];
    price?: string;
}

export const SERVICES: Service[] = [
    {
        title: "Notar Schedule",
        slug: "notar-schedule",
        description: "Schedule appointments with trusted notaries for your property transactions.",
        icon: FileText,
        fullDescription: "Streamline your property transaction process by scheduling appointments directly with our network of top-rated notaries. We handle the coordination to ensure your signing process is smooth and legally sound.",
        benefits: ["Direct Scheduling", "Verified Notaries", "Document Prep Assistance", "Reminder Alerts"],
        price: "Free for Clients"
    },
    {
        title: "Energy Certificate",
        slug: "energy-certificate",
        description: "Get your EPC (Energy Performance Certificate) quickly and compliant with regulations.",
        icon: Zap,
        fullDescription: "An Energy Performance Certificate (EPC) is mandatory for selling or renting a property. Our certified assessors provide quick turnaround times and detailed reports to ensure your property meets all legal requirements.",
        benefits: ["Certified Assessors", "24-48h Turnaround", "Digital Delivery", "Valid for 10 Years"],
        price: "€150"
    },
    {
        title: "Credit Broker Simulation",
        slug: "credit-broker",
        description: "Compare mortgage rates and get pre-approved with our integrated credit tools.",
        icon: Calculator,
        fullDescription: "Find the best financing options for your dream home. Our credit broker tools allow you to simulate mortgage payments, compare rates from top banks, and get pre-qualification letters to strengthen your offer.",
        benefits: ["Compare 20+ Banks", "Real-time Rates", "Pre-approval Letter", "Expert Advice"],
        price: "Free"
    },
    {
        title: "Designer",
        slug: "designer",
        description: "Professional interior design and property staging services.",
        icon: Palette,
        fullDescription: "Transform your space with our expert interior designers. Whether you're staging for a sale or designing your forever home, we provide personalized mood boards, layouts, and aesthetic guidance.",
        benefits: ["Space Planning", "Mood Boards", "Professional Staging", "Material Sourcing"],
        price: "From €500"
    },
    {
        title: "Custom Furniture",
        slug: "custom-furniture",
        description: "Bespoke furniture solutions tailored to your property's dimensions.",
        icon: Armchair,
        fullDescription: "Get high-quality, custom-made furniture that fits perfectly in your new home. From kitchen cabinets to luxury wardrobes, our craftsmen use premium materials to bring your vision to life.",
        benefits: ["Custom Dimensions", "Premium Materials", "3D Visualization", "Installation Included"],
        price: "Custom Quote"
    },
    {
        title: "Architect",
        slug: "architect",
        description: "Architectural planning, blueprints, and building permit assistance.",
        icon: Ruler,
        fullDescription: "Full-service architectural solutions for renovations or new builds. We handle everything from initial conceptual sketches and technical blueprints to navigating building permit applications.",
        benefits: ["Concept Design", "Technical Drawings", "Permit Management", "Site Supervision"],
        price: "Custom Quote"
    },
    {
        title: "Topometrist",
        slug: "topometrist",
        description: "Precise land surveying, mapping, and boundary verification.",
        icon: Compass,
        fullDescription: "Professional land surveying services for property boundary verification, topographical mapping, and legal registration. Essential for new constructions and land transactions.",
        benefits: ["GPS Surveying", "Boundary Mapping", "Topographical Plans", "Legal Documentation"],
        price: "From €300"
    },
    {
        title: "Renovation Services",
        slug: "renovation-services",
        description: "Complete home renovation, remodeling, and repair solutions.",
        icon: Hammer,
        fullDescription: "High-quality renovation services to modernize your property. We handle electrical, plumbing, tiling, and structural changes to increase your property's value and comfort.",
        benefits: ["Expert Contractors", "Turnkey Solutions", "Material Management", "Warranty Provided"],
        price: "From €1000"
    },
    {
        title: "Relocation Transport",
        slug: "relocation-transport",
        description: "Seamless moving and logistics for a stress-free transition.",
        icon: Truck,
        fullDescription: "Reliable relocation services for your household goods. Our team handles packing, transport, and unpacking with care, ensuring your belongings reach your new home safely.",
        benefits: ["Insured Transport", "Professional Packing", "Global Shipping", "Storage Solutions"],
        price: "From €150"
    },
    {
        title: "Construction Team",
        slug: "construction-team",
        description: "Full-scale building services for residential and commercial projects.",
        icon: HardHat,
        fullDescription: "A dedicated construction team for your largest projects. From foundations to roofing, we provide skilled labor and project management for new builds and major structural expansions.",
        benefits: ["Skilled Labor", "Project Management", "Safety Compliance", "Quality Materials"],
        price: "Custom Quote"
    },
    {
        title: "Virtual Tour Service",
        slug: "virtual-tour",
        description: "Immersive 3D tours to showcase your property to buyers anywhere in the world.",
        icon: Move,
        fullDescription: "Elevate your listing with a high-definition 3D Matterport virtual tour. Allow potential buyers to walk through your property remotely, increasing engagement and reducing unnecessary physical viewings.",
        benefits: ["4K 3D Capture", "Floor Plan Generation", "VR Headset Ready", "Google Maps Integration"],
        price: "From €200"
    },
    {
        title: "Property Marketing Plan",
        slug: "marketing-plan",
        description: "Comprehensive strategies to maximize your property's exposure and sale price.",
        icon: Megaphone,
        fullDescription: "Get a tailored marketing strategy designed to target the right buyers. From social media campaigns to premium listing placements, we ensure your property gets the attention it deserves.",
        benefits: ["Social Media Ads", "Premium Listing Status", "Email Marketing", "Targeted Outreach"],
        price: "Custom Quote"
    },
    {
        title: "Video Presentation",
        slug: "video-presentation",
        description: "Cinema-quality video tours that capture the emotion and lifestyle of your home.",
        icon: Video,
        fullDescription: "Go beyond static images with a professionally produced video tour. Using drone footage and steady-cam walkthroughs, we tell the story of your home to create an emotional connection with buyers.",
        benefits: ["Drone Footage", "Professional Editing", "Voiceover Option", "Rights for Social Media"],
        price: "From €350"
    },
    {
        title: "Photo Session",
        slug: "photo-session",
        description: "Professional HDR photography to make your listing stand out in search results.",
        icon: Camera,
        fullDescription: "First impressions matter. Our professional real estate photographers use HDR techniques and wide-angle lenses to showcase your property's best features, ensuring bright, crisp, and inviting images.",
        benefits: ["25+ HDR Photos", "Blue Sky Replacement", "Next Day Delivery", "Print Quality"],
        price: "€120"
    },
    {
        title: "Cleaning Service",
        slug: "cleaning-service",
        description: "Deep cleaning services to prepare your home for open houses or move-in day.",
        icon: Sparkles,
        fullDescription: "Ensure your property sparkles for every viewing. Our professional cleaning teams specialize in pre-sale deep cleans and move-in/move-out services to leave a lasting positive impression.",
        benefits: ["Deep Cleaning", "Eco-friendly Products", "Bonded & Insured", "Checklist Guarantee"],
        price: "From €100"
    },
    {
        title: "Open House Events",
        slug: "open-house",
        description: "Full-service organization of open house events to attract serious buyers.",
        icon: Key,
        fullDescription: "Let us handle the logistics of your Open House. We manage invitations, staging setup, visitor registration, and follow-up, turning casual visitors into serious leads.",
        benefits: ["Event Hosting", "Visitor Registration", "Feedback Collection", "Safety Monitoring"],
        price: "Included for Agents"
    },
    {
        title: "Transaction Documents",
        slug: "transaction-docs",
        description: "Guidance on all necessary legal documents for a smooth real estate transaction.",
        icon: FileCheck,
        fullDescription: "Navigate the paperwork with ease. We provide a comprehensive checklist and assistance in gathering all required documents, from title deeds to tax records, ensuring a delay-free closing.",
        benefits: ["Document Checklist", "Digital Vault", "Legal Review", "Compliance Check"],
        price: "Free Consultation"
    },
    {
        title: "Land Register Extract",
        slug: "land-register",
        description: "Official extracts from the Land Registry to verify ownership and encumbrances.",
        icon: Landmark,
        fullDescription: "Obtain official, up-to-date Land Register extracts (Extras de Cartea Funciara) quickly. Verify ownership history, plot details, and legal status before making an offer.",
        benefits: ["Official Government Source", "PDF Delivery", "Legal Verification", "English Translation"],
        price: "€25"
    }
];
