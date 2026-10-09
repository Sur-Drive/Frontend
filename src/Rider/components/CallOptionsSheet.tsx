/**
 * "Call in-app" / "Call phone" bottom sheet (Figma "call"). The screen behind
 * it is dimmed and blurred like the Figma frame.
 */
export default function CallOptionsSheet({
  onClose,
  onInApp,
  onPhone,
  phoneAvailable,
}: {
  onClose: () => void;
  onInApp: () => void;
  onPhone: () => void;
  phoneAvailable: boolean;
}) {
  return (
    <div
      className="font-outfit absolute inset-0 z-50 flex items-end bg-black/20 backdrop-blur-[10px]"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-[30px] bg-white px-6 pb-[max(26px,env(safe-area-inset-bottom))] pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onInApp}
          className="h-[60px] w-full rounded-full bg-[#6E43A3] text-[16px] font-semibold text-white active:scale-[0.99]"
        >
          Call in-app
        </button>
        <button
          type="button"
          onClick={onPhone}
          disabled={!phoneAvailable}
          className="mt-[11px] h-[60px] w-full rounded-full border border-[#E6E6EA] bg-white text-[16px] font-semibold text-[#5B4A72] shadow-[0_22px_30px_-8px_rgba(110,67,163,0.30)] active:scale-[0.99] disabled:opacity-50"
        >
          Call phone
        </button>
        {!phoneAvailable && (
          <p className="mt-2 text-center text-xs text-[#9A96A8]">
            This passenger's phone number isn't available yet.
          </p>
        )}
      </div>
    </div>
  );
}
