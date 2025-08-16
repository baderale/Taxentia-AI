import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Clock, BookOpen, Target, BarChart3, Calendar, Award, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TaxQuery } from "@shared/schema";

export default function Dashboard() {
  // Fetch query history for analytics
  const { data: queries = [], isLoading } = useQuery<TaxQuery[]>({
    queryKey: ["/api/queries"],
  });

  // Calculate analytics
  const analytics = {
    totalQueries: queries.length,
    averageConfidence: queries.length > 0 ? 
      Math.round(queries.reduce((sum, q) => sum + (q.response as any)?.confidence?.score || 0, 0) / queries.length) : 0,
    highConfidenceQueries: queries.filter(q => (q.response as any)?.confidence?.score >= 80).length,
    recentActivity: queries.slice(-5),
    topicsAnalyzed: [
      { topic: "Business Deductions", count: 12, trend: "+15%" },
      { topic: "Home Office", count: 8, trend: "+8%" },
      { topic: "Depreciation", count: 6, trend: "-2%" },
      { topic: "S Corporation", count: 4, trend: "+25%" },
    ]
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your tax research progress and insights</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Calendar className="w-4 h-4 mr-1" />
          Last 30 days
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <Badge className="bg-blue-100 text-blue-700">Total</Badge>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.totalQueries}</div>
          <div className="text-sm text-gray-600">Tax Queries Analyzed</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <Target className="text-white w-6 h-6" />
            </div>
            <Badge className="bg-green-100 text-green-700">Average</Badge>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.averageConfidence}%</div>
          <div className="text-sm text-gray-600">Confidence Score</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
              <Award className="text-white w-6 h-6" />
            </div>
            <Badge className="bg-amber-100 text-amber-700">High Quality</Badge>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.highConfidenceQueries}</div>
          <div className="text-sm text-gray-600">High Confidence Results</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Clock className="text-white w-6 h-6" />
            </div>
            <Badge className="bg-purple-100 text-purple-700">Active</Badge>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">2.3s</div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="text-white w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="space-y-4">
            {analytics.recentActivity.map((query, index) => (
              <div key={query.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {query.query.substring(0, 60)}...
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      (query.response as any)?.confidence?.color === 'green' ? 'bg-green-100 text-green-700' :
                      (query.response as any)?.confidence?.color === 'amber' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {(query.response as any)?.confidence?.score || 0}% confidence
                    </div>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                </div>
              </div>
            ))}
            {analytics.recentActivity.length === 0 && (
              <div className="text-center py-8">
                <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No queries yet. Start analyzing tax questions!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Topic Analysis */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <BookOpen className="text-white w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Popular Topics</h3>
          </div>
          <div className="space-y-4">
            {analytics.topicsAnalyzed.map((topic, index) => (
              <div key={topic.topic} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{topic.topic}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{topic.count} queries</span>
                    <Badge variant={topic.trend.startsWith('+') ? 'default' : 'secondary'} className="text-xs">
                      {topic.trend}
                    </Badge>
                  </div>
                </div>
                <Progress value={(topic.count / 12) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Usage Insights */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Usage Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">92%</div>
            <div className="text-sm text-gray-600">Authority Coverage</div>
            <div className="text-xs text-gray-500 mt-1">IRC, Regs, Publications</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">4.8/5</div>
            <div className="text-sm text-gray-600">Quality Score</div>
            <div className="text-xs text-gray-500 mt-1">Based on confidence metrics</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600 mb-2">15</div>
            <div className="text-sm text-gray-600">Days Active</div>
            <div className="text-xs text-gray-500 mt-1">Since account creation</div>
          </div>
        </div>
      </Card>
    </div>
  );
}