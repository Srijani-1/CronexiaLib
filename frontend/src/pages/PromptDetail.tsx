import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Tag } from '../components/Tag';
import { Heart, Copy, Share2, Eye } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { API_BASE_URL } from "../config/api";
import { useTheme } from '../components/ThemeProvider';
import { useNavigate } from 'react-router-dom';

export function PromptDetail() {
  const { id } = useParams();
  const [promptData, setPromptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editModel, setEditModel] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ---------------------------------------
  // FETCH SINGLE PROMPT
  // ---------------------------------------
  useEffect(() => {
    async function fetchPrompt() {
      try {
        const token = sessionStorage.getItem("token");

        const res = await fetch(`${API_BASE_URL}/prompts/${id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          }
        });

        if (!res.ok) throw new Error("Prompt not found");

        const data = await res.json();
        setPromptData(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditContent(data.content);
        setEditCategory(data.category);
        setEditModel(data.model);
        setEditTags(data.tags?.join(", ") || "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchPrompt();
  }, [id]);

  // ... (fetchUser code) ...

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
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/prompts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Prompt deleted!");
        navigate("/prompts");
      } else {
        toast.error("Unable to delete prompt");
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  }
  async function handleUpdate() {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/prompts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          content: editContent,
          category: editCategory,
          recommended_model: editModel,
          tags: editTags.split(",").map(t => t.trim()).filter(Boolean)
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Prompt updated!");
        setShowEditModal(false);
        setEditing(false);
        setPromptData(data); // update UI live
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
        <p className="text-center dark:text-white">Loading prompt...</p>
      </div>
    );
  }

  if (!promptData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-red-500 dark:text-red-300">
          Prompt not found.
        </p>
      </div>
    );
  }

  // ---------------------------------------
  // COPY CONTENT
  // ---------------------------------------
  const isOwner = currentUser && promptData.created_by === currentUser.id;
  const handleCopy = () => {
    navigator.clipboard.writeText(promptData.content);
    toast.success("Prompt copied to clipboard!");
  };

  // ---------------------------------------
  // LIKE BUTTON → CALL BACKEND + UPDATE UI
  // ---------------------------------------
  const handleLike = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/prompts/${id}/like`, {
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
      setPromptData((prev: any) => ({
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

        {/* MAIN CONTENT */}
        <div className="flex-1">
          <div className="mb-6">
            {editing ? (
              <input
                className="border w-full p-2 rounded mb-4 dark:bg-slate-800 dark:text-white"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            ) : (
              <h1 className="mb-4" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {promptData.title}
              </h1>
            )}
            {/* TAGS */}
            {editing ? (
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
                {(promptData.tags || []).map((tag: string, i: number) => (
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
                  ⚠️ Are you sure you want to delete this prompt?
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

            {/* BUTTONS */}
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" size="sm" onClick={handleLike}>
                <Heart className="h-4 w-4 mr-2" />
                Like ({promptData.likes || 0})
              </Button>

              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>

              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* PROMPT CONTENT */}
          <section className="mb-8">
            <h2 className="mb-4">Prompt</h2>

            <div
              className="border rounded-lg p-6"
              style={{
                backgroundColor:
                  theme === "dark" ? "var(--color-violet-900)" : "#F3E8FF",
              }}
            >
              {editing ? (
                <textarea
                  className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:text-white"
                  rows={10}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              ) : (
                <pre className="whitespace-pre-wrap dark:text-white">
                  {promptData.content}
                </pre>
              )}
            </div>
          </section>


          {/* EXAMPLE OUTPUTS */}
          {promptData.example_outputs && (
            <section className="mb-8">
              <h2 className="mb-4">Example Outputs</h2>
              <div className="space-y-4">
                {promptData.example_outputs.map((ex: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-6 bg-white dark:bg-violet-900">
                    <h3 className="mb-3 dark:text-white">{ex.title}</h3>

                    <div
                      className="p-4 rounded"
                      style={{ backgroundColor: theme === 'dark' ? 'var(--color-slate-900)' : '#F3E8FF' }}
                    >
                      <pre className="text-sm whitespace-pre-wrap dark:text-slate-200">
                        {ex.content}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="w-full lg:w-80">
          <div
            className="border rounded-lg p-6 sticky top-4"
            style={{ backgroundColor: theme === 'dark' ? 'var(--color-violet-900)' : '#F3E8FF' }}
          >
            <h2 className="mb-4 dark:text-white font-bold text-2xl">Details</h2>

            <div className="space-y-4">

              <div>
                <p className="text-sm text-slate-500">Category</p>

                {editing ? (
                  <input
                    className="border p-2 rounded w-full dark:bg-slate-800 dark:text-white"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  />
                ) : (
                  <p className="dark:text-white">{promptData.category || "N/A"}</p>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-slate-500">Creator</p>
                <p>{promptData.creator_name || "Unknown"}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-slate-500">Recommended Model</p>

                {editing ? (
                  <input
                    className="border p-2 rounded w-full dark:bg-slate-800 dark:text-white"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                  />
                ) : (
                  <p className="dark:text-white">{promptData.recommended_model || "N/A"}</p>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-slate-500">Views</p>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <p>{promptData.views || 0}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p>{promptData.created_at?.split("T")[0]}</p>
              </div>

            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
