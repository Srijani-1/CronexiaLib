import { useEffect, useState, useRef } from 'react';
import { SearchBar } from '../components/SearchBar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Pagination } from '../components/Pagination';
import { API_BASE_URL } from "../config/api";
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

interface FilterGroup {
  title: string;
  options: {
    id: string;
    label: string;
    checked?: boolean;
  }[];
}

import { useTheme } from '../components/ThemeProvider';

export function ToolsList() {
  const { theme } = useTheme();
  /* State */
  const [currentPage, setCurrentPage] = useState(1);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  /* Logic to fetch tools with current state filters */
  const fetchTools = async () => {
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
          if (group.title === "Language") paramKey = "language";
          else if (group.title === "Use Case") paramKey = "tag";
          else if (group.title === "Model") paramKey = "model";

          if (paramKey && activeOptions.length > 0) {
            // Pass first selected option for now
            queryParams.append(paramKey, activeOptions[0]);
          }
        }
      });

      const res = await fetch(`${API_BASE_URL}/tools/?${queryParams.toString()}`, {
        signal: controller.signal
      });
      const data = await res.json();
      setTools(data.data || []);
      setTotalPages(data.total_pages || 1);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Failed to fetch tools:", err);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  /* Initial Load & Search */
  useEffect(() => {
    // Instant search with abort handling
    fetchTools();
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
    fetchTools();
  };

  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch(`${API_BASE_URL}/tools/filters`);
        const data = await res.json();

        setFilterGroups([
          {
            title: "Language",
            options: data.languages?.map((l: string) => ({
              id: l.toLowerCase().replace(/\s+/g, "-"),
              label: l,
              checked: false
            })) || []
          },
          {
            title: "Use Case",
            options: data.use_cases?.map((t: string) => ({
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

  if (loading && !tools.length && !filterGroups.length) { // Initial load
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center dark:text-white">Loading tools...</p>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto px-4 py-8 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-slate-950 dark:to-purple-950/50 min-h-screen"
      style={{ backgroundImage: theme === 'light' ? 'linear-gradient(to top, #e3d5f4ff 0%, #dbc6fcff 100%)' : undefined }}
    >
      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar placeholder="Search tools..." onSearch={handleSearch} />
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
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 animate-fade-in-up">
              <h1 className="mb-2">Tools Library</h1>
              <p className="text-slate-600 dark:text-slate-400">Discover developer tools and utilities for building AI agents</p>
            </div>
            <Button
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <Link to="/submit-tool">
                <Plus className="mr-2 h-4 w-4" />
                Upload Tool
              </Link>
            </Button>
          </div>

          {/* Tools Grid */}
          {/* Tools Grid */}
          {tools.length > 0 ? (
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
              {tools.map((tool: any, index: number) => (
                <div key={tool.id} className="animate-stagger" style={{ animationDelay: `${0.05 * index}s` }}>
                  <Card
                    title={tool.title}
                    description={tool.description}
                    tags={tool.tags || []}
                    href={`/tools/${tool.id}`}
                    metadata={[
                      { label: "Views", value: tool.views || "0" },
                      { label: "Likes", value: tool.likes || "0" },
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
              <p className="text-lg text-slate-600 dark:text-slate-400">No tools found matching your search.</p>
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
