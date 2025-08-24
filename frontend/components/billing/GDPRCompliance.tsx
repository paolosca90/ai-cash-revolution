import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useBackend } from "@/hooks/useBackend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Settings
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GDPRComplianceProps {
  userId: number;
  userEmail: string;
}

export function GDPRCompliance({ userId, userEmail }: GDPRComplianceProps) {
  const backend = useBackend();
  const { toast } = useToast();
  const [showDeletionWarning, setShowDeletionWarning] = useState(false);

  const { data: dataSummary } = useQuery({
    queryKey: ["dataSummary", userId],
    queryFn: () => backend.billing.getUserDataSummary({ userId }),
  });

  const { data: processingInfo } = useQuery({
    queryKey: ["processingInfo"],
    queryFn: () => backend.billing.getDataProcessingInfo(),
  });

  const { data: auditLog } = useQuery({
    queryKey: ["auditLog", userId],
    queryFn: () => backend.billing.getSecurityAuditLog({ userId, limit: 20 }),
  });

  const exportDataMutation = useMutation({
    mutationFn: () => backend.billing.requestDataExport({ userId, email: userEmail }),
    onSuccess: (data) => {
      toast({
        title: "Data export requested",
        description: `Your data export request has been submitted. Request ID: ${data.requestId}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletionRequestMutation = useMutation({
    mutationFn: (reason?: string) => 
      backend.billing.requestDataDeletion({ userId, email: userEmail, reason }),
    onSuccess: (data) => {
      toast({
        title: "Deletion requested",
        description: `Your data deletion request has been submitted. Some data may be retained for ${data.retentionPeriod} years due to legal requirements.`,
      });
      setShowDeletionWarning(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const consentMutation = useMutation({
    mutationFn: (consents: { marketing: boolean; analytics: boolean; essential: boolean }) =>
      backend.billing.updateConsent({ userId, consents }),
    onSuccess: () => {
      toast({
        title: "Consent updated",
        description: "Your consent preferences have been updated.",
      });
    },
  });

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Data Protection
          </CardTitle>
          <CardDescription>
            Manage your data privacy settings and exercise your GDPR rights
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="rights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rights">Your Rights</TabsTrigger>
          <TabsTrigger value="data">Your Data</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="security">Security Log</TabsTrigger>
        </TabsList>

        <TabsContent value="rights" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Download className="h-4 w-4" />
                  Right to Access
                </CardTitle>
                <CardDescription>
                  Download all your personal data we have collected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Get a complete export of your data including subscriptions, 
                  payment history, and account information.
                </p>
                <Button 
                  onClick={() => exportDataMutation.mutate()}
                  disabled={exportDataMutation.isPending}
                  className="w-full"
                >
                  {exportDataMutation.isPending ? "Processing..." : "Request Data Export"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trash2 className="h-4 w-4" />
                  Right to Erasure
                </CardTitle>
                <CardDescription>
                  Request deletion of your personal data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Request deletion of your account and associated data. 
                  Some financial records may be retained for legal compliance.
                </p>
                {!showDeletionWarning ? (
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeletionWarning(true)}
                    className="w-full"
                  >
                    Request Account Deletion
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This action cannot be undone. Your subscription will be cancelled 
                        and all data will be permanently deleted (subject to legal retention requirements).
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        onClick={() => deletionRequestMutation.mutate("User requested deletion")}
                        disabled={deletionRequestMutation.isPending}
                        className="flex-1"
                      >
                        Confirm Deletion
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDeletionWarning(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Processing Information
              </CardTitle>
              <CardDescription>
                How we process your personal data and why
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processingInfo?.activities.map((activity, index) => (
                <div key={index} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{activity.purpose}</h4>
                    <Badge variant="outline" className="text-xs">{activity.legalBasis.split(' ')[0]}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Legal basis:</strong> {activity.legalBasis}</p>
                    <p><strong>Data types:</strong> {activity.dataTypes.join(", ")}</p>
                    <p><strong>Retention:</strong> {activity.retention}</p>
                    {activity.thirdParties.length > 0 && (
                      <p><strong>Third parties:</strong> {activity.thirdParties.join(", ")}</p>
                    )}
                  </div>
                  {index < processingInfo.activities.length - 1 && (
                    <hr className="mt-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Your Data Summary
              </CardTitle>
              <CardDescription>
                Overview of personal data we store about you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataSummary ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Subscriptions</h4>
                      <p className="text-sm text-gray-600">
                        {dataSummary.data.subscriptions.length} subscription record(s)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Payment Methods</h4>
                      <p className="text-sm text-gray-600">
                        {dataSummary.data.paymentMethods.length} payment method(s)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Billing History</h4>
                      <p className="text-sm text-gray-600">
                        {dataSummary.data.invoices.length} invoice(s)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Activity Events</h4>
                      <p className="text-sm text-gray-600">
                        {dataSummary.data.billingEvents.length} recent event(s)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">External References</h4>
                      <p className="text-sm text-gray-600">
                        Customer ID: {dataSummary.data.personalData.customerId ? "Yes" : "No"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Subscriptions: {dataSummary.data.personalData.subscriptionIds.length}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  Loading data summary...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Consent Management
              </CardTitle>
              <CardDescription>
                Control how your data is used for different purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Essential Services</h4>
                    <p className="text-sm text-gray-600">
                      Required for core functionality and security
                    </p>
                  </div>
                  <Badge variant="secondary">Required</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Analytics & Performance</h4>
                    <p className="text-sm text-gray-600">
                      Help us improve our service through usage analytics
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => consentMutation.mutate({ 
                      essential: true, 
                      analytics: false, 
                      marketing: false 
                    })}
                  >
                    Opt Out
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Marketing Communications</h4>
                    <p className="text-sm text-gray-600">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => consentMutation.mutate({ 
                      essential: true, 
                      analytics: true, 
                      marketing: false 
                    })}
                  >
                    Opt Out
                  </Button>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You can change these preferences at any time. Essential services 
                  cannot be disabled as they are required for account functionality.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Activity Log
              </CardTitle>
              <CardDescription>
                Recent security-related activities on your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLog?.events.length ? (
                <div className="space-y-3">
                  {auditLog.events.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">
                            {formatEventType(event.eventType)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(event.timestamp).toLocaleDateString()} at{" "}
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={event.success ? "default" : "destructive"} className="bg-green-100 text-green-800">
                        {event.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No security events recorded
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}