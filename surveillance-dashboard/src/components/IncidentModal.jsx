import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle = {
  background: '#fff',
  width: 'min(960px, 92vw)',
  maxHeight: '90vh',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  color: '#111827'
};

const headerStyle = {
  padding: '14px 18px',
  borderBottom: '1px solid #eee',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

const titleStyle = { fontSize: 18, fontWeight: 600 };

const closeBtnStyle = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 22,
  lineHeight: 1,
  padding: 6,
  borderRadius: 6
};

const contentStyle = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr',
  gap: 16,
  padding: 16,
  overflow: 'auto'
};

const snapshotWrapperStyle = {
  background: '#f6f7f9',
  borderRadius: 10,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 240,
  border: '1px solid #eef0f4'
};

const snapshotStyle = { width: '100%', height: '100%', objectFit: 'contain' };

const metaSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14
};

const sectionTitleStyle = { fontWeight: 600, color: '#111827' };

const metaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  columnGap: 12,
  rowGap: 8,
  alignItems: 'start'
};

const chipListStyle = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const chipStyle = {
  background: '#eef2ff',
  color: '#3730a3',
  border: '1px solid #c7d2fe',
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600
};

function formatTimestamp(value) {
  if (!value) return '—';
  try {
    const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  } catch (_) {
    return String(value);
  }
}

function normalizeInvolvedIds(involved) {
  if (!involved) return [];
  if (Array.isArray(involved)) {
    return involved.map((item) => {
      if (item == null) return 'null';
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      if (typeof item === 'object') {
        if (item.id != null) return String(item.id);
        if (item.name != null) return String(item.name);
        const keys = Object.keys(item);
        if (keys.length > 0) return `${keys[0]}:${String(item[keys[0]])}`;
        return 'object';
      }
      return String(item);
    });
  }
  if (typeof involved === 'object') {
    return Object.values(involved).map((v) => String(v));
  }
  return [String(involved)];
}

export default function IncidentModal({ isOpen, onClose, incident, title }) {
  const dialogTitle = title || 'Incident Details';

  useEffect(() => {
    if (!isOpen) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const metadata = useMemo(() => {
    const data = incident || {};
    const excludeKeys = new Set([
      'snapshot',
      'snapshotUrl',
      'imageUrl',
      'thumbnail',
      'involvedIds',
      'participants',
      'entities',
      'title',
      'type',
      'id'
    ]);
    const entries = Object.entries(data)
      .filter(([key]) => !excludeKeys.has(key))
      .map(([key, value]) => {
        let displayValue = value;
        if (key.toLowerCase().includes('time') || key.toLowerCase().includes('date')) {
          displayValue = formatTimestamp(value);
        } else if (typeof value === 'boolean') {
          displayValue = value ? 'Yes' : 'No';
        } else if (typeof value === 'object' && value !== null) {
          displayValue = JSON.stringify(value);
        }
        return [key, displayValue];
      });
    return entries;
  }, [incident]);

  const involvedChips = useMemo(() => {
    const fromKnown = incident?.involvedIds || incident?.participants || incident?.entities;
    return normalizeInvolvedIds(fromKnown);
  }, [incident]);

  const snapshotSrc = incident?.snapshotUrl || incident?.snapshot || incident?.imageUrl || incident?.thumbnail;

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="incident-modal-title" onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={titleStyle} id="incident-modal-title">
            {incident?.title || incident?.type || `${dialogTitle}${incident?.id ? ` • ${incident.id}` : ''}`}
          </div>
          <button aria-label="Close" style={closeBtnStyle} onClick={onClose}>
            ×
          </button>
        </div>
        <div style={contentStyle}>
          <div style={snapshotWrapperStyle}>
            {snapshotSrc ? (
              <img src={snapshotSrc} alt="Incident snapshot" style={snapshotStyle} />
            ) : (
              <div style={{ color: '#6b7280', fontSize: 14 }}>No snapshot available</div>
            )}
          </div>
          <div style={metaSectionStyle}>
            <div>
              <div style={sectionTitleStyle}>Metadata</div>
              <div style={metaGridStyle}>
                <div style={{ color: '#6b7280' }}>ID</div>
                <div>{incident?.id ?? '—'}</div>
                {incident?.type ? (
                  <>
                    <div style={{ color: '#6b7280' }}>Type</div>
                    <div>{incident.type}</div>
                  </>
                ) : null}
                {metadata.length === 0 ? (
                  <>
                    <div style={{ color: '#6b7280' }}>Info</div>
                    <div>—</div>
                  </>
                ) : (
                  metadata.map(([key, value]) => (
                    <React.Fragment key={key}>
                      <div style={{ color: '#6b7280' }}>{key}</div>
                      <div>{String(value)}</div>
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>

            <div>
              <div style={sectionTitleStyle}>Involved IDs</div>
              {involvedChips.length > 0 ? (
                <div style={chipListStyle}>
                  {involvedChips.map((label, idx) => (
                    <span key={`${label}-${idx}`} style={chipStyle}>{label}</span>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#6b7280' }}>None</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

IncidentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  incident: PropTypes.object,
  title: PropTypes.string
};

IncidentModal.defaultProps = {
  incident: undefined,
  title: undefined
};


