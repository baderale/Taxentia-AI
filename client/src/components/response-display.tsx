import { FileDown, Copy, Share2, Gavel, BookOpen, Search, AlertTriangle, TrendingUp, ExternalLink, Calendar, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { TaxQuery, TaxResponse } from "@shared/schema";

interface ResponseDisplayProps {
  response: TaxQuery;
  onCitationsToggle: () => void;
}

export default function ResponseDisplay({ response, onCitationsToggle }: ResponseDisplayProps) {
  const { toast } = useToast();
  const parsedResponse = response.response as TaxResponse;

  if (!parsedResponse) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No response data available</p>
      </div>
    );
  }

  const handleExportPDF = () => {
    toast({
      title: "Export initiated",
      description: "PDF export will be available in Pro plan",
    });
  };

  const handleCopyResponse = () => {
    const textContent = `Query: ${response.query}\n\nConclusion: ${parsedResponse.conclusion}\n\nAnalysis: ${parsedResponse.analysis.map(a => `${a.step}: ${a.rationale}`).join('\n\n')}`;
    navigator.clipboard.writeText(textContent);
    toast({
      title: "Copied to clipboard",
      description: "Response content has been copied",
    });
  };

  const handleShare = () => {
    toast({
      title: "Share feature",
      description: "Sharing will be available in a future update",
    });
  };

  const getConfidenceColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-50 border-green-200';
      case 'amber': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getAuthorityBadgeColor = (sourceType: string) => {
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

  const getAuthorityType = (sourceType: string) => {
    switch (sourceType) {
      case 'irc':
      case 'regs':
        return 'Primary Authority';
      case 'pubs':
        return 'Secondary Authority';
      case 'rulings':
        return 'Administrative';
      case 'cases':
        return 'Case Law';
      default:
        return 'Authority';
    }
  };

  return (
    <div className="space-y-6" data-testid="response-display">
      {/* User Question */}
      <div className="flex justify-end">
        <div className="bg-taxentia-blue text-white p-4 rounded-lg max-w-2xl" data-testid="user-query">
          <p className="text-sm">{response.query}</p>
        </div>
      </div>

      {/* AI Response */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg animate-fadeIn">
        {/* Response Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-6" data-testid="response-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-taxentia-navy rounded-full flex items-center justify-center">
                <Gavel className="text-white w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900" data-testid="response-title">Taxentia Analysis</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      parsedResponse.confidence.color === 'green' ? 'bg-green-500' :
                      parsedResponse.confidence.color === 'amber' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      parsedResponse.confidence.color === 'green' ? 'text-green-600' :
                      parsedResponse.confidence.color === 'amber' ? 'text-yellow-600' : 'text-red-600'
                    }`} data-testid="confidence-indicator">
                      {parsedResponse.confidence.score}% - {parsedResponse.confidence.color === 'green' ? 'High' :
                       parsedResponse.confidence.color === 'amber' ? 'Medium' : 'Low'} Confidence
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500" data-testid="response-time">Response time: 2.3s</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPDF}
                title="Export to PDF"
                data-testid="button-export-pdf"
              >
                <FileDown className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyResponse}
                title="Copy Response"
                data-testid="button-copy-response"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                title="Share"
                data-testid="button-share"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Conclusion Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="conclusion-section">
            <div className="flex items-center space-x-2 mb-3">
              <Gavel className="text-taxentia-navy w-4 h-4" />
              <h4 className="font-semibold text-gray-900">Conclusion</h4>
            </div>
            <p className="text-gray-800 leading-relaxed" data-testid="conclusion-content">
              {parsedResponse.conclusion}
            </p>
          </div>

          {/* Authority Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="authority-section">
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen className="text-taxentia-gold w-4 h-4" />
              <h4 className="font-semibold text-gray-900">Authority</h4>
            </div>
            <div className="space-y-3">
              {parsedResponse.authority.map((auth, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={onCitationsToggle}
                  data-testid={`authority-item-${index}`}
                >
                  <div className="w-6 h-6 bg-taxentia-navy rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900" data-testid={`authority-title-${index}`}>
                      {auth.citation}
                    </div>
                    <div className="text-xs text-gray-600 mt-1" data-testid={`authority-description-${index}`}>
                      {auth.title}
                    </div>
                    {(auth.effectiveDate || auth.versionDate) && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {auth.effectiveDate || `Version: ${auth.versionDate}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getAuthorityBadgeColor(auth.sourceType)} data-testid={`authority-type-${index}`}>
                        {getAuthorityType(auth.sourceType)}
                      </Badge>
                      {auth.directUrl ? (
                        <a href={auth.directUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-taxentia-blue text-xs hover:underline" data-testid={`authority-direct-link-${index}`}>
                          <span>Direct Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <a href={auth.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-taxentia-blue text-xs hover:underline" data-testid={`authority-link-${index}`}>
                          <span>View Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="analysis-section">
            <div className="flex items-center space-x-2 mb-3">
              <Search className="text-taxentia-blue w-4 h-4" />
              <h4 className="font-semibold text-gray-900">Analysis</h4>
            </div>
            <div className="space-y-4">
              {parsedResponse.analysis.map((step, index) => (
                <div key={index} className="border-l-4 border-taxentia-blue pl-4" data-testid={`analysis-step-${index}`}>
                  <h5 className="font-medium text-gray-900 mb-2" data-testid={`analysis-step-title-${index}`}>
                    {index + 1}. {step.step}
                  </h5>
                  <p className="text-sm text-gray-700 mb-2" data-testid={`analysis-step-rationale-${index}`}>
                    {step.rationale}
                  </p>
                  {step.proceduralNotes && (
                    <div className="bg-blue-50 border-l-2 border-blue-200 pl-3 py-2 mb-2">
                      <div className="flex items-center space-x-1 mb-1">
                        <FileText className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-medium text-blue-700">Procedural Note</span>
                      </div>
                      <p className="text-xs text-blue-600">{step.proceduralNotes}</p>
                    </div>
                  )}
                  {step.authorityRefs && step.authorityRefs.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Authority refs:</span>
                      {step.authorityRefs.map((ref, refIndex) => (
                        <Badge key={refIndex} variant="secondary" className="text-xs" data-testid={`authority-ref-${index}-${refIndex}`}>
                          {parsedResponse.authority[ref]?.citation || `Ref ${ref}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Scope & Assumptions Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="scope-section">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="text-yellow-500 w-4 h-4" />
              <h4 className="font-semibold text-gray-900">Scope & Assumptions</h4>
            </div>
            <div className="text-sm text-gray-700" data-testid="scope-content">
              <p>{parsedResponse.scopeAssumptions}</p>
            </div>
          </div>

          {/* Confidence Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="confidence-section">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="text-green-500 w-4 h-4" />
                <h4 className="font-semibold text-gray-900">{parsedResponse.confidence.score}% Confidence Assessment</h4>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24">
                  <Progress value={parsedResponse.confidence.score} className="h-2" />
                </div>
                <span className={`text-sm font-medium ${
                  parsedResponse.confidence.color === 'green' ? 'text-green-600' :
                  parsedResponse.confidence.color === 'amber' ? 'text-yellow-600' : 'text-red-600'
                }`} data-testid="confidence-score">
                  {parsedResponse.confidence.color === 'green' ? 'High' :
                   parsedResponse.confidence.color === 'amber' ? 'Medium' : 'Low'}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-700" data-testid="confidence-notes">
              <p>{parsedResponse.confidence.notes || 'Primary authority is directly on point with minimal interpretive uncertainty.'}</p>
            </div>
          </div>

          {/* Further Reading Section */}
          {parsedResponse.furtherReading && parsedResponse.furtherReading.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="further-reading-section">
              <div className="flex items-center space-x-2 mb-3">
                <BookOpen className="text-blue-500 w-4 h-4" />
                <h4 className="font-semibold text-gray-900">Further Reading</h4>
              </div>
              <div className="space-y-2">
                {parsedResponse.furtherReading.map((reading, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded" data-testid={`further-reading-${index}`}>
                    <ExternalLink className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <a href={reading.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-700 hover:underline">
                        {reading.citation}
                      </a>
                      <p className="text-xs text-gray-600 mt-1">{reading.title}</p>
                      <p className="text-xs text-blue-600 mt-1">{reading.relevance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Procedural Guidance Section */}
          {parsedResponse.proceduralGuidance && (
            <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="procedural-guidance-section">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="text-purple-500 w-4 h-4" />
                <h4 className="font-semibold text-gray-900">Procedural Guidance</h4>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {parsedResponse.proceduralGuidance.forms && parsedResponse.proceduralGuidance.forms.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>Required Forms</span>
                    </h5>
                    {parsedResponse.proceduralGuidance.forms.map((form, index) => (
                      <Badge key={index} variant="outline" className="block text-xs">
                        {form}
                      </Badge>
                    ))}
                  </div>
                )}
                {parsedResponse.proceduralGuidance.deadlines && parsedResponse.proceduralGuidance.deadlines.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Key Deadlines</span>
                    </h5>
                    {parsedResponse.proceduralGuidance.deadlines.map((deadline, index) => (
                      <Badge key={index} variant="outline" className="block text-xs bg-orange-50 border-orange-200">
                        {deadline}
                      </Badge>
                    ))}
                  </div>
                )}
                {parsedResponse.proceduralGuidance.elections && parsedResponse.proceduralGuidance.elections.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Available Elections</span>
                    </h5>
                    {parsedResponse.proceduralGuidance.elections.map((election, index) => (
                      <Badge key={index} variant="outline" className="block text-xs bg-green-50 border-green-200">
                        {election}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer Section */}
          {parsedResponse.disclaimer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" data-testid="disclaimer-section">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-yellow-800 mb-1">Professional Disclaimer</h5>
                  <p className="text-xs text-yellow-700">{parsedResponse.disclaimer}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}