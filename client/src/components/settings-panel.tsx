import { useState } from "react";
import { Settings, Moon, Sun, Bell, Download, Shield, User, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SettingsPanel() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoExport, setAutoExport] = useState(false);

  const settingsSections = [
    {
      title: "Appearance",
      icon: Moon,
      settings: [
        {
          name: "Dark Mode",
          description: "Switch to dark theme for better low-light viewing",
          value: darkMode,
          onChange: setDarkMode,
          premium: false
        },
        {
          name: "Compact Layout",
          description: "Use a more condensed interface layout",
          value: false,
          onChange: () => {},
          premium: true
        }
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      settings: [
        {
          name: "Query Completion",
          description: "Get notified when analysis is complete",
          value: notifications,
          onChange: setNotifications,
          premium: false
        },
        {
          name: "Daily Summary",
          description: "Receive daily usage and insights summary",
          value: false,
          onChange: () => {},
          premium: true
        }
      ]
    },
    {
      title: "Export & Data",
      icon: Download,
      settings: [
        {
          name: "Auto-Export",
          description: "Automatically export queries to PDF",
          value: autoExport,
          onChange: setAutoExport,
          premium: true
        },
        {
          name: "Data Retention",
          description: "Keep query history for extended periods",
          value: true,
          onChange: () => {},
          premium: true
        }
      ]
    },
    {
      title: "Privacy & Security",
      icon: Shield,
      settings: [
        {
          name: "Analytics Tracking",
          description: "Help improve the service with usage analytics",
          value: true,
          onChange: () => {},
          premium: false
        },
        {
          name: "Two-Factor Auth",
          description: "Add an extra layer of account security",
          value: false,
          onChange: () => {},
          premium: true
        }
      ]
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Settings & Preferences</span>
          </DialogTitle>
          <DialogDescription>
            Customize your Taxentia.ai experience and manage your account settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Account Info */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <User className="text-white w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {user?.fullName || user?.username || 'User'}
                </h3>
                <p className="text-sm text-gray-600">{user?.email || 'No email'}</p>
              </div>
              <Badge className="bg-amber-500 text-white">
                {user?.tier === 'pro' ? 'Pro Plan' : user?.tier === 'enterprise' ? 'Enterprise' : 'Free Plan'}
              </Badge>
            </div>
          </Card>

          {/* Settings Sections */}
          {settingsSections.map((section, sectionIndex) => {
            const IconComponent = section.icon;
            return (
              <div key={section.title} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <IconComponent className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                </div>
                
                <Card className="p-4">
                  <div className="space-y-4">
                    {section.settings.map((setting, settingIndex) => (
                      <div key={setting.name}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{setting.name}</span>
                              {setting.premium && (
                                <Badge variant="secondary" className="text-xs">Pro</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                          </div>
                          <Switch
                            checked={setting.value}
                            onCheckedChange={setting.onChange}
                            disabled={setting.premium && false} // Would check subscription status
                          />
                        </div>
                        {settingIndex < section.settings.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            );
          })}

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <span>Quick Actions</span>
            </h3>
            
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </Button>
                <Button variant="outline" className="justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy Policy
                </Button>
                <Button variant="outline" className="justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </Button>
                <Button variant="outline" className="justify-start text-red-600 border-red-200 hover:bg-red-50">
                  <User className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>

          {/* App Info */}
          <Card className="p-4 bg-gray-50">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-gray-900">Taxentia.ai v2.1.0</p>
              <p className="text-xs text-gray-600">
                Professional tax research powered by AI • Last updated: Today
              </p>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}