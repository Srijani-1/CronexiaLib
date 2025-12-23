import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { API_BASE_URL } from "../config/api";

interface FilterGroup {
    title: string;
    options: {
        id: string;
        label: string;
        checked?: boolean;
    }[];
}

import { useTheme } from '../components/ThemeProvider';

export function AgentLibrary() {
    const { theme } = useTheme();
    /* State */
    const [currentPage, setCurrentPage] = useState(1);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const abortControllerRef = useRef<AbortController | null>(null);

    /* Logic to fetch agents with current state filters */
    const fetchAgents = async () => {
        // Cancel previous
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append("search", searchQuery);

            // Extract active filters
            filterGroups.forEach(group => {
                const activeOptions = group.options.filter(o => o.checked).map(o => o.label);
                if (activeOptions.length > 0) {
                    // Map Group Title to backend query param
                    // Titles: "Language", "Use Case", "Model" -> params: language, tag, model
                    let paramKey = "";
                    if (group.title === "Tools Used") paramKey = "tools";
                    else if (group.title === "Category") paramKey = "tag";
                    else if (group.title === "Model") paramKey = "model";

                    if (paramKey && activeOptions.length > 0) {
                        // Pass first selected option for now
                        queryParams.append(paramKey, activeOptions[0]);
                    }
                }
            });

            const res = await fetch(`${API_BASE_URL}/agents/?${queryParams.toString()}`, {
                signal: controller.signal
            });
            const data = await res.json();
            setAgents(data.data || []);
            setTotalPages(data.total_pages || 1);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error("Failed to fetch agents:", err);
        } finally {
            if (abortControllerRef.current === controller) {
                setLoading(false);
            }
        }
    };

    /* Initial Load & Search */
    useEffect(() => {
        // Instant search with abort handling
        fetchAgents();
    }, [searchQuery]);

    /* Handlers */
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleFilterChange = (groupTitle: string, optionId: string, checked: boolean) => {
        setFilterGroups(prev => prev.map(group => {
            if (group.title !== groupTitle) return group;
            return {
                ...group,
                options: group.options.map(opt =>
                    opt.id === optionId ? { ...opt, checked } : opt
                )
            };
        }));
    };

    const handleApplyFilters = () => {
        fetchAgents();
    };

    useEffect(() => {
        async function fetchFilters() {
            try {
                const res = await fetch(`${API_BASE_URL}/agents/filters`);
                const data = await res.json();

                setFilterGroups([
                    {
                        title: "Category",
                        options: data.tags?.map((l: string) => ({
                            id: l.toLowerCase().replace(/\s+/g, "-"),
                            label: l,
                            checked: false
                        })) || []
                    },
                    {
                        title: "Tools Used",
                        options: data.tools?.map((t: string) => ({
                            id: t.toLowerCase().replace(/\s+/g, "-"),
                            label: t,
                            checked: false
                        })) || []
                    },
                    {
                        title: "Model",
                        options: data.models?.map((m: string) => ({
                            id: m.toLowerCase().replace(/\s+/g, "-"),
                            label: m,
                            checked: false
                        })) || []
                    }
                ]);
            } catch (err) {
                console.error("Failed to load filters:", err);
            }
        }

        fetchFilters();
    }, []);

    if (loading && !agents.length && !filterGroups.length) { // Initial load
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center dark:text-white">Loading agents...</p>
            </div>
        );
    }


    // export function AgentLibrary() {
    //     const [currentPage, setCurrentPage] = useState(1);

    //     const filterGroups = [
    //         {
    //             title: 'Category',
    //             options: [
    //                 { id: 'research', label: 'Research' },
    //                 { id: 'coding', label: 'Coding' },
    //                 { id: 'marketing', label: 'Marketing' },
    //                 { id: 'data', label: 'Data Analysis' },
    //                 { id: 'customer-support', label: 'Customer Support' },
    //                 { id: 'creative', label: 'Creative' },
    //             ],
    //         },
    //         {
    //             title: 'Model',
    //             options: [
    //                 { id: 'gpt-4', label: 'GPT-4' },
    //                 { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    //                 { id: 'gpt-3.5', label: 'GPT-3.5' },
    //                 { id: 'claude-3', label: 'Claude 3' },
    //                 { id: 'gemini', label: 'Gemini' },
    //                 { id: 'llama', label: 'Llama' },
    //             ],
    //         },
    //         {
    //             title: 'Tools Used',
    //             options: [
    //                 { id: 'web-search', label: 'Web Search' },
    //                 { id: 'code-interpreter', label: 'Code Interpreter' },
    //                 { id: 'api-integration', label: 'API Integration' },
    //                 { id: 'file-analysis', label: 'File Analysis' },
    //                 { id: 'image-generation', label: 'Image Generation' },
    //             ],
    //         },
    //         {
    //             title: 'Creator',
    //             options: [
    //                 { id: 'verified', label: 'Verified Creators' },
    //                 { id: 'community', label: 'Community' },
    //                 { id: 'official', label: 'Official' },
    //             ],
    //         },
    //     ];

    //     const agents = [
    //         {
    //             title: 'Research Assistant Pro',
    //             description: 'Advanced research agent that can search, summarize, and synthesize information from multiple sources with citations.',
    //             tags: ['Research', 'GPT-4', 'Web Search'],
    //             href: '/agents/1',
    //             metadata: [
    //                 { label: 'Uses', value: '2.4k' },
    //                 { label: 'Likes', value: '567' },
    //             ],
    //         },
    //         {
    //             title: 'Full-Stack Code Generator',
    //             description: 'Generate complete, production-ready code with tests, documentation, and best practices across multiple frameworks.',
    //             tags: ['Coding', 'GPT-4 Turbo', 'Code Interpreter'],
    //             href: '/agents/2',
    //             metadata: [
    //                 { label: 'Uses', value: '1.8k' },
    //                 { label: 'Likes', value: '432' },
    //             ],
    //         },
    //         {
    //             title: 'Marketing Campaign Creator',
    //             description: 'End-to-end marketing campaign agent that creates content, ad copy, social posts, and analytics strategies.',
    //             tags: ['Marketing', 'Claude 3', 'Image Generation'],
    //             href: '/agents/3',
    //             metadata: [
    //                 { label: 'Uses', value: '1.5k' },
    //                 { label: 'Likes', value: '389' },
    //             ],
    //         },
    //         {
    //             title: 'Data Analysis Expert',
    //             description: 'Comprehensive data analysis agent with visualization generation, statistical analysis, and actionable insights.',
    //             tags: ['Data Analysis', 'GPT-4', 'Code Interpreter'],
    //             href: '/agents/4',
    //             metadata: [
    //                 { label: 'Uses', value: '1.2k' },
    //                 { label: 'Likes', value: '298' },
    //             ],
    //         },
    //         {
    //             title: 'Customer Support Specialist',
    //             description: 'Intelligent customer support agent with sentiment analysis, ticket routing, and knowledge base integration.',
    //             tags: ['Customer Support', 'GPT-3.5', 'API Integration'],
    //             href: '/agents/5',
    //             metadata: [
    //                 { label: 'Uses', value: '2.1k' },
    //                 { label: 'Likes', value: '478' },
    //             ],
    //         },
    //         {
    //             title: 'Content Creator Studio',
    //             description: 'Multi-modal content creation agent for blogs, videos, podcasts, and social media with SEO optimization.',
    //             tags: ['Creative', 'Gemini', 'Image Generation'],
    //             href: '/agents/6',
    //             metadata: [
    //                 { label: 'Uses', value: '934' },
    //                 { label: 'Likes', value: '267' },
    //             ],
    //         },
    //     ];

    return (
        <div
            className="container mx-auto px-4 py-8 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-slate-950 dark:to-purple-950/50 min-h-screen"
            style={{ backgroundImage: theme === 'light' ? 'linear-gradient(to top, #e3d5f4ff 0%, #dbc6fcff 100%)' : undefined }}
        >

            {/* <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="mb-2">Agent Library</h1>
                        <p className="text-muted-foreground">
                            Discover and deploy pre-configured AI agents for various tasks
                        </p>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                        asChild
                    >
                        <Link to="/agents/builder">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Agent
                        </Link>
                    </Button>
                </div>
                <SearchBar placeholder="Search agents..." />
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <Sidebar filterGroups={filterGroups} />

                <div className="flex-1">
                    <div className="mb-8 p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl border-2 border-violet-200 dark:border-violet-800">
                        <h2 className="mb-2">Featured Agents</h2>
                        <p className="text-muted-foreground mb-4">
                            Top-rated agents curated by our community
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {agents.slice(0, 2).map((agent, index) => (
                                <Card key={index} {...agent} />
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="mb-4">All Agents</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {agents.map((agent, index) => (
                            <Card key={index} {...agent} />
                        ))}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
} */}

            <div className="mb-8">
                <SearchBar placeholder="Search agents..." onSearch={handleSearch} />
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters */}
                <Sidebar
                    filterGroups={filterGroups}
                    onFilterChange={handleFilterChange}
                    onApply={handleApplyFilters}
                />

                {/* Main Content */}
                <div className="flex-1">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 animate-fade-in-up">
                            <h1 className="mb-2">Agent Library</h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                Discover and deploy pre-configured AI agents for various tasks
                            </p>
                        </div>
                        <Button
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                            asChild
                        >
                            <Link to="/submit-agent">
                                <Plus className="mr-2 h-4 w-4" />
                                Upload Agent
                            </Link>
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                            asChild
                        >
                            <Link to="/agents/builder">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Agent
                            </Link>
                        </Button>
                    </div>

                    {/* Agents Grid */}
                    {agents.length > 0 ? (
                        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
                            {agents.map((agent: any, index: number) => (
                                <div key={agent.id} className="animate-stagger" style={{ animationDelay: `${0.05 * index}s` }}>
                                    <Card
                                        title={agent.title}
                                        description={agent.description}
                                        tags={agent.tags || []}
                                        href={`/agents/${agent.id}`}
                                        metadata={[
                                            { label: "Views", value: agent.views || "0" },
                                            { label: "Likes", value: agent.likes || "0" },
                                        ]}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center py-12">
                            <p className="text-xl text-slate-600 dark:text-slate-400">Loading...</p>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-lg text-slate-600 dark:text-slate-400">No agents found matching your search.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}

