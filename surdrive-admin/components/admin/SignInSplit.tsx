import { SignInForm } from './SignInForm';
import { SignInShowcase } from './SignInShowcase';

// Same layout model as app/signin/page.tsx: a full-bleed flex row where each
// half owns lg:w-1/2 (set inside SignInShowcase/SignInForm). Grid (grid-cols-2)
// would resolve that 50% against each grid cell instead, shrinking both panels.
export function SignInSplit() {
  return (
    <main className="force-light flex min-h-screen w-full flex-col bg-white lg:flex-row">
      <SignInShowcase />
      <SignInForm />
    </main>
  );
}
