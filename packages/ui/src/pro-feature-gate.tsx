import { LockIcon } from 'lucide-react';

export function ProFeatureGate({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-12 text-center">
      <div className="rounded-full bg-amber-100 p-4">
        <LockIcon className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-semibold">Feature PRO</h2>
      <p className="text-muted-foreground max-w-sm">
        <strong>{feature}</strong> está disponible en TramiFlow PRO.
      </p>
      <button disabled className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
        Conocer TramiFlow PRO →
      </button>
    </div>
  );
}
