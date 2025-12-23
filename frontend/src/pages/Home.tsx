import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/Card';
import { FileText, Wrench, Layout, Users, TrendingUp, Zap, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { SplineScene } from "@/components/ui/splite";

export function Home() {
  const { theme } = useTheme();
  const categories = [
    { icon: FileText, title: 'Prompt Engineering', count: 245, type: 'prompts' },
    { icon: Wrench, title: 'Development Tools', count: 132, type: 'tools' },
    { icon: Layout, title: 'Agent Templates', count: 89, type: 'templates' },
    { icon: Users, title: 'Customer Support', count: 156, type: 'prompts' },
    { icon: TrendingUp, title: 'Analytics Tools', count: 67, type: 'tools' },
    { icon: Zap, title: 'Automation', count: 98, type: 'prompts' },
  ];

  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [pools, setPools] = useState<{ prompts: any[], tools: any[], agents: any[] }>({
    prompts: [],
    tools: [],
    agents: []
  });

  const pickRandomItems = (pPool: any[], tPool: any[], aPool: any[]) => {
    const items = [];
    if (pPool.length > 0) {
      const p = pPool[Math.floor(Math.random() * pPool.length)];
      items.push({
        type: 'prompt', title: p.title, description: p.description, tags: p.tags || [], href: `/prompts/${p.id}`,
        metadata: [{ label: 'Likes', value: p.likes?.toString() || '0' }, { label: 'Views', value: p.views?.toString() || '0' }]
      });
    }
    if (tPool.length > 0) {
      const t = tPool[Math.floor(Math.random() * tPool.length)];
      items.push({
        type: 'tool', title: t.title, description: t.description, tags: t.tags || [], href: `/tools/${t.id}`,
        metadata: [{ label: 'Likes', value: t.likes?.toString() || '0' }, { label: 'Views', value: t.views?.toString() || '0' }]
      });
    }
    if (aPool.length > 0) {
      const a = aPool[Math.floor(Math.random() * aPool.length)];
      items.push({
        type: 'agent', title: a.title, description: a.description || 'Custom AI Agent', tags: [a.model, a.visibility], href: `/agents/${a.id}`,
        metadata: [{ label: 'Likes', value: a.likes?.toString() || '0' }, { label: 'Views', value: a.views?.toString() || '0' }]
      });
    }
    return items;
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoadingFeatured(true);
        const [promptsRes, toolsRes, agentsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/prompts/?limit=50`),
          fetch(`${API_BASE_URL}/tools/?limit=50`),
          fetch(`${API_BASE_URL}/agents/?limit=50`)
        ]);
        const promptsData = await promptsRes.json();
        const toolsData = await toolsRes.json();
        const agentsData = await agentsRes.json();
        const pPool = promptsData.data || [];
        const tPool = toolsData.data || [];
        const aPool = agentsData.data || [];
        setPools({ prompts: pPool, tools: tPool, agents: aPool });
        setFeaturedItems(pickRandomItems(pPool, tPool, aPool));
      } catch (err) {
        console.error("Failed to fetch featured items:", err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (loadingFeatured || !pools.prompts.length || !pools.tools.length || !pools.agents.length) return;
    const interval = setInterval(() => {
      setFeaturedItems(pickRandomItems(pools.prompts, pools.tools, pools.agents));
    }, 8000);
    return () => clearInterval(interval);
  }, [loadingFeatured, pools]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950"
      style={{ backgroundImage: theme === 'light' ? 'linear-gradient(to top, #e3d5f4ff 0%, #dbc6fcff 100%)' : undefined }}
    >
      {/* Hero Section */}
      <section className="w-full relative py-12 md:py-20 overflow-hidden bg-transparent">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 md:w-96 md:h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 md:w-96 md:h-96 bg-violet-300 dark:bg-violet-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              <span className="text-xs md:text-sm font-medium">Community-Driven AI Resources</span>
            </div>

            {/* Heading: Responsive text sizes to prevent awkward wrapping on mobile */}
            <h1 className="mb-6 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight animate-fade-in-up">
              Discover, Share, and Build with AI Agent Resources
            </h1>

            <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto text-base md:text-lg px-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Access a comprehensive library of prompts, tools, and templates to supercharge your AI agent development. Join our community of builders and innovators.
            </p>

            {/* Search Bar Container */}
            {/* <div className="max-w-2xl mx-auto mb-8 w-full px-2">
              <SearchBar
                size="large"
                placeholder="Search prompts, tools, templates..."
              />
            </div> */}

            {/* Buttons: Stack on mobile (w-full), row on tablet/desktop */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full px-2 sm:px-0 flex-wrap">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all animate-fade-in-up" style={{ animationDelay: '0.4s' }} asChild>
                <Link to="/prompts">Browse Prompts</Link>
              </Button>
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all animate-fade-in-up" style={{ animationDelay: '0.5s' }} asChild>
                <Link to="/tools">Browse Tools</Link>
              </Button>
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all animate-fade-in-up" style={{ animationDelay: '0.6s' }} asChild>
                <Link to="/agents">Browse Agents</Link>
              </Button>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4 flex-wrap justify-center">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950 animate-fade-in-up" style={{ animationDelay: '0.7s' }} asChild>
                  <Link to="/submit-prompt">Submit Prompt</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 animate-fade-in-up" style={{ animationDelay: '0.8s' }} asChild>
                  <Link to="/submit-tool">Submit Tool</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 animate-fade-in-up" style={{ animationDelay: '0.9s' }} asChild>
                  <Link to="/submit-agent">Submit Agent</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Create Agent Section */}
      <section className="w-full py-20 bg-transparent">
        <div className="w-full max-w-[1600px] mx-auto px-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}
            <div
              style={{
                marginLeft: '100px'
              }}
              className="flex flex-col justify-center pl-[300px]">

              <h2 className="text-5xl md:text-5xl font-bold leading-[1.2] mb-6">
                <span className="inline-block bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent pb-[0.15em]">
                  Create Your Own AI Agent
                  <br className="hidden sm:block" />
                </span>
              </h2>

              <p className="text-lg sm:text-xl md:text-3xl xl:text-4xl
              leading-snug tracking-tight
              text-slate-600 dark:text-slate-300 mb-8 max-w-4xl">


                Design, configure, and deploy powerful AI agents using prompts,
                tools, and workflows — all without friction.
                <br />
              </p>

              <Button
                size="lg"
                variant="outline"
                className="w-fit border-2 border-violet-300 dark:border-violet-700
                     hover:bg-violet-50 dark:hover:bg-violet-950
                     shadow-md hover:shadow-lg transition-all"
                asChild
              >
                <Link to="/agents/create">
                  Create Agent
                </Link>
              </Button>
            </div>

            {/* Right Animation */}
            <div
              style={{
                marginLeft: '200px'
              }}
              className="relative h-[420px] rounded-2xl overflow-hidden shadow-2xl"
            >
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>

          </div>
        </div>
      </section>


      {/* Featured Items */}
      <section className="w-full py-20 bg-transparent">
        <div className="w-full max-w-[1600px] mx-auto px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Featured Resources</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Hand-picked by our community and team
              <br />
              <br />
            </p>
          </div>
          {loadingFeatured ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-violet-500 animate-spin mb-4" />
              <p className="text-muted-foreground">Loading featured resources...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredItems.map((item) => (
                  <div key={`${item.type}-${item.title}`} className="animate-in fade-in zoom-in duration-1000">
                    <Card {...item} />
                  </div>
                ))}
              </div>
              <div className="text-center mt-12 md:mt-16">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950" asChild>
                  <Link to="/prompts">View All Resources</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}