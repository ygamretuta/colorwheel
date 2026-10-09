import { useActionState } from 'react';

import { Button } from '@/shared/ui/button';

const LABELS = { idle: 'Copy hex codes', copied: 'Copied ✓', failed: 'Copy failed, try again' };

interface CopyCodesButtonProps {
  colors: string[];
  className?: string;
}

/** Copies the hex codes through a form Action; React tracks the pending and result state. */
export default function CopyCodesButton({ colors, className }: CopyCodesButtonProps) {
  const [result, copy, isPending] = useActionState(async () => {
    try {
      await navigator.clipboard.writeText(colors.join(', '));
      return 'copied';
    } catch {
      return 'failed'; // e.g. clipboard permission denied
    }
  }, 'idle');

  return (
    <form action={copy} className="palette__copy">
      <Button className={className} variant="outline" size="sm" type="submit" disabled={isPending}>
        {LABELS[result]}
      </Button>
    </form>
  );
}
