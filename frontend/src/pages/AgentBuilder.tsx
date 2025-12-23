import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Play, Save, Sparkles, Check } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config/api';
import { useEffect } from 'react';
import Markdown from 'react-markdown';
import { useTheme } from "../components/ThemeProvider";

type Step = 'basics' | 'instructions' | 'tools' | 'prompts' | 'usage' | 'test';

interface AgentData {
    name: string;
    description: string;
    model: string;
    visibility: string;
    systemPrompt: string;
    tags: string[];
    temperature: string;
    maxTokens: string;
    selectedTools: number[];
    selectedPrompts: { id: number; role: string; order: number }[];
    testInput: string;
    testOutput: string;
    instructions: string;
}

export function AgentBuilder() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [allTools, setAllTools] = useState<any[]>([]);
    const [allPrompts, setAllPrompts] = useState<any[]>([]);
    const [suggestedTools, setSuggestedTools] = useState<number[]>([]);
    const [suggestedPrompts, setSuggestedPrompts] = useState<number[]>([]);
    const [currentStep, setCurrentStep] = useState<Step>('basics');
    const [agentData, setAgentData] = useState<AgentData>({
        name: '',
        description: '',
        model: 'gpt-4',
        visibility: 'public',
        systemPrompt: '',
        tags: [],
        temperature: '0.7',
        maxTokens: '2000',
        selectedTools: [],
        selectedPrompts: [],
        testInput: '',
        testOutput: '',
        instructions: '',
    });
    const [tagsInput, setTagsInput] = useState('');
    const [instructionLoading, setInstructionLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const toolsRes = await fetch(`${API_BASE_URL}/tools/`);
                const promptsRes = await fetch(`${API_BASE_URL}/prompts/`);
                const toolsData = await toolsRes.json();
                const promptsData = await promptsRes.json();
                setAllTools(toolsData.data || []);
                setAllPrompts(promptsData.data || []);
            } catch (err) {
                console.error("Failed to fetch library items", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        // Update suggestions based on tags, description and name
        const searchTerms = [
            ...agentData.tags.map(t => t.toLowerCase()),
            ...agentData.name.toLowerCase().split(/\s+/),
            ...agentData.description.toLowerCase().split(/\s+/)
        ].filter(t => t.length > 2);

        if (searchTerms.length === 0) {
            setSuggestedTools([]);
            setSuggestedPrompts([]);
            return;
        }

        const suggestedT = allTools.filter(tool => {
            const toolTags = Array.isArray(tool.tags) ? tool.tags.map((t: string) => t.toLowerCase()) : [];
            const toolText = (tool.title + " " + tool.description).toLowerCase();

            const tagMatch = agentData.tags.some(t => toolTags.includes(t.toLowerCase()));
            if (tagMatch) return true;

            return searchTerms.some(term => toolText.includes(term) || toolTags.some((tag: string) => tag.includes(term)));
        }).map(t => t.id);

        const suggestedP = allPrompts.filter(prompt => {
            const promptTags = Array.isArray(prompt.tags) ? prompt.tags.map((t: string) => t.toLowerCase()) : [];
            const promptText = (prompt.title + " " + prompt.description).toLowerCase();

            const tagMatch = agentData.tags.some(t => promptTags.includes(t.toLowerCase()));
            if (tagMatch) return true;

            return searchTerms.some(term => promptText.includes(term) || promptTags.some((tag: string) => tag.includes(term)));
        }).map(p => p.id);

        setSuggestedTools(suggestedT);
        setSuggestedPrompts(suggestedP);
    }, [agentData.tags, agentData.description, agentData.name, allTools, allPrompts]);

    const steps: { id: Step; title: string; description: string }[] = [
        { id: 'basics', title: 'Agent Basics', description: 'Name and configuration' },
        { id: 'instructions', title: 'System Instructions', description: 'Define behavior' },
        { id: 'tools', title: 'Add Tools', description: 'Select capabilities' },
        { id: 'prompts', title: 'Add Prompts', description: 'Configure prompts' },
        { id: 'usage', title: 'Usage Guide', description: 'How to use agent' },
        { id: 'test', title: 'Test Agent', description: 'Try it out' },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const handleNext = () => {
        if (currentStep === 'basics') {
            if (!agentData.name.trim()) {
                toast.error("Please enter an agent name.");
                return;
            }
            if (!agentData.description.trim()) {
                toast.error("Please enter a description.");
                return;
            }
            if (!agentData.model) {
                toast.error("Please select a model.");
                return;
            }
        } else if (currentStep === 'instructions') {
            if (!agentData.systemPrompt.trim()) {
                toast.error("Please enter system instructions.");
                return;
            }
        } else if (currentStep === 'tools') {
            if (agentData.selectedTools.length === 0) {
                toast.error("Please select at least one tool.");
                return;
            }
        }
        // No specific validation for 'usage' step, it's optional.

        if (currentStepIndex < steps.length - 1) {
            setCurrentStep(steps[currentStepIndex + 1].id);
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(steps[currentStepIndex - 1].id);
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
                    title: agentData.name,
                    description: agentData.description,
                    model: agentData.model,
                    system_prompt: agentData.systemPrompt,
                    tags: agentData.tags,
                    tools: allTools.filter(t => agentData.selectedTools.includes(t.id)).map(t => ({ name: t.title, description: t.description })),
                    prompts: allPrompts.filter(p => agentData.selectedPrompts.some(sp => sp.id === p.id)).map(p => ({ title: p.title, description: p.description }))
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setAgentData({ ...agentData, instructions: data.output });
                toast.success("Instructions generated!", { id: toastId });
            } else {
                toast.error("Failed to generate instructions", { id: toastId });
            }
        } catch (err) {
            toast.error("Error generating instructions", { id: toastId });
        } finally {
            setInstructionLoading(false);
        }
    };

    const handleToolToggle = (toolId: number) => {
        setAgentData(prev => ({
            ...prev,
            selectedTools: prev.selectedTools.includes(toolId)
                ? prev.selectedTools.filter(id => id !== toolId)
                : [...prev.selectedTools, toolId],
        }));
    };

    const handlePromptToggle = (promptId: number) => {
        setAgentData(prev => {
            const exists = prev.selectedPrompts.find(p => p.id === promptId);
            if (exists) {
                return {
                    ...prev,
                    selectedPrompts: prev.selectedPrompts.filter(p => p.id !== promptId),
                };
            }
            return {
                ...prev,
                selectedPrompts: [
                    ...prev.selectedPrompts,
                    { id: promptId, role: 'user', order: prev.selectedPrompts.length },
                ],
            };
        });
    };

    const [testLoading, setTestLoading] = useState(false);

    const handleRunTest = async () => {
        if (!agentData.testInput.trim()) return;
        setTestLoading(true);
        const toastId = toast.loading('Running agent test...');

        try {
            const res = await fetch(`${API_BASE_URL}/agents/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    config: {
                        title: agentData.name,
                        description: agentData.description,
                        system_prompt: agentData.systemPrompt,
                        model: agentData.model,
                        temperature: parseFloat(agentData.temperature),
                        max_tokens: parseInt(agentData.maxTokens),
                        visibility: agentData.visibility,
                        tools: agentData.selectedTools.map(id => ({ tool_id: id, enabled: true })),
                        prompts: agentData.selectedPrompts.map(p => ({ prompt_id: p.id, role: p.role, order: p.order })),
                        instructions: agentData.instructions
                    },
                    input: agentData.testInput
                })
            });

            if (res.ok) {
                const result = await res.json();
                setAgentData(prev => ({ ...prev, testOutput: result.output }));
                toast.success("Test complete", { id: toastId });
            } else {
                toast.error("Test failed", { id: toastId });
            }
        } catch (err) {
            toast.error("Error connecting to server", { id: toastId });
        } finally {
            setTestLoading(false);
        }
    };

    const handleSave = async () => {
        if (!agentData.name || !agentData.systemPrompt) {
            toast.error("Name and System Instructions are required.");
            return;
        }

        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Please login to create an agent.");
            return;
        }

        const toastId = toast.loading("Creating agent...");

        try {
            const res = await fetch(`${API_BASE_URL}/agents/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: agentData.name,
                    description: agentData.description,
                    system_prompt: agentData.systemPrompt,
                    model: agentData.model,
                    temperature: parseFloat(agentData.temperature),
                    max_tokens: parseInt(agentData.maxTokens),
                    visibility: agentData.visibility,
                    tools: agentData.selectedTools.map(id => ({ tool_id: id, enabled: true })),
                    prompts: agentData.selectedPrompts.map(p => ({ prompt_id: p.id, role: p.role, order: p.order })),
                    instructions: agentData.instructions
                })
            });

            if (res.ok) {
                const result = await res.json();
                toast.success("Agent created successfully!", { id: toastId });
                navigate(`/agents/${result.id}`);
            } else {
                const errData = await res.json();
                toast.error(errData.detail || "Failed to create agent", { id: toastId });
            }
        } catch (err) {
            toast.error("Error connecting to server", { id: toastId });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-violet-600" />
                    Agent Builder
                </h1>
                <p className="text-muted-foreground">
                    Create a custom AI agent with tools, prompts, and specific instructions
                </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${index <= currentStepIndex
                                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 border-violet-600 text-white'
                                        : 'border-gray-300 dark:border-gray-700 text-gray-400'
                                        }`}
                                >
                                    {index < currentStepIndex ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>
                                <div className="mt-2 text-center hidden md:block">
                                    <div className={`text-sm ${index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {step.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{step.description}</div>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`h-0.5 flex-1 mx-2 transition-all ${index < currentStepIndex
                                        ? 'bg-gradient-to-r from-violet-600 to-purple-600'
                                        : 'bg-gray-300 dark:bg-gray-700'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <Card className="mb-8 border-violet-200 dark:border-violet-800 bg-white/40 dark:bg-black/60 shadow-xl backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">{steps[currentStepIndex].title}</CardTitle>
                    <CardDescription>{steps[currentStepIndex].description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Step 1: Agent Basics */}
                    {currentStep === 'basics' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Agent Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Research Assistant Pro"
                                        value={agentData.name}
                                        onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                                        className="bg-white/50 dark:bg-slate-900/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="model">Model *</Label>
                                    <Input
                                        id="model"
                                        placeholder="e.g., gpt-4"
                                        value={agentData.model}
                                        onChange={(e) => setAgentData({ ...agentData, model: e.target.value })}
                                        className="bg-white/50 dark:bg-slate-900/50"
                                    />
                                    {/* <Select value={agentData.model} onValueChange={(value: string) => setAgentData({ ...agentData, model: value })}>
                                        <SelectTrigger className="!bg-white !text-black border-slate-200 !opacity-100" style={{ backgroundColor: 'white', color: 'black' }}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="!bg-white !text-black border !border-slate-200 shadow-2xl !opacity-100 z-[100]" style={{ backgroundColor: 'white', color: 'black' }}>
                                            <SelectItem value="gpt-4" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">GPT-4</SelectItem>
                                            <SelectItem value="gpt-4-turbo" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">GPT-4 Turbo</SelectItem>
                                            <SelectItem value="gpt-3.5" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">GPT-3.5</SelectItem>
                                            <SelectItem value="claude-3" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">Claude 3</SelectItem>
                                            <SelectItem value="gemini" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">Gemini</SelectItem>
                                        </SelectContent>
                                    </Select> */}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe what your agent does..."
                                    rows={3}
                                    value={agentData.description}
                                    onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                                    className="bg-white/50 dark:bg-slate-900/50"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* <div className="space-y-2">
                                    <Label htmlFor="visibility">Visibility</Label>
                                    <Select value={agentData.visibility} onValueChange={(value: string) => setAgentData({ ...agentData, visibility: value })}>
                                        <SelectTrigger className="!bg-white !text-black border-slate-200 !opacity-100" style={{ backgroundColor: 'white', color: 'black' }}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="!bg-white !text-black border !border-slate-200 shadow-2xl !opacity-100 z-[100]" style={{ backgroundColor: 'white', color: 'black' }}>
                                            <SelectItem value="public" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">Public</SelectItem>
                                            <SelectItem value="private" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">Private</SelectItem>
                                            <SelectItem value="unlisted" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">Unlisted</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div> */}
                                <div className="space-y-2">
                                    <Label htmlFor="temperature">Temperature</Label>
                                    <Input
                                        id="temperature"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="2"
                                        value={agentData.temperature}
                                        onChange={(e) => setAgentData({ ...agentData, temperature: e.target.value })}
                                        className="bg-white/50 dark:bg-slate-900/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxTokens">Max Tokens</Label>
                                    <Input
                                        id="maxTokens"
                                        type="number"
                                        value={agentData.maxTokens}
                                        onChange={(e) => setAgentData({ ...agentData, maxTokens: e.target.value })}
                                        className="bg-white/50 dark:bg-slate-900/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags (comma separated)</Label>
                                <Input
                                    id="tags"
                                    placeholder="e.g., research, coding, ai"
                                    value={tagsInput}
                                    onChange={(e) => {
                                        setTagsInput(e.target.value);
                                        const tags = e.target.value.split(",").map(t => t.trim()).filter(t => t);
                                        setAgentData({ ...agentData, tags });
                                    }}
                                    className="bg-white/50 dark:bg-slate-900/50"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: System Instructions */}
                    {currentStep === 'instructions' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800">
                                <h3 className="mb-2 font-semibold">System Prompt Guidelines</h3>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Define the agent's role and expertise</li>
                                    <li>Specify tone and communication style</li>
                                    <li>Include any constraints or guidelines</li>
                                    <li>You can use Markdown formatting</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="systemPrompt">System Instructions *</Label>
                                <Textarea
                                    id="systemPrompt"
                                    placeholder="You are an expert research assistant specialized in..."
                                    rows={15}
                                    className="font-mono bg-white/50 dark:bg-slate-900/50"
                                    value={agentData.systemPrompt}
                                    onChange={(e) => setAgentData({ ...agentData, systemPrompt: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {agentData.systemPrompt.length} characters
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Add Tools */}
                    {currentStep === 'tools' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800">
                                <p className="text-sm">
                                    Select tools from the library to give your agent additional capabilities. At least one tool is required.
                                    {agentData.selectedTools.length > 0 && (
                                        <span className="ml-2 font-medium text-violet-600 dark:text-violet-400">
                                            ({agentData.selectedTools.length} selected)
                                        </span>
                                    )}
                                </p>
                            </div>
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-3">
                                    {[...allTools].sort((a, b) => {
                                        const aS = suggestedTools.includes(a.id) ? 1 : 0;
                                        const bS = suggestedTools.includes(b.id) ? 1 : 0;
                                        return bS - aS;
                                    }).map((tool) => (
                                        <div
                                            key={tool.id}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${agentData.selectedTools.includes(tool.id)
                                                ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 shadow-md'
                                                : suggestedTools.includes(tool.id)
                                                    ? 'border-violet-400/50 dark:border-violet-600/50 bg-violet-100/30 dark:bg-violet-900/20'
                                                    : 'border-border hover:border-violet-200 dark:hover:border-violet-800'
                                                }`}
                                            onClick={() => handleToolToggle(tool.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={agentData.selectedTools.includes(tool.id)}
                                                    tabIndex={-1}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold">{tool.title}</h4>
                                                            {suggestedTools.includes(tool.id) && (
                                                                <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 animate-pulse text-white border-none text-[10px]">
                                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                                    Suggested
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-[10px]">{tool.language || 'General'}</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Step 4: Add Prompts */}
                    {currentStep === 'prompts' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800">
                                <p className="text-sm">
                                    Select prompts from the library to enhance your agent's capabilities.
                                    {agentData.selectedPrompts.length > 0 && (
                                        <span className="ml-2 font-medium text-violet-600 dark:text-violet-400">
                                            ({agentData.selectedPrompts.length} selected)
                                        </span>
                                    )}
                                </p>
                            </div>
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-3">
                                    {[...allPrompts].sort((a, b) => {
                                        const aS = suggestedPrompts.includes(a.id) ? 1 : 0;
                                        const bS = suggestedPrompts.includes(b.id) ? 1 : 0;
                                        return bS - aS;
                                    }).map((prompt) => {
                                        const selected = agentData.selectedPrompts.find(p => p.id === prompt.id);
                                        const isSuggested = suggestedPrompts.includes(prompt.id);
                                        return (
                                            <div
                                                key={prompt.id}
                                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selected
                                                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 shadow-md'
                                                    : isSuggested
                                                        ? 'border-violet-400/50 dark:border-violet-600/50 bg-violet-100/30 dark:bg-violet-900/20'
                                                        : 'border-border hover:border-violet-200 dark:hover:border-violet-800'
                                                    }`}
                                                onClick={() => handlePromptToggle(prompt.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        checked={!!selected}
                                                        tabIndex={-1}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold">{prompt.title}</h4>
                                                                {isSuggested && (
                                                                    <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 animate-pulse text-white border-none text-[10px]">
                                                                        <Sparkles className="h-3 w-3 mr-1" />
                                                                        Suggested
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-[10px]">{prompt.category || 'General'}</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">{prompt.description}</p>
                                                        {selected && (
                                                            <div className="flex gap-2 items-center text-sm" onClick={(e) => e.stopPropagation()}>
                                                                <span className="text-muted-foreground">Role:</span>
                                                                <Select
                                                                    value={selected.role}
                                                                    onValueChange={(value: string) => {
                                                                        setAgentData(prev => ({
                                                                            ...prev,
                                                                            selectedPrompts: prev.selectedPrompts.map(p =>
                                                                                p.id === prompt.id ? { ...p, role: value } : p
                                                                            ),
                                                                        }));
                                                                    }}
                                                                >
                                                                    <SelectTrigger
                                                                        className="w-32 h-8 !bg-white !text-black border-slate-200 !opacity-100"
                                                                        style={{ backgroundColor: 'white', color: 'black', opacity: 1 }}
                                                                    >
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent
                                                                        className="!bg-white !text-black border !border-slate-200 shadow-2xl !opacity-100 z-[100]"
                                                                        style={{ backgroundColor: 'white', color: 'black', opacity: 1 }}
                                                                    >
                                                                        <SelectItem value="system" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">System</SelectItem>
                                                                        <SelectItem value="user" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">User</SelectItem>
                                                                        <SelectItem value="assistant" className="!text-black !bg-white hover:!bg-slate-100 focus:!bg-slate-100 cursor-pointer">Assistant</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* New Step: Usage Instructions */}
                    {currentStep === 'usage' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="instructions" className="text-lg font-semibold">Usage Guide</Label>
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
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Instructions (Markdown supported)</Label>
                                    <Textarea
                                        id="instructions"
                                        rows={15}
                                        placeholder="Explain how to best interact with your agent..."
                                        value={agentData.instructions}
                                        onChange={(e) => setAgentData({ ...agentData, instructions: e.target.value })}
                                        className="bg-white/50 dark:bg-slate-900/50 min-h-[400px] font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Preview</Label>
                                    <ScrollArea className="h-[400px] w-full rounded-xl border p-4 bg-white/30 dark:bg-black/20">
                                        <div className="prose dark:prose-invert max-w-none">
                                            {agentData.instructions ? (
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
                                                                <code className="bg-slate-200 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-sm text-slate-900 dark:text-purple-200 font-mono" {...props}>
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
                                                    {agentData.instructions}
                                                </Markdown>
                                            ) : (
                                                <p className="text-muted-foreground italic">No instructions yet. Write some or use AI to generate them.</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Test Agent */}
                    {currentStep === 'test' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800">
                                <h3 className="mb-2 font-semibold">Test your Agent</h3>
                                <p className="text-sm text-muted-foreground">
                                    You can now test your agent's behavior with the current configuration before officially creating it.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="testInput">Sample Input</Label>
                                    <Textarea
                                        id="testInput"
                                        placeholder="Ask your agent something..."
                                        value={agentData.testInput}
                                        onChange={(e) => setAgentData({ ...agentData, testInput: e.target.value })}
                                        className="bg-white/50 dark:bg-slate-900/50 min-h-[100px]"
                                    />
                                </div>
                                <Button
                                    onClick={handleRunTest}
                                    disabled={testLoading || !agentData.testInput.trim()}
                                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                                >
                                    {testLoading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Running...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Play className="h-4 w-4" />
                                            Run Test
                                        </span>
                                    )}
                                </Button>
                            </div>

                            {agentData.testOutput && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <Label>Agent Output</Label>
                                    <ScrollArea
                                        className="h-[400px] w-full rounded-xl border p-4 text-black dark:text-white"
                                        style={{ backgroundColor: theme === 'dark' ? 'black' : 'white' }}
                                    >
                                        <div className="prose dark:prose-invert max-w-none">
                                            <Markdown
                                                components={{
                                                    h1: (props: any) => <h1 className="text-2xl font-bold mb-4 text-slate-950 dark:text-purple-300" {...props} />,
                                                    h2: (props: any) => <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-purple-200" {...props} />,
                                                    h3: (props: any) => <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-purple-100" {...props} />,
                                                    p: (props: any) => <p className="mb-4 text-slate-900 dark:text-slate-300 leading-relaxed" {...props} />,
                                                    ul: (props: any) => <ul className="list-disc list-inside mb-4 text-slate-900 dark:text-slate-300" {...props} />,
                                                    ol: (props: any) => <ol className="list-decimal list-inside mb-4 text-slate-900 dark:text-slate-300" {...props} />,
                                                    li: (props: any) => <li className="mb-1" {...props} />,
                                                    strong: (props: any) => <strong className="text-black dark:text-white font-bold" {...props} />,
                                                    code: ({ className, children, ...props }: any) => {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return !match ? (
                                                            <code className="bg-slate-200 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-sm text-slate-900 dark:text-purple-200 font-mono" {...props}>
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <code className={className} {...props}>{children}</code>
                                                        );
                                                    },
                                                    pre: (props: any) => (
                                                        <pre className="bg-white/60 dark:bg-black/90 p-4 rounded-lg mb-4 overflow-x-auto border border-slate-200 dark:border-slate-700/50 text-black dark:text-white" {...props} />
                                                    ),
                                                }}
                                            >
                                                {agentData.testOutput}
                                            </Markdown>
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}

                            <Separator className="my-6" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-violet-50/20 dark:bg-slate-900/20 p-6 rounded-xl border border-violet-100 dark:border-violet-900">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground font-medium">Name</span>
                                    <p className="font-semibold">{agentData.name || 'Not set'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground font-medium">Model</span>
                                    <p className="font-semibold">{agentData.model}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground font-medium">Tools</span>
                                    <p className="font-semibold">{agentData.selectedTools.length} selected</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground font-medium">Prompts</span>
                                    <p className="font-semibold">{agentData.selectedPrompts.length} selected</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center bg-white/20 dark:bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/20 dark:border-white/5">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStepIndex === 0}
                    className="border-violet-300 dark:border-violet-700"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleSave} className="text-violet-600 dark:text-violet-400">
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                    </Button>
                    {currentStepIndex < steps.length - 1 ? (
                        <Button
                            onClick={handleNext}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white min-w-[120px] shadow-lg shadow-violet-500/20"
                        >
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white min-w-[140px] shadow-lg shadow-violet-500/20"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Create Agent
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
