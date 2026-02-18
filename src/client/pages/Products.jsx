import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { useShop } from '../contexts/ShopContext';
import { 
  getShopifyProducts, 
  getProductMappings, 
  createProductMapping,
  getBsaleProducts,
  getBsaleVariants,
} from '../services/api';
import { 
  CubeIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { LoadingCard } from '../components/LoadingSpinner';

export default function Products() {
  const { shop } = useShop();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bsaleSearchTerm, setBsaleSearchTerm] = useState('');
  const [selectedBsaleProduct, setSelectedBsaleProduct] = useState(null);
  const [selectedBsaleVariant, setSelectedBsaleVariant] = useState(null);

  // Fetch Shopify products
  const { data: shopifyProducts, isLoading: productsLoading } = useQuery(
    ['shopifyProducts'],
    () => getShopifyProducts({ limit: 50 })
  );

  // Fetch product mappings
  const { data: mappings, isLoading: mappingsLoading, refetch: refetchMappings } = useQuery(
    ['productMappings'],
    () => getProductMappings()
  );

  // Search Bsale products
  const { data: bsaleProducts, isLoading: bsaleLoading, refetch: searchBsale } = useQuery(
    ['bsaleProducts', bsaleSearchTerm],
    () => getBsaleProducts({ name: bsaleSearchTerm, limit: 20 }),
    { enabled: false }
  );

  // Get Bsale variants
  const { data: bsaleVariants, isLoading: variantsLoading } = useQuery(
    ['bsaleVariants', selectedBsaleProduct?.id],
    () => getBsaleVariants(selectedBsaleProduct.id),
    { enabled: !!selectedBsaleProduct }
  );

  // Create mapping mutation
  const mappingMutation = useMutation(createProductMapping, {
    onSuccess: () => {
      toast.success('Product mapped successfully');
      setShowMappingModal(false);
      setSelectedProduct(null);
      setSelectedBsaleProduct(null);
      setSelectedBsaleVariant(null);
      refetchMappings();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create mapping');
    },
  });

  const handleOpenMapping = (product) => {
    setSelectedProduct(product);
    setShowMappingModal(true);
  };

  const handleSearchBsale = () => {
    if (bsaleSearchTerm) {
      searchBsale();
    }
  };

  const handleSelectBsaleProduct = (product) => {
    setSelectedBsaleProduct(product);
  };

  const handleCreateMapping = () => {
    if (!selectedProduct || !selectedBsaleProduct) {
      toast.error('Please select both Shopify and Bsale products');
      return;
    }

    mappingMutation.mutate({
      shopifyProductId: selectedProduct.id,
      shopifyVariantId: selectedProduct.variants?.[0]?.id,
      shopifySku: selectedProduct.variants?.[0]?.sku,
      bsaleProductId: selectedBsaleProduct.id,
      bsaleVariantId: selectedBsaleVariant?.id,
      bsaleSku: selectedBsaleVariant?.code,
      syncStock: true,
      syncPrice: false,
    });
  };

  // Check if product is mapped
  const isProductMapped = (productId) => {
    return mappings?.some(m => m.shopify_product_id === productId);
  };

  // Filter products by search
  const filteredProducts = shopifyProducts?.products?.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.variants?.some(v => v.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Map your Shopify products to Bsale products for document generation and stock sync.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          className="form-input pl-10"
          placeholder="Search products by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsLoading || mappingsLoading ? (
                <tr>
                  <td colSpan={4}>
                    <LoadingCard />
                  </td>
                </tr>
              ) : filteredProducts?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts?.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center">
                        {product.images?.[0]?.src && (
                          <img 
                            src={product.images[0].src} 
                            alt={product.title}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{product.title}</p>
                          <p className="text-xs text-gray-500">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {product.variants?.[0]?.sku || '-'}
                    </td>
                    <td>
                      {isProductMapped(product.id) ? (
                        <span className="badge-success">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Mapped
                        </span>
                      ) : (
                        <span className="badge-gray">Not mapped</span>
                      )}
                    </td>
                    <td className="text-right">
                      {isProductMapped(product.id) ? (
                        <button className="btn-secondary btn-sm">
                          Edit Mapping
                        </button>
                      ) : (
                        <button 
                          className="btn-primary btn-sm"
                          onClick={() => handleOpenMapping(product)}
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Map to Bsale
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mapping Modal */}
      {showMappingModal && (
        <div className="modal">
          <div className="modal-overlay" onClick={() => setShowMappingModal(false)} />
          <div className="modal-content max-w-2xl">
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">Map Product to Bsale</h3>
              <button 
                className="btn-icon"
                onClick={() => setShowMappingModal(false)}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body space-y-6">
              {/* Shopify Product */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Shopify Product</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedProduct?.title}</p>
                  <p className="text-sm text-gray-500">SKU: {selectedProduct?.variants?.[0]?.sku || 'N/A'}</p>
                </div>
              </div>

              {/* Bsale Product Search */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Search Bsale Product</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="form-input flex-1"
                    placeholder="Search by name or code..."
                    value={bsaleSearchTerm}
                    onChange={(e) => setBsaleSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchBsale()}
                  />
                  <button 
                    className="btn-secondary"
                    onClick={handleSearchBsale}
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Bsale Products List */}
              {bsaleProducts?.items?.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bsaleProducts.items.map((product) => (
                    <button
                      key={product.id}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        selectedBsaleProduct?.id === product.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectBsaleProduct(product)}
                    >
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">Code: {product.code || 'N/A'}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Bsale Variants */}
              {bsaleVariants?.items?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Select Variant (Optional)</h4>
                  <select 
                    className="form-input"
                    value={selectedBsaleVariant?.id || ''}
                    onChange={(e) => {
                      const variant = bsaleVariants.items.find(v => v.id === parseInt(e.target.value));
                      setSelectedBsaleVariant(variant);
                    }}
                  >
                    <option value="">Default product</option>
                    {bsaleVariants.items.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name || variant.code} - Stock: {variant.stock || 0}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowMappingModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateMapping}
                disabled={mappingMutation.isLoading || !selectedBsaleProduct}
              >
                {mappingMutation.isLoading ? 'Saving...' : 'Create Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}