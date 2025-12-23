import { useParams } from 'react-router-dom';
import { useEffect, useState } from "react";
import { Button } from '../components/ui/button';
import { Tag } from '../components/Tag';
import { Heart, Play, Settings, Share2, Eye, Sparkles } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Textarea } from '../components/ui/textarea';
import { API_BASE_URL } from "../config/api";
import { useTheme } from "../components/ThemeProvider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Markdown from 'react-markdown';

export function AgentDetail() {
    const { id } = useParams();
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userInput, setUserInput] = useState("");
    const [agentOutput, setAgentOutput] = useState("");
    const [running, setRunning] = useState(false);
    const { theme } = useTheme();
    const navigate = useNavigate();

    /* Edit State */
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editSystemPrompt, setEditSystemPrompt] = useState("");
    const [editModel, setEditModel] = useState("");
    const [editTemperature, setEditTemperature] = useState(0.7);
    const [editMaxTokens, setEditMaxTokens] = useState(2000);
    const [editVisibility, setEditVisibility] = useState("public");
    const [editTools, setEditTools] = useState<any[]>([]);
    const [editPrompts, setEditPrompts] = useState<any[]>([]);
    const [editInstructions, setEditInstructions] = useState("");
    const [instructionLoading, setInstructionLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    const runAgent = async () => {
        if (!userInput.trim()) {
            toast.error("Please enter a message to try the agent.");
            return;
        }

        setRunning(true);
        setAgentOutput("");

        try {
            const res = await fetch(`${API_BASE_URL}/agents/${id}/run`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    agent: id,
                    input: userInput,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to run agent");
            }

            const data = await res.json();
            setAgentOutput(data.output);

        } catch (err) {
            console.error(err);
            setAgentOutput("❌ Failed to run agent.");
        } finally {
            setRunning(false);
        }
    };



    useEffect(() => {
        async function fetchAgent() {
            try {
                const token = sessionStorage.getItem("token") || localStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/agents/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Agent not found");
                const data = await res.json();
                setAgent(data);

                // Initialize edit fields
                setEditTitle(data.title);
                setEditDescription(data.description || "");
                setEditSystemPrompt(data.system_prompt || "");
                setEditModel(data.model || "");
                setEditTemperature(data.temperature || 0.7);
                setEditMaxTokens(data.max_tokens || 2000);
                setEditVisibility(data.visibility || "public");
                setEditTools(data.tools || []);
                setEditPrompts(data.prompts || []);
                setEditInstructions(data.instructions || "");
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        async function fetchUser() {
            try {
                const token = sessionStorage.getItem("token") || localStorage.getItem("token");
                if (!token) return;
                const res = await fetch(`${API_BASE_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCurrentUser(data);
                }
            } catch (err) { }
        }

        if (id) {
            fetchAgent();
            fetchUser();
        }
    }, [id]);

    // Debugging ownership
    useEffect(() => {
        if (currentUser && agent) {
            console.log("Ownership Debug:", {
                currentUserId: currentUser.id,
                agentCreatedBy: agent.created_by,
                isOwner: currentUser.id === agent.created_by
            });
        }
    }, [currentUser, agent]);

    const handleUpdate = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/agents/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDescription,
                    system_prompt: editSystemPrompt,
                    model: editModel,
                    temperature: editTemperature,
                    max_tokens: editMaxTokens,
                    visibility: editVisibility,
                    // Use current edit state
                    tools: editTools.map((t: any) => ({
                        tool_id: t.tool_id,
                        name: t.display_name,
                        description: t.display_description,
                        code: t.display_code,
                        enabled: t.enabled
                    })),
                    prompts: editPrompts.map((p: any) => ({
                        prompt_id: p.prompt_id,
                        role: p.role,
                        content: p.content,
                        order: p.order
                    })),
                    instructions: editInstructions
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                setAgent(updated);
                setEditing(false);
                toast.success("Agent updated successfully!");
            } else {
                toast.error("Failed to update agent");
            }
        } catch (err) {
            toast.error("Error updating agent");
        }
    };

    const handleGenerateInstructions = async () => {
        setInstructionLoading(true);
        const toastId = toast.loading("Generating instructions...");
        try {
            const res = await fetch(`${API_BASE_URL}/ai/generate-agent-instructions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("token") || localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDescription,
                    model: editModel,
                    system_prompt: editSystemPrompt,
                    tools: editTools.map((t: any) => ({ name: t.display_name, description: t.display_description })),
                    prompts: editPrompts.map((p: any) => ({ content: p.content, role: p.role }))
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setEditInstructions(data.output);
                toast.success("Instructions generated!", { id: toastId });
            } else {
                toast.error("Failed to generate instructions", { id: toastId });
            }
        } catch (err) {
            toast.error("Error connecting to generator", { id: toastId });
        } finally {
            setInstructionLoading(false);
        }
    };

    const handleLike = async () => {
        try {
            const token = sessionStorage.getItem("token") || localStorage.getItem("token");
            if (!token) {
                toast.error("Please login to like this agent");
                return;
            }
            const res = await fetch(`${API_BASE_URL}/agents/${id}/like`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAgent({ ...agent, likes: data.likes });
                toast.success(data.message);
            }
        } catch (err) {
            toast.error("Error liking agent");
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    const handleTryAgent = () => {
        setActiveTab("demo");
        // Scroll to the tabs content
        const tabsElement = document.querySelector('[role="tablist"]');
        if (tabsElement) {
            tabsElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDelete = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/agents/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success("Agent deleted!");
                navigate("/agents");
            } else {
                toast.error("Failed to delete agent");
            }
        } catch (err) {
            toast.error("Error deleting agent");
        }
    };

    if (loading) {
        return <div className="text-center py-20">Loading agent...</div>;
    }

    if (!agent) {
        return <div className="text-center py-20">Agent not found</div>;
    }

    return (
        <div
            className="container mx-auto px-4 py-8 max-w-6xl min-h-screen bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-slate-950 dark:to-purple-950/50"
            style={{ backgroundImage: theme === 'light' ? 'linear-gradient(to top, #e3d5f4ff 0%, #dbc6fcff 100%)' : undefined }}
        >
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        {editing ? (
                            <input
                                className="text-4xl font-bold mb-4 bg-transparent border-b border-slate-300 dark:border-slate-700 w-full outline-none focus:border-violet-500"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                            />
                        ) : (
                            <h1 className="mb-4">{agent.title}</h1>
                        )}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {agent.tags?.map((tag: string, i: number) => (
                                <Tag key={i}>{tag}</Tag>
                            ))}
                            {/* <Badge variant="outline">{agent.visibility}</Badge> */}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                    <Button
                        className="border border-slate-200 dark:border-slate-800 hover:opacity-90"
                        style={{
                            backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF',
                            color: theme === 'dark' ? 'white' : 'black'
                        }}
                        onClick={handleTryAgent}
                    >
                        <Play className="h-4 w-4 mr-2" />
                        Try Agent
                    </Button>
                    <Button
                        variant="outline"
                        style={{
                            backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF',
                            color: theme === 'dark' ? 'white' : 'black'
                        }}
                        className="border border-slate-200 dark:border-slate-800"
                        onClick={handleLike}
                    >
                        <Heart className="h-4 w-4 mr-2" />
                        Like ({agent.likes})
                    </Button>
                    <Button
                        variant="outline"
                        style={{
                            backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF',
                            color: theme === 'dark' ? 'white' : 'black'
                        }}
                        className="border border-slate-200 dark:border-slate-800"
                        onClick={handleShare}
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>

                    {currentUser && currentUser.id === agent.created_by && (
                        <div className="flex gap-4">
                            {!editing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        style={{
                                            backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF',
                                            color: theme === 'dark' ? 'white' : 'black'
                                        }}
                                        className="border border-slate-200 dark:border-slate-800"
                                        onClick={() => setEditing(true)}
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        Delete
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setEditing(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleUpdate}
                                    >
                                        Save Changes
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {showDeleteConfirm && (
                    <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 font-semibold mb-4 text-center">
                            Are you sure you want to delete this agent? This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete}>Yes, Delete</Button>
                        </div>
                    </div>
                )}

                {editing ? (
                    <textarea
                        className="w-full p-4 rounded-lg bg-transparent border border-slate-300 dark:border-slate-700 min-h-[100px] outline-none focus:border-violet-500"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                    />
                ) : (
                    <p className="text-muted-foreground text-lg">{agent.description}</p>
                )}
            </div>

            <Separator className="mb-8" />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card
                    className="border-none"
                    style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
                >
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Views</span>
                        </div>
                        <p className="text-2xl font-semibold">{agent.views}</p>
                    </CardContent>
                </Card>
                <Card
                    className="border-none"
                    style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
                >
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-1">
                            <Heart className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Likes</span>
                        </div>
                        <p className="text-2xl font-semibold">{agent.likes}</p>
                    </CardContent>
                </Card>
                <Card
                    className="border-none"
                    style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
                >
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-1">Model</div>
                        <p className="text-lg font-medium">{agent.model}</p>
                    </CardContent>
                </Card>
                <Card
                    className="border-none"
                    style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
                >
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-1">Created</div>
                        <p className="text-lg font-medium">{agent.created_at}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                <TabsList
                    className="inline-flex w-full rounded-full bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                    <TabsTrigger value="overview" className="flex-1 rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-900 data-[state=active]:shadow data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Overview</TabsTrigger>
                    <TabsTrigger value="configuration" className="flex-1 rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-900 data-[state=active]:shadow data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Configuration</TabsTrigger>
                    <TabsTrigger value="demo" className="flex-1 rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-900 data-[state=active]:shadow data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Try it Out</TabsTrigger>
                    <TabsTrigger value="about" className="flex-1 rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-900 data-[state=active]:shadow data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">About</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Instructions</CardTitle>
                            <CardDescription>Core behavior and guidelines for this agent</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea
                                className="h-[400px] w-full rounded-lg border p-4"
                                style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
                            >
                                {editing ? (
                                    <textarea
                                        className="w-full h-full min-h-[350px] bg-transparent outline-none font-mono text-sm whitespace-pre-wrap"
                                        value={editSystemPrompt}
                                        onChange={(e) => setEditSystemPrompt(e.target.value)}
                                    />
                                ) : (
                                    <pre className="whitespace-pre-wrap text-sm">{agent.system_prompt}</pre>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Usage Instructions</CardTitle>
                                    <CardDescription>How to best interact with this agent</CardDescription>
                                </div>
                                {editing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400"
                                        onClick={handleGenerateInstructions}
                                        disabled={instructionLoading}
                                    >
                                        {instructionLoading ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                                        ) : (
                                            <Sparkles className="h-4 w-4" />
                                        )}
                                        Generate with AI
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {editing ? (
                                <Textarea
                                    rows={10}
                                    value={editInstructions}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditInstructions(e.target.value)}
                                    placeholder="Enter usage guide (Markdown supported)..."
                                    className="bg-transparent border-slate-300 dark:border-slate-700 w-full"
                                />
                            ) : (
                                <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                                    {(agent.instructions || editInstructions) ? (
                                        <Markdown
                                            components={{
                                                h1: (props) => <h1 className="text-2xl font-bold mb-4 text-slate-950 dark:text-purple-300" {...props} />,
                                                h2: (props) => <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-purple-200" {...props} />,
                                                h3: (props) => <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-purple-100" {...props} />,
                                                p: (props) => <p className="mb-4 text-slate-900 dark:text-slate-300 leading-relaxed" {...props} />,
                                                ul: (props) => <ul className="list-disc list-inside mb-4 text-slate-900 dark:text-slate-300" {...props} />,
                                                ol: (props) => <ol className="list-decimal list-inside mb-4 text-slate-900 dark:text-slate-300" {...props} />,
                                                li: (props) => <li className="mb-1" {...props} />,
                                                strong: (props) => <strong className="text-black dark:text-white font-bold" {...props} />,
                                                code: ({ className, children, ...props }: any) => {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return !match ? (
                                                        <code className="px-1.5 py-0.5 rounded text-sm text-slate-900 dark:text-purple-200 font-mono" {...props}>
                                                            {children}
                                                        </code>
                                                    ) : (
                                                        <code className={className} {...props}>{children}</code>
                                                    );
                                                },
                                                pre: (props) => (
                                                    <pre className="bg-white/60 dark:bg-black/90 p-4 rounded-lg mb-4 overflow-x-auto border border-slate-200 dark:border-slate-700/50 text-black dark:text-white" {...props} />
                                                ),
                                            }}
                                        >
                                            {agent.instructions || editInstructions}
                                        </Markdown>
                                    ) : (
                                        <p className="italic">No usage instructions provided.</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Configuration Tab */}
                <TabsContent value="configuration" className="space-y-6">
                    <Card
                        style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
                    >
                        <CardHeader>
                            <CardTitle>Model Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Model</div>
                                    {editing ? (
                                        <input
                                            className="bg-transparent border-b border-slate-300 dark:border-slate-700 outline-none w-full"
                                            value={editModel}
                                            onChange={(e) => setEditModel(e.target.value)}
                                        />
                                    ) : (
                                        <p>{agent.model}</p>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Temperature</div>
                                    {editing ? (
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="bg-transparent border-b border-slate-300 dark:border-slate-700 outline-none w-full"
                                            value={editTemperature}
                                            onChange={(e) => setEditTemperature(parseFloat(e.target.value))}
                                        />
                                    ) : (
                                        <p>{agent.temperature}</p>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Max Tokens</div>
                                    {editing ? (
                                        <input
                                            type="number"
                                            className="bg-transparent border-b border-slate-300 dark:border-slate-700 outline-none w-full"
                                            value={editMaxTokens}
                                            onChange={(e) => setEditMaxTokens(parseInt(e.target.value))}
                                        />
                                    ) : (
                                        <p>{agent.max_tokens}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
                    >
                        <CardHeader>
                            <CardTitle>Configured Tools</CardTitle>
                            <CardDescription>Tools enabled for this agent</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {(editing ? editTools : agent.tools).map((tool: any, idx: number) => (
                                    <div
                                        key={tool.id || idx}
                                        className={`p-4 border rounded-lg ${!tool.enabled ? "opacity-50" : ""}`}
                                        style={{ backgroundColor: theme === 'dark' ? 'black' : 'white' }}
                                    >
                                        {editing ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <input
                                                        className="font-bold bg-transparent border-b border-slate-700 outline-none w-full mr-4"
                                                        value={tool.display_name}
                                                        onChange={(e) => {
                                                            const newTools = [...editTools];
                                                            newTools[idx].display_name = e.target.value;
                                                            setEditTools(newTools);
                                                        }}
                                                        placeholder="Tool Name"
                                                    />
                                                    <Badge
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            const newTools = [...editTools];
                                                            newTools[idx].enabled = !newTools[idx].enabled;
                                                            setEditTools(newTools);
                                                        }}
                                                    >
                                                        {tool.enabled ? "Enabled" : "Disabled"}
                                                    </Badge>
                                                </div>
                                                <textarea
                                                    className="text-sm text-muted-foreground bg-transparent border border-slate-700 rounded p-2 w-full outline-none"
                                                    value={tool.display_description}
                                                    onChange={(e) => {
                                                        const newTools = [...editTools];
                                                        newTools[idx].display_description = e.target.value;
                                                        setEditTools(newTools);
                                                    }}
                                                    placeholder="Tool Description"
                                                />
                                                <textarea
                                                    className="text-sm font-mono text-muted-foreground bg-transparent border border-slate-700 rounded p-2 w-full outline-none h-32"
                                                    value={tool.display_code}
                                                    onChange={(e) => {
                                                        const newTools = [...editTools];
                                                        newTools[idx].display_code = e.target.value;
                                                        setEditTools(newTools);
                                                    }}
                                                    placeholder="Tool Code"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <h4>{tool.display_name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {tool.display_description}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {tool.display_code}
                                                </p>
                                                <Badge>{tool.enabled ? "Enabled" : "Disabled"}</Badge>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
                    >
                        <CardHeader>
                            <CardTitle>Configured Prompts</CardTitle>
                            <CardDescription>Prompts used by this agent</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {(editing ? editPrompts : agent.prompts).map((prompt: any, idx: number) => (
                                    <div
                                        key={prompt.id || idx}
                                        className="p-4 border rounded-lg"
                                        style={{ backgroundColor: theme === 'dark' ? 'black' : 'white' }}
                                    >
                                        {editing ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold">Prompt #{prompt.order}</span>
                                                    <select
                                                        className="!bg-white border border-slate-300 rounded p-1 text-sm outline-none !text-black font-medium"
                                                        value={prompt.role}
                                                        onChange={(e) => {
                                                            const newPrompts = [...editPrompts];
                                                            newPrompts[idx].role = e.target.value;
                                                            setEditPrompts(newPrompts);
                                                        }}
                                                    >
                                                        <option value="system" className="!bg-white !text-black">system</option>
                                                        <option value="user" className="!bg-white !text-black">user</option>
                                                        <option value="assistant" className="!bg-white !text-black">assistant</option>
                                                    </select>
                                                </div>
                                                <textarea
                                                    className="text-sm text-muted-foreground bg-transparent border border-slate-700 rounded p-2 w-full outline-none h-24"
                                                    value={prompt.content}
                                                    onChange={(e) => {
                                                        const newPrompts = [...editPrompts];
                                                        newPrompts[idx].content = e.target.value;
                                                        setEditPrompts(newPrompts);
                                                    }}
                                                    placeholder="Prompt content..."
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <h4>Prompt #{prompt.order}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Role: {prompt.role}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {prompt.content}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Demo Tab */}
                <TabsContent value="demo" className="space-y-6">
                    <Card
                        style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
                    >
                        <CardHeader>
                            <CardTitle>Try This Agent</CardTitle>
                            <CardDescription>
                                Ask a question and see the agent respond in real time
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Input */}
                            <div>
                                <div className="text-sm text-muted-foreground mb-2">
                                    Your Input:
                                </div>
                                <textarea
                                    className="w-full min-h-[120px] rounded-lg border p-3 bg-background"
                                    placeholder="Ask something..."
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                />
                            </div>

                            {/* Run button */}
                            <Button
                                onClick={runAgent}
                                disabled={running}
                                className="border border-slate-200 dark:border-slate-800 hover:opacity-90"
                                style={{
                                    backgroundColor: theme === 'dark' ? 'black' : 'white',
                                    color: theme === 'dark' ? 'white' : 'black'
                                }}
                            >
                                {running ? "Running..." : "Run Agent"}
                            </Button>

                            {/* Output */}
                            {agentOutput && (
                                <div>
                                    <div className="text-sm text-muted-foreground mb-2">
                                        Agent Response:
                                    </div>
                                    <ScrollArea
                                        className="h-[500px] w-full rounded-lg border p-4 text-black dark:text-white"
                                        style={{ backgroundColor: theme === 'dark' ? 'black' : 'white' }}
                                    >
                                        <div className="prose dark:prose-invert max-w-none">
                                            <Markdown
                                                components={{
                                                    h1: (props) => <h1 className="text-2xl font-bold mb-4 text-slate-950 dark:text-white" {...props} />,
                                                    h2: (props) => <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100" {...props} />,
                                                    h3: (props) => <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-200" {...props} />,
                                                    p: (props) => <p className="mb-4 text-slate-900 dark:text-white leading-relaxed" {...props} />,
                                                    ul: (props) => <ul className="list-disc list-inside mb-4 text-slate-900 dark:text-white" {...props} />,
                                                    ol: (props) => <ol className="list-decimal list-inside mb-4 text-slate-900 dark:text-white" {...props} />,
                                                    li: (props) => <li className="mb-1" {...props} />,
                                                    strong: (props) => <strong className="text-black dark:text-white font-bold" {...props} />,
                                                    code: ({ className, children, ...props }: any) => {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return !match ? (
                                                            <code className="px-1.5 py-0.5 rounded text-sm text-slate-900 dark:text-purple-200 font-mono" {...props}>
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <code className={className} {...props}>{children}</code>
                                                        );
                                                    },
                                                    pre: (props) => (
                                                        <pre className="bg-white/60 dark:bg-black/90 p-4 rounded-lg mb-4 overflow-x-auto border border-slate-200 dark:border-slate-700/50 text-black dark:text-white" {...props} />
                                                    ),
                                                }}
                                            >
                                                {agentOutput}
                                            </Markdown>
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>


                {/* About Tab */}
                <TabsContent value="about" className="space-y-6">
                    <Card style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}>
                        <CardHeader>
                            <CardTitle>About This Agent</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Created By</div>
                                <p>{agent.creator_name}</p>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Created On</div>
                                <p className="text-lg">
                                    {new Date(agent.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Visibility</div>
                                <p className="capitalize">{agent.visibility}</p>
                            </div>
                            {/* <Separator /> */}
                            {/* <div>
                                <h3 className="mb-3">Use Cases</h3>
                                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                                    <li>Academic literature reviews</li>
                                    <li>Market research and analysis</li>
                                    <li>Technical documentation research</li>
                                    <li>Competitive intelligence gathering</li>
                                    <li>Grant proposal background research</li>
                                </ul>
                            </div> */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
