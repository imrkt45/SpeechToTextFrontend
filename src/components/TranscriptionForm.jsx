import { useState } from 'react';
import Modal from './Modal.jsx';
import { LANGUAGES } from '../config.js';

const TranscriptionForm = ({ title, initialValues, submitLabel = 'Save', onSubmit, onClose }) => {
  const [values, setValues] = useState({
    title: initialValues?.title || '',
    content: initialValues?.content || '',
    language: initialValues?.language || 'auto',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.title.trim()) nextErrors.title = 'Title is required';
    else if (values.title.trim().length > 255) nextErrors.title = 'Title must be at most 255 characters';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({ ...values, title: values.title.trim(), content: values.content.trim() });
    } catch (error) {
      setErrors(error.details || {});
      setFormError(error.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={submitting ? () => {} : onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="button button-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="transcription-form" className="button button-primary" disabled={submitting}>
            {submitting ? 'Saving...' : submitLabel}
          </button>
        </>
      }
    >
      <form id="transcription-form" className="form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="alert alert-error">{formError}</div>}
        <label className="field">
          <span>Title</span>
          <input type="text" value={values.title} onChange={update('title')} maxLength={255} autoFocus />
          {errors.title && <small className="field-error">{errors.title}</small>}
        </label>
        <label className="field">
          <span>Language</span>
          <select value={values.language} onChange={update('language')}>
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          {errors.language && <small className="field-error">{errors.language}</small>}
        </label>
        <label className="field">
          <span>Transcript</span>
          <textarea value={values.content} onChange={update('content')} rows={10} />
          {errors.content && <small className="field-error">{errors.content}</small>}
        </label>
      </form>
    </Modal>
  );
};

export default TranscriptionForm;
