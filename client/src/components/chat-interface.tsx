import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Gavel, Lightbulb, Home, Building, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
        {!currentResponse ? (
          /* Welcome Message */
          <div className="text-center py-12" data-testid="welcome-message">
            <div className="w-16 h-16 bg-taxentia-navy rounded-full flex items-center justify-center mx-auto mb-4">
              <Gavel className="text-white w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="welcome-title">
              Welcome to Taxentia.ai
            </h2>
            <p className="text-gray-600 max-w-md mx-auto" data-testid="welcome-description">
              Ask me about U.S. federal tax law. I'll provide authoritative answers with precise citations from the IRC, Treasury Regulations, and official IRS guidance.
            </p>
            
            {/* Quick Examples */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-4xl mx-auto">
              {examples.map((example, index) => {
                const IconComponent = example.icon;
                return (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-taxentia-blue transition-colors"
                    onClick={() => handleExampleClick(example.description)}
                    data-testid={`example-${index}`}
                  >
                    <IconComponent className="text-taxentia-gold mb-2 w-5 h-5" />
                    <div className="text-sm font-medium mb-1" data-testid={`example-title-${index}`}>
                      {example.title}
                    </div>
                    <div className="text-xs text-gray-600" data-testid={`example-description-${index}`}>
                      {example.description}
                    </div>
                  </div>
                );
              })}
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
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span data-testid="keyboard-shortcut">Press ⌘+Enter to send</span>
                  <span>•</span>
                  <span data-testid="scope-notice">U.S. federal tax only</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span data-testid="usage-counter">12/20 queries today</span>
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