import { useQuery } from "@tanstack/react-query";
import { Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { TaxQuery } from "@shared/schema";

interface QueryHistoryProps {
  onSelectQuery: (queryId: string) => void;
  selectedQuery: string | null;
}

export default function QueryHistory({ onSelectQuery, selectedQuery }: QueryHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch query history
  const { data: queries = [], isLoading } = useQuery<TaxQuery[]>({
    queryKey: ["/api/queries"],
  });

  const filteredQueries = queries.filter(query =>
    query.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div key={i} className="bg-gray-50 p-3 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1" data-testid="query-history">
      {/* Search History */}
      <div className="relative mb-4">
        <Input
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-sm focus:ring-2 focus:ring-taxentia-blue focus:border-transparent"
          data-testid="input-search-history"
        />
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
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
              onClick={() => onSelectQuery(query.id)}
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
          <span className="text-sm font-medium" data-testid="usage-count">12 / 20 queries</span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div className="bg-taxentia-blue h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}