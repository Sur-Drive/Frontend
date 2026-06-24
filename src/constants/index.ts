export const NAV_ITEMS = [
    { label: "Features", href: "#features" },
    { label: "Navigation", href: "#navigation" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Fleets", href: "#fleets" },
    { label: "Partners", href: "#partners" },
    { label: "Contact", href: "#contact" },
];

export const HAZARD_TYPES = [
    { label: "Pothole", color: "bg-yellow-600" },
    { label: "Flood", color: "bg-checkpoint-blue" },
    { label: "Accident", color: "bg-danger-red" },
    { label: "Debris", color: "bg-amber-800" },
    { label: "Road Works", color: "bg-amber-600" },
    { label: "Checkpoint", color: "bg-purple-700" },
    { label: "Danger Zone", color: "bg-red-700" },
    { label: "SOS", color: "bg-sos-red" },
];

export const FEATURES = [
    {
        icon: "fa-route",
        title: "Turn-by-Turn Navigation",
        desc: "Voice-guided directions with real-time hazard alerts.",
    },
    {
        icon: "fa-exclamation-triangle",
        title: "Hazard-Aware Routing",
        desc: "Routes that avoid potholes, floods, accidents, and danger zones.",
    },
    {
        icon: "fa-map",
        title: "Live Traffic & Hazard Map",
        desc: "Real-time road conditions and incident reporting.",
    },
    {
        icon: "fa-search",
        title: "Search Destinations",
        desc: "Find places, addresses, landmarks, and saved locations.",
    },
    {
        icon: "fa-random",
        title: "Multiple Route Options",
        desc: "Choose fastest, safest, or shortest route.",
    },
    {
        icon: "fa-clock",
        title: "Arrival Time Estimation",
        desc: "ETA with hazard and traffic delays factored in.",
    },
    {
        icon: "fa-phone-alt",
        title: "Emergency SOS",
        desc: "One-tap emergency alerts to nearby users and contacts.",
    },
    {
        icon: "fa-eye",
        title: "Scout Mode",
        desc: "Preview your route and safety score before you leave.",
    },
];

export const HOW_IT_WORKS = [
    {
        step: 1,
        title: "Open the App",
        desc: "Launch SUR-DRIVEHT on your device.",
    },
    {
        step: 2,
        title: "Search or Tap Map",
        desc: "Enter destination or tap on the map.",
    },
    {
        step: 3,
        title: "View Hazard-Aware Routes",
        desc: "See route options with safety scores.",
    },
    {
        step: 4,
        title: "Navigate & Report",
        desc: "Get turn-by-turn guidance and report hazards.",
    },
    {
        step: 5,
        title: "Help Others Stay Safe",
        desc: "Your reports help the entire community.",
        isGold: true,
    },
];

export const STATS = [
    { number: "10,000+", label: "Hazards Reported" },
    { number: "50,000+", label: "Drivers Protected" },
    { number: "8,000+", label: "Community Verifications" },
    { number: "25,000+", label: "Safer Routes Suggested" },
];

export const FAQS = [
    {
        q: "What is SUR-DRIVEHT?",
        a: "SUR-DRIVEHT is a full navigation app with real-time hazard intelligence, turn-by-turn guidance, and community-powered road safety.",
    },
    {
        q: "Is SUR-DRIVEHT free?",
        a: "Yes. SUR-DRIVEHT is designed to be free for individual drivers.",
    },
    {
        q: "How does hazard-aware navigation work?",
        a: "The app detects reported hazards on your route and automatically suggests safer alternatives with real-time updates.",
    },
    {
        q: "Can fleet companies use SUR-DRIVEHT?",
        a: "Yes. Fleet operators have access to a dedicated dashboard for vehicle tracking, route safety, and hazard reports.",
    },
    {
        q: "Can government agencies partner with SUR-DRIVEHT?",
        a: "Yes. Government agencies can access road condition data, hazard heatmaps, and road safety analytics.",
    },
];
