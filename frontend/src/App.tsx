import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { PromptsList } from './pages/PromptsList';
import { PromptDetail } from './pages/PromptDetail';
import { ToolsList } from './pages/ToolsList';
import { ToolDetail } from './pages/ToolDetail';
import { Dashboard } from './pages/Dashboard';
import { SubmissionForm } from './pages/SubmissionForm';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';
// import { ProtectedRoute } from "./components/ProtectedRoute";
import { Profile } from "./pages/Profile";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AgentLibrary } from "./pages/AgentLibrary";
import { AgentBuilder } from "./pages/AgentBuilder";
import { AgentDetail } from "./pages/AgentDetail";
import { Community } from './pages/Community';

export default function App() {
    return (
        <ThemeProvider>
            <Router>
                <AuthProvider>
                    <div className="min-h-screen flex flex-col bg-background">
                        <Navigation />

                        <main className="flex-1">
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<Home />} />
                                <Route path="/prompts" element={<PromptsList />} />
                                <Route path="/tools" element={<ToolsList />} />
                                <Route path="/agents" element={<AgentLibrary />} />
                                <Route path="/community" element={<Community />} />

                                <Route
                                    path="/login"
                                    element={<Login onLogin={() => { }} />}
                                />

                                <Route
                                    path="/signup"
                                    element={<SignUp onSwitchToLogin={() => { }} />}
                                />

                                {/* PROTECTED ROUTES */}
                                <Route element={<ProtectedRoute />}>

                                    <Route path="/prompts/:id" element={<PromptDetail />} />
                                    <Route path="/tools/:id" element={<ToolDetail />} />
                                    <Route path="/agents/:id" element={<AgentDetail />} />
                                    <Route path="/submit-prompt" element={<SubmissionForm type="prompt" />} />
                                    <Route path="/submit-tool" element={<SubmissionForm type="tool" />} />
                                    <Route path="/submit-agent" element={<SubmissionForm type="agent" />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route path="/agents/builder" element={<AgentBuilder />} />
                                </Route>

                            </Routes>
                        </main>

                        <Footer />
                        <Toaster />
                    </div>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}
