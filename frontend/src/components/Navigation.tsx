import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Menu, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../context/AuthContext';

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  return (
    <nav
      className="border-b backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300"
      style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                CronexiaLib
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/prompts" className="hover:text-violet-600 transition-colors">
                Prompts
              </Link>
              <Link to="/tools" className="hover:text-violet-600 transition-colors">
                Tools
              </Link>
              <Link to="/agents" className="hover:text-violet-600 transition-colors">
                Agents
              </Link>
              <Link to="/community" className="hover:text-violet-600 transition-colors">
                Community
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {user ? (
              <>
                <Link to="/profile">
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                    Account
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-red-500 hover:text-red-600"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                  Login / Sign Up
                </Button>
              </Link>
            )}


            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>

        </div>
      </div>
    </nav>
  );
}
