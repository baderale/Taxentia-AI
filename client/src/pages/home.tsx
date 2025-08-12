import ChatInterface from "../components/chat-interface";
import QueryHistory from "../components/query-history";
import CitationsPanel from "../components/citations-panel";
import { useState } from "react";
import { Scale, User, ChevronLeft } from "lucide-react";

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [citationsPanelOpen, setCitationsPanelOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-taxentia-bg" data-testid="home-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50" data-testid="header">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-taxentia-navy rounded-lg flex items-center justify-center" data-testid="logo">
                <Scale className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-taxentia-navy" data-testid="app-title">Taxentia.ai</h1>
                <p className="text-sm text-gray-600" data-testid="app-tagline">Smarter Tax Intelligence for Professionals</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Subscription Tier Badge */}
            <div className="bg-taxentia-gold text-white px-3 py-1 rounded-full text-sm font-medium" data-testid="subscription-badge">
              Pro Plan
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-2" data-testid="user-menu">
              <div className="w-8 h-8 bg-taxentia-blue rounded-full flex items-center justify-center">
                <User className="text-white w-4 h-4" />
              </div>
              <span className="text-sm font-medium" data-testid="username">J. Smith, CPA</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar - Query History */}
        <div 
          className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
          data-testid="sidebar"
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              {!sidebarCollapsed && (
                <h2 className="font-semibold text-gray-900" data-testid="sidebar-title">Query History</h2>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-500 hover:text-gray-700 p-1"
                data-testid="button-toggle-sidebar"
              >
                <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {!sidebarCollapsed && (
              <QueryHistory 
                onSelectQuery={setSelectedQuery}
                selectedQuery={selectedQuery}
              />
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white">
          <ChatInterface 
            selectedQuery={selectedQuery}
            onCitationsToggle={() => setCitationsPanelOpen(!citationsPanelOpen)}
          />
        </div>

        {/* Citations Panel (Floating) */}
        <CitationsPanel 
          isOpen={citationsPanelOpen}
          onClose={() => setCitationsPanelOpen(false)}
        />
      </div>
    </div>
  );
}
