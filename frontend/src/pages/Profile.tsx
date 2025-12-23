import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
// import { Separator } from '../components/ui/separator';
import { Phone, Mail, Calendar, Link as LinkIcon, Settings, Heart, Eye, TrendingUp, Award, BookmarkPlus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config/api';
import { useTheme } from '../components/ThemeProvider';

export function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [myTools, setMyTools] = useState([]);
    const [myPrompts, setMyPrompts] = useState([]);
    const [myAgents, setMyAgents] = useState([]);
    const [activeTab, setActiveTab] = useState("tools");
    const { theme } = useTheme();
    const [profileData, setProfileData] = useState<{
        full_name: string;
        email: string;
        phone: string;
        website: string;
        bio: string;
        joined_date: string;
    } | null>(null);

    useEffect(() => {
        // Get user data from state, context, or localStorage
        const userStr = sessionStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user) {
                    setProfileData({
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        website: user.website || "",
                        bio: user.bio || "",
                        joined_date: new Date(user.joined_date).toLocaleDateString(),
                    });
                }
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
    }, []);
    const [statsData, setStatsData] = useState({
        total_prompts: 0,
        total_tools: 0,
        total_agents: 0,
        total_likes: 0,
        total_views: 0
    });

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = sessionStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/users/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setStatsData(data);
            } catch (err) {
                console.log("Stats error:", err);
            }
        }

        async function fetchMyTools() {
            try {
                const token = sessionStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/tools/my`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setMyTools(data.data);
            } catch (err) {
                console.log("My tools error:", err);
            }
        }

        async function fetchMyPrompts() {
            try {
                const token = sessionStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/prompts/my`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setMyPrompts(data.data);
            } catch (err) {
                console.log("My prompts error:", err);
            }
        }
        async function fetchMyAgents() {
            try {
                const token = sessionStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/agents/my`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setMyAgents(data.data);
            } catch (err) {
                console.log("My agents error:", err);
            }
        }

        fetchStats();
        fetchMyTools();
        fetchMyPrompts();
        fetchMyAgents();
    }, []);


    const stats = [
        { label: 'Prompts Created', value: statsData.total_prompts ?? 0, icon: Upload, color: 'text-violet-600' },
        { label: 'Tools Created', value: statsData.total_tools ?? 0, icon: BookmarkPlus, color: 'text-purple-600' },
        { label: 'Agents Created', value: statsData.total_agents ?? 0, icon: BookmarkPlus, color: 'text-purple-600' },
        { label: 'Total Likes', value: statsData.total_likes ?? 0, icon: Heart, color: 'text-pink-600' },
        { label: 'Total Views', value: statsData.total_views ?? 0, icon: Eye, color: 'text-blue-600' },
    ];


    const handleSaveProfile = () => {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
    };

    // const handleLogout = () => {
    //     localStorage.removeItem("user");
    //     localStorage.removeItem("token");
    //     window.dispatchEvent(new Event("storage")); // Notify Navigation
    //     toast.success("Logged out successfully!");
    //     navigate('/');
    // };


    if (!profileData) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950"
            style={{ backgroundImage: theme === 'light' ? 'linear-gradient(to top, #e3d5f4ff 0%, #dbc6fcff 100%)' : undefined }}
        >
            <div className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <Card className="border-2 shadow-xl mb-8">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Avatar */}
                            <div className="flex flex-col items-center">
                                <Avatar className="h-32 w-32 border-4 border-violet-200 dark:border-violet-800">
                                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                                    <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                        {profileData.full_name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <Button variant="outline" size="sm" className="mt-4">
                                    Change Photo
                                </Button>
                            </div>

                            {/* Profile Info */}
                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                    <div>
                                        <h1 className="mb-2">{profileData.full_name}</h1>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <Badge className="bg-gradient-to-r from-violet-500 to-purple-600">
                                                <Award className="h-3 w-3 mr-1" />
                                                Pro Member
                                            </Badge>
                                            <Badge variant="outline" className="border-violet-300">
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                Top Contributor
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground mb-4">{profileData.bio}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsEditing(true);
                                                setActiveTab("settings");
                                            }}

                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Edit Profile
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-violet-600" />
                                        {profileData.email}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-violet-600" />
                                        {profileData.phone}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="h-4 w-4 text-violet-600" />
                                        <a href={profileData.website} className="text-violet-600 hover:underline">
                                            {profileData.website}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-violet-600" />
                                        Joined {profileData.joined_date}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="flex gap-4 mb-8">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card
                                key={index}
                                className="border-2 flex-1 min-w-[220px]"
                            >
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900">
                                            <Icon className={`h-5 w-5 ${stat.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-2xl">{stat.value ?? 0}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {stat.label}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>



                {/* Tabs Section */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="flex gap-6 bg-transparent p-0 border-b border-slate-700 w-full">

                        <TabsTrigger
                            value="tools"
                            className="rounded-none px-4 py-2
                       data-[state=active]:border-b-2
                       data-[state=active]:border-violet-500
                       data-[state=active]:text-violet-400"
                        >
                            My Tools
                        </TabsTrigger>

                        <TabsTrigger
                            value="prompts"
                            className="rounded-none px-4 py-2
                       data-[state=active]:border-b-2
                       data-[state=active]:border-violet-500
                       data-[state=active]:text-violet-400"
                        >
                            My Prompts
                        </TabsTrigger>
                        <TabsTrigger
                            value="agents"
                            className="rounded-none px-4 py-2
                       data-[state=active]:border-b-2
                       data-[state=active]:border-violet-500
                       data-[state=active]:text-violet-400"
                        >
                            My Agents
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="rounded-none px-4 py-2
                       data-[state=active]:border-b-2
                       data-[state=active]:border-violet-500
                       data-[state=active]:text-violet-400"
                        >
                            Settings
                        </TabsTrigger>
                    </TabsList>


                    {/* Activity Tab */}
                    <TabsContent value="tools">
                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle>My Tools</CardTitle>
                                <CardDescription>Your created tools</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    {myTools.map((tool: any) => (
                                        <Card
                                            key={tool.id}
                                            className="p-4 border hover:shadow-lg transition"
                                        >
                                            <h2 className="text-xl font-semibold">{tool.title}</h2>
                                            <p className="text-sm text-muted-foreground">
                                                {tool.description}
                                            </p>

                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {tool.tags?.map((tag: string, i: number) => (
                                                    <Badge key={i} className="text-white hover:bg-violet-800" style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}>{tag}</Badge>
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
                                                className="mt-4 text-white hover:bg-violet-800"
                                                style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}
                                                onClick={() => window.location.href = `/tools/${tool.id}`}
                                            >
                                                View Tool
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="prompts">
                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle>My Prompts</CardTitle>
                                <CardDescription>Your created prompts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    {myPrompts.map((prompt: any) => (
                                        <Card
                                            key={prompt.id}
                                            className="p-4 border hover:shadow-lg transition"
                                        >
                                            <h2 className="text-xl font-semibold">{prompt.title}</h2>
                                            <p className="text-sm text-muted-foreground">
                                                {prompt.description}
                                            </p>

                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {prompt.tags?.map((tag: string, i: number) => (
                                                    <Badge key={i} className="text-white hover:bg-violet-800" style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}>{tag}</Badge>
                                                ))}
                                            </div>

                                            <div className="flex gap-4 text-sm mt-3">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-4 h-4" /> {prompt.views}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-4 h-4" /> {prompt.likes}
                                                </span>
                                            </div>

                                            <Button
                                                className="mt-4 text-white hover:bg-violet-800"
                                                style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}
                                                onClick={() => window.location.href = `/prompts/${prompt.id}`}
                                            >
                                                View Prompt
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="agents">
                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle>My Agents</CardTitle>
                                <CardDescription>View your agents</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {myAgents.map((agent: any) => (
                                        <Card key={agent.id} className="border-2">
                                            <CardHeader>
                                                <CardTitle>{agent.title}</CardTitle>
                                                <CardDescription>{agent.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex gap-4 text-sm mt-3">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-4 h-4" /> {agent.views}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="w-4 h-4" /> {agent.likes}
                                                    </span>
                                                </div>

                                                <Button
                                                    className="mt-4 text-white hover:bg-violet-800"
                                                    style={{ backgroundColor: 'var(--color-violet-900)', color: 'white' }}
                                                    onClick={() => window.location.href = `/agents/${agent.id}`}
                                                >
                                                    View Agent
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings">
                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle>Profile Settings</CardTitle>
                                <CardDescription>Update your profile information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={profileData.full_name}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, full_name: e.target.value })
                                            }
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, email: e.target.value })
                                            }
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <Input
                                            id="bio"
                                            value={profileData.bio}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, bio: e.target.value })
                                            }
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Website</Label>
                                            <Input
                                                id="website"
                                                value={profileData.website}
                                                onChange={(e) =>
                                                    setProfileData({ ...profileData, website: e.target.value })
                                                }
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="flex gap-3">
                                            <Button
                                                type="button"
                                                onClick={handleSaveProfile}
                                                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                                            >
                                                Save Changes
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsEditing(false)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
