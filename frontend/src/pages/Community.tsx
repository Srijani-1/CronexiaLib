import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
// import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { MessageSquare, ThumbsUp, Users, Filter, Plus, TrendingUp, Clock, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { useTheme } from '../components/ThemeProvider';
import { useEffect } from "react";
import { API_BASE_URL } from '../config/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
// import { communityAPI } from "../config/community";


interface Discussion {
    id: number;
    title: string;
    content: string;
    creator_name: string;
    avatar: string;
    category: string;
    tags: string[];
    comments_count: number;
    likes: number;
    created_at: string;
    // excerpt: string;
    // group?: string;
}

interface DiscussionGroup {
    id: number;
    name: string;
    description: string;
    members_count: number;
    category: string;
}

export function Community() {
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('recent');
    const [searchQuery, setSearchQuery] = useState('');
    const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
    const [newDiscussionContent, setNewDiscussionContent] = useState('');
    const [newDiscussionCategory, setNewDiscussionCategory] = useState('general');
    const { theme } = useTheme();
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [groups, setGroups] = useState<DiscussionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [openNewDiscussion, setOpenNewDiscussion] = useState(false);
    const [openNewGroup, setOpenNewGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupCategory, setNewGroupCategory] = useState('general');
    const [groupFilterCategory, setGroupFilterCategory] = useState('all');
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 10
    const navigate = useNavigate()


    const authFetch = async (url: string, options: RequestInit = {}) => {
        const token =
            sessionStorage.getItem("token") || localStorage.getItem("token");

        const res = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || "Request failed");
        }

        return data;
    };


    useEffect(() => {
        const loadDiscussions = async () => {
            setLoading(true);
            try {
                const res = await authFetch(
                    `${API_BASE_URL}/community/discussions/get?category=${filterCategory}&page=1&limit=10`
                );

                const mapped = res.data.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    content: d.content,
                    creator_name: d.creator_name,
                    avatar: d.creator_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join(""),
                    category: d.category,
                    tags: d.tags || [],
                    comments_count: d.comments_count || 0,
                    likes: d.likes || 0,
                    created_at: new Date(d.created_at).toLocaleDateString(),
                }));

                setDiscussions(mapped);
                setTotal(res.total)
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadDiscussions();
    }, [filterCategory]);

    useEffect(() => {
        const loadGroups = async () => {
            try {
                const res = await authFetch(
                    `${API_BASE_URL}/community/groups/get?page=1&limit=10`
                );
                setGroups(res.data);
                setTotal(res.total)
            } catch (err) {
                console.error(err);
            }
        };

        loadGroups();
    }, []);
    const TabHeader = ({ children }: { children: React.ReactNode }) => (
        <Card
            style={{ background: theme === "light" ? "white" : "black" }}
        >
            <CardContent className="pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {children}
                </div>
            </CardContent>
        </Card>
    );

    const handleCreateDiscussion = async () => {
        if (!newDiscussionTitle || !newDiscussionContent) return;

        try {
            await authFetch(`${API_BASE_URL}/community/discussions/create`, {
                method: "POST",
                body: JSON.stringify({
                    title: newDiscussionTitle,
                    content: newDiscussionContent,
                    category: newDiscussionCategory,
                }),
            });

            setNewDiscussionTitle("");
            setNewDiscussionContent("");
            setNewDiscussionCategory("general");

            setOpenNewDiscussion(false);

            // Reload discussions
            const refreshed = await authFetch(
                `${API_BASE_URL}/community/discussions/get?page=1&limit=10`
            );
            const mapped = refreshed.data.map((d: any) => ({
                id: d.id,
                title: d.title,
                content: d.content,
                creator_name: d.creator_name,
                avatar: d.creator_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join(""),
                category: d.category,
                tags: d.tags || [],
                comments_count: d.comments_count || 0,
                likes: d.likes || 0,
                created_at: new Date(d.created_at).toLocaleDateString(),
            }));

            setDiscussions(mapped);

        } catch (err) {
            console.error(err);
        }
    };
    const handleCreateGroup = async () => {
        if (!newGroupName || !newGroupDescription) return;

        try {
            await authFetch(`${API_BASE_URL}/community/groups/create`, {
                method: "POST",
                body: JSON.stringify({
                    name: newGroupName,
                    description: newGroupDescription,
                    category: newGroupCategory,
                }),
            });

            setNewGroupName("");
            setNewGroupDescription("");
            setNewGroupCategory("general");

            setOpenNewGroup(false);

            // Reload discussions
            const refreshed = await authFetch(
                `${API_BASE_URL}/community/groups/get?page=1&limit=10`
            )
            const mapped = refreshed.data.map((d: any) => ({
                id: d.id,
                name: d.name,
                description: d.description,
                creator_name: d.creator_name,
                avatar: d.creator_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join(""),
                category: d.category,
                members_count: d.members_count || 0,
                created_at: new Date(d.created_at).toLocaleDateString(),
            }));

            setGroups(mapped);

        } catch (err) {
            console.error(err);
        }
    };


    const filteredDiscussions = discussions.filter((discussion) => {
        const matchesCategory = filterCategory === 'all' || discussion.category === filterCategory;
        const matchesSearch = searchQuery === '' ||
            discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            discussion.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            discussion.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
        if (sortBy === 'recent') {
            return 0; // Already sorted by recent
        } else if (sortBy === 'popular') {
            return b.likes - a.likes;
        } else if (sortBy === 'active') {
            return b.comments_count - a.comments_count;
        }
        return 0;
    });

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'prompts': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
            case 'tools': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
            case 'agents': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
            case 'general': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    return (
        <div className="min-h-screen"
            style={{
                background: theme === 'light'
                    ? 'linear-gradient(to top, #e3d5f4ff 0%, #dbc6fcff 100%)'
                    : 'linear-gradient(to bottom right, rgb(2 6 23) 0%, rgb(88 28 135 / 0.5) 100%)'
            }}
        >
            <div className='mx-auto max-w-[1600px] px-6 py-8'>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="mb-2">Community</h1>
                    <p className="text-muted-foreground">
                        Connect with other builders, share knowledge, and get help
                    </p>
                </div>

                {/* Main Layout */}
                <div className="flex gap-8 items-start">



                    {/* Main Content - Discussions */}
                    <div className="flex-1 space-y-6">

                        <Tabs defaultValue="discussions" className="w-full">
                            <TabsList className="flex w-full gap-2 mb-6">
                                <TabsTrigger
                                    value="discussions"
                                    className="flex-1 flex items-center justify-center gap-2"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Discussions
                                </TabsTrigger>

                                <TabsTrigger
                                    value="groups"
                                    className="flex-1 flex items-center justify-center gap-2"
                                >
                                    <Users className="h-4 w-4" />
                                    Groups
                                </TabsTrigger>
                            </TabsList>


                            {/* Discussions Tab */}
                            <TabsContent value="discussions" className="space-y-6">
                                <TabHeader>
                                    {/* Search and Filters */}
                                    <Card className="" style={{ background: theme === 'light' ? 'white' : 'black' }}>
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                                <div className="flex-1 relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search discussions..."
                                                        className="pl-10"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                                    <SelectTrigger className="w-full sm:w-[160px]">
                                                        <Filter className="h-4 w-4 mr-2" />
                                                        <SelectValue placeholder="Filter by" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Topics</SelectItem>
                                                        <SelectItem value="prompts">Prompts</SelectItem>
                                                        <SelectItem value="tools">Tools</SelectItem>
                                                        <SelectItem value="agents">Agents</SelectItem>
                                                        <SelectItem value="general">General</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Select value={sortBy} onValueChange={setSortBy}>
                                                    <SelectTrigger className="w-full md:w-[180px]">
                                                        <SelectValue placeholder="Sort by" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="recent">Most Recent</SelectItem>
                                                        <SelectItem value="popular">Most Popular</SelectItem>
                                                        <SelectItem value="active">Most Active</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Dialog modal={false} >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            onClick={() => setOpenNewDiscussion(true)}
                                                            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            New Discussion
                                                        </Button>

                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[600px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Start a New Discussion</DialogTitle>
                                                            <DialogDescription>
                                                                Share your thoughts, ask questions, or start a conversation with the community
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="title">Title</Label>
                                                                <Input
                                                                    id="title"
                                                                    placeholder="What's your discussion about?"
                                                                    value={newDiscussionTitle}
                                                                    onChange={(e) => setNewDiscussionTitle(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="category">Category</Label>
                                                                <Select value={newDiscussionCategory} onValueChange={setNewDiscussionCategory}>
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="prompts">Prompts</SelectItem>
                                                                        <SelectItem value="tools">Tools</SelectItem>
                                                                        <SelectItem value="agents">Agents</SelectItem>
                                                                        <SelectItem value="general">General</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="content">Content</Label>
                                                                <Textarea
                                                                    id="content"
                                                                    placeholder="Share your thoughts in detail..."
                                                                    rows={6}
                                                                    value={newDiscussionContent}
                                                                    onChange={(e) => setNewDiscussionContent(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button onClick={handleCreateDiscussion} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                                                                Post Discussion
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabHeader>

                                {/* Discussion List */}
                                <div className="space-y-4">
                                    {sortedDiscussions.map((discussion) => (
                                        <Card className="hover:shadow-lg transition-shadow cursor-pointer" style={{ background: theme === 'light' ? 'white' : 'black' }} key={discussion.id}
                                            onClick={() => navigate(`/community/discussions/${discussion.id}`)}>
                                            <CardContent className="pt-6">
                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    <Avatar className="h-10 w-10 shrink-0">
                                                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                                            {discussion.avatar}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex-1 space-y-3">
                                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                                <h3 className="text-base font-semibold leading-tight line-clamp-2">
                                                                    {discussion.title}
                                                                </h3>
                                                                <Badge className={`${getCategoryColor(discussion.category)} self-start`}>
                                                                    {discussion.category}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                                <span>{discussion.creator_name}</span>
                                                                <span>•</span>
                                                                <Clock className="h-3 w-3" />
                                                                <span>{discussion.created_at}</span>
                                                                {discussion.category && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <Users className="h-3 w-3" />
                                                                        <span>{discussion.category}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                {discussion.content}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                            <div className="flex flex-wrap gap-2">
                                                                {discussion.tags.map(tag => (
                                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                            </div>

                                                            <div className="flex items-center gap-4 sm:ml-auto text-sm text-muted-foreground">
                                                                <div className="flex items-center gap-1">
                                                                    <MessageSquare className="h-4 w-4" />
                                                                    <span>{discussion.comments_count}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <ThumbsUp className="h-4 w-4" />
                                                                    <span>{discussion.likes}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* Groups Tab */}
                            <TabsContent value="groups" className="space-y-4">
                                <TabHeader>
                                    {/* Search and Filters */}
                                    <Card className="" style={{ background: theme === 'light' ? 'white' : 'black' }}>
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                                <div className="flex-1 relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search groups..."
                                                        className="pl-10"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                                    <SelectTrigger className="w-full sm:w-[160px]">
                                                        <Filter className="h-4 w-4 mr-2" />
                                                        <SelectValue placeholder="Filter by" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Topics</SelectItem>
                                                        <SelectItem value="prompts">Prompts</SelectItem>
                                                        <SelectItem value="tools">Tools</SelectItem>
                                                        <SelectItem value="agents">Agents</SelectItem>
                                                        <SelectItem value="general">General</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Select value={sortBy} onValueChange={setSortBy}>
                                                    <SelectTrigger className="w-full md:w-[180px]">
                                                        <SelectValue placeholder="Sort by" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="recent">Most Recent</SelectItem>
                                                        <SelectItem value="popular">Most Popular</SelectItem>
                                                        <SelectItem value="active">Most Active</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Dialog modal={false} >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            onClick={() => setOpenNewGroup(true)}
                                                            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            New Group
                                                        </Button>

                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[600px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Start a New Group</DialogTitle>
                                                            <DialogDescription>
                                                                Share your thoughts, ask questions, or start a conversation with the community
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="title">Title</Label>
                                                                <Input
                                                                    id="title"
                                                                    placeholder="What's your discussion about?"
                                                                    value={newGroupName}
                                                                    onChange={(e) => setNewGroupName(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="category">Category</Label>
                                                                <Select value={newGroupCategory} onValueChange={setNewGroupCategory}>
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="prompts">Prompts</SelectItem>
                                                                        <SelectItem value="tools">Tools</SelectItem>
                                                                        <SelectItem value="agents">Agents</SelectItem>
                                                                        <SelectItem value="general">General</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="description">Description</Label>
                                                                <Textarea
                                                                    id="description"
                                                                    placeholder="Share your thoughts in detail..."
                                                                    rows={6}
                                                                    value={newGroupDescription}
                                                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button onClick={handleCreateGroup} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                                                                Create Group
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabHeader>

                                <div className="grid grid-cols-1 gap-4">
                                    {groups.map((group) => (
                                        <Card className="hover:shadow-lg transition-shadow cursor-pointer" style={{ background: theme === 'light' ? 'white' : 'black' }} key={group.id}
                                            onClick={() => navigate(`/community/groups/${group.id}/messages`)}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="mb-2">{group.name}</CardTitle>
                                                        <CardDescription>{group.description}</CardDescription>
                                                    </div>
                                                    <Badge className={getCategoryColor(group.category)}>
                                                        {group.category}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-6 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            <span>{group.members_count.toLocaleString()} members</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MessageSquare className="h-4 w-4" />
                                                            <span>Group Chat</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await authFetch(
                                                                    `${API_BASE_URL}/community/groups/${group.id}/join`,
                                                                    { method: "POST" }
                                                                );

                                                                toast("Joined group 🎉");

                                                                // Optional: refresh groups to update member count
                                                                const updatedGroups = await authFetch(
                                                                    `${API_BASE_URL}/community/groups/get`
                                                                );
                                                                setGroups(updatedGroups.data);

                                                            } catch (err: any) {
                                                                const msg = err.message || "Something went wrong";

                                                                if (msg.toLowerCase().includes("already")) {
                                                                    toast("Already a member");
                                                                } else {
                                                                    toast("Failed to join group");
                                                                }
                                                            }
                                                        }}

                                                    >
                                                        Join Group
                                                    </Button>

                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="w-[320px] shrink-0 space-y-6 sticky top-24">

                        {/* Trending Topics */}
                        <Card className="" style={{ background: theme === 'light' ? 'white' : 'black' }}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-violet-600" />
                                    Trending Topics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {['Agent Builder Tips', 'GPT-4 Prompts', 'API Integration', 'Code Review', 'Research Tools'].map((topic, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-lg cursor-pointer transition-colors">
                                            <span className="text-sm">{topic}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {Math.floor(Math.random() * 50) + 10}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Community Stats */}
                        <Card className="" style={{ background: theme === 'light' ? 'white' : 'black' }}>
                            <CardHeader>
                                <CardTitle>Community Stats</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Active Members</span>
                                            <span className="text-sm">8,432</span>
                                        </div>
                                        <div className="text-xs text-green-600">+234 this week</div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Discussions</span>
                                            <span className="text-sm">1,247</span>
                                        </div>
                                        <div className="text-xs text-green-600">+45 this week</div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Groups</span>
                                            <span className="text-sm">{groups.length}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Join and participate</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Community Guidelines */}
                        <Card className="" style={{ background: theme === 'light' ? 'white' : 'black' }}>
                            <CardHeader>
                                <CardTitle>Community Guidelines</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-violet-600">•</span>
                                        <span>Be respectful and constructive</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-violet-600">•</span>
                                        <span>Share knowledge and help others</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-violet-600">•</span>
                                        <span>Stay on topic and organized</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-violet-600">•</span>
                                        <span>No spam or self-promotion</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
