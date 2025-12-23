import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { useTheme } from './ThemeProvider';

interface FilterGroup {
  title: string;
  options: {
    id: string;
    label: string;
    checked?: boolean;
  }[];
}

interface SidebarProps {
  filterGroups: FilterGroup[];
  onFilterChange?: (groupTitle: string, optionId: string, checked: boolean) => void;
  onApply?: () => void;
}

export function Sidebar({ filterGroups, onFilterChange, onApply }: SidebarProps) {
  const { theme } = useTheme();
  return (
    <aside
      className="w-full md:w-64 border-r border-slate-200 dark:border-slate-700 p-6"
      style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}
    >
      <h2 className="mb-6 text-slate-900 dark:text-slate-100 font-bold text-2xl">Filters</h2>
      <div className="space-y-6">
        {filterGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="mb-3 text-slate-800 dark:text-slate-200 font-bold text-xl">{group.title}</h3>
            <div className="space-y-2">
              {group.options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    id={option.id}
                    checked={option.checked}
                    onCheckedChange={(checked: boolean) =>
                      onFilterChange?.(group.title, option.id, checked)
                    }
                  />
                  <Label
                    htmlFor={option.id}
                    className="cursor-pointer text-slate-700 dark:text-white"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {groupIndex < filterGroups.length - 1 && <Separator className="mt-6" />}
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Button
          onClick={onApply}
          className="w-full hover:bg-violet-200 dark:hover:bg-violet-800"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#cfaef1ff',
            color: theme === 'dark' ? 'white' : 'black'
          }}
        >
          Apply Filters
        </Button>
      </div>
    </aside>
  );
}
