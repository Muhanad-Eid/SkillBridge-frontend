import { type FormEvent, useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, FileCheck2, ShieldCheck, Waypoints } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import DataState from "../../../shared/components/DataState";
import type { EvidenceReviewOutcome, EvidenceReviewRequest } from "../domain/evidenceTypes";
import {
  getPublicEvidenceReviewRequestAsync,
  submitPublicEvidenceReviewAsync,
} from "../infrastructure/evidenceApi";
import "./PublicEvidenceReviewRequestPage.css";

const outcomes: { value: EvidenceReviewOutcome; label: string; description: string }[] = [
  { value: "Verified", label: "Verified", description: "The evidence supports the requested review." },
  { value: "NeedsClarification", label: "Needs clarification", description: "The evidence is present, but the claim or context needs clarification." },
  { value: "InsufficientEvidence", label: "Insufficient evidence", description: "The available proof does not support a conclusion." },
];

export default function PublicEvidenceReviewRequestPage() {
  const { token = "" } = useParams();
  const [request, setRequest] = useState<EvidenceReviewRequest | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [outcome, setOutcome] = useState<EvidenceReviewOutcome>("Verified");
  const [response, setResponse] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let active = true;
    void getPublicEvidenceReviewRequestAsync(token)
      .then((result) => {
        if (!active) return;
        setRequest(result);
        setAnswers(Object.fromEntries(result.questions.map((question) => [question, ""])));
      })
      .catch((caughtError) => active && setLoadError(caughtError instanceof Error ? caughtError.message : "This review request is unavailable."))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [token]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const result = await submitPublicEvidenceReviewAsync(token, {
        reviewerName: reviewerName.trim(),
        outcome,
        response: response.trim(),
        answers: request.questions.map((question) => ({
          question,
          answer: answers[question]?.trim() ?? "",
        })),
      });
      setRequest(result);
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : "Unable to submit this review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || loadError || !request) {
    return <DataState isLoading={isLoading} error={loadError} empty={!isLoading && !loadError && !request} emptyTitle="Review request unavailable" emptyDescription="This link may have expired or the evidence is no longer active." />;
  }

  const boundary = request.card.claimBoundary;

  return (
    <main className="public-review-page">
      <header className="public-review-topbar">
        <Link to="/" className="public-review-brand"><span>SB</span> SkillBridge</Link>
        <div><ShieldCheck size={16} aria-hidden="true" /> External evidence review</div>
      </header>

      <section className="public-review-hero">
        <div>
          <p>Evidence Review Request</p>
          <h1>Review a bounded work claim.</h1>
          <span>Requested for {request.card.opportunityTitle} by {request.card.providerName}.</span>
        </div>
        <aside>
          <span>Proof receipt</span>
          <strong>{request.card.proofReceipt?.fingerprint ?? "Verified evidence record"}</strong>
          <small>{request.card.proofReceipt ? `${request.card.proofReceipt.verifiedCheckpoints}/${request.card.proofReceipt.totalCheckpoints} checkpoints verified` : "Issued evidence"}</small>
        </aside>
      </section>

      <section className="public-review-layout">
        <div className="public-review-main">
          <section className="public-review-brief">
            <span>Review brief</span>
            <h2>{request.purpose}</h2>
            <ol>{request.questions.map((question) => <li key={question}>{question}</li>)}</ol>
          </section>

          <section className="public-review-boundary">
            <header><FileCheck2 size={20} aria-hidden="true" /><div><span>Claim Boundary</span><h2>What this record can prove</h2></div></header>
            <p className="public-review-context">{boundary.context}</p>
            <div className="public-review-boundary-grid">
              <article className="supported"><span>Supported by this evidence</span><ul>{boundary.supportedCriteria.length ? boundary.supportedCriteria.map((item) => <li key={item}>{item}</li>) : <li>No criterion claims are available.</li>}</ul></article>
              <article className="unsupported"><span>Not supported by this evidence</span><ul>{boundary.unsupportedOptionalCriteria.length ? boundary.unsupportedOptionalCriteria.map((item) => <li key={item}>{item}</li>) : <li>No additional claims are made.</li>}</ul></article>
            </div>
            <p className="public-review-limit">{boundary.limitation}</p>
          </section>

          <section className="public-review-trace">
            <header><Waypoints size={20} aria-hidden="true" /><div><span>Evidence Trace</span><h2>What was verified before this card issued</h2></div></header>
            <ol>{request.card.trace.length ? request.card.trace.map((entry) => <li key={`${entry.sortOrder}-${entry.sourceType}`}><span>{entry.sortOrder}</span><div><strong>{entry.sourceType}</strong><small>{entry.sourceReference} · {entry.status}</small></div></li>) : <li className="public-review-trace-empty">The issued evidence record has no public trace entries.</li>}</ol>
          </section>
        </div>

        <aside className="public-review-response">
          {request.status === "Completed" ? (
            <section className="public-review-complete">
              <CheckCircle2 size={26} aria-hidden="true" />
              <span>Review recorded</span>
              <h2>{request.outcome}</h2>
              <div className="public-review-completed-answers">{request.answers.map((answer, index) => <article key={answer.question}><strong>{index + 1}. {answer.question}</strong><p>{answer.answer}</p></article>)}</div>
              <p>{request.response}</p>
              <small>Submitted by {request.reviewerName} on {request.respondedAt ? new Date(request.respondedAt).toLocaleString() : "this session"}.</small>
            </section>
          ) : (
            <form onSubmit={submitReview}>
              <header><ClipboardCheck size={21} aria-hidden="true" /><div><span>Your response</span><h2>Record an independent view</h2></div></header>
              <label><span>Your name</span><input value={reviewerName} required maxLength={120} onChange={(event) => setReviewerName(event.target.value)} placeholder="Name or organisation" /></label>
              <fieldset><legend>Outcome</legend>{outcomes.map((item) => <label key={item.value}><input type="radio" name="outcome" checked={outcome === item.value} onChange={() => setOutcome(item.value)} /><span><strong>{item.label}</strong><small>{item.description}</small></span></label>)}</fieldset>
              <div className="public-review-questionnaire"><span>Requested questions</span>{request.questions.map((question, index) => <label key={question}><strong>{index + 1}. {question}</strong><textarea value={answers[question] ?? ""} required minLength={3} maxLength={1000} onChange={(event) => setAnswers((current) => ({ ...current, [question]: event.target.value }))} placeholder="Record your evidence-based answer." /></label>)}</div>
              <label><span>Review notes</span><textarea value={response} required minLength={10} maxLength={1500} onChange={(event) => setResponse(event.target.value)} placeholder="Explain what the evidence does or does not establish." /></label>
              {submitError ? <p className="public-review-error">{submitError}</p> : null}
              <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Recording review..." : "Submit review"}</button>
            </form>
          )}
        </aside>
      </section>
    </main>
  );
}
