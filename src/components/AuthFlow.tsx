// import { useState } from 'react'
// import SignInModal from './SignInModal'
// import CreateAccountModal from './CreateAccountModal'
// import ForgotPasswordModal from './ForgetPasswordModal'
// import VerifyResetOtpModal from './VerifyResetOtpModal'
// import CreateNewPassword from './Createnewpassword'
// import ResetPasswordSuccess from './Resetpasswordsuccess'
// import OTP from './OTP'
// import PersonalInformation from './PersonalInformation'
// import CreatePassword from './CreatePassword'

// type Screen =
//   | 'signin'
//   | 'signup'
//   | 'signup-otp'
//   | 'personal-info'
//   | 'create-password'
//   | 'forgot'
//   | 'verify-reset-otp'
//   | 'new-password'
//   | 'reset-success'

// interface PersonalInfoData {
//   firstName: string
//   lastName: string
//   gender: 'male' | 'female' | 'others'
//   dateOfBirth: string
//   occupation: string
// }

// interface AuthFlowProps {
//   /** Which screen to open on. Defaults to sign in. */
//   initialScreen?: Extract<Screen, 'signin' | 'signup'>
//   onClose: () => void
//   /** Called once the user is fully authenticated (sign-in, or finished sign-up). */
//   onAuthSuccess: (user?: any) => void
// }

// export default function AuthFlow({
//   initialScreen = 'signin',
//   onClose,
//   onAuthSuccess,
// }: AuthFlowProps) {
//   const [screen, setScreen] = useState<Screen>(initialScreen)

//   // Shared state across the sign-up sub-flow
//   const [signupIdentifier, setSignupIdentifier] = useState('')
//   const [personalInfo, setPersonalInfo] = useState<PersonalInfoData | null>(null)

//   // Shared state across the forgot-password sub-flow
//   const [resetPhone, setResetPhone] = useState('')

//   switch (screen) {
//     case 'signin':
//       return (
//         <SignInModal
//           onClose={onClose}
//           onSignInSuccess={(user) => onAuthSuccess(user)}
//           onForgotPassword={() => setScreen('forgot')}
//           onSignUp={() => setScreen('signup')}
//         />
//       )

//     case 'signup':
//       return (
//         <CreateAccountModal
//           onClose={onClose}
//           onSignIn={() => setScreen('signin')}
//           onSendCodeSuccess={(identifier) => {
//             setSignupIdentifier(identifier)
//             setScreen('signup-otp')
//           }}
//         />
//       )

//     case 'signup-otp':
//       return (
//         <OTP
//           phoneNumber={signupIdentifier}
//           onBack={() => setScreen('signup')}
//           onEditPhone={() => setScreen('signup')}
//           onResend={() => {
//             /* re-trigger send via CreateAccountModal's hook if you want a toast here */
//           }}
//           onVerifySuccess={() => setScreen('personal-info')}
//         />
//       )

//     case 'personal-info':
//       return (
//         <PersonalInformation
//           onBack={() => setScreen('signup-otp')}
//           initialData={personalInfo ?? undefined}
//           onContinue={(data) => {
//             setPersonalInfo(data)
//             setScreen('create-password')
//           }}
//         />
//       )

//     case 'create-password':
//       return (
//         <CreatePassword
//           onBack={() => setScreen('personal-info')}
//           onComplete={() => onAuthSuccess()}
//         />
//       )

//     case 'forgot':
//       return (
//         <ForgotPasswordModal
//           onClose={onClose}
//           onBack={() => setScreen('signin')}
//           onSendCode={(fullPhone) => setResetPhone(fullPhone)}
//           onSendCodeSuccess={(fullPhone) => {
//             setResetPhone(fullPhone)
//             setScreen('verify-reset-otp')
//           }}
//         />
//       )

//     case 'verify-reset-otp':
//       return (
//         <VerifyResetOtpModal
//           phoneNumber={resetPhone}
//           onClose={onClose}
//           onBack={() => setScreen('forgot')}
//           onVerifySuccess={() => setScreen('new-password')}
//         />
//       )

//     case 'new-password':
//       return <CreateNewPassword onComplete={() => setScreen('reset-success')} />

//     case 'reset-success':
//       return <ResetPasswordSuccess onSignIn={() => setScreen('signin')} />

//     default:
//       return null
//   }
// }




import { useState } from 'react'
import SignInModal from './SignInModal'
import CreateAccountModal from './CreateAccountModal'
import ForgotPasswordModal from './ForgetPasswordModal'
import VerifyResetOtpModal from './VerifyResetOtpModal'
import CreateNewPassword from './Createnewpassword'
import ResetPasswordSuccess from './Resetpasswordsuccess'
import OTP from './OTP'
import PersonalInformation from './PersonalInformation'
import CreatePassword from './CreatePassword'

type Screen =
  | 'signin'
  | 'signup'
  | 'signup-otp'
  | 'personal-info'
  | 'create-password'
  | 'forgot'
  | 'verify-reset-otp'
  | 'new-password'
  | 'reset-success'

interface PersonalInfoData {
  firstName: string
  lastName: string
  gender: 'male' | 'female' | 'others'
  dateOfBirth: string
  occupation: string
}

interface AuthFlowProps {
  /** Which screen to open on. Defaults to sign in. */
  initialScreen?: Extract<Screen, 'signin' | 'signup'>
  onClose: () => void
  /** Called once the user is fully authenticated (sign-in, or finished sign-up). */
  onAuthSuccess: (user?: any) => void
}

export default function AuthFlow({
  initialScreen = 'signin',
  onClose,
  onAuthSuccess,
}: AuthFlowProps) {
  const [screen, setScreen] = useState<Screen>(initialScreen)

  // Shared state across the sign-up sub-flow
  const [signupIdentifier, setSignupIdentifier] = useState('')
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData | null>(null)

  // Shared state across the forgot-password sub-flow
  const [resetPhone, setResetPhone] = useState('')

  switch (screen) {
    case 'signin':
      return (
        <SignInModal
          onClose={onClose}
          onSignInSuccess={(user) => onAuthSuccess(user)}
          onForgotPassword={() => setScreen('forgot')}
          onSignUp={() => setScreen('signup')}
        />
      )

    case 'signup':
      return (
        <CreateAccountModal
          onClose={onClose}
          onSignIn={() => setScreen('signin')}
          onSendCodeSuccess={(identifier) => {
            setSignupIdentifier(identifier)
            setScreen('signup-otp')
          }}
        />
      )

    case 'signup-otp':
      return (
        <OTP
          phoneNumber={signupIdentifier}
          onBack={() => setScreen('signup')}
          onEditPhone={() => setScreen('signup')}
          onResend={() => {
            /* re-trigger send via CreateAccountModal's hook if you want a toast here */
          }}
          onVerifySuccess={() => setScreen('personal-info')}
        />
      )

    case 'personal-info':
      return (
        <PersonalInformation
          onBack={() => setScreen('signup-otp')}
          initialData={personalInfo ?? undefined}
          onContinue={(data) => {
            setPersonalInfo(data)
            setScreen('create-password')
          }}
        />
      )

    case 'create-password':
      return (
        <CreatePassword
          onBack={() => setScreen('personal-info')}
          onComplete={() => onAuthSuccess()}
        />
      )

    case 'forgot':
      return (
        <ForgotPasswordModal
          onClose={onClose}
          onBack={() => setScreen('signin')}
          onSendCode={(fullPhone) => setResetPhone(fullPhone)}
          onSendCodeSuccess={(fullPhone) => {
            setResetPhone(fullPhone)
            setScreen('verify-reset-otp')
          }}
        />
      )

    case 'verify-reset-otp':
      return (
        <VerifyResetOtpModal
          phoneNumber={resetPhone}
          onClose={onClose}
          onBack={() => setScreen('forgot')}
          onVerifySuccess={() => setScreen('new-password')}
        />
      )

    case 'new-password':
      return <CreateNewPassword onComplete={() => setScreen('reset-success')} />

    case 'reset-success':
      return <ResetPasswordSuccess onSignIn={() => setScreen('signin')} />

    default:
      return null
  }
}