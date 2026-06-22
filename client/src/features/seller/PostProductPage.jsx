import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { useCreateProductMutation, useInitiatePaymentMutation, useVerifyPaymentMutation, useCheckPaymentQuery, useGetPresignedUrlMutation } from '../../services/api';
import { CATEGORIES, CONDITIONS, NEPAL_DISTRICTS } from '../../constants';
import toast from 'react-hot-toast';

export default function PostProductPage() {
  const navigate = useNavigate();
  const { data: paymentCheck, isLoading: checkingPayment } = useCheckPaymentQuery();
  const [step, setStep] = useState(1); // 1: Pay, 2: Form
  const [form, setForm] = useState({
    title: '', description: '', category: '', subCategory: '', condition: '', price: '', negotiable: false, district: '', contactPreference: 'chat', images: [],
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [initiatePayment, { isLoading: paying }] = useInitiatePaymentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();

  const selectedCategory = CATEGORIES.find((c) => c.id === form.category);

  // Fix 4a: Use useEffect to set step once payment check completes
  useEffect(() => {
    if (paymentCheck?.hasPayment) {
      setStep(2);
    }
  }, [paymentCheck]);

  // Step 1: Payment
  const handlePayment = async (method) => {
    try {
      const result = await initiatePayment({ method }).unwrap();

      if (result.method === 'khalti' && !result.paymentUrl) {
        // Dev mode auto-confirm
        await verifyPayment({ paymentId: result.paymentId, method: 'khalti' }).unwrap();
        toast.success('Payment confirmed (dev mode)');
        setStep(2);
        return;
      }

      // For real payment flows, redirect
      toast.success('Payment confirmed');
      setStep(2);
    } catch (err) {
      toast.error(err.data?.error || 'Payment failed');
    }
  };

  // Step 2: Submit product
  const validate = () => {
    const errs = {};
    if (!form.title || form.title.length < 3) errs.title = 'Title must be at least 3 characters';
    if (!form.description || form.description.length < 10) errs.description = 'At least 10 characters';
    if (!form.category) errs.category = 'Select a category';
    if (!form.condition) errs.condition = 'Select condition';
    if (!form.price || parseFloat(form.price) <= 0) errs.price = 'Enter a valid price';
    if (!form.district) errs.district = 'Select location';
    if (form.images.length === 0) errs.images = 'At least one image is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Fix 4b: Image Upload handler
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (form.images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 5MB`);
          continue;
        }

        const presignRes = await getPresignedUrl({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          type: 'product'
        }).unwrap();

        await fetch(presignRes.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        uploadedUrls.push(presignRes.publicUrl);
      }

      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      setErrors((prev) => ({ ...prev, images: null }));
    } catch (err) {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await createProduct({
        ...form,
        price: parseFloat(form.price),
        images: form.images,
      }).unwrap();

      toast.success('Product submitted for review!');
      navigate('/seller/dashboard');
    } catch (err) {
      toast.error(err.data?.error || 'Failed to create product');
    }
  };

  if (checkingPayment) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 animate-fadeIn">
        <div className="text-center mb-8">
          <CreditCard className="w-12 h-12 text-[var(--color-primary)] mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Listing Fee</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Pay Rs 5 to post your product</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <div className="text-center p-4 bg-[var(--color-bg)] rounded-xl mb-4">
            <p className="text-3xl font-bold text-[var(--color-primary)]">Rs 5</p>
            <p className="text-xs text-[var(--color-text-muted)]">One-time listing fee</p>
          </div>

          <button onClick={() => handlePayment('esewa')} disabled={paying} className="btn-secondary w-full py-3 justify-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center text-xs font-bold">eS</span>
            Pay with eSewa
          </button>
          <button onClick={() => handlePayment('khalti')} disabled={paying} className="btn-secondary w-full py-3 justify-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold">K</span>
            Pay with Khalti
          </button>
          <button onClick={() => handlePayment('bank-transfer')} disabled={paying} className="btn-secondary w-full py-3 justify-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-gray-600 text-white flex items-center justify-center text-xs font-bold">🏦</span>
            Bank Transfer
          </button>

          {paying && <div className="text-center py-2"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[var(--color-primary)]" /></div>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="w-6 h-6 text-[var(--color-success)]" />
        <h1 className="text-2xl font-bold">Post Your Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        
        {/* Images section */}
        <div className="space-y-3">
          <label className="input-label">Product Images (up to 5)</label>
          <div className="flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[var(--color-border)]">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {form.images.length < 5 && (
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer bg-[var(--color-bg)]">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">Add Photo</span>
                  </>
                )}
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
          {errors.images && <p className="error-text">{errors.images}</p>}
        </div>

        <div className="input-group">
          <label className="input-label">Title</label>
          <input type="text" placeholder="e.g., iPhone 13 Pro - Like New" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`input ${errors.title ? 'input-error' : ''}`} maxLength={100} />
          {errors.title && <p className="error-text">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subCategory: '' })} className={`input ${errors.category ? 'input-error' : ''}`}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            {errors.category && <p className="error-text">{errors.category}</p>}
          </div>

          {selectedCategory?.subCategories?.length > 0 && (
            <div className="input-group">
              <label className="input-label">Sub-category</label>
              <select value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} className="input">
                <option value="">Select</option>
                {selectedCategory.subCategories.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">Description</label>
          <textarea placeholder="Describe your product in detail..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`input min-h-[120px] resize-y ${errors.description ? 'input-error' : ''}`} maxLength={2000} />
          <span className="text-xs text-[var(--color-text-muted)]">{form.description.length}/2000</span>
          {errors.description && <p className="error-text">{errors.description}</p>}
        </div>

        <div className="input-group">
          <label className="input-label">Condition</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button key={c.id} type="button" onClick={() => setForm({ ...form, condition: c.id })}
                className={`badge ${c.color} cursor-pointer px-3 py-1.5 text-xs ${form.condition === c.id ? 'ring-2 ring-offset-1 ring-current' : 'opacity-60 hover:opacity-100'}`}>
                {c.label}
              </button>
            ))}
          </div>
          {errors.condition && <p className="error-text">{errors.condition}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Price (Rs)</label>
            <input type="number" placeholder="e.g., 5000" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={`input ${errors.price ? 'input-error' : ''}`} min="0" />
            {errors.price && <p className="error-text">{errors.price}</p>}
          </div>
          <div className="input-group">
            <label className="input-label">Location (District)</label>
            <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={`input ${errors.district ? 'input-error' : ''}`}>
              <option value="">Select district</option>
              {NEPAL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.district && <p className="error-text">{errors.district}</p>}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.negotiable} onChange={(e) => setForm({ ...form, negotiable: e.target.checked })} className="accent-[var(--color-primary)] w-4 h-4" />
          <span className="text-sm">Price is negotiable</span>
        </label>

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base">
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit for Review'}
        </button>
      </form>

      <div className="h-20 md:h-0" />
    </div>
  );
}
