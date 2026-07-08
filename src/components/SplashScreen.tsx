import logo from '../assets/logo.png'

export default function SplashScreen() {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#6E43A3]">
      <div className="h-[env(safe-area-inset-top)] bg-[#6E43A3]" />

      <div className="flex items-center justify-center flex-1 px-6">
        <div className="flex items-center gap-2 animate-[fadeInUp_0.6s_ease-out]">
          <img
            src={logo}
            alt="SUR-DRIVE logo"
            className="object-contain w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0"
          />

          <div>
            <h1 className="text-3xl font-extrabold leading-none tracking-tight text-white sm:text-4xl md:text-5xl">
              SUR-DRIVE
              <sup className="text-[10px] sm:text-xs text-yellow-400 align-super ml-0.5">HT</sup>
            </h1>
            <p className="text-yellow-400 text-[10px] sm:text-xs md:text-sm font-bold tracking-widest mt-1.5">
              YOUR ROAD. YOUR GUIDE.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-center pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="w-32 h-1 rounded-full bg-white/70" />
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}





