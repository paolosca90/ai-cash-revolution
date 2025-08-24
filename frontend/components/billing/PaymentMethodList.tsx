import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "@/hooks/useBackend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  CreditCard, 
  Star, 
  Trash2, 
  MoreVertical,
  CheckCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentMethodListProps {
  userId: number;
}

interface PaymentMethod {
  id: number;
  stripePaymentMethodId: string;
  type: string;
  brand?: string;
  lastFour?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export function PaymentMethodList({ userId }: PaymentMethodListProps) {
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: paymentMethods, isLoading, error } = useQuery({
    queryKey: ["paymentMethods", userId],
    queryFn: () => backend.billing.getPaymentMethods({ userId }),
  });

  const removePaymentMethodMutation = useMutation({
    mutationFn: (paymentMethodId: string) => 
      backend.billing.removePaymentMethod({ userId, paymentMethodId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods", userId] });
      toast({
        title: "Payment method removed",
        description: "The payment method has been successfully removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment method",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (paymentMethodId: string) =>
      backend.billing.setDefaultPaymentMethod({ userId, paymentMethodId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods", userId] });
      toast({
        title: "Default payment method updated",
        description: "Your default payment method has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update default payment method",
        variant: "destructive",
      });
    },
  });

  const getCardBrandIcon = (brand?: string) => {
    // You could replace this with actual brand icons
    return <CreditCard className="h-5 w-5" />;
  };

  const formatCardBrand = (brand?: string) => {
    if (!brand) return "Card";
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load payment methods: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const methods = paymentMethods?.paymentMethods || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {methods.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No payment methods added yet</p>
          </div>
        ) : (
          methods.map((method: PaymentMethod) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {getCardBrandIcon(method.brand)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatCardBrand(method.brand)} ending in {method.lastFour}
                    </span>
                    {method.isDefault && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Default
                      </Badge>
                    )}
                  </div>
                  {method.expMonth && method.expYear && (
                    <p className="text-sm text-gray-500">
                      Expires {String(method.expMonth).padStart(2, "0")}/{method.expYear}
                    </p>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!method.isDefault && (
                    <DropdownMenuItem
                      onClick={() => setDefaultMutation.mutate(method.stripePaymentMethodId)}
                      disabled={setDefaultMutation.isPending}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Set as Default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => removePaymentMethodMutation.mutate(method.stripePaymentMethodId)}
                    disabled={removePaymentMethodMutation.isPending}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}