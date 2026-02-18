import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { useShop } from '../contexts/ShopContext';
import { configureBsale, getBsaleBranches, getBsaleWarehouses } from '../services/api';
import { 
  KeyIcon, 
  BuildingStorefrontIcon, 
  BuildingOfficeIcon,
  CubeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function Setup() {
  const navigate = useNavigate();
  const { shop, refetchShop } = useShop();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    apiToken: '',
    companyId: '',
    branchId: '',
    warehouseId: '',
  });
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Configure Bsale mutation
  const configMutation = useMutation(configureBsale, {
    onSuccess: (data) => {
      toast.success('Bsale configured successfully!');
      refetchShop();
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to configure Bsale');
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = async () => {
    if (!formData.apiToken) {
      toast.error('Please enter your Bsale API token');
      return;
    }

    try {
      const branchesData = await getBsaleBranches();
      setBranches(branchesData.items || []);
      setStep(2);
      toast.success('Connection successful!');
    } catch (error) {
      toast.error('Failed to connect to Bsale. Please check your API token.');
    }
  };

  const handleBranchSelect = async (branchId) => {
    setFormData(prev => ({ ...prev, branchId }));
    
    try {
      const warehousesData = await getBsaleWarehouses(branchId);
      setWarehouses(warehousesData.items || []);
      setStep(3);
    } catch (error) {
      toast.error('Failed to load warehouses');
    }
  };

  const handleWarehouseSelect = (warehouseId) => {
    setFormData(prev => ({ ...prev, warehouseId }));
    setStep(4);
  };

  const handleComplete = () => {
    configMutation.mutate({
      apiToken: formData.apiToken,
      companyId: formData.companyId,
      branchId: formData.branchId,
      warehouseId: formData.warehouseId,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Bsale Integration</h1>
          <p className="mt-2 text-gray-600">
            Let's set up your Bsale account to start generating documents and syncing stock.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${s <= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {s < step ? <CheckCircleIcon className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-1 ${s < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="card">
          <div className="card-body">
            {/* Step 1: API Token */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <KeyIcon className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-lg font-medium text-gray-900">Enter your Bsale API Token</h2>
                </div>
                
                <div className="form-group">
                  <label className="form-label">API Token</label>
                  <input
                    type="password"
                    name="apiToken"
                    value={formData.apiToken}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Your Bsale API access token"
                  />
                  <p className="form-hint">
                    You can find your API token in Bsale Settings {">"} API Access
                  </p>
                </div>

                <button
                  onClick={handleTestConnection}
                  className="btn-primary w-full"
                >
                  Test Connection
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}

            {/* Step 2: Select Branch */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <BuildingOfficeIcon className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-lg font-medium text-gray-900">Select your Branch</h2>
                </div>

                <div className="space-y-2">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => handleBranchSelect(branch.id)}
                      className="w-full p-4 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{branch.name}</p>
                      <p className="text-sm text-gray-500">ID: {branch.id}</p>
                    </button>
                  ))}
                </div>

                {branches.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No branches found. Please check your Bsale configuration.
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Select Warehouse */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <BuildingStorefrontIcon className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-lg font-medium text-gray-900">Select your Warehouse</h2>
                </div>

                <div className="space-y-2">
                  {warehouses.map((warehouse) => (
                    <button
                      key={warehouse.id}
                      onClick={() => handleWarehouseSelect(warehouse.id)}
                      className="w-full p-4 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{warehouse.name}</p>
                      <p className="text-sm text-gray-500">ID: {warehouse.id}</p>
                    </button>
                  ))}
                </div>

                {warehouses.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No warehouses found for this branch.
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <CubeIcon className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-lg font-medium text-gray-900">Configuration Complete!</h2>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-700">
                      Your Bsale account is ready to be connected.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Branch ID:</span> {formData.branchId}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Warehouse ID:</span> {formData.warehouseId}
                  </p>
                </div>

                <button
                  onClick={handleComplete}
                  disabled={configMutation.isLoading}
                  className="btn-primary w-full"
                >
                  {configMutation.isLoading ? 'Saving...' : 'Complete Setup'}
                  {!configMutation.isLoading && <CheckCircleIcon className="w-4 h-4 ml-2" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Help Link */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Need help?{' '}
          <a href="#" className="text-indigo-600 hover:text-indigo-500">
            View our setup guide
          </a>
        </p>
      </div>
    </div>
  );
}