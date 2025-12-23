import { Badge } from './ui/badge';

interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
}

export function Tag({ children, variant = 'secondary' }: TagProps) {
  return (
    <Badge variant={variant} className="rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900 dark:text-violet-300 border-0">
      {children}
    </Badge>
  );
}