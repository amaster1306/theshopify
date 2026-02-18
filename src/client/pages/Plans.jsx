import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { useShop, usePlanStatus } from '../contexts/ShopContext';
import { getPlans, getSubscription, createCheckout, cancelSubscription } from '../services/api';
import { 
  CreditCardIcon,
  CheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { LoadingCard } from '../components/LoadingSpinner';

export default function Plans() {
  const { shop, refetchShop } = useShop();
  const { isTrial, trialDaysRemaining, isActive, isPastDue, isCancelled } = usePlanStatus();
  const [billingInterval, setBillingInterval] = useState('monthly');

  // Fetch plans
  const { data: plans, isLoading: plansLoading } = useQuery(
    ['plans'],
    () => getPlans()
  );

  // Fetch current subscription
  const { data: subscription, isLoading: subLoading } = useQuery(
    ['subscription'],
    () => getSubscription()
  );

  // Checkout mutation
  const checkoutMutation = useMutation(
    ({ planSlug, interval }) => createCheckout(planSlug, interval),
    {
      onSuccess: (data) => {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to start checkout');
      },
    }
  );

  // Cancel mutation
  const cancelMutation = useMutation(cancelSubscription, {
    onSuccess: () => {
      toast.success('Subscription cancelled');
      refetchShop();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });

  const handleSelectPlan = (planSlug) => {
    checkoutMutation.mutate({ planSlug, interval: billingInterval });
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const currentPlanId = subscription?.planId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mt-2 text-sm text-gray-500">
          Select the plan that best fits your business needs.
        </p>
      </div>

      {/* Current Plan Status */}
      {(isTrial || isActive || isPastDue || isCancelled) && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
                <p className="text-sm text-gray-500">
                  {subscription?.plan?.name || 'Free Trial'}
                </p>
              </div>
              <div className="text-right">
                {isTrial && (
                  <p className="text-sm text-yellow-600">
                    {trialDaysRemaining} days remaining in trial
                  </p>
                )}
                {isActive && (
                  <span className="badge-success">Active</span>
                )}
                {isPastDue && (
                  <span className="badge-error">Past Due</span>
                )}
                {isCancelled && (
                  <span className="badge-gray">Cancelled</span>
                )}
              </div>
            </div>
            {isActive && (
              <button 
                className="btn-secondary btn-sm mt-4"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isLoading}
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              billingInterval === 'monthly'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setBillingInterval('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              billingInterval === 'yearly'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setBillingInterval('yearly')}
          >
            Yearly <span className="text-green-600">(Save 17%)</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const price = billingInterval === 'yearly' ? plan.price_yearly : plan.price_monthly;
            
            return (
              <div 
                key={plan.id}
                className={`card relative ${plan.is_popular ? 'ring-2 ring-indigo-600' : ''}`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white">
                      <StarIcon className="w-3 h-3 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="card-body">
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>

                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(price, plan.currency)}
                    </span>
                    <span className="text-gray-500">/{billingInterval === 'yearly' ? 'year' : 'month'}</span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                      {plan.max_orders_per_month || 'Unlimited'} orders/month
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                      {plan.max_documents_per_month || 'Unlimited'} documents/month
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                      {plan.features?.document_types?.join(', ')} support
                    </li>
                    {plan.features?.stock_sync_enabled && (
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                        Stock synchronization
                      </li>
                    )}
                    {plan.features?.priority_support && (
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                        Priority support
                      </li>
                    )}
                    {plan.features?.custom_branding && (
                      <li className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                        Custom branding
                      </li>
                    )}
                  </ul>

                  <button
                    className={`w-full mt-6 ${
                      isCurrentPlan
                        ? 'btn-secondary cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                    onClick={() => handleSelectPlan(plan.slug)}
                    disabled={isCurrentPlan || checkoutMutation.isLoading}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAQ */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Can I change plans later?</h4>
            <p className="text-sm text-gray-500 mt-1">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">What happens if I exceed my limits?</h4>
            <p className="text-sm text-gray-500 mt-1">
              You will be notified when approaching your limits. You can upgrade your plan or wait for the next billing cycle.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Is there a free trial?</h4>
            <p className="text-sm text-gray-500 mt-1">
              Yes! All new installations get a 14-day free trial with full access to all features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}