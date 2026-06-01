import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { requestService } from '../../services/requestService';
import { uploadService } from '../../services/uploadService';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { CATEGORIES } from '../../utils/constants';
import { FiSend, FiZap, FiImage, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './CreateRequest.css';

const PHASE = { FORM: 'form', PROCESSING: 'processing', SUCCESS: 'success' };

export default function CreateRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['request', 'common']);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(PHASE.FORM);
  const [createdId, setCreatedId] = useState(null);
  
  // Custom states for Dual-Mode Image/AI reference
  const [imageSourceType, setImageSourceType] = useState('AI');
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const [form, setForm] = useState({ title: '', description: '', budget: '', category: CATEGORIES[0] });

  const isRtl = i18n.language === 'ar';

  const categoryOptions = CATEGORIES.map(cat => ({
    value: cat,
    label: t('common:categories.' + cat, cat)
  }));

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setUploadFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        toast.error(t('request:createRequest.onlyImages', 'Only image files are allowed'));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget) return toast.error(t('request:createRequest.fillRequired', 'Fill all required fields'));
    if (Number(form.budget) < 1) return toast.error(t('request:createRequest.budgetMin', 'Budget must be at least $1 USD'));
    if (imageSourceType === 'Upload' && !uploadFile) return toast.error(t('request:createRequest.uploadRequired', 'Please upload a reference image'));

    setLoading(true);
    
    try {
      let uploadedUrl = null;
      if (imageSourceType === 'Upload') {
        const uploadRes = await uploadService.uploadImage(uploadFile);
        if (!uploadRes.ok || !uploadRes.imageUrl) {
          throw new Error(t('request:createRequest.uploadFailed', 'Image upload failed'));
        }
        uploadedUrl = uploadRes.imageUrl;
      }

      if (imageSourceType === 'AI') {
        setPhase(PHASE.PROCESSING);
      }

      const res = await requestService.create({
        buyer_id: user.id,
        title: form.title,
        description: form.description,
        budget: form.budget,
        category: form.category,
        imageSourceType,
        uploadedImageUrl: uploadedUrl,
        requestDate: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });

      const newId = res.data?.request?.id;
      setCreatedId(newId);

      if (imageSourceType === 'AI') {
        setTimeout(() => {
          setPhase(PHASE.SUCCESS);
        }, 2200);
      } else {
        setPhase(PHASE.SUCCESS);
      }
    } catch (err) {
      toast.error(err.message || t('request:createRequest.failedCreate', 'Failed to create request'));
      setPhase(PHASE.FORM);
    } finally {
      setLoading(false);
    }
  };

  // ── Processing Animation ──
  if (phase === PHASE.PROCESSING) {
    return (
      <div className="create-request-processing-container">
        <div>
          <div className="processing-icon-wrapper">
            <FiZap size={36} />
          </div>
          <h2 className="processing-title">{t('request:createRequest.aiMagicTitle', 'AI is working its magic ✨')}</h2>
          <p className="processing-desc">
            {t('request:createRequest.aiMagicDesc', 'Your request has been saved. Our AI is enhancing your description and generating visual previews for artisans...')}
          </p>

          {/* Step indicators */}
          <div className="processing-steps-list">
            {[
              { icon: FiCheckCircle, label: t('request:createRequest.stepSaved', 'Request saved successfully'), done: true },
              { icon: FiZap, label: t('request:createRequest.stepEnhancing', 'Enhancing description with AI...'), done: false, active: true },
              { icon: FiImage, label: t('request:createRequest.stepPreviews', 'Generating visual previews...'), done: false },
            ].map((step, i) => {
              const statusClass = step.done ? 'done' : step.active ? 'active' : 'pending';
              return (
                <div key={i} className={`processing-step-row ${statusClass}`} style={{
                  animation: step.active ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}>
                  <div className={`processing-step-icon ${statusClass}`}>
                    <step.icon />
                  </div>
                  <span className={`processing-step-label ${statusClass}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Success State ──
  if (phase === PHASE.SUCCESS) {
    return (
      <div className="create-request-success-container">
        <div className="success-icon-wrapper">
          <FiCheckCircle size={36} />
        </div>
        <h2 className="success-title">{t('request:createRequest.successTitle', 'Request Created Successfully! 🎉')}</h2>
        <p className="success-desc">
          {imageSourceType === 'AI' 
            ? t('request:createRequest.successDescAI', 'Your custom request is live. AI-generated visual previews will appear shortly.')
            : t('request:createRequest.successDescUpload', 'Your custom request is live with your reference image.')}
        </p>
        <div className="success-actions">
          <Button onClick={() => navigate(`/requests/${createdId}`)} size="lg">
            {t('request:createRequest.viewRequest', 'View Request')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/requests')} size="lg">
            {t('request:myRequests', 'My Requests')}
          </Button>
        </div>
      </div>
    );
  }

  // ── Form State ──
  return (
    <div className="create-request-container">
      <div className="create-request-header">
        <h1 className="create-request-title">{t('request:createRequest.title', 'Create Custom Request')}</h1>
        
        {/* Mode Selector */}
        <div className="create-request-mode-wrapper">
          <label className="create-request-mode-label">{t('request:createRequest.referenceType', 'Reference Type *')}</label>
          <div className="create-request-mode-grid">
            <button
              type="button"
              onClick={() => {
                setImageSourceType('AI');
                setUploadFile(null);
                setPreviewUrl('');
              }}
              className={`create-request-mode-btn ${imageSourceType === 'AI' ? 'active' : ''}`}
            >
              <FiZap /> {t('request:createRequest.aiMode', 'AI Generation Mode')}
            </button>
            <button
              type="button"
              onClick={() => setImageSourceType('Upload')}
              className={`create-request-mode-btn ${imageSourceType === 'Upload' ? 'active' : ''}`}
            >
              <FiImage /> {t('request:createRequest.imageMode', 'Reference Image Mode')}
            </button>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="create-request-form">
        <Input label={t('request:createRequest.titleLabel', 'Title *')} placeholder={t('request:createRequest.titlePlaceholder', 'E.g., Custom ceramic vase')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <Select label={t('request:createRequest.categoryLabel', 'Category *')} options={categoryOptions} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required />
        <TextArea
          label={t('request:createRequest.descLabel', 'Description *')}
          placeholder={t('request:createRequest.descPlaceholder', 'Describe your ideal product...')}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={5}
          required
        />
        <Input type="number" min="1" step="0.01" label={t('request:createRequest.budgetLabel', 'Budget (USD) *')} placeholder={t('request:createRequest.budgetPlaceholder', 'Enter your budget')} value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} required />

        {imageSourceType === 'Upload' ? (
          <div className="create-request-dropzone-wrapper">
            <label className="create-request-dropzone-label">{t('request:createRequest.refImageLabel', 'Reference Image *')}</label>
            <div
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`create-request-dropzone ${dragActive ? 'drag-active' : ''}`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              
              {previewUrl ? (
                <div className="dropzone-preview-container">
                  <img src={previewUrl} alt="Preview" className="dropzone-preview-img" />
                  <span className="dropzone-preview-filename">{uploadFile?.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadFile(null);
                      setPreviewUrl('');
                    }}
                    className="dropzone-remove-btn"
                  >
                    {t('request:createRequest.removeImage', 'Remove Image')}
                  </button>
                </div>
              ) : (
                <div className="dropzone-placeholder-container">
                  <div className="dropzone-icon-wrapper">
                    <FiImage size={20} />
                  </div>
                  <div>
                    <p>{t('request:createRequest.dragDrop', 'Drag and drop your reference image here')}</p>
                    <p>{t('request:createRequest.orBrowse', 'or click to browse')}</p>
                  </div>
                  <span>{t('request:createRequest.imageFormat', 'Supports JPG, PNG, WEBP')}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="create-request-ai-infobox">
            <FiZap className="create-request-ai-infobox-icon" />
            <p>
              <strong>{t('request:createRequest.aiPowered', 'AI-Powered')}:</strong> {t('request:createRequest.aiPoweredDesc', 'Describe what you want...')}
            </p>
          </div>
        )}

        <Button type="submit" loading={loading} size="lg" icon={FiSend}>{t('request:create', 'Submit Request')}</Button>
      </form>
    </div>
  );
}
