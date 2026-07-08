import { motion, AnimatePresence } from 'framer-motion'

interface ResetPasswordSuccessProps {
  onSignIn: () => void
}

export default function ResetPasswordSuccess({ onSignIn }: ResetPasswordSuccessProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.div
          className="relative w-full max-w-[430px] h-[92dvh] bg-emerald-700 rounded-t-[40px] px-8 pt-20 pb-10 flex flex-col items-center overflow-hidden"
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 220,
            mass: 1.2,
          }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 14 }}
            className="flex items-center justify-center rounded-full shadow-lg w-28 h-28 bg-emerald-500"
          >
            <svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5l5 5L20 6" />
            </svg>
          </motion.div>

          <motion.h1
            className="mt-8 text-2xl sm:text-[32px] font-extrabold text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            All done!
          </motion.h1>

          <motion.p
            className="mt-3 text-center text-emerald-50 text-base leading-snug max-w-[280px]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Your password has been reset successfully. You can now sign in to your account using
            your new password.
          </motion.p>

          <div className="flex-1" />

          <motion.button
            onClick={onSignIn}
            className="w-full text-lg font-semibold transition-all bg-white h-14 rounded-2xl text-emerald-700"
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Sign in
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}