import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSendPersonalInfo } from '../hooks/useAuth'

interface PersonalInformationProps {
  onBack?: () => void
  onContinue: (data: {
    firstName: string
    lastName: string
    gender: 'male' | 'female' | 'others'
    dateOfBirth: string
    occupation: string
  }) => void
  initialData?: {
    firstName?: string
    lastName?: string
    gender?: 'male' | 'female' | 'others'
    dateOfBirth?: string
    occupation?: string
  }
}

const OCCUPATIONS = [
  'Driver',
  'Engineer',
  'Doctor',
  'Teacher',
  'Student',
  'Business Owner',
  'Mechanic',
  'Other',
]

export default function PersonalInformation({
  onBack,
  onContinue,
  initialData = {},
}: PersonalInformationProps) {
  const [firstName, setFirstName] = useState(initialData.firstName || '')
  const [lastName, setLastName] = useState(initialData.lastName || '')
  const [gender, setGender] = useState<'male' | 'female' | 'others'>(
    initialData.gender || 'male'
  )
  const [dateOfBirth, setDateOfBirth] = useState(initialData.dateOfBirth || '')
  const [occupation, setOccupation] = useState(initialData.occupation || '')
  const [showOccupationDropdown, setShowOccupationDropdown] = useState(false)

  const personalInfoMutation = useSendPersonalInfo()

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    dateOfBirth.length > 0 &&
    occupation.length > 0

  const handleContinue = () => {
    if (!isValid || personalInfoMutation.isPending) return

    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      dateOfBirth,
      occupation,
    }

    personalInfoMutation.mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender.charAt(0).toUpperCase() + data.gender.slice(1), // "male" → "Male"
        dateOfBirth: data.dateOfBirth,
        occupation: data.occupation,
      },
      {
        onSuccess: (response) => {
          console.log('Personal info saved:', response)
          onContinue(data)
        },
        onError: (error) => {
          console.error('Failed to save personal info:', error.message)
        },
      }
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-end justify-center z-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onBack}
        />

        {/* Bottom Sheet */}
        <motion.div
          className="relative w-full max-w-[430px] h-[92dvh] bg-white rounded-t-[40px] px-6 pt-8 pb-10 flex flex-col overflow-hidden"
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 220,
            mass: 1.2,
          }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.y > 150) onBack?.()
          }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center mb-2 -mt-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Back button */}
          {onBack && (
            <motion.button
              onClick={onBack}
              aria-label="Go back"
              className="absolute top-6 left-6 w-10 h-10 rounded-full bg-[#1a0a2e] flex items-center justify-center text-white"
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <BackIcon />
            </motion.button>
          )}

          <div className="mt-6">
            <motion.h1
              className="text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Personal Information
            </motion.h1>

            <motion.p
              className="mt-2 text-base text-gray-600"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Tell us a little about yourself to get started.
            </motion.p>
          </div>

          {/* Error message */}
          {personalInfoMutation.isError && (
            <motion.p
              className="mt-3 text-sm text-red-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {personalInfoMutation.error.message}
            </motion.p>
          )}

          {/* Scrollable form */}
          <div className="mt-4 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* First Name */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <label className="text-lg font-medium text-gray-900">First Name</label>
              <div className="mt-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your First Name"
                  className="w-full rounded-2xl bg-gray-50 border border-gray-200 px-5 py-4 text-lg text-gray-900 outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#6E43A3] placeholder:text-gray-400"
                />
              </div>
            </motion.div>

            {/* Last Name */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <label className="text-lg font-medium text-gray-900">Last Name</label>
              <div className="mt-3">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your Last Name"
                  className="w-full rounded-2xl bg-gray-50 border border-gray-200 px-5 py-4 text-lg text-gray-900 outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#6E43A3] placeholder:text-gray-400"
                />
              </div>
            </motion.div>

            {/* Gender */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <label className="text-lg font-medium text-gray-900">Gender</label>
              <div className="flex gap-3 mt-3">
                {(['male', 'female', 'others'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 h-14 rounded-full text-lg font-medium transition-all ${
                      gender === g
                        ? 'bg-[#6E43A3] text-white shadow-md'
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }`}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Date of Birth */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <label className="text-lg font-medium text-gray-900">Date of Birth</label>
              <div className="relative mt-3">
                <input
                  type="text"
                  value={dateOfBirth}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^\d/]/g, '')
                    if (val.length === 2 && !val.includes('/')) val = val + '/'
                    if (val.length === 5 && val.split('/').length === 2) val = val + '/'
                    if (val.length <= 10) setDateOfBirth(val)
                  }}
                  placeholder="dd/mm/yyyy"
                  maxLength={10}
                  className="w-full rounded-2xl bg-gray-50 border border-gray-200 px-5 py-4 text-lg text-gray-900 outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#6E43A3] placeholder:text-gray-400"
                />
                <div className="absolute -translate-y-1/2 pointer-events-none right-5 top-1/2">
                  <CalendarIcon />
                </div>
              </div>
            </motion.div>

            {/* Occupation */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <label className="text-lg font-medium text-gray-900">Occupation</label>
              <div className="relative mt-3">
                <button
                  onClick={() => setShowOccupationDropdown(!showOccupationDropdown)}
                  className="w-full rounded-2xl bg-gray-50 border border-gray-200 px-5 py-4 text-lg text-left outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#6E43A3] flex items-center justify-between"
                >
                  <span className={occupation ? 'text-gray-900' : 'text-gray-400'}>
                    {occupation || 'Select'}
                  </span>
                  <ChevronDownIcon />
                </button>

                <AnimatePresence>
                  {showOccupationDropdown && (
                    <motion.div
                      className="absolute left-0 right-0 z-50 mt-2 overflow-y-auto bg-white border border-gray-200 shadow-lg top-full rounded-2xl max-h-60"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {OCCUPATIONS.map((occ) => (
                        <button
                          key={occ}
                          onClick={() => {
                            setOccupation(occ)
                            setShowOccupationDropdown(false)
                          }}
                          className={`w-full px-5 py-3 text-left text-lg transition-colors ${
                            occupation === occ
                              ? 'bg-purple-50 text-[#6E43A3] font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {occ}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="h-6" />
          </div>

          {/* Continue Button */}
          <motion.button
            onClick={handleContinue}
            disabled={!isValid || personalInfoMutation.isPending}
            className={`mt-4 h-14 rounded-2xl font-semibold text-lg text-white transition-all ${
              isValid && !personalInfoMutation.isPending
                ? 'bg-[#6E43A3]'
                : 'bg-purple-300 cursor-not-allowed'
            }`}
            whileTap={isValid && !personalInfoMutation.isPending ? { scale: 0.97 } : {}}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {personalInfoMutation.isPending ? 'Saving...' : 'Continue'}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}




