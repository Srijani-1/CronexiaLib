import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card as UICard, CardHeader, CardTitle, CardDescription, CardContent, Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from '../components/ui/badge';
import { Eye } from "lucide-react";
import { BarChart3, Upload, Heart, Download } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useTheme } from "../components/ThemeProvider";

type Prompt = {
  id: number;
  title: string;
  downloads: string | number;
  likes: number;
  views?: number;
  tags?: string[];
  description?: string;
};

type Tool = {
  id: number;
  title: string;
  downloads: string | number;
  likes?: number;
  views?: number;
  tags?: string[];
  description?: string;
};

type Agent = {
  id: number;
  title: string;
  downloads: string | number;
  likes?: number;
  views?: number;
  tags?: string[];
  description?: string;
};

export function Dashboard() {
  const { theme } = useTheme();
  const [likedPrompts, setLikedPrompts] = useState<Prompt[]>([]);
  const [likedTools, setLikedTools] = useState<Tool[]>([]);
  const [likedAgents, setLikedAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = sessionStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [promptsRes, toolsRes, agentsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/prompts/liked`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            }),
          fetch(`${API_BASE_URL}/tools/liked`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            }),
          fetch(`${API_BASE_URL}/agents/liked`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            }),
        ]);

        if (promptsRes.ok) {
          const data = await promptsRes.json();
          setLikedPrompts(data.data || []);
        }
        if (toolsRes.ok) {
          const data = await toolsRes.json();
          setLikedTools(data.data || []);
        }
        if (agentsRes.ok) {
          const data = await agentsRes.json();
          setLikedAgents(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const menuItems = [
    { icon: Heart, label: "Liked Prompts", href: "#liked-prompts", count: likedPrompts.length },
    { icon: Heart, label: "Liked Tools", href: "#liked-tools", count: likedTools.length },
    { icon: Upload, label: "Upload Prompt", href: "/submit-prompt" },
    { icon: Upload, label: "Upload Tool", href: "/submit-tool" },
    { icon: Upload, label: "Upload Agent", href: "/submit-agent" },
    { icon: BarChart3, label: "Analytics", href: "#analytics" },
  ];

  const stats = [
    { label: "Total Liked Prompts", value: likedPrompts.length, icon: Heart, change: "" },
    { label: "Total Liked Tools", value: likedTools.length, icon: Heart, change: "" },
    { label: "Total Liked Agents", value: likedAgents.length, icon: Heart, change: "" },
  ];

  return (
    <div
      className="container mx-auto px-4 py-8 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-slate-950 dark:to-purple-950/50 min-h-screen"
      style={{ backgroundImage: theme === 'light' ? 'linear-gradient(to top, #e3d5f4ff 0%, #dbc6fcff 100%)' : undefined }}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64">
          <div className="border-2 rounded-xl dark:bg-card p-4 shadow-lg sticky top-6" style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-950)' : '#F3E8FF' }}>
            <h2 className="mb-4 text-black dark:text-white text-2xl font-extrabold">
              Dashboard Menu
            </h2>
            <nav className="space-y-2">
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={i}
                    to={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors group"
                  >
                    <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    <span className="flex-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors font-medium">
                      {item.label}
                    </span>
                    {item.count !== undefined && (
                      <span className="text-sm px-2 py-1 bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 rounded-full font-bold">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <h1 className="mb-6 text-2xl font-bold">My Dashboard</h1>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <UICard key={i} style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                      <Icon className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                    </div>
                  </CardContent>
                </UICard>
              );
            })}
          </div>

          {/* Liked Prompts */}
          <section className="mb-8" id="liked-prompts">
            <UICard style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Liked Prompts</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/prompts">View All</Link>
                  </Button>
                </div>
                <CardDescription>Prompts you have liked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p>Loading...</p>
                  ) : likedPrompts.length === 0 ? (
                    <p>No liked prompts yet.</p>
                  ) : (
                    likedPrompts.map((prompt) => (
                      <Card
                        key={prompt.id}
                        className="p-4 border hover:shadow-lg transition"
                        style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}
                      >
                        <h2 className="text-xl font-semibold">{prompt.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {prompt.description}
                        </p>

                        <div className="flex gap-2 mt-2 flex-wrap">
                          {prompt.tags?.map((tag: string, i: number) => (
                            <Badge key={i} className="text-white hover:bg-violet-800 dark:bg-slate-800 dark:text-slate-100" style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}>{tag}</Badge>
                          ))}
                        </div>

                        <div className="flex gap-4 text-sm mt-3">
                          {prompt.views !== undefined && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" /> {prompt.views}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Download className="w-4 h-4" /> {prompt.downloads || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" /> {prompt.likes}
                          </span>
                        </div>

                        <Button
                          className="mt-4 text-white hover:bg-violet-800 dark:bg-primary dark:text-primary-foreground"
                          style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}
                          onClick={() => window.location.href = `/prompts/${prompt.id}`}
                        >
                          View Prompt
                        </Button>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </UICard>
          </section>

          {/* Liked Tools */}
          <section className="mb-8" id="liked-tools">
            <UICard style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Liked Tools</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/tools">View All</Link>
                  </Button>
                </div>
                <CardDescription>Tools you have liked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p>Loading...</p>
                  ) : likedTools.length === 0 ? (
                    <p>No liked tools yet.</p>
                  ) : (
                    likedTools.map((tool) => (
                      <Card
                        key={tool.id}
                        className="p-4 border hover:shadow-lg transition"
                        style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}
                      >
                        <h2 className="text-xl font-semibold">{tool.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {tool.description}
                        </p>

                        <div className="flex gap-2 mt-2 flex-wrap">
                          {tool.tags?.map((tag: string, i: number) => (
                            <Badge key={i} className="text-white hover:bg-violet-800 dark:bg-slate-800 dark:text-slate-100" style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}>{tag}</Badge>
                          ))}
                        </div>

                        <div className="flex gap-4 text-sm mt-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {tool.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" /> {tool.likes}
                          </span>
                        </div>

                        <Button
                          className="mt-4 text-white hover:bg-violet-800 dark:bg-primary dark:text-primary-foreground"
                          style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}
                          onClick={() => window.location.href = `/tools/${tool.id}`}
                        >
                          View Tool
                        </Button>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </UICard>
          </section>

          <section className="mb-8" id="liked-agents">
            <UICard style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Liked Agents</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/agents">View All</Link>
                  </Button>
                </div>
                <CardDescription>Agents you have liked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p>Loading...</p>
                  ) : likedAgents.length === 0 ? (
                    <p>No liked agents yet.</p>
                  ) : (
                    likedAgents.map((agent) => (
                      <Card
                        key={agent.id}
                        className="p-4 border hover:shadow-lg transition"
                        style={{ backgroundColor: theme === 'dark' ? 'black' : '#F3E8FF' }}
                      >
                        <h2 className="text-xl font-semibold">{agent.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {agent.description}
                        </p>

                        <div className="flex gap-2 mt-2 flex-wrap">
                          {agent.tags?.map((tag: string, i: number) => (
                            <Badge key={i} className="text-white hover:bg-violet-800 dark:bg-slate-800 dark:text-slate-100" style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}>{tag}</Badge>
                          ))}
                        </div>

                        <div className="flex gap-4 text-sm mt-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {agent.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" /> {agent.likes}
                          </span>
                        </div>

                        <Button
                          className="mt-4 text-white hover:bg-violet-800 dark:bg-primary dark:text-primary-foreground"
                          style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}
                          onClick={() => window.location.href = `/agents/${agent.id}`}
                        >
                          View Agent
                        </Button>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </UICard>
          </section>

          {/* Analytics Placeholder */}
          <section id="analytics">
            <UICard>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>Your content performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-64 border-2 border-dashed rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 dark:text-slate-400">Chart placeholder</p>
                    <p className="text-sm text-slate-500">Analytics visualization</p>
                  </div>
                </div>
              </CardContent>
            </UICard>
          </section>

        </main>
      </div>
    </div>
  );
}
