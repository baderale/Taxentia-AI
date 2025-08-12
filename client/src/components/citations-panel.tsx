import { X, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CitationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CitationsPanel({ isOpen, onClose }: CitationsPanelProps) {
  if (!isOpen) return null;

  // Mock citation data - in real app this would come from props or API
  const citations = [
    {
      id: 1,
      citation: "IRC §195(a)",
      title: "Startup Expenditures - Deduction and amortization provisions",
      sourceType: "irc",
      url: "https://www.law.cornell.edu/uscode/text/26/195",
      content: "Except as otherwise provided in this section, no deduction shall be allowed for start-up expenditures...",
    },
    {
      id: 2,
      citation: "IRC §195(c)",
      title: "Election Rules - Election to deduct startup expenditures",
      sourceType: "irc", 
      url: "https://www.law.cornell.edu/uscode/text/26/195",
      content: "A taxpayer may elect to deduct so much of his start-up expenditures as does not exceed $5,000...",
    },
    {
      id: 3,
      citation: "IRS Pub. 535",
      title: "Business Expenses - Chapter 8: Startup Costs",
      sourceType: "pubs",
      url: "https://www.irs.gov/publications/p535",
      content: "Start-up costs are the expenses incurred before you actually begin business operations...",
    },
  ];

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'irc': return 'Internal Revenue Code';
      case 'regs': return 'Treasury Regulations';
      case 'pubs': return 'IRS Publication';
      case 'rulings': return 'Revenue Ruling';
      case 'cases': return 'Court Decision';
      default: return 'Authority';
    }
  };

  const getSourceTypeBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'irc':
      case 'regs':
        return 'bg-blue-100 text-blue-800';
      case 'pubs':
        return 'bg-amber-100 text-amber-800';
      case 'rulings':
        return 'bg-green-100 text-green-800';
      case 'cases':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="fixed right-4 top-24 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden z-50"
      data-testid="citations-panel"
    >
      <div className="p-4 border-b border-gray-200 bg-gray-50" data-testid="citations-header">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900" data-testid="citations-title">Citations</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-citations"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-80" data-testid="citations-content">
        {citations.length === 0 ? (
          <div className="p-4" data-testid="citations-empty">
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Citations will appear here when viewing a response.</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4" data-testid="citations-list">
            {citations.map((citation) => (
              <div
                key={citation.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                data-testid={`citation-item-${citation.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900 mb-1" data-testid={`citation-citation-${citation.id}`}>
                      {citation.citation}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2" data-testid={`citation-title-${citation.id}`}>
                      {citation.title}
                    </p>
                    <Badge 
                      className={`text-xs ${getSourceTypeBadge(citation.sourceType)}`}
                      data-testid={`citation-badge-${citation.id}`}
                    >
                      {getSourceTypeLabel(citation.sourceType)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    data-testid={`citation-link-${citation.id}`}
                  >
                    <a href={citation.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
                
                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-taxentia-blue" data-testid={`citation-content-${citation.id}`}>
                  {citation.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}