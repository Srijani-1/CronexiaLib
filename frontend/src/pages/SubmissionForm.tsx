import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Upload, Sparkles } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useTheme } from "../components/ThemeProvider";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface SubmissionFormProps {
  type: "prompt" | "tool" | "agent";
}

export function SubmissionForm({ type }: SubmissionFormProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [instructions, setInstructions] = useState("");
  type AgentToolInput = {
    name: string;
    description: string;
    code: string;
    enabled: boolean;
    saveToLibrary: boolean;
  };
  type AgentPromptInput = {
    role: "system" | "user" | "assistant";
    content: string;
    order: number;
    saveToLibrary: boolean;
  };



  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    content: "",
    language: "",
    version: "",
    recommended_model: "",
    category: "",
    system_prompt: "",
    model: "gpt-4",
    temperature: "0.7",
    max_tokens: 2000,
    visibility: "public",
    tools: [] as AgentToolInput[],
    prompts: [] as AgentPromptInput[],
    instructions: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [agentInstructionLoading, setAgentInstructionLoading] = useState(false);

  const handleGenerateAgentInstructions = async () => {
    setAgentInstructionLoading(true);
    const toastId = toast.loading("Generating usage guide...");
    try {
      const res = await fetch(`${API_BASE_URL}/ai/generate-agent-instructions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token") || localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          model: formData.model,
          system_prompt: formData.system_prompt,
          tools: formData.tools.map(t => ({ name: t.name, description: t.description })),
          prompts: formData.prompts.map(p => ({ role: p.role, content: p.content }))
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData({ ...formData, instructions: data.output });
        toast.success("Usage guide generated!", { id: toastId });
      } else {
        toast.error("Failed to generate usage guide", { id: toastId });
      }
    } catch (err) {
      toast.error("Error connecting to generator", { id: toastId });
    } finally {
      setAgentInstructionLoading(false);
    }
  };
  const [validationMessage, setValidationMessage] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.title.trim()) e.title = "Title is required";
    if (!formData.description.trim()) e.description = "Description is required";
    if (type !== "agent" && !formData.content.trim()) {
      e.content = type === "tool"
        ? "Tool code is required"
        : "Prompt content is required";
    }
    if (type === "agent") {
      if (!formData.title.trim()) e.title = "Agent name is required";
      if (!formData.description.trim()) e.description = "Description is required";
      if (!formData.system_prompt.trim()) e.system_prompt = "System prompt is required";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setValidationMessage("Please fill in all required fields.");
      return false;
    }

    setValidationMessage("");
    return true;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      // Build payload according to backend schema
      const payload: any = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        content: formData.content,
      };
      if (type === "agent") {
        payload.title = formData.title;
        payload.description = formData.description;
        payload.tags = formData.tags
          ? formData.tags.split(",").map(t => t.trim())
          : [];

        payload.system_prompt = formData.system_prompt;
        payload.model = formData.model;
        payload.temperature = Number(formData.temperature);
        payload.max_tokens = Number(formData.max_tokens);
        payload.visibility = formData.visibility;
        payload.tools = formData.tools;
        if (type === "agent") {
          payload.prompts = formData.prompts.map((p, index) => ({
            role: p.role,
            content: p.content,
            order: index,
            save_to_library: p.saveToLibrary,
          }));
          payload.tools = formData.tools.map((t) => ({
            name: t.name,
            description: t.description,
            code: t.code,
            enabled: t.enabled,
            save_to_library: t.saveToLibrary,
          }));
          payload.instructions = formData.instructions;
        }
      }
      if (type === "tool") {
        payload.language = formData.language;
        payload.version = formData.version;
        payload.recommended_model = formData.recommended_model;
        payload.instructions = instructions;
      } else {
        payload.category = formData.category;
        payload.recommended_model = formData.recommended_model;
      }

      const endpoint = type === "tool"
        ? "/tools/create"
        : type === "prompt"
          ? "/prompts/create"
          : "/agents/create";
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        const msg =
          typeof result.detail === "string"
            ? result.detail
            : Array.isArray(result.detail)
              ? result.detail.map((d: any) => d.msg).join(", ")
              : result.message || "Submission failed";
        setApiError(msg);
        return;
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} submitted successfully!`);
      // Success -> navigate to listing or detail
      navigate(
        type === "agent"
          ? `/agents/${result.id}`
          : type === "tool"
            ? `/tools/${result.id}`
            : `/prompts/${result.id}`
      );

    } catch (err) {
      console.error(err);
      setApiError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate(-1);

  // Common styles for all inputs to ensure black text on white background
  const inputStyles = "bg-white text-black dark:bg-input/30 dark:text-black border-slate-200 placeholder:text-slate-400 focus-visible:ring-violet-500";

  return (
    <div
      className="bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-slate-950 dark:to-purple-950/50 min-h-screen py-8"
      style={{ backgroundImage: theme === 'light' ? 'linear-gradient(to top, #e3d5f4ff 0%, #dbc6fcff 100%)' : undefined }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2">{type === "prompt" ? "Upload Prompt" : type === "tool" ? "Upload Tool" : "Upload Agent"}</h1>
          <p className="text-slate-600 dark:text-slate-400">Share your {type} with the AgentHub community</p>
        </div>

        <Card style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }} className="border-2">
          <CardHeader>
            <CardTitle className="dark:text-white">{type === "prompt" ? "Prompt Details" : "Tool Details"}</CardTitle>
            <CardDescription className="dark:text-slate-300">Fill in the information below to submit your {type}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="dark:text-white">Title *</Label>
                    <Input
                      id="title"
                      placeholder={`Enter ${type} title`}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={inputStyles}
                    />
                    {errors.title && <p className="text-sm text-red-600 dark:text-red-400">{errors.title}</p>}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="dark:text-white">Description *</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      placeholder={`Describe your ${type} and its use cases`}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={inputStyles}
                    />
                    {errors.description && <p className="text-sm text-red-600 dark:text-red-400">{errors.description}</p>}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="dark:text-white">Tags</Label>
                    <Input
                      id="tags"
                      placeholder="Enter tags separated by commas (e.g., API, TypeScript)"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className={inputStyles}
                    />
                  </div>

                  {/* Agent: System Prompt */}
                  {type === "agent" && (
                    <div className="space-y-2">
                      <Label className="dark:text-white">System Prompt *</Label>
                      <Textarea
                        rows={12}
                        placeholder="Define the agent's behavior, rules, and personality..."
                        value={formData.system_prompt}
                        onChange={(e) =>
                          setFormData({ ...formData, system_prompt: e.target.value })
                        }
                        className={inputStyles}
                      />
                      {errors.system_prompt && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {errors.system_prompt}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Agent: Model Settings */}
                  {type === "agent" && (
                    <div className="space-y-4 p-4 rounded-lg bg-white/50 dark:bg-black/20">
                      <h3 className="font-semibold dark:text-white">Model Settings <br /></h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="dark:text-white">Model</Label>
                          <Input
                            id="model"
                            placeholder="Enter recommended model name"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            className={inputStyles}
                          />
                          {/* <Select
                            value={formData.model}
                            onValueChange={(value: string) =>
                              setFormData({ ...formData, model: value })
                            }
                          >
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

                        <div>
                          <Label className="dark:text-white">Temperature</Label>
                          <Input
                            value={formData.temperature}
                            onChange={(e) =>
                              setFormData({ ...formData, temperature: e.target.value })
                            }
                            className={inputStyles}
                          />
                        </div>

                        <div>
                          <Label className="dark:text-white">Max Tokens</Label>
                          <Input
                            type="number"
                            value={formData.max_tokens}
                            onChange={(e) =>
                              setFormData({ ...formData, max_tokens: Number(e.target.value) })
                            }
                            className={inputStyles}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Agent: Visibility */}
                  {/* {type === "agent" && (
                    <div className="space-y-2">
                      <Label className="dark:text-white">Visibility</Label>
                      <select
                        value={formData.visibility}
                        onChange={(e) =>
                          setFormData({ ...formData, visibility: e.target.value })
                        }
                        className={`border rounded px-3 py-2 w-full max-w-xs ${inputStyles}`}
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                      </select>
                    </div>
                  )} */}

                  {/* Agent: Tools & Prompts */}
                  {type === "agent" && (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Tools</CardTitle>
                          <CardDescription>Select tools for this agent</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Card>
                            <CardHeader>
                              <CardTitle>Tools</CardTitle>
                              <CardDescription>Add tools this agent can use</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                              {formData.tools.map((tool, index) => (
                                <div
                                  key={index}
                                  className="border rounded-lg p-3 space-y-2 bg-white/50 dark:bg-black/20"
                                >
                                  <Input
                                    placeholder="Tool name"
                                    value={(tool as any).name || ""}
                                    onChange={(e) => {
                                      const tools = [...formData.tools];
                                      (tools[index] as any).name = e.target.value;
                                      setFormData({ ...formData, tools });
                                    }}
                                    className={inputStyles}
                                  />

                                  <Textarea
                                    placeholder="Tool description / usage"
                                    value={(tool as any).description || ""}
                                    onChange={(e) => {
                                      const tools = [...formData.tools];
                                      (tools[index] as any).description = e.target.value;
                                      setFormData({ ...formData, tools });
                                    }}
                                    className={inputStyles}
                                  />
                                  <Textarea
                                    placeholder="Tool code"
                                    value={(tool as any).code || ""}
                                    onChange={(e) => {
                                      const tools = [...formData.tools];
                                      (tools[index] as any).code = e.target.value;
                                      setFormData({ ...formData, tools });
                                    }}
                                    className={inputStyles}
                                  />

                                  <div className="flex items-center space-x-2 pt-1">
                                    <input
                                      type="checkbox"
                                      id={`save-tool-${index}`}
                                      checked={tool.saveToLibrary}
                                      onChange={(e) => {
                                        const tools = [...formData.tools];
                                        tools[index].saveToLibrary = e.target.checked;
                                        setFormData({ ...formData, tools });
                                      }}
                                      className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                    />
                                    <Label htmlFor={`save-tool-${index}`} className="text-sm font-normal dark:text-slate-300">
                                      Submit to Tools Library
                                    </Label>
                                  </div>

                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      setFormData({
                                        ...formData,
                                        tools: formData.tools.filter((_, i) => i !== index),
                                      })
                                    }
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    tools: [...formData.tools, { name: "", description: "", code: "", enabled: true, saveToLibrary: false }],
                                  })
                                }
                              >
                                + Add Tool
                              </Button>
                            </CardContent>
                          </Card>
                          <p className="text-sm text-muted-foreground">
                            Tool selection UI goes here
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Prompts</CardTitle>
                          <CardDescription>Attach prompts to this agent</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Card>
                            <CardHeader>
                              <CardTitle>Prompts</CardTitle>
                              <CardDescription>
                                Define the prompts this agent will use (in order)
                              </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                              {formData.prompts.map((prompt, index) => (
                                <div
                                  key={index}
                                  className="border rounded-lg p-3 space-y-2 bg-white/50 dark:bg-black/20"
                                >
                                  {/* Role selector */}
                                  <select
                                    value={prompt.role}
                                    onChange={(e) => {
                                      const prompts = [...formData.prompts];
                                      prompts[index].role = e.target.value as any;
                                      setFormData({ ...formData, prompts });
                                    }}
                                    className="border rounded px-3 py-2 !bg-white !text-black border-slate-200 w-full font-medium"
                                  >
                                    <option value="system" className="!text-black !bg-white">System</option>
                                    <option value="user" className="!text-black !bg-white">User</option>
                                    <option value="assistant" className="!text-black !bg-white">Assistant</option>
                                  </select>

                                  {/* Prompt content */}
                                  <Textarea
                                    placeholder="Prompt content..."
                                    rows={4}
                                    value={prompt.content}
                                    onChange={(e) => {
                                      const prompts = [...formData.prompts];
                                      prompts[index].content = e.target.value;
                                      setFormData({ ...formData, prompts });
                                    }}
                                    className={inputStyles}
                                  />

                                  <div className="flex items-center space-x-2 pt-1">
                                    <input
                                      type="checkbox"
                                      id={`save-prompt-${index}`}
                                      checked={prompt.saveToLibrary}
                                      onChange={(e) => {
                                        const prompts = [...formData.prompts];
                                        prompts[index].saveToLibrary = e.target.checked;
                                        setFormData({ ...formData, prompts });
                                      }}
                                      className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                    />
                                    <Label htmlFor={`save-prompt-${index}`} className="text-sm font-normal dark:text-slate-300">
                                      Submit to Prompt Library
                                    </Label>
                                  </div>

                                  {/* Remove */}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      setFormData({
                                        ...formData,
                                        prompts: formData.prompts.filter((_, i) => i !== index),
                                      })
                                    }
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}

                              {/* Add Prompt */}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    prompts: [
                                      ...formData.prompts,
                                      {
                                        role: "user",
                                        content: "",
                                        order: formData.prompts.length,
                                        saveToLibrary: false,
                                      },
                                    ],
                                  })
                                }
                              >
                                + Add Prompt
                              </Button>
                            </CardContent>
                          </Card>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Usage Guide (Agent ONLY) */}
                  {type === "agent" && (
                    <div className="space-y-4">
                      <Card className="border-none shadow-sm bg-white/40 dark:bg-slate-900/40">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-xl font-bold dark:text-white">Usage Guide</CardTitle>
                            <CardDescription className="dark:text-slate-400">Explain how others should use your agent</CardDescription>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateAgentInstructions}
                            disabled={agentInstructionLoading}
                            className="gap-2 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400"
                          >
                            {agentInstructionLoading ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            Generate with AI
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="instructions" className="dark:text-white text-xs font-medium uppercase tracking-wider text-slate-500">
                                Instructions (Markdown)
                              </Label>
                              <Textarea
                                id="instructions"
                                rows={10}
                                className={`font-mono text-sm ${inputStyles} min-h-[300px]`}
                                placeholder="Enter usage instructions..."
                                value={formData.instructions}
                                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="dark:text-white text-xs font-medium uppercase tracking-wider text-slate-500">
                                Preview
                              </Label>
                              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-white/30 dark:bg-black/20 min-h-[300px] max-h-[400px] overflow-auto">
                                <div className="prose dark:prose-invert prose-sm max-w-none">
                                  {formData.instructions ? (
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
                                      {formData.instructions}
                                    </Markdown>
                                  ) : (
                                    <p className="text-slate-500 italic">No instructions yet. Use the generate button or write your own.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Content / Code (Prompt & Tool ONLY) */}
                  {type !== "agent" && (
                    <div className="space-y-2">
                      <Label htmlFor="content" className="dark:text-white">
                        {type === "prompt" ? "Prompt Content" : "Tool Code"} *
                      </Label>
                      <Textarea
                        id="content"
                        rows={12}
                        className={`font-mono text-sm ${inputStyles}`}
                        placeholder={type === "prompt" ? "Enter prompt content..." : "Enter tool code..."}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      />
                      {errors.content && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.content}</p>
                      )}
                    </div>
                  )}

                  {/* Tool-specific fields */}
                  {type === "tool" && (
                    <div className="space-y-4 p-4 rounded-lg bg-white/50 dark:bg-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="language" className="dark:text-white">Language</Label>
                          <Input
                            id="language"
                            placeholder="e.g., TypeScript"
                            value={formData.language}
                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            className={inputStyles}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recommended_model" className="dark:text-white">Recommended Model</Label>
                          <Input
                            id="recommended_model"
                            placeholder="e.g., gpt-5.1"
                            value={formData.recommended_model}
                            onChange={(e) => setFormData({ ...formData, recommended_model: e.target.value })}
                            className={inputStyles}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="version" className="dark:text-white">Version</Label>
                          <Input
                            id="version"
                            placeholder="e.g., 1.0.0"
                            value={formData.version}
                            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                            className={inputStyles}
                          />
                        </div>
                        {/* <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="installation_steps" className="dark:text-white">
                            Installation & Usage Instructions
                          </Label>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={loading}
                            onClick={async () => {
                              try {
                                setLoading(true);
                                // setAiError(null); 

                                const token = sessionStorage.getItem("token");
                                const res = await fetch(`${API_BASE_URL}/ai/generate-installation-steps`, {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    title: formData.title,
                                    description: formData.description,
                                    code: formData.content,
                                    language: formData.language,
                                    version: formData.version,
                                  }),
                                });

                                const data = await res.json();

                                if (!res.ok) {
                                  throw new Error(data.detail || "Generation failed");
                                }

                                const steps = data.output
                                  .split("\n")
                                  .map((s: string) => s.trim())
                                  .filter(Boolean)
                                  .join("\n");

                                setFormData(prev => ({
                                  ...prev,
                                  installation_steps: steps,
                                }));
                              } catch (err) {
                                console.error(err);
                                setApiError("Failed to generate installation steps. Please try again.");
                              } finally {
                                setLoading(false);
                              }
                            }}

                          >
                            ✨ Generate with AI
                          </Button>
                        </div>

                        <Textarea
                          id="installation_steps"
                          placeholder="One step per line..."
                          rows={6}
                          value={formData.installation_steps}
                          onChange={(e) =>
                            setFormData({ ...formData, installation_steps: e.target.value })
                          }
                          className={inputStyles}
                        />

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Each line will be saved as a separate instruction step.
                        </p>
                      </div> */}

                      </div>

                      {/* File upload UI */}
                      <div className="space-y-2">
                        <Label className="dark:text-white">Additional Files (Optional)</Label>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer dark:border-slate-500 bg-white dark:bg-black/50">
                          <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                          <p className="text-slate-600 dark:text-slate-300 mb-2">Click to upload or drag and drop</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">ZIP, TAR, or individual files (max 10MB)</p>
                          <Input id="file" type="file" className="hidden" multiple />
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Prompt-specific fields */}
                  {type === "prompt" && (
                    <div className="space-y-4 p-4 rounded-lg bg-white/50 dark:bg-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category" className="dark:text-white">Category</Label>
                          <Input
                            id="category"
                            placeholder="e.g., Code Review"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className={inputStyles}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model" className="dark:text-white">Recommended Model</Label>
                          <Input
                            id="model"
                            placeholder="e.g., GPT-4"
                            value={formData.recommended_model}
                            onChange={(e) => setFormData({ ...formData, recommended_model: e.target.value })}
                            className={inputStyles}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* API Error */}
                  {apiError && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">{apiError}</div>}

                  {/* Validation message */}
                  {validationMessage && (
                    <div className="text-red-600 dark:text-red-400 text-sm font-medium">
                      {validationMessage}
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-4">
                    {type === "tool" ? (
                      <Button
                        type="button"
                        size="lg"
                        onClick={() => {
                          if (!validate()) return;
                          setStep(2);
                        }}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Submitting…" : "Submit"}
                      </Button>
                    )}

                    <Button type="button" variant="outline" size="lg" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </>
              )}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Instructions</CardTitle>
                    <CardDescription>
                      Write or generate usage instructions for this tool
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <Tabs defaultValue={instructions ? "preview" : "write"} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <TabsList>
                          <TabsTrigger value="write">Write</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const toastId = toast.loading("Instructions are being generated...");
                            try {
                              const token = sessionStorage.getItem("token");
                              const res = await fetch(`${API_BASE_URL}/tools/generate-instructions`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  title: formData.title,
                                  description: formData.description,
                                  code: formData.content,
                                  language: formData.language,
                                }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.detail || "Failed to generate");
                              setInstructions(data.output);
                              toast.success("Instructions have been generated!", { id: toastId });
                            } catch (err: any) {
                              console.error(err);
                              toast.error(err.message || "Failed to generate instructions", { id: toastId });
                            }
                          }}
                        >
                          ✨ Generate with AI
                        </Button>
                      </div>

                      <TabsContent value="write">
                        <Textarea
                          rows={12}
                          className={`font-mono ${inputStyles}`}
                          placeholder="Write instructions in Markdown..."
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                        />
                      </TabsContent>

                      <TabsContent value="preview">
                        <div className="prose dark:prose-invert max-w-none border rounded p-4 bg-black/80 min-h-[300px]">
                          <Markdown
                            components={{
                              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 text-purple-300" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 text-purple-200" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 text-purple-100" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-4 text-slate-300 leading-relaxed" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 text-slate-300" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 text-slate-300" {...props} />,
                              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                              strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
                              code: ({ node, className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return !match ? (
                                  <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-sm text-purple-200 font-mono" {...props}>
                                    {children}
                                  </code>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                )
                              },
                              pre: ({ node, ...props }) => <pre className="bg-slate-900/50 p-4 rounded-lg mb-4 overflow-x-auto border border-slate-700/50" {...props} />,
                            }}
                          >
                            {instructions || "Instructions will appear here after generation or writing."}
                          </Markdown>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex gap-3 pt-4">
                      <Button variant="secondary" onClick={() => setStep(1)}>
                        ← Back
                      </Button>

                      <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Submitting…" : "Submit Tool"}
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              )}

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}