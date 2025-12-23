import { Search } from 'lucide-react';
import { Input } from './ui/input';

interface SearchBarProps {
  placeholder?: string;
  size?: 'default' | 'large';
  onSearch?: (query: string) => void;
}

import { useTheme } from './ThemeProvider';

export function SearchBar({
  placeholder = "Search...",
  size = 'default',
  onSearch
}: SearchBarProps) {
  const { theme } = useTheme();
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
      <Input
        type="text"
        placeholder={placeholder}
        className={`pl-10 ${size === 'large' ? 'h-14' : ''}`}
        style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}
        onChange={(e) => onSearch?.(e.target.value)}
      />
    </div>
  );
}
