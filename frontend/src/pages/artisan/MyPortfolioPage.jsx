import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { portfolioService } from '../../services/portfolioService';
import { galleryService } from '../../services/galleryService';
import { uploadService } from '../../services/uploadService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import ImageUploader from '../../components/ui/ImageUploader';
import Spinner from '../../components/ui/Spinner';
import {
  FiPlus, FiTrash2, FiEdit3, FiImage, FiChevronLeft,
  FiChevronRight, FiX, FiEye, FiLayers, FiCalendar, FiUser,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './Portfolio.css';

const API_BASE = import.meta.env.VITE_API_URL || '${API_BASE}';

/* ─── VIEWS ─────────────────────────────────────── */
const VIEW = { LIST: 'list', CREATE: 'create', DETAIL: 'detail', EDIT: 'edit' };

export default function MyPortfolioPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['dashboard']);
  const isRtl = i18n.language === 'ar';

  const [projects, setProjects] = useState([]);
  const [projectImages, setProjectImages] = useState({}); // { projectId: [images] }
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(VIEW.LIST);
  const [selectedProject, setSelectedProject] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* ─── Fetch Projects + Cover Images ──────────── */
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await portfolioService.getByArtisan(user.id);
      const projs = res.data?.projects || [];
      setProjects(projs);

      // Fetch gallery images for each project
      const imgMap = {};
      await Promise.all(projs.map(async (p) => {
        try {
          const gRes = await galleryService.getByProject(p.id);
          imgMap[p.id] = gRes.data?.gallery || [];
        } catch {
          imgMap[p.id] = [];
        }
      }));
      setProjectImages(imgMap);
    } catch {
      toast.error(t('dashboard:portfolio.failedLoad', 'Failed to load portfolio'));
    } finally {
      setLoading(false);
    }
  }, [user.id, t]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  /* ─── Navigate to Detail ─────────────────────── */
  const openDetail = (project) => {
    setSelectedProject(project);
    setView(VIEW.DETAIL);
  };

  /* ─── Delete ─────────────────────────────────── */
  const handleDelete = async (projectId) => {
    try {
      await portfolioService.delete(projectId);
      toast.success(t('dashboard:portfolio.projectDeleted', 'Project deleted'));
      setConfirmDelete(null);
      if (view === VIEW.DETAIL) setView(VIEW.LIST);
      fetchProjects();
    } catch {
      toast.error(t('dashboard:portfolio.failedDelete', 'Failed to delete project'));
    }
  };

  /* ─── After Create / Edit ────────────────────── */
  const handleSaved = () => {
    setView(VIEW.LIST);
    setSelectedProject(null);
    fetchProjects();
  };

  if (loading) return <Spinner />;

  return (
    <div className="portfolio-page">
      {/* ─── LIST VIEW ──────────────────────────── */}
      {view === VIEW.LIST && (
        <>
          <div className="portfolio-header">
            <div>
              <h1>{t('dashboard:portfolio.title', 'My Portfolio')}</h1>
              <p>{t('dashboard:portfolio.subtitle', 'Showcase your finest craftwork and attract buyers')}</p>
            </div>
            <div className="portfolio-actions">
              <Button onClick={() => setView(VIEW.CREATE)} icon={FiPlus}>{t('dashboard:portfolio.addNew', 'Add New Project')}</Button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="portfolio-empty">
              <FiLayers className="portfolio-empty-icon" />
              <h3>{t('dashboard:portfolio.noProjectsTitle', 'No portfolio projects yet')}</h3>
              <p>{t('dashboard:portfolio.noProjectsSubtitle', 'Create your first project to showcase your artisan craft to buyers')}</p>
              <Button onClick={() => setView(VIEW.CREATE)} icon={FiPlus}>{t('dashboard:portfolio.createFirst', 'Create First Project')}</Button>
            </div>
          ) : (
            <div className="portfolio-grid">
              {projects.map(p => {
                const imgs = projectImages[p.id] || [];
                const cover = imgs.length > 0
                  ? `${API_BASE}${imgs[0].Image}`
                  : null;

                return (
                  <div key={p.id} className="portfolio-card" onClick={() => openDetail(p)}>
                    <div className="portfolio-card-img-wrap">
                      {cover ? (
                        <img src={cover} alt={p.projectName} className="portfolio-card-img" />
                      ) : (
                        <div className="portfolio-card-img-placeholder">
                          <FiImage />
                        </div>
                      )}
                      {imgs.length > 1 && (
                        <span className="portfolio-card-img-count" style={{ [isRtl ? 'left' : 'right']: 10, [isRtl ? 'right' : 'left']: 'auto' }}>
                          <FiImage size={11} /> {imgs.length}
                        </span>
                      )}
                    </div>
                    <div className="portfolio-card-body">
                      <h3 className="portfolio-card-title">{p.projectName}</h3>
                      <p className="portfolio-card-desc">{p.description || t('dashboard:portfolio.noDesc', 'No description provided.')}</p>
                    </div>
                    <div className="portfolio-card-footer">
                      <span>{t('dashboard:portfolio.imageCount', { count: imgs.length, defaultValue: imgs.length === 1 ? '1 image' : '{{count}} images' })}</span>
                      <div className="portfolio-card-footer-actions">
                        <button
                          className="portfolio-card-action"
                          title={t('dashboard:portfolio.edit', 'Edit')}
                          onClick={(e) => { e.stopPropagation(); setSelectedProject(p); setView(VIEW.EDIT); }}
                        >
                          <FiEdit3 size={13} />
                        </button>
                        <button
                          className="portfolio-card-action portfolio-card-action--danger"
                          title={t('dashboard:portfolio.delete', 'Delete')}
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id); }}
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── CREATE VIEW ────────────────────────── */}
      {view === VIEW.CREATE && (
        <ProjectForm
          onBack={() => setView(VIEW.LIST)}
          onSaved={handleSaved}
          artisanId={user.id}
        />
      )}

      {/* ─── DETAIL VIEW ────────────────────────── */}
      {view === VIEW.DETAIL && selectedProject && (
        <ProjectDetail
          project={selectedProject}
          images={projectImages[selectedProject.id] || []}
          onBack={() => { setView(VIEW.LIST); setSelectedProject(null); }}
          onEdit={() => setView(VIEW.EDIT)}
          onDelete={() => setConfirmDelete(selectedProject.id)}
        />
      )}

      {/* ─── EDIT VIEW ──────────────────────────── */}
      {view === VIEW.EDIT && selectedProject && (
        <ProjectForm
          project={selectedProject}
          existingImages={projectImages[selectedProject.id] || []}
          onBack={() => { setView(selectedProject ? VIEW.DETAIL : VIEW.LIST); }}
          onSaved={handleSaved}
          artisanId={user.id}
        />
      )}

      {/* ─── Delete Confirmation ────────────────── */}
      {confirmDelete && (
        <div className="portfolio-confirm-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="portfolio-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>{t('dashboard:portfolio.confirmDeleteTitle', 'Delete Project')}</h3>
            <p>{t('dashboard:portfolio.confirmDeleteText', 'Are you sure you want to delete this project? This will permanently remove the project and all its images. This action cannot be undone.')}</p>
            <div className="portfolio-confirm-actions">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>{t('dashboard:portfolio.cancel', 'Cancel')}</Button>
              <Button style={{ background: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => handleDelete(confirmDelete)}>{t('dashboard:portfolio.deleteProjectBtn', 'Delete Project')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROJECT DETAIL COMPONENT
   ═══════════════════════════════════════════════════ */
function ProjectDetail({ project, images, onBack, onEdit, onDelete }) {
  const { t, i18n } = useTranslation(['dashboard']);
  const isRtl = i18n.language === 'ar';
  const [currentIdx, setCurrentIdx] = useState(0);
  const API = import.meta.env.VITE_API_URL || '${API_BASE}';

  const prev = () => setCurrentIdx(i => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrentIdx(i => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="portfolio-detail">
      <Button variant="ghost" onClick={onBack} icon={isRtl ? FiChevronRight : FiChevronLeft} style={{ marginBottom: 20 }}>
        {t('dashboard:portfolio.backToPortfolio', 'Back to Portfolio')}
      </Button>

      {/* Image Gallery */}
      {images.length > 0 ? (
        <>
          <div className="portfolio-detail-hero">
            <img
              src={`${API}${images[currentIdx].Image}`}
              alt={images[currentIdx].Caption || project.projectName}
              key={currentIdx}
            />
            {images.length > 1 && (
              <>
                <button className="portfolio-detail-hero-nav portfolio-detail-hero-nav--prev" onClick={prev}>
                  {isRtl ? <FiChevronRight /> : <FiChevronLeft />}
                </button>
                <button className="portfolio-detail-hero-nav portfolio-detail-hero-nav--next" onClick={next}>
                  {isRtl ? <FiChevronLeft /> : <FiChevronRight />}
                </button>
                <div className="portfolio-detail-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`portfolio-detail-dot ${i === currentIdx ? 'portfolio-detail-dot--active' : ''}`}
                      onClick={() => setCurrentIdx(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="portfolio-detail-thumbs">
              {images.map((img, i) => (
                <div
                  key={img.Image_id}
                  className={`portfolio-detail-thumb ${i === currentIdx ? 'portfolio-detail-thumb--active' : ''}`}
                  onClick={() => setCurrentIdx(i)}
                >
                  <img src={`${API}${img.Image}`} alt={img.Caption || ''} />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ height: 300, background: 'var(--surface-secondary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 48, marginBottom: 24 }}>
          <FiImage />
        </div>
      )}

      {/* Project Info */}
      <div className="portfolio-detail-meta">
        <h1 className="portfolio-detail-title">{project.projectName}</h1>
        <p className="portfolio-detail-desc">{project.description || t('dashboard:portfolio.noDesc', 'No description provided.')}</p>

        <div className="portfolio-detail-info">
          <div className="portfolio-detail-info-item">
            <FiImage size={14} /> {t('dashboard:portfolio.imageCount', { count: images.length, defaultValue: images.length === 1 ? '1 image' : '{{count}} images' })}
          </div>
          <div className="portfolio-detail-info-item">
            <FiUser size={14} /> {project.artisanName || `Artisan #${project.artisan_id}`}
          </div>
        </div>

        <div className="portfolio-detail-actions">
          <Button onClick={onEdit} icon={FiEdit3}>{t('dashboard:portfolio.editProject', 'Edit Project')}</Button>
          <Button variant="ghost" onClick={onDelete} style={{ color: 'var(--error)' }} icon={FiTrash2}>{t('dashboard:portfolio.delete', 'Delete')}</Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROJECT FORM (CREATE + EDIT)
   ═══════════════════════════════════════════════════ */
function ProjectForm({ project, existingImages = [], onBack, onSaved, artisanId }) {
  const { t, i18n } = useTranslation(['dashboard']);
  const isRtl = i18n.language === 'ar';
  const isEdit = Boolean(project);
  const API = import.meta.env.VITE_API_URL || '${API_BASE}';

  const [form, setForm] = useState({
    projectName: project?.projectName || '',
    description: project?.description || '',
  });
  const [images, setImages] = useState([]);
  const [keptImages, setKeptImages] = useState(
    existingImages.map(img => ({
      id: `existing-${img.Image_id}`,
      dbId: img.Image_id,
      preview: `${API}${img.Image}`,
      url: img.Image,
      existing: true,
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const allImages = [...keptImages, ...images];

  const validate = () => {
    const e = {};
    if (!form.projectName.trim()) e.projectName = t('dashboard:portfolio.nameRequired', 'Project name is required');
    if (!form.description.trim()) e.description = t('dashboard:portfolio.descRequired', 'Description is required');
    if (allImages.length === 0) e.images = t('dashboard:portfolio.imgRequired', 'At least one image is required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      let projectId = project?.id;

      // Create or update project
      if (isEdit) {
        await portfolioService.update(projectId, {
          projectName: form.projectName,
          description: form.description,
        });
      } else {
        const res = await portfolioService.create({
          projectName: form.projectName,
          description: form.description,
          artisan_id: artisanId,
        });
        projectId = res.data?.project?.id;
        if (!projectId) throw new Error(t('dashboard:portfolio.failedSave', 'Failed to save project'));
      }

      // Handle image deletions (removed existing images)
      if (isEdit) {
        const keptDbIds = new Set(keptImages.filter(i => i.existing).map(i => i.dbId));
        const toDelete = existingImages.filter(img => !keptDbIds.has(img.Image_id));
        for (const img of toDelete) {
          await galleryService.delete(img.Image_id).catch(() => {});
        }
      }

      // Upload new images
      for (const img of images) {
        if (img.file) {
          const uploadRes = await uploadService.uploadImage(img.file);
          const imageUrl = uploadRes.imageUrl;
          if (imageUrl) {
            await galleryService.create({
              project_id: projectId,
              Image: imageUrl,
              Caption: form.projectName,
            });
          }
        }
      }

      toast.success(isEdit ? t('dashboard:portfolio.projectUpdated', 'Project updated!') : t('dashboard:portfolio.projectCreated', 'Project created!'));
      onSaved();
    } catch (err) {
      console.error('Portfolio save error:', err);
      toast.error(err?.message || t('dashboard:portfolio.failedSave', 'Failed to save project'));
    } finally {
      setSubmitting(false);
    }
  };

  const removeKeptImage = (id) => {
    setKeptImages(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div>
      <Button variant="ghost" onClick={onBack} icon={isRtl ? FiChevronRight : FiChevronLeft} style={{ marginBottom: 20 }}>
        {isEdit ? t('dashboard:portfolio.backToProject', 'Back to Project') : t('dashboard:portfolio.backToPortfolio', 'Back to Portfolio')}
      </Button>

      <form onSubmit={handleSubmit} className="portfolio-form">
        <h2>{isEdit ? t('dashboard:portfolio.editProject', 'Edit Project') : t('dashboard:portfolio.createTitle', 'Create New Project')}</h2>

        <div className="portfolio-form-fields">
          <Input
            label={t('dashboard:portfolio.projectNameLabel', 'Project Name')}
            value={form.projectName}
            onChange={e => setForm({ ...form, projectName: e.target.value })}
            error={errors.projectName}
            placeholder={t('dashboard:portfolio.projectNamePlaceholder', 'e.g. Egyptian Heritage Collection')}
            required
          />

          <TextArea
            label={t('dashboard:portfolio.descriptionLabel', 'Description')}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            error={errors.description}
            placeholder={t('dashboard:portfolio.descriptionPlaceholder', 'Describe this project, the materials used, inspiration, and craftsmanship details...')}
            rows={5}
            required
          />

          {/* Existing images (edit mode) */}
          {keptImages.length > 0 && (
            <div>
              <label className="img-uploader-label">{t('dashboard:portfolio.currentImages', 'Current Images')}</label>
              <div className="img-uploader-previews" style={{ marginTop: 8 }}>
                {keptImages.map((img, idx) => (
                  <div key={img.id} className="img-uploader-preview">
                    <img src={img.preview} alt={`Existing ${idx + 1}`} className="img-uploader-thumb" />
                    <button
                      type="button"
                      className="img-uploader-remove"
                      style={{ opacity: 1 }}
                      onClick={() => removeKeptImage(img.id)}
                      title={t('dashboard:portfolio.delete', 'Delete')}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ImageUploader
            images={images}
            onImagesChange={setImages}
            maxFiles={8 - keptImages.length}
            required={keptImages.length === 0}
            error={errors.images}
            label={isEdit ? t('dashboard:portfolio.addMoreImages', 'Add More Images') : t('dashboard:portfolio.projectImages', 'Project Images')}
          />
        </div>

        <div className="portfolio-form-actions">
          <Button variant="ghost" type="button" onClick={onBack}>{t('dashboard:portfolio.cancel', 'Cancel')}</Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? t('dashboard:portfolio.saveChanges', 'Save Changes') : t('dashboard:portfolio.createProject', 'Create Project')}
          </Button>
        </div>
      </form>
    </div>
  );
}
