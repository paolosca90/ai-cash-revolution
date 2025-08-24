import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Crown, Calendar, DollarSign } from "lucide-react";

export default function Billing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription, payment methods, and billing history.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge className="bg-purple-100 text-purple-800 mb-2">Premium Plan</Badge>
              <p className="text-2xl font-bold">$79.99/month</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Next billing date</span>
                <span>Jan 24, 2025</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status</span>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Change Plan
            </Button>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
                VISA
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-600">Expires 12/26</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Update Payment Method
            </Button>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Signals Used</span>
                <span className="font-medium">142/200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Trading Accounts</span>
                <span className="font-medium">3/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">API Calls</span>
                <span className="font-medium">1,247</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              View Details
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "Dec 24, 2024", amount: "$79.99", status: "Paid" },
              { date: "Nov 24, 2024", amount: "$79.99", status: "Paid" },
              { date: "Oct 24, 2024", amount: "$79.99", status: "Paid" }
            ].map((invoice, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{invoice.date}</p>
                    <p className="text-sm text-gray-600">Monthly subscription</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{invoice.amount}</p>
                  <Badge variant="default" className="text-xs">
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="outline">View All Invoices</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing Notice */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">💳 Payment Integration Coming Soon</h4>
        <p className="text-blue-700 text-sm">
          We're working on integrating Stripe for seamless payment processing. 
          For now, this is a demo of the billing interface.
        </p>
      </div>
    </div>
  );
}