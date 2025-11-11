"use client";

import React, { useState } from "react";
import { createReport } from "../../services/report";
import { ReportEntityType, ReportReason } from "../../types/report";

interface ReportDialogProps {
  entityType: ReportEntityType;
  entityId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ReportDialog: React.FC<ReportDialogProps> = ({
  entityType,
  entityId,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportReasons: { value: ReportReason; label: string }[] = [
    { value: "spam", label: "Spam" },
    { value: "harassment", label: "Harassment" },
    { value: "hate_speech", label: "Hate Speech" },
    { value: "violence", label: "Violence" },
    { value: "sexual_content", label: "Sexual Content" },
    { value: "misinformation", label: "Misinformation" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createReport(entityType, entityId, reason, description);
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit report";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog className="active" id="report-dialog">
      <h5>Report {entityType}</h5>
      <form onSubmit={handleSubmit}>
        <div className="field label border">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            required
          >
            {reportReasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <label>Reason</label>
        </div>

        <div className="field textarea label border">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide additional details (optional)"
            rows={4}
          />
          <label>Description (Optional)</label>
        </div>

        {error && (
          <div className="padding">
            <article className="border error-container">
              <i>error</i>
              <div>
                <h6 className="small">Error</h6>
                <p>{error}</p>
              </div>
            </article>
          </div>
        )}

        <nav className="right-align">
          <button
            type="button"
            className="border"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <progress className="circle small" />
                <span>Submitting...</span>
              </>
            ) : (
              "Submit Report"
            )}
          </button>
        </nav>
      </form>
    </dialog>
  );
};

export default ReportDialog;
