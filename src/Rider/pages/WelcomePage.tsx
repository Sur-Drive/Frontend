import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import logo from "../../assets/logo.png";

const HERO_IMAGE = "/images/bgimg.png";

type CardProps = {
  title: string;
  desc: string;
  icon: string;
  variant: "purple" | "gold";
  onClick: () => void;
};

function ActionCard({ title, desc, icon, variant, onClick }: CardProps) {
  const isGold = variant === "gold";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-center gap-3 overflow-hidden rounded-[20px] px-4 py-6 text-left shadow-sm transition active:scale-[0.98] ${
        isGold ? "bg-[#F4C542] text-[#2d1a4a]" : "bg-[#6E43A3] text-white"
      }`}
    >
      {/* Faint decorative ring — matches the subtle pattern in the mock.
          Swap for the real pattern asset if you have one. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-9 -top-12 h-36 w-36 rounded-full border-[12px] ${
          isGold ? "border-[#2d1a4a]/10" : "border-white/10"
        }`}
      />

      {/* Icon */}
      <span
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
          isGold ? "bg-white/20" : "bg-white/25"
        }`}
      >
        <img src={icon} alt="" className="object-contain w-8 h-8" />
      </span>

      {/* Text */}
      <span className="relative flex-1 min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span
          className={`mt-0.5 block text-[11px] leading-snug ${
            isGold ? "text-[#2d1a4a]/80" : "text-white/85"
          }`}
        >
          {desc}
        </span>
      </span>

      {/* Arrow */}
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#6E43A3]">
        <ArrowRight size={17} />
      </span>
    </button>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const bookRide = () => {
    navigate("/signin");
  };

  return (
    <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-[#6E43A3]">
      {/* ========================= HERO SECTION ========================== */}
      <div
        className="relative h-[42dvh] shrink-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      >
        {/* Purple overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#6E43A3] via-[#6E43A3]/40 to-transparent" />

        {/* Logo — clears the status bar via safe-area, then 26px (80px total on iPhone 14 Pro) */}
        <div className="relative flex items-center justify-center gap-2 pt-[calc(env(safe-area-inset-top,0px)+26px)]">
          <img src={logo} alt="SUR-DRIVE" className="w-auto h-8" />
          <div className="leading-none text-white">
            <span className="text-lg font-extrabold tracking-tight">
              SUR-DRIVE
            </span>
            <sup className="ml-0.5 text-[8px] font-bold text-[#F4C542]">HT</sup>
            <p className="mt-0.5 text-[6px] font-bold tracking-widest text-[#F4C542]">
              YOUR ROAD. YOUR GUIDE.
            </p>
          </div>
        </div>
      </div>

      {/* ========================= MAIN CONTENT ========================== */}

      <div className="-mt-7 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-t-[38px] bg-white px-5 pb-4 pt-8">
        {/* Heading */}
        <h1 className="text-center text-[23px] mt-4 font-bold text-[#6E43A3]">
          Welcome to SUR-DRIVE <span className="text-[#F4C542]">HT</span>
        </h1>

        {/* Description */}
        <p className="mx-auto  max-w-xs text-center text-xs leading-loose text-[#7286A7]">
          Your journey. your choice. Drive, book or earn all in one app
        </p>

        {/* ========================= ACTION CARDS ========================== */}
        <div className="mt-6 space-y-3">
          <ActionCard
            variant="purple"
            title="Open Navigation"
            desc="Get real-time directions and reach your destination with ease."
            icon="/images/Frame2.png"
            onClick={() => {
              // Force the splash screen to replay before landing on /home
              sessionStorage.removeItem("splashShown");
              navigate("/home");
            }}
          />
          <ActionCard
            variant="gold"
            title="Book a Ride"
            desc="Request a ride and get matched with a nearby driver."
            icon="/images/Frame4.png"
            onClick={bookRide}
          />
          <ActionCard
            variant="purple"
            title="Earn as a Driver"
            desc="Join our driver community and start earning today."
            icon="/images/Frame1.png"
            onClick={() => navigate("/signin")}
          />
        </div>

        {/* ========================= CONTACT SUPPORT ========================== */}
        <div className="pt-4 mt-auto text-center">
          <p className="text-[11px] text-[#7286A7]">
            Need help?{" "}
            <a
              href="mailto:surdriveht@gmail.com"
              className="font-semibold text-[#4a148c] underline"
            >
              Contact support →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
