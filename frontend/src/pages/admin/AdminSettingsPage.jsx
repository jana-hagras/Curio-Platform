import { useState } from 'react';
import {
  FiSettings, FiShield, FiAlertTriangle, FiActivity,
  FiSave, FiToggleLeft, FiToggleRight, FiInfo
} from 'react-icons/fi';
import './AdminTable.css';
import './AdminSettings.css';

const TABS = [
  { id: 'marketplace', label: 'Marketplace Logic', icon: FiSettings },
  { id: 'security',    label: 'Security',           icon: FiShield },
  { id: 'content',     label: 'Content Policy',     icon: FiAlertTriangle },
  { id: 'health',      label: 'System Health',      icon: FiActivity },
];

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-info">
        <span className="settings-toggle-label">{label}</span>
        {description && <span className="settings-toggle-desc">{description}</span>}
      </div>
      <button
        className={`settings-toggle-btn ${checked ? 'on' : 'off'}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        title={checked ? 'Disable' : 'Enable'}
      >
        {checked ? <FiToggleRight /> : <FiToggleLeft />}
        <span>{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}

function InfoBadge({ text }) {
  return (
    <span className="settings-info-badge">
      <FiInfo style={{ marginRight: 4, flexShrink: 0 }} />
      {text}
    </span>
  );
}

function SettingField({ label, description, children }) {
  return (
    <div className="settings-field">
      <div className="settings-field-label">{label}</div>
      {description && <div className="settings-field-desc">{description}</div>}
      <div className="settings-field-control">{children}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [saved, setSaved] = useState(false);

  // ── Marketplace Logic state ──
  const [mktSettings, setMktSettings] = useState({
    commissionRate: 10,
    minPrice: 1,
    maxPrice: 10000,
    allowGuestBrowsing: true,
    requireArtisanVerification: false,
    autoCloseRequests: true,
    requestExpiryDays: 30,
    enableApplicationLimit: false,
    maxApplicationsPerRequest: 10,
  });

  // ── Security state ──
  const [secSettings, setSecSettings] = useState({
    maxLoginAttempts: 5,
    sessionTimeoutMins: 60,
    requireEmailVerification: false,
    enableTwoFactor: false,
    ipRateLimit: true,
    maxRequestsPerMinute: 100,
  });

  // ── Content Policy state ──
  const [contentSettings, setContentSettings] = useState({
    autoModerateProfanity: true,
    requireImageForProduct: false,
    maxImagesPerProduct: 5,
    minReviewLength: 10,
    allowAnonymousReviews: false,
    enableReviewModeration: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setMkt = (key) => (val) => setMktSettings(s => ({ ...s, [key]: val }));
  const setSec = (key) => (val) => setSecSettings(s => ({ ...s, [key]: val }));
  const setContent = (key) => (val) => setContentSettings(s => ({ ...s, [key]: val }));

  // ── System Health data (read-only display) ──
  const healthStats = [
    { label: 'API Status',       value: 'Operational', color: '#10B981', dot: true },
    { label: 'Database',         value: 'Connected',   color: '#10B981', dot: true },
    { label: 'Uptime',           value: '99.8%',       color: '#D4A843' },
    { label: 'Avg Response',     value: '~120ms',      color: '#8B5CF6' },
    { label: 'Last Deploy',      value: 'Just now',    color: 'var(--text-secondary)' },
    { label: 'Node Environment', value: 'development', color: 'var(--text-secondary)' },
  ];

  return (
    <div className="admin-table-page settings-page">
      {/* Header */}
      <div className="admin-table-header">
        <div>
          <h1>Settings</h1>
          <p className="admin-table-count">Configure marketplace behaviour, security rules, and content policies</p>
        </div>
        {activeTab !== 'health' && (
          <button className={`settings-save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
            <FiSave />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MARKETPLACE LOGIC ── */}
      {activeTab === 'marketplace' && (
        <div className="settings-panel">
          <div className="settings-section">
            <h3 className="settings-section-title">Pricing & Commission</h3>
            <SettingField
              label="Platform Commission Rate (%)"
              description="Percentage deducted from each sale before artisan payout."
            >
              <input
                type="number" min={0} max={50} step={0.5}
                className="settings-input"
                value={mktSettings.commissionRate}
                onChange={e => setMkt('commissionRate')(Number(e.target.value))}
              />
            </SettingField>
            <SettingField label="Minimum Product Price (USD)" description="Products below this price cannot be listed.">
              <input
                type="number" min={0}
                className="settings-input"
                value={mktSettings.minPrice}
                onChange={e => setMkt('minPrice')(Number(e.target.value))}
              />
            </SettingField>
            <SettingField label="Maximum Product Price (USD)" description="Cap for product listings.">
              <input
                type="number" min={0}
                className="settings-input"
                value={mktSettings.maxPrice}
                onChange={e => setMkt('maxPrice')(Number(e.target.value))}
              />
            </SettingField>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Marketplace Access</h3>
            <Toggle
              label="Allow Guest Browsing"
              description="Unauthenticated users can view products and artisan profiles."
              checked={mktSettings.allowGuestBrowsing}
              onChange={setMkt('allowGuestBrowsing')}
            />
            <Toggle
              label="Require Artisan Verification Before Listing"
              description="Artisans must be manually verified before their products appear publicly."
              checked={mktSettings.requireArtisanVerification}
              onChange={setMkt('requireArtisanVerification')}
            />
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Custom Requests</h3>
            <Toggle
              label="Auto-Close Expired Requests"
              description="Automatically close open requests after the expiry period."
              checked={mktSettings.autoCloseRequests}
              onChange={setMkt('autoCloseRequests')}
            />
            {mktSettings.autoCloseRequests && (
              <SettingField label="Request Expiry (days)" description="How many days before an open request auto-closes.">
                <input
                  type="number" min={1} max={365}
                  className="settings-input"
                  value={mktSettings.requestExpiryDays}
                  onChange={e => setMkt('requestExpiryDays')(Number(e.target.value))}
                />
              </SettingField>
            )}
            <Toggle
              label="Enable Application Limit per Request"
              description="Cap the number of artisan proposals per custom request."
              checked={mktSettings.enableApplicationLimit}
              onChange={setMkt('enableApplicationLimit')}
            />
            {mktSettings.enableApplicationLimit && (
              <SettingField label="Max Applications per Request" description="Artisans cannot apply once this limit is reached.">
                <input
                  type="number" min={1} max={100}
                  className="settings-input"
                  value={mktSettings.maxApplicationsPerRequest}
                  onChange={e => setMkt('maxApplicationsPerRequest')(Number(e.target.value))}
                />
              </SettingField>
            )}
          </div>
        </div>
      )}

      {/* ── SECURITY ── */}
      {activeTab === 'security' && (
        <div className="settings-panel">
          <div className="settings-section">
            <h3 className="settings-section-title">Authentication</h3>
            <InfoBadge text="These settings take effect on next server restart." />
            <SettingField label="Max Failed Login Attempts" description="Account is temporarily locked after this many failures.">
              <input
                type="number" min={1} max={20}
                className="settings-input"
                value={secSettings.maxLoginAttempts}
                onChange={e => setSec('maxLoginAttempts')(Number(e.target.value))}
              />
            </SettingField>
            <SettingField label="Session Timeout (minutes)" description="Users are logged out after this period of inactivity.">
              <input
                type="number" min={5} max={1440}
                className="settings-input"
                value={secSettings.sessionTimeoutMins}
                onChange={e => setSec('sessionTimeoutMins')(Number(e.target.value))}
              />
            </SettingField>
            <Toggle
              label="Require Email Verification on Registration"
              description="New users must verify their email before accessing the platform."
              checked={secSettings.requireEmailVerification}
              onChange={setSec('requireEmailVerification')}
            />
            <Toggle
              label="Enable Two-Factor Authentication (2FA)"
              description="Prompt users for a one-time code on each login."
              checked={secSettings.enableTwoFactor}
              onChange={setSec('enableTwoFactor')}
            />
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Rate Limiting</h3>
            <Toggle
              label="IP-Based Rate Limiting"
              description="Block IPs that exceed the request threshold."
              checked={secSettings.ipRateLimit}
              onChange={setSec('ipRateLimit')}
            />
            {secSettings.ipRateLimit && (
              <SettingField label="Max Requests per Minute (per IP)" description="Requests beyond this threshold will receive 429 Too Many Requests.">
                <input
                  type="number" min={10} max={1000}
                  className="settings-input"
                  value={secSettings.maxRequestsPerMinute}
                  onChange={e => setSec('maxRequestsPerMinute')(Number(e.target.value))}
                />
              </SettingField>
            )}
          </div>
        </div>
      )}

      {/* ── CONTENT POLICY ── */}
      {activeTab === 'content' && (
        <div className="settings-panel">
          <div className="settings-section">
            <h3 className="settings-section-title">Product Listings</h3>
            <Toggle
              label="Require at Least One Image per Product"
              description="Products without an image cannot be published."
              checked={contentSettings.requireImageForProduct}
              onChange={setContent('requireImageForProduct')}
            />
            <SettingField label="Max Images per Product" description="Gallery image limit for market listings.">
              <input
                type="number" min={1} max={20}
                className="settings-input"
                value={contentSettings.maxImagesPerProduct}
                onChange={e => setContent('maxImagesPerProduct')(Number(e.target.value))}
              />
            </SettingField>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Reviews & Moderation</h3>
            <Toggle
              label="Auto-Moderate Profanity in Reviews"
              description="Flag and hide reviews containing banned words automatically."
              checked={contentSettings.autoModerateProfanity}
              onChange={setContent('autoModerateProfanity')}
            />
            <Toggle
              label="Enable Review Moderation Queue"
              description="New reviews go into a pending queue before they appear publicly."
              checked={contentSettings.enableReviewModeration}
              onChange={setContent('enableReviewModeration')}
            />
            <Toggle
              label="Allow Anonymous Reviews"
              description="Non-buyers can submit reviews (not recommended)."
              checked={contentSettings.allowAnonymousReviews}
              onChange={setContent('allowAnonymousReviews')}
            />
            <SettingField label="Minimum Review Length (characters)" description="Reviews shorter than this are rejected.">
              <input
                type="number" min={0} max={500}
                className="settings-input"
                value={contentSettings.minReviewLength}
                onChange={e => setContent('minReviewLength')(Number(e.target.value))}
              />
            </SettingField>
          </div>
        </div>
      )}

      {/* ── SYSTEM HEALTH ── */}
      {activeTab === 'health' && (
        <div className="settings-panel">
          <div className="settings-section">
            <h3 className="settings-section-title">Live Status</h3>
            <InfoBadge text="This is a read-only snapshot. Full monitoring requires a metrics backend." />
            <div className="settings-health-grid">
              {healthStats.map(stat => (
                <div key={stat.label} className="settings-health-card">
                  <div className="settings-health-label">{stat.label}</div>
                  <div className="settings-health-value" style={{ color: stat.color }}>
                    {stat.dot && (
                      <span className="settings-health-dot" style={{ background: stat.color }} />
                    )}
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Maintenance Actions</h3>
            <div className="settings-action-group">
              <button className="settings-action-btn secondary">
                <FiActivity />
                Run Database Health Check
              </button>
              <button className="settings-action-btn secondary">
                <FiSettings />
                Clear Application Cache
              </button>
              <button className="settings-action-btn danger-outline">
                <FiAlertTriangle />
                Purge Expired Sessions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
