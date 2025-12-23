import { Link } from 'react-router-dom';
import { Card as UICard, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Tag } from './Tag';

interface CardProps {
  title: string;
  description: string;
  tags?: string[];
  href: string;
  metadata?: {
    label: string;
    value: string;
  }[];
}

import { useTheme } from './ThemeProvider';

export function Card({ title, description, tags, href, metadata }: CardProps) {
  const { theme } = useTheme();
  return (
    <Link to={href}>
      <UICard
        className="h-full hover:shadow-xl hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 hover:-translate-y-1 border-2"
        style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}
      >
        <CardHeader>
          <CardTitle className="truncate leading-normal">{title}</CardTitle>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, index) => (
                <Tag key={index}>{tag}</Tag>
              ))}
            </div>
          )}
          {metadata && metadata.length > 0 && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {metadata.map((item, index) => (
                <div key={index}>
                  <span className="text-muted-foreground">{item.label}:</span>{' '}
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </UICard>
    </Link>
  );
}