import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Gavel, Lightbulb, Home, Building, Calculator, Sparkles, TrendingUp, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ResponseDisplay from "../components/response-display";
import type { TaxQuery, TaxResponse } from "@shared/schema";

interface ChatInterfaceProps {
  selectedQuery: string | null;
  onCitationsToggle: () => void;
}

export default function ChatInterface({ selectedQuery, onCitationsToggle }: ChatInterfaceProps) {
  const [queryText, setQueryText] = useState("");
  const [currentResponse, setCurrentResponse] = useState<TaxQuery | null>(null);
  const { toast } = useToast();

  // Fetch user queries
  const { data: queries = [], refetch } = useQuery<TaxQuery[]>({
    queryKey: ["/api/queries"],
  });

  // Submit query mutation
  const submitQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/taxentia/query", { query });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentResponse(data);
      setQueryText("");
      refetch();
      toast({
        title: "Query processed",
        description: "Tax analysis complete with citations",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Query failed",
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    if (!queryText.trim()) return;
    submitQueryMutation.mutate(queryText);
  };

  const handleExampleClick = (example: string) => {
    setQueryText(example);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  const examples = [
    {
      icon: Lightbulb,
      title: "Startup Expenditures",
      description: "When can startup costs be deducted vs. amortized under IRC §195?",
    },
    {
      icon: Home,
      title: "Home Office Deduction",
      description: "Requirements for claiming home office deduction under IRC §280A",
    },
    {
      icon: Building,
      title: "S Corp Elections",
      description: "Timing requirements for Form 2553 S Corporation election",
    },
    {
      icon: Calculator,
      title: "QBI Deduction",
      description: "IRC §199A qualified business income requirements",
    },
  ];

  return (
    <div className="flex flex-col h-screen" data-testid="chat-interface">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {submitQueryMutation.isPending ? (
          /* Loading State */
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse">
                  <Sparkles className="text-white w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Analyzing Your Tax Question</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Searching through IRC, Treasury Regulations, and IRS Publications...</span>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          </div>
        ) : !currentResponse ? (
          /* Enhanced Welcome Experience */
          <div className="max-w-6xl mx-auto animate-fadeIn" data-testid="welcome-message">
            {/* Hero Section */}
            <div className="text-center py-16">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Gavel className="text-white w-10 h-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                  <Sparkles className="text-white w-3 h-3" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4" data-testid="welcome-title">
                Welcome to Taxentia.ai
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8" data-testid="welcome-description">
                Your AI-powered tax research assistant. Get authoritative answers with precise citations from the IRC, Treasury Regulations, and official IRS guidance.
              </p>
              
              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="text-blue-600 w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Authoritative Sources</h3>
                  <p className="text-sm text-gray-600">IRC, Treasury Regulations, Revenue Rulings, and Case Law</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="text-green-600 w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Confidence Scoring</h3>
                  <p className="text-sm text-gray-600">AI-powered confidence assessment for each analysis</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Clock className="text-amber-600 w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instant Answers</h3>
                  <p className="text-sm text-gray-600">Get comprehensive analysis in seconds</p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Quick Examples */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <Lightbulb className="text-amber-500 w-5 h-5" />
                <h2 className="text-lg font-semibold text-gray-900">Try These Common Questions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {examples.map((example, index) => {
                  const IconComponent = example.icon;
                  return (
                    <div
                      key={index}
                      className="group bg-white p-6 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 animate-slideIn"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => handleExampleClick(example.description)}
                      data-testid={`example-${index}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                          <IconComponent className="text-blue-600 w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-2 group-hover:text-blue-700 transition-colors" data-testid={`example-title-${index}`}>
                            {example.title}
                          </div>
                          <div className="text-sm text-gray-600 leading-relaxed" data-testid={`example-description-${index}`}>
                            {example.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <ResponseDisplay 
            response={currentResponse}
            onCitationsToggle={onCitationsToggle}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4" data-testid="input-area">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Textarea
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about U.S. federal tax law (IRC, Treasury Regulations, IRS Publications)..."
                  className="resize-none pr-12 focus:ring-2 focus:ring-taxentia-blue focus:border-transparent"
                  rows={3}
                  disabled={submitQueryMutation.isPending}
                  data-testid="input-query"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!queryText.trim() || submitQueryMutation.isPending}
                  className="absolute right-2 bottom-2 bg-taxentia-navy hover:bg-blue-900 text-white p-2"
                  size="sm"
                  data-testid="button-submit-query"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Input Helpers */}
              <div className="flex items-center justify-between mt-3 text-xs">
                <div className="flex items-center space-x-4 text-gray-500">
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    <kbd className="font-mono">⌘+Enter</kbd> to send
                  </Badge>
                  <span>•</span>
                  <span data-testid="scope-notice">U.S. federal tax only</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    <Clock className="w-3 h-3 mr-1" />
                    12/20 queries today
                  </Badge>
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}