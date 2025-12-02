import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Lock,
  Shield,
  Clock,
  Receipt,
  Download,
  RefreshCw,
  X,
  Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { paymentMethodsApi, paymentsApi, billingSettingsApi } from "../services/api";

interface PaymentMethod {
  id: string;
  type: "card" | "ach" | "paypal" | "bank" | "wire";
  details: string;
  isDefault: boolean;
  expiry?: string;
  accountNumber?: string;
  accountHolderName?: string;
  bankName?: string;
  routingNumber?: string;
  accountType?: "checking" | "savings";
  swiftCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Transaction {
  id: string;
  date: string | Date;
  description: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "refunded";
  method: string;
  reference?: string;
  sessionId?: string;
  currency?: string;
}

const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"methods" | "history" | "billing">(
    "methods"
  );

  // Fetch payment methods from backend
  const { data: paymentMethods = [], isLoading: isLoadingMethods } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => paymentMethodsApi.getPaymentMethods(),
  });

  // Fetch transactions from backend
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => paymentsApi.getTransactions({ limit: 100 }),
  });

  const transactions: Transaction[] = transactionsData?.transactions || [];

  // Fetch billing settings from backend
  const { data: billingSettings, isLoading: isLoadingBillingSettings } = useQuery({
    queryKey: ["billingSettings"],
    queryFn: () => billingSettingsApi.getBillingSettings(),
  });

  // Billing settings state
  const [billingFormData, setBillingFormData] = useState({
    billingName: "",
    billingEmail: "",
    billingAddress: "",
    monthlyInvoices: true,
    autoPayment: false,
  });

  // Update form data when billing settings are loaded
  React.useEffect(() => {
    if (billingSettings) {
      setBillingFormData({
        billingName: billingSettings.billingName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        billingEmail: billingSettings.billingEmail || user?.email || "",
        billingAddress: billingSettings.billingAddress || "",
        monthlyInvoices: billingSettings.monthlyInvoices ?? true,
        autoPayment: billingSettings.autoPayment ?? false,
      });
    }
  }, [billingSettings, user]);

  // Update billing settings mutation
  const updateBillingSettingsMutation = useMutation({
    mutationFn: (settings: {
      billingName?: string;
      billingEmail?: string;
      billingAddress?: string;
      monthlyInvoices?: boolean;
      autoPayment?: boolean;
    }) => billingSettingsApi.updateBillingSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billingSettings"] });
      alert("Billing settings updated successfully");
    },
    onError: (error: any) => {
      alert(error.message || "Failed to update billing settings");
    },
  });

  const handleBillingSettingsSave = async () => {
    await updateBillingSettingsMutation.mutateAsync(billingFormData);
  };

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({
    type: "card" as PaymentMethod["type"],
    details: "",
    expiry: "",
    // Bank account fields (USA standards)
    accountNumber: "",
    accountHolderName: "",
    bankName: "",
    routingNumber: "",
    accountType: "checking" as "checking" | "savings",
    swiftCode: "",
  });

  // Mutations
  const createPaymentMethodMutation = useMutation({
    mutationFn: (methodData: {
      type: "card" | "ach" | "paypal" | "bank" | "wire";
      details: string;
      expiry?: string;
      accountNumber?: string;
      accountHolderName?: string;
      bankName?: string;
      routingNumber?: string;
      accountType?: "checking" | "savings";
      swiftCode?: string;
      isDefault?: boolean;
    }) => paymentMethodsApi.createPaymentMethod(methodData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      setShowAddMethod(false);
      setNewMethod({
        type: "card",
        details: "",
        expiry: "",
        accountNumber: "",
        accountHolderName: "",
        bankName: "",
        routingNumber: "",
        accountType: "checking",
        swiftCode: "",
      });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to add payment method");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => paymentMethodsApi.setDefaultPaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to set default payment method");
    },
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: (id: string) => paymentMethodsApi.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to delete payment method");
    },
  });

  const handleAddPaymentMethod = async () => {
    // Validation based on payment type
    if (newMethod.type === "card") {
      if (!newMethod.details.trim() || !newMethod.expiry.trim()) {
        alert("Card number and expiry date are required");
        return;
      }
    } else if (newMethod.type === "bank" || newMethod.type === "ach" || newMethod.type === "wire") {
      if (
        !newMethod.accountNumber.trim() ||
        !newMethod.accountHolderName.trim() ||
        !newMethod.bankName.trim() ||
        !newMethod.routingNumber.trim()
      ) {
        alert("All bank account fields are required");
        return;
      }
      if (newMethod.routingNumber.length !== 9) {
        alert("Routing number must be 9 digits");
        return;
      }
    } else {
      if (!newMethod.details.trim()) {
        alert("PayPal email is required");
        return;
      }
    }

    // Format details for display
    const formattedDetails =
      newMethod.type === "card"
        ? `•••• •••• •••• ${newMethod.details.slice(-4)}`
        : newMethod.type === "bank" || newMethod.type === "ach" || newMethod.type === "wire"
        ? `${newMethod.bankName} - ••••${newMethod.accountNumber.slice(-4)}`
        : newMethod.details;

    await createPaymentMethodMutation.mutateAsync({
      type: newMethod.type,
      details: formattedDetails,
      expiry: newMethod.expiry || undefined,
      accountNumber: newMethod.accountNumber || undefined,
      accountHolderName: newMethod.accountHolderName || undefined,
      bankName: newMethod.bankName || undefined,
      routingNumber: newMethod.routingNumber || undefined,
      accountType: newMethod.accountType || undefined,
      swiftCode: newMethod.swiftCode || undefined,
      isDefault: paymentMethods.length === 0,
    });
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultMutation.mutateAsync(id);
  };

  const handleDeleteMethod = async (id: string) => {
    if (paymentMethods.length <= 1) {
      alert("You must have at least one payment method.");
      return;
    }
    if (confirm("Are you sure you want to delete this payment method?")) {
      await deletePaymentMethodMutation.mutateAsync(id);
    }
  };

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "failed":
        return "text-red-600";
    }
  };

  const getMethodIcon = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "card":
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case "ach":
        return <Building2 className="h-5 w-5 text-green-600" />;
      case "paypal":
        return <Shield className="h-5 w-5 text-blue-500" />;
      case "bank":
        return <Building2 className="h-5 w-5 text-green-600" />;
      case "wire":
        return <Receipt className="h-5 w-5 text-purple-600" />;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalSpent = isLoadingTransactions
    ? 0
    : transactions
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment & Billing
          </h1>
          <p className="text-gray-600">
            Manage your payment methods and view transaction history
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Spent</div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalSpent.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {paymentMethods.length}
          </div>
          <div className="text-sm text-gray-600">Payment Methods</div>
        </div>
        <div className="card text-center">
          <Receipt className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {isLoadingTransactions ? "..." : transactions.filter((t) => t.status === "completed").length}
            </div>
            <div className="text-sm text-gray-600">Completed Transactions</div>
          </div>
          <div className="card text-center">
            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {isLoadingTransactions ? "..." : transactions.filter((t) => t.status === "pending").length}
            </div>
          <div className="text-sm text-gray-600">Pending Transactions</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: "methods", label: "Payment Methods", icon: CreditCard },
              { id: "history", label: "Transaction History", icon: Receipt },
              { id: "billing", label: "Billing Settings", icon: DollarSign },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Payment Methods Tab */}
        {activeTab === "methods" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Your Payment Methods
              </h3>
              <button
                onClick={() => setShowAddMethod(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Method</span>
              </button>
            </div>

            {isLoadingMethods ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading payment methods...</p>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No payment methods added yet.</p>
                <p className="text-sm mt-1">Click "Add Method" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getMethodIcon(method.type)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {method.details}
                          </div>
                          {method.expiry && (
                            <div className="text-sm text-gray-600">
                              Expires {method.expiry}
                            </div>
                          )}
                          {method.isDefault && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!method.isDefault && (
                          <button
                            onClick={() => handleSetDefault(method.id)}
                            disabled={setDefaultMutation.isPending}
                            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMethod(method.id)}
                          disabled={deletePaymentMethodMutation.isPending}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Secure Payments</h4>
                  <p className="text-blue-700 text-sm mt-1">
                    All payment information is encrypted and secure. We never
                    store your full card details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Transaction History
              </h3>
              <button className="btn-secondary flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>

            {isLoadingTransactions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No transactions found.</p>
                <p className="text-sm mt-1">Your transaction history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                <div key={transaction.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(transaction.status)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(transaction.date)} • {transaction.method}
                        </div>
                        {transaction.reference && (
                          <div className="text-xs text-gray-500">
                            Ref: {transaction.reference}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        ${transaction.amount.toFixed(2)}
                      </div>
                      <div
                        className={`text-sm font-medium ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  ${totalSpent.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {transactions.filter((t) => t.status === "completed").length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {transactions.filter((t) => t.status === "pending").length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        )}

        {/* Billing Settings Tab */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {isLoadingBillingSettings ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading billing settings...</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Billing Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Name
                      </label>
                      <input
                        type="text"
                        value={billingFormData.billingName}
                        onChange={(e) =>
                          setBillingFormData({
                            ...billingFormData,
                            billingName: e.target.value,
                          })
                        }
                        className="input-field"
                        placeholder="Enter billing name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={billingFormData.billingEmail}
                        onChange={(e) =>
                          setBillingFormData({
                            ...billingFormData,
                            billingEmail: e.target.value,
                          })
                        }
                        className="input-field"
                        placeholder="Enter billing email"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billing Address
                    </label>
                    <textarea
                      rows={4}
                      value={billingFormData.billingAddress}
                      onChange={(e) =>
                        setBillingFormData({
                          ...billingFormData,
                          billingAddress: e.target.value,
                        })
                      }
                      className="input-field"
                      placeholder="Enter your billing address..."
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Billing Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          Monthly Invoices
                        </div>
                        <div className="text-sm text-gray-600">
                          Receive monthly billing summaries
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={billingFormData.monthlyInvoices}
                          onChange={(e) =>
                            setBillingFormData({
                              ...billingFormData,
                              monthlyInvoices: e.target.checked,
                            })
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          Auto Payment
                        </div>
                        <div className="text-sm text-gray-600">
                          Automatically charge default payment method
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={billingFormData.autoPayment}
                          onChange={(e) =>
                            setBillingFormData({
                              ...billingFormData,
                              autoPayment: e.target.checked,
                            })
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={handleBillingSettingsSave}
                    disabled={updateBillingSettingsMutation.isPending}
                    className="btn-primary"
                  >
                    {updateBillingSettingsMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Payment Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold">Add Payment Method</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddMethod(false);
                  setNewMethod({
                    type: "card",
                    details: "",
                    expiry: "",
                    accountNumber: "",
                    accountHolderName: "",
                    bankName: "",
                    routingNumber: "",
                    accountType: "checking",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type
                </label>
                <select
                  value={newMethod.type}
                  onChange={(e) =>
                    setNewMethod({
                      ...newMethod,
                      type: e.target.value as PaymentMethod["type"],
                    })
                  }
                  className="input-field"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="ach">ACH Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank">Bank Account (Direct Deposit)</option>
                  <option value="wire">Wire Transfer</option>
                </select>
              </div>

              {newMethod.type === "card" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMethod.details}
                      onChange={(e) =>
                        setNewMethod({
                          ...newMethod,
                          details: e.target.value.replace(/\D/g, "").slice(0, 16),
                        })
                      }
                      placeholder="1234 5678 9012 3456"
                      className="input-field"
                      maxLength={16}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date (MM/YY) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMethod.expiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2, 4);
                        }
                        setNewMethod({ ...newMethod, expiry: value });
                      }}
                      placeholder="12/25"
                      className="input-field"
                      maxLength={5}
                      required
                    />
                  </div>
                </>
              ) : newMethod.type === "bank" || newMethod.type === "ach" || newMethod.type === "wire" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMethod.accountHolderName}
                      onChange={(e) =>
                        setNewMethod({
                          ...newMethod,
                          accountHolderName: e.target.value,
                        })
                      }
                      placeholder="John Doe"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMethod.accountNumber}
                      onChange={(e) =>
                        setNewMethod({
                          ...newMethod,
                          accountNumber: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="1234567890"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMethod.bankName}
                      onChange={(e) =>
                        setNewMethod({
                          ...newMethod,
                          bankName: e.target.value,
                        })
                      }
                      placeholder="Chase Bank"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Routing Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMethod.routingNumber}
                      onChange={(e) =>
                        setNewMethod({
                          ...newMethod,
                          routingNumber: e.target.value.replace(/\D/g, "").slice(0, 9),
                        })
                      }
                      placeholder="123456789"
                      className="input-field"
                      maxLength={9}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      9-digit routing number (ABA routing number)
                    </p>
                  </div>
                  {newMethod.type !== "wire" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newMethod.accountType}
                        onChange={(e) =>
                          setNewMethod({
                            ...newMethod,
                            accountType: e.target.value as "checking" | "savings",
                          })
                        }
                        className="input-field"
                        required
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>
                  )}
                  {newMethod.type === "wire" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SWIFT Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={newMethod.swiftCode}
                        onChange={(e) =>
                          setNewMethod({
                            ...newMethod,
                            swiftCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11),
                          })
                        }
                        placeholder="CHASUS33"
                        className="input-field"
                        maxLength={11}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Required for international wire transfers
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PayPal Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newMethod.details}
                    onChange={(e) =>
                      setNewMethod({ ...newMethod, details: e.target.value })
                    }
                    placeholder="your.email@tutorlink.com"
                    className="input-field"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMethod(false);
                    setNewMethod({
                      type: "card",
                      details: "",
                      expiry: "",
                      accountNumber: "",
                      accountHolderName: "",
                      bankName: "",
                      routingNumber: "",
                      accountType: "checking",
                      swiftCode: "",
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  className="btn-primary"
                  disabled={
                    createPaymentMethodMutation.isPending ||
                    (newMethod.type === "card"
                      ? !newMethod.details.trim() || !newMethod.expiry.trim()
                      : newMethod.type === "bank" || newMethod.type === "ach" || newMethod.type === "wire"
                      ? !newMethod.accountNumber.trim() ||
                        !newMethod.accountHolderName.trim() ||
                        !newMethod.bankName.trim() ||
                        !newMethod.routingNumber.trim() ||
                        newMethod.routingNumber.length !== 9
                      : !newMethod.details.trim())
                  }
                >
                  {createPaymentMethodMutation.isPending ? "Adding..." : "Add Method"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
