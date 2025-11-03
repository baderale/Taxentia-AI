import { useQuery } from "@tanstack/react-query";
import { Search, Clock, TrendingUp, FileText, Filter, SortDesc, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { TaxQuery } from "@shared/schema";

interface QueryHistoryProps {
  onSelectQuery: (query: TaxQuery) => void;
  selectedQuery: string | null;
}

export default function QueryHistory({ onSelectQuery, selectedQuery }: QueryHistoryProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "confidence" | "topic">("recent");
  const [filterBy, setFilterBy] = useState<"all" | "high" | "medium" | "low">("all");

  // Fetch query history
  const { data: queries = [], isLoading } = useQuery<TaxQuery[]>({
    queryKey: ["/api/queries"],
  });

  // Calculate today's usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayQueries = queries.filter(q => {
    const queryDate = new Date(q.createdAt || 0);
    queryDate.setHours(0, 0, 0, 0);
    return queryDate.getTime() === today.getTime();
  });
  const todayCount = todayQueries.length;
  const monthlyQuota = user?.apiQuotaMonthly || 100; // Default to 100 if not set
  const usagePercent = Math.min((todayCount / Math.max(monthlyQuota / 30, 1)) * 100, 100); // Daily quota estimate

  // Enhanced filtering and sorting
  let filteredQueries = queries.filter(query => {
    const matchesSearch = query.query.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filterBy === "all") return true;
    
    const confidence = (query.response as any)?.confidence;
    if (!confidence) return filterBy === "low";
    
    const score = confidence.score;
    switch (filterBy) {
      case "high": return score >= 80;
      case "medium": return score >= 50 && score < 80;
      case "low": return score < 50;
      default: return true;
    }
  });

  // Sort queries
  filteredQueries.sort((a, b) => {
    switch (sortBy) {
      case "confidence":
        const aScore = (a.response as any)?.confidence?.score || 0;
        const bScore = (b.response as any)?.confidence?.score || 0;
        return bScore - aScore;
      case "topic":
        return a.query.localeCompare(b.query);
      default: // recent
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const getConfidenceColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500 text-green-600';
      case 'amber': return 'bg-yellow-500 text-yellow-600';
      default: return 'bg-red-500 text-red-600';
    }
  };

  const getConfidenceText = (color: string) => {
    switch (color) {
      case 'green': return 'High';
      case 'amber': return 'Medium';
      default: return 'Low';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fadeIn">
            <div className="flex items-start space-x-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1" data-testid="query-history">
      {/* Enhanced Search & Filters */}
      <div className="space-y-3 mb-4">
        {/* Search Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 text-sm focus:ring-2 focus:ring-taxentia-blue focus:border-transparent"
            data-testid="input-search-history"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        </div>
        
        {/* Sort & Filter Controls */}
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-28">
              <SortDesc className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="confidence">Confidence</SelectItem>
              <SelectItem value="topic">Topic</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="px-2">
                <Filter className="w-3 h-3" />
                {filterBy !== "all" && (
                  <Badge className="ml-1 h-4 w-4 p-0 text-xs">{
                    filteredQueries.length
                  }</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter by Confidence</h4>
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Queries</SelectItem>
                    <SelectItem value="high">High (80%+)</SelectItem>
                    <SelectItem value="medium">Medium (50-79%)</SelectItem>
                    <SelectItem value="low">Low (&lt;50%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Results Summary */}
        {(searchTerm || filterBy !== "all") && (
          <div className="text-xs text-gray-500 flex items-center space-x-1">
            <span>{filteredQueries.length} result{filteredQueries.length !== 1 ? 's' : ''}</span>
            {searchTerm && <span>for "{searchTerm}"</span>}
            {filterBy !== "all" && <Badge variant="secondary" className="h-4 text-xs">{filterBy}</Badge>}
          </div>
        )}
      </div>

      {/* Query List */}
      <div className="flex-1 overflow-y-auto space-y-3" data-testid="query-list">
        {filteredQueries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500" data-testid="empty-history">
              {searchTerm ? 'No matching queries found' : 'No query history yet'}
            </p>
          </div>
        ) : (
          filteredQueries.map((query) => (
            <div
              key={query.id}
              className={`bg-gray-50 hover:bg-gray-100 p-3 rounded-lg cursor-pointer border transition-colors ${
                selectedQuery === query.id ? 'border-taxentia-blue bg-blue-50' : 'border-transparent hover:border-taxentia-blue'
              }`}
              onClick={() => onSelectQuery(query)}
              data-testid={`query-item-${query.id}`}
            >
              <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2" data-testid={`query-title-${query.id}`}>
                {query.query.substring(0, 60)}...
              </div>
              <div className="text-xs text-gray-600 line-clamp-2 mb-2" data-testid={`query-preview-${query.id}`}>
                {query.query}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500" data-testid={`query-time-${query.id}`}>
                  {formatTimeAgo(query.createdAt || new Date().toISOString())}
                </span>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${getConfidenceColor(query.confidenceColor)}`}></div>
                  <span className={`text-xs ${getConfidenceColor(query.confidenceColor).split(' ')[1]}`}>
                    {getConfidenceText(query.confidenceColor)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Usage Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 -mx-4" data-testid="usage-stats">
        <div className="text-xs text-gray-600 mb-2">Today's Usage</div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium" data-testid="usage-count">
            {todayCount} / {Math.floor(monthlyQuota / 30)} queries
          </span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-taxentia-blue h-2 rounded-full transition-all"
              style={{ width: `${usagePercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}