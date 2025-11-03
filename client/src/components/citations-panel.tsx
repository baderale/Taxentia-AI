import { X, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TaxResponse } from "@shared/schema";

interface CitationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  authorities: TaxResponse['authority'];
}

export default function CitationsPanel({ isOpen, onClose, authorities = [] }: CitationsPanelProps) {
  if (!isOpen) return null;

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
        {authorities.length === 0 ? (
          <div className="p-4" data-testid="citations-empty">
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Citations will appear here when viewing a response.</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4" data-testid="citations-list">
            {authorities.map((authority, index) => (
              <div
                key={`${authority.citation}-${index}`}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                data-testid={`citation-item-${index}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900 mb-1" data-testid={`citation-citation-${index}`}>
                      {authority.citation}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2" data-testid={`citation-title-${index}`}>
                      {authority.title}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge
                        className={`text-xs ${getSourceTypeBadge(authority.sourceType)}`}
                        data-testid={`citation-badge-${index}`}
                      >
                        {getSourceTypeLabel(authority.sourceType)}
                      </Badge>
                      {authority.versionDate && (
                        <Badge variant="outline" className="text-xs">
                          {authority.versionDate}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    data-testid={`citation-link-${index}`}
                  >
                    <a href={authority.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>

                {authority.section && (
                  <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-taxentia-blue mb-1">
                    <span className="font-semibold">Section:</span> {authority.section}
                    {authority.subsection && ` (${authority.subsection})`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}