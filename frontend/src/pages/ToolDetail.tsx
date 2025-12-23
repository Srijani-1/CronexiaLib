import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Tag } from "../components/Tag";
import { Heart, Share2, Play, Copy } from "lucide-react";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";
import { API_BASE_URL } from "../config/api";
import { useTheme } from "../components/ThemeProvider"
import { useNavigate } from "react-router-dom";
import Markdown from "react-markdown";


export function ToolDetail() {
  const { id } = useParams<{ id: string }>();
  const [tool, setTool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [demoOutput, setDemoOutput] = useState("");
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editInstructions, setEditInstructions] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editLanguage, setEditLanguage] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editTags, setEditTags] = useState("");
  const [generatingInstructions, setGeneratingInstructions] = useState(false);

  const { theme } = useTheme();

  async function generateInstructions() {
    if (!id) return;
    setGeneratingInstructions(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tools/${id}/instructions`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error("Failed to generate instructions");
      const data = await res.json();

      // Update the edit state directly
      setEditInstructions(data.output);

      // Also update the main tool view if appropriate
      setTool((prev: any) => ({ ...prev, instructions: data.output }));

      toast.success("Instructions generated successfully!");
    } catch (err) {
      toast.error("Failed to generate instructions");
      console.error(err);
    } finally {
      setGeneratingInstructions(false);
    }
  }

  useEffect(() => {
    async function fetchTool() {
      try {
        const res = await fetch(`${API_BASE_URL}/tools/${id}`);
        if (!res.ok) throw new Error("Tool not found");
        const data = await res.json();
        setTool(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditContent(data.content);
        setEditLanguage(data.language);
        setEditInstructions(data.instructions);
        setEditModel(data.model);
        setEditVersion(data.version);
        setEditTags(data.tags?.join(", ") || "");

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTool();
  }, [id]);

  async function runDemo() {
    setRunning(true);
    setDemoOutput("");
    try {
      const res = await fetch(`${API_BASE_URL}/tools/${id}/run`, { method: "POST" });
      const data = await res.json();
      setDemoOutput(data.output);
    } catch (err) {
      setDemoOutput("Error running demo: " + err);
    } finally {
      setRunning(false);
    }
  }
  useEffect(() => {
    async function fetchUser() {
      try {
        const token = sessionStorage.getItem("token");
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

    fetchUser();
  }, []);
  async function handleDelete() {
    // const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/tools/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Tool deleted!");
        navigate("/tools");
      } else {
        toast.error("Unable to delete tool");
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  }
  async function handleUpdate() {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/tools/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          content: editContent,
          language: editLanguage,
          recommended_model: editModel,
          instructions: editInstructions,
          version: editVersion,
          tags: editTags.split(",").map(t => t.trim()).filter(Boolean)
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Tool updated!");
        setEditing(false);
        setTool((prev: any) => ({
          ...prev,
          ...data,
          instructions: editInstructions, // 🔥 force sync
        })); // update UI live
      } else {
        toast.error(data.detail || "Update failed");
      }
    } catch (err) {
      toast.error("Error updating");
    }
  }



  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center dark:text-white">Loading tool...</p>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-red-500">Tool not found.</p>
      </div>
    );
  }
  const isOwner = currentUser && tool.created_by === currentUser.id;
  const handleCopy = () => {
    navigator.clipboard.writeText(tool.content);
    toast.success("Tool code copied to clipboard!");
  };

  // ---------------------------------------
  // LIKE BUTTON → CALL BACKEND + UPDATE UI
  // ---------------------------------------
  const handleLike = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/tools/${id}/like`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      if (!res.ok) {
        toast.error("Login required!");
        return;
      }

      const data = await res.json();

      // update UI instantly
      setTool((prev: any) => ({
        ...prev,
        likes: data.likes,
      }));

      toast.success(data.message);

    } catch (error) {
      console.error(error);
      toast.error("Failed to like prompt");
    }
  };

  // ---------------------------------------
  // SHARE LINK
  // ---------------------------------------
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Share link copied!");
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-slate-950 dark:to-purple-950/50 min-h-screen"
      style={{ backgroundImage: theme === 'light' ? 'linear-gradient(to top, #e3d5f4ff 0%, #dbc6fcff 100%)' : undefined }}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-6">
            {isOwner && editing ? (
              <input
                className="border w-full p-2 rounded mb-4 dark:bg-slate-800 dark:text-white"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            ) : (
              <h1 className="mb-4" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {tool.title}
              </h1>
            )}


            {isOwner && editing ? (
              <div className="mb-4">
                <label className="text-sm text-slate-500 mb-1 block">Tags (comma separated)</label>
                <input
                  className="border w-full p-2 rounded dark:bg-slate-800 dark:text-white"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {(tool.tags || []).map((tag: string, i: number) => (
                  <Tag key={i}>{tag}</Tag>
                ))}
              </div>
            )}
            {isOwner && !editing && (
              <div className="flex gap-3 mb-4">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </Button>

              </div>
            )}
            {showDeleteConfirm && (
              <div className="mt-4 p-4 border border-red-400 bg-red-50 dark:bg-red-950 rounded-lg">
                <h3 className="text-lg font-semibold text-red-600">
                  ⚠️ Are you sure you want to delete this tool?
                </h3>

                <p className="text-red-500 mt-1">
                  This action cannot be undone.
                </p>

                <div className="flex gap-3 mt-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={async () => {
                      setShowDeleteConfirm(false);
                      await handleDelete();
                    }}
                  >
                    Confirm Delete
                  </Button>
                </div>
              </div>
            )}


            {isOwner && editing && (
              <div className="flex gap-3 mb-4">
                <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>

                <Button size="sm" onClick={handleUpdate}>
                  Save
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <Button variant="outline" size="sm" onClick={handleLike}>
                <Heart className="h-4 w-4 mr-2" />
                Like ({tool.likes || 0})
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="mb-4">Description</h2>
            <div
              className="border rounded-lg p-6"
              style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
            >
              {isOwner && editing ? (
                <textarea
                  className="border p-3 w-full rounded dark:bg-slate-800 dark:text-white"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              ) : (
                <p className="dark:text-white">{tool.description}</p>
              )}

            </div>
          </section>

          {/* Code */}
          <section className="mb-8">
            <h2 className="mb-4">Code</h2>
            <div
              className="border rounded-lg p-6"
              style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
            >
              {isOwner && editing ? (
                <textarea
                  className="border p-3 w-full h-64 rounded bg-white dark:bg-slate-800 text-black dark:text-white font-mono"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <Markdown
                    components={{
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
                        <pre className="bg-white/60 dark:bg-black/90 p-4 rounded-lg mb-4 overflow-x-auto border border-violet-200 dark:border-violet-500/30 text-black dark:text-white" {...props} />
                      ),
                    }}
                  >
                    {`\`\`\`${tool.language || ''}\n${(tool.content || "").replace(/\\n/g, '\n')}\n\`\`\``}
                  </Markdown>
                </div>
              )}

            </div>
          </section>
          <section className="mb-8">
            <h2 className="mb-4">Instructions</h2>
            <div
              className="border rounded-lg p-6"
              style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
            >
              {isOwner && editing ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="border p-3 w-full h-64 rounded dark:bg-slate-800 dark:text-white font-mono"
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    placeholder="Manually write instructions or generate them with AI..."
                  />
                  <Button
                    variant="outline"
                    onClick={generateInstructions}
                    disabled={generatingInstructions}
                    className="self-start gap-2"
                  >
                    {generatingInstructions ? "Generating..." : "✨ Generate with AI"}
                  </Button>
                </div>
              ) : (
                <div
                  className="prose dark:prose-invert max-w-none border rounded p-4 bg-white/40 dark:bg-black/80 text-black dark:text-white"
                >
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
                    {tool.instructions || "No instructions provided."}
                  </Markdown>
                </div>
              )}

            </div>
          </section>

          {/* Live Demo */}
          <section className="mb-8">
            <h2 className="mb-4">Live Demo</h2>
            <div
              className="border rounded-lg p-6"
              style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
            >
              {demoOutput ? (
                <div className="bg-black/80 text-white p-4 rounded-lg mb-4 max-h-80 overflow-y-auto prose prose-invert max-w-none">
                  <Markdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 text-slate-950 dark:text-purple-300" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-purple-200" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-purple-100" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-4 text-slate-900 dark:text-slate-300 leading-relaxed" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 text-slate-900 dark:text-slate-300" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 text-slate-900 dark:text-slate-300" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="text-black dark:text-white font-bold" {...props} />,
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !match ? (
                          <code className="bg-slate-200 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-sm text-slate-900 dark:text-purple-200 font-mono" {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      },
                      pre: ({ node, ...props }) => <pre className="bg-white/60 dark:bg-black/90 p-4 rounded-lg mb-4 overflow-x-auto border border-slate-200 dark:border-slate-700/50 text-black dark:text-white" {...props} />,
                    }}
                  >
                    {demoOutput}
                  </Markdown>
                </div>
              ) : (
                <div className="text-center mb-6">
                  <Play className="h-12 w-12 mx-auto mb-2 text-slate-400 opacity-50" />
                  <p className="text-slate-500">Run the tool to see it in action</p>
                </div>
              )}
              <Button onClick={runDemo} disabled={running} className="w-full sm:w-auto">
                {running ? "Running..." : "Run Tool Simulation"}
              </Button>
            </div>
          </section>

          {/* Installation */}
          {tool.installation_steps && tool.installation_steps.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4">Installation</h2>
              <div
                className="border rounded-lg p-6"
                style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
              >
                <ol className="space-y-3">
                  {tool.installation_steps.map((s: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </span>
                      <span className="dark:text-white">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}

        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80">
          <div
            className="border rounded-lg p-6 sticky top-4"
            style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
          >
            <h2 className="mb-4 dark:text-white font-bold text-2xl">Details</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Language</p>

                {isOwner && editing ? (
                  <input
                    className="border p-2 rounded w-full dark:bg-slate-800 dark:text-white"
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value)}
                  />
                ) : (
                  <p className="dark:text-white">{tool.language || "N/A"}</p>
                )}
              </div>


              <Separator />
              <div>
                <p className="text-sm text-slate-500">Recommended Model</p>

                {isOwner && editing ? (
                  <input
                    className="border p-2 rounded w-full dark:bg-slate-800 dark:text-white"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                  />
                ) : (
                  <p className="dark:text-white">{tool.recommended_model || "N/A"}</p>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-slate-500">Creator</p>
                <p className="dark:text-white">{tool.creator_name || "Unknown"}</p>
              </div>

              <Separator />
              <div>
                <p className="text-sm text-slate-500">Version</p>

                {isOwner && editing ? (
                  <input
                    className="border p-2 rounded w-full dark:bg-slate-800 dark:text-white"
                    value={editVersion}
                    onChange={(e) => setEditVersion(e.target.value)}
                  />
                ) : (
                  <p className="dark:text-white">{tool.version || "N/A"}</p>
                )}
              </div>


              <Separator />

              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p className="dark:text-white">{tool.created_at?.split("T")[0]}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
