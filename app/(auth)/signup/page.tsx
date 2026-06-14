import { BrandPanel } from '@/components/auth/BrandPanel';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <BrandPanel />
      <SignupForm />
    </div>
  );
}
