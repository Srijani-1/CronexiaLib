import { Link } from 'react-router-dom';
import { useTheme } from './ThemeProvider';

export function Footer() {
  const { theme } = useTheme();
  return (
    <footer
      className="border-t mt-auto"
      style={{ background: theme === 'dark' ? 'linear-gradient(to bottom right, var(--color-slate-950), var(--color-purple-950))' : '#F3E8FF' }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Product</h3>
            <div className="flex flex-col gap-2">
              <Link to="/prompts" className="text-muted-foreground hover:text-violet-600 transition-colors">
                Prompts
              </Link>
              <Link to="/tools" className="text-muted-foreground hover:text-violet-600 transition-colors">
                Tools
              </Link>
              <Link to="/templates" className="text-muted-foreground hover:text-violet-600 transition-colors">
                Templates
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Community</h3>
            <div className="flex flex-col gap-2">
              <Link to="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                Discord
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                Twitter
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                GitHub
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Resources</h3>
            <div className="flex flex-col gap-2">
              <Link to="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                Documentation
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                API
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                Blog
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Company</h3>
            <div className="flex flex-col gap-2">
              <Link to="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                About
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                Privacy
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-muted-foreground">
          <p>&copy; 2025 AgentHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}