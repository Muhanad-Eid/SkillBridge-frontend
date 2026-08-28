import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, LockKeyhole, Send, Sparkles, TimerReset } from "lucide-react";
import { useParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import { getMyCompanyProjectsAsync } from "../../projects/infrastructure/projectApi";
import type { Project } from "../../projects/domain/projectTypes";
import {
  ProofBriefCheckpointDecisions,
  ProofBriefStatuses,
  ProofBriefSubmissionStatuses,
  type ProofBrief,
  type ProofBriefSubmission,
  type ProofBriefCheckpointDecision,
} from "../domain/proofBriefTypes";
import {
  closeProofBriefAsync,
  getProofBriefAsync,
  getProofBriefSubmissionsAsync,
  publishProofBriefAsync,
  reviewProofBriefAsync,
  saveProofBriefAsync,
} from "../infrastructure/proofBriefApi";
import "./proofBrief.css";

type Draft = { title: string; scenario: string; constraints: string; responseInstructions: string; timeboxMinutes: number; checkpoints: Array<{ title: string; description: string; evidenceCriterionStableKey: string }> };
const emptyDraft = (): Draft => ({ title: "", scenario: "", constraints: "", responseInstructions: "", timeboxMinutes: 45, checkpoints: [{ title: "Clear approach", description: "Explain the first decision and why it fits the scenario.", evidenceCriterionStableKey: "" }] });

function draftFromBrief(brief: ProofBrief): Draft {
  return { title: brief.title, scenario: brief.scenario, constraints: brief.constraints, responseInstructions: brief.responseInstructions, timeboxMinutes: brief.timeboxMinutes, checkpoints: brief.checkpoints.map((item) => ({ title: item.title, description: item.description ?? "", evidenceCriterionStableKey: item.evidenceCriterionStableKey ?? "" })) };
}

function statusLabel(status: number) {
  if (status === ProofBriefStatuses.Published) return "Published";
  if (status === ProofBriefStatuses.Closed) return "Closed";
  return "Draft";
}

function decisionLabel(decision: ProofBriefCheckpointDecision) {
  if (decision === ProofBriefCheckpointDecisions.Demonstrated) return "Demonstrated";
  if (decision === ProofBriefCheckpointDecisions.NeedsClarification) return "Needs clarification";
  if (decision === ProofBriefCheckpointDecisions.NotObserved) return "Not observed";
  return "Not reviewed";
}

export default function ProofBriefWorkspacePage() {
  const numericProjectId = Number(useParams().projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [brief, setBrief] = useState<ProofBrief | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [submissions, setSubmissions] = useState<ProofBriefSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [reviewDecisions, setReviewDecisions] = useState<Record<number, ProofBriefCheckpointDecision>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [providerNote, setProviderNote] = useState("");
  const [isClarification, setIsClarification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!Number.isInteger(numericProjectId) || numericProjectId < 1) { setError("The opportunity ID is invalid."); setIsLoading(false); return; }
    setIsLoading(true); setError("");
    try {
      const [projects, savedBrief] = await Promise.all([
        getMyCompanyProjectsAsync(),
        getProofBriefAsync(numericProjectId).catch(() => null),
      ]);
      const foundProject = projects.items.find((item) => item.id === numericProjectId) ?? null;
      setProject(foundProject);
      setBrief(savedBrief);
      setDraft(savedBrief ? draftFromBrief(savedBrief) : emptyDraft());
      setSubmissions(savedBrief ? await getProofBriefSubmissionsAsync(numericProjectId).catch(() => []) : []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load the Proof Brief workspace."); }
    finally { setIsLoading(false); }
  }, [numericProjectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);
  const selectedSubmission = useMemo(() => submissions.find((item) => item.id === selectedSubmissionId) ?? null, [selectedSubmissionId, submissions]);
  const definitionIssues = useMemo(() => {
    const issues: string[] = [];
    if (!draft.title.trim()) issues.push("a clear title");
    if (!draft.scenario.trim()) issues.push("a bounded scenario");
    if (!draft.constraints.trim()) issues.push("constraints and non-goals");
    if (!draft.responseInstructions.trim()) issues.push("response guidance");
    if (draft.checkpoints.some((checkpoint) => !checkpoint.title.trim())) issues.push("a title for every checkpoint");
    return issues;
  }, [draft]);
  const reviewRemaining = useMemo(() => brief?.checkpoints.filter((checkpoint) => (reviewDecisions[checkpoint.id] ?? ProofBriefCheckpointDecisions.NotReviewed) === ProofBriefCheckpointDecisions.NotReviewed).length ?? 0, [brief, reviewDecisions]);
  const waitingForReview = submissions.filter((submission) => submission.status === ProofBriefSubmissionStatuses.Submitted).length;
  const isClosed = brief?.status === ProofBriefStatuses.Closed;

  function setCheckpoint(index: number, field: "title" | "description" | "evidenceCriterionStableKey", value: string) {
    setDraft((current) => ({ ...current, checkpoints: current.checkpoints.map((checkpoint, checkpointIndex) => checkpointIndex === index ? { ...checkpoint, [field]: value } : checkpoint) }));
  }

  async function saveDraft(publish = false) {
    if (!project) return;
    if (definitionIssues.length > 0) {
      setMessage(`Before ${publish ? "publishing" : "saving"}, add ${definitionIssues.join(", ")}.`);
      return;
    }
    setIsSaving(true); setMessage("");
    try {
      const saved = await saveProofBriefAsync(project.id, {
        ...draft,
        checkpoints: draft.checkpoints.map((checkpoint) => ({ title: checkpoint.title, description: checkpoint.description || undefined, evidenceCriterionStableKey: checkpoint.evidenceCriterionStableKey || undefined })),
      });
      const next = publish ? await publishProofBriefAsync(project.id) : saved;
      setBrief(next); setDraft(draftFromBrief(next)); setMessage(publish ? "Proof Brief published. Applicants can now choose to include a Proof Pack." : "Draft version saved. Publishing locks this version for applicants.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Unable to save the Proof Brief."); }
    finally { setIsSaving(false); }
  }

  async function closeBrief() {
    if (!project) return;
    setIsSaving(true); setMessage("");
    try { const closed = await closeProofBriefAsync(project.id); setBrief(closed); setMessage("Proof Brief closed. Existing submissions remain available to review."); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : "Unable to close the Proof Brief."); }
    finally { setIsSaving(false); }
  }

  async function submitReview() {
    if (!selectedSubmission || !brief) return;
    if (reviewRemaining > 0) {
      setMessage(`Choose a decision for the remaining ${reviewRemaining} checkpoint${reviewRemaining === 1 ? "" : "s"} before saving this review.`);
      return;
    }
    setIsSaving(true); setMessage("");
    try {
      const reviewed = await reviewProofBriefAsync(selectedSubmission.id, {
        providerNote: providerNote.trim() || undefined,
        requestClarification: isClarification,
        checkpoints: brief.checkpoints.map((checkpoint) => ({ checkpointId: checkpoint.id, decision: reviewDecisions[checkpoint.id] ?? ProofBriefCheckpointDecisions.NotObserved, note: reviewNotes[checkpoint.id]?.trim() || undefined })),
      });
      setSubmissions((current) => current.map((item) => item.id === reviewed.id ? reviewed : item));
      setSelectedSubmissionId(null); setProviderNote(""); setReviewDecisions({}); setReviewNotes({}); setMessage(isClarification ? "Clarification requested from the applicant." : "Proof Pack review saved. You can now decide the application separately.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Unable to save this Proof Brief review."); }
    finally { setIsSaving(false); }
  }

  return <section className="page proof-brief-workspace">
    <DataState isLoading={isLoading} error={error} empty={!project} emptyTitle="Opportunity not found" emptyDescription="This workspace is available only to the provider who owns the opportunity." />
    {project ? <>
      <PageHeader eyebrow="Selection evidence" title="Proof Brief workspace" description={`Build a bounded, fair way to assess thinking for ${project.title}.`} actions={<Button to={`/company/projects/${project.id}/applications`} variant="secondary">View applications</Button>} />
      {message ? <div className="notice">{message}</div> : null}
      <section className="proof-workspace-banner"><div><span><Sparkles size={16} aria-hidden="true" /> SkillBridge fair-assessment protocol</span><h2>See the work of thinking, without asking for free client work.</h2><p>Every published brief is capped at 60 minutes, marked as non-production, and evaluated against explicit checkpoints.</p></div><div className="proof-workspace-stats"><article><TimerReset size={18} /><strong>{draft.timeboxMinutes} min</strong><small>time box</small></article><article><ClipboardCheck size={18} /><strong>{draft.checkpoints.length}</strong><small>checkpoints</small></article><article><LockKeyhole size={18} /><strong>{waitingForReview}</strong><small>awaiting review</small></article></div></section>
      <div className="proof-workspace-grid"><main className="proof-authoring"><header><div><span>Provider setup</span><h2>{brief?.status === ProofBriefStatuses.Published ? `Version ${brief.versionNumber} is live` : brief?.status === ProofBriefStatuses.Closed ? "This assessment is closed" : "Create the assessment boundary"}</h2></div>{brief ? <StatusBadge tone={brief.status === ProofBriefStatuses.Published ? "green" : brief.status === ProofBriefStatuses.Closed ? "neutral" : "amber"}>{statusLabel(brief.status)}</StatusBadge> : null}</header><div className="proof-fairness-line"><CheckCircle2 size={17} aria-hidden="true" /><span>Mandatory: no production use, no hidden score, and no more than 60 minutes of work.</span></div>
        {brief?.status === ProofBriefStatuses.Published ? <div className="proof-version-notice"><LockKeyhole size={17} aria-hidden="true" /><span><strong>Version {brief.versionNumber} is the applicant-facing boundary.</strong> Edit carefully, then publish a revised version in one step. Existing responses remain tied to the version they saw.</span></div> : null}
        {isClosed ? <div className="proof-closed-notice"><LockKeyhole size={17} aria-hidden="true" />This Proof Brief is closed to new responses and is now read-only. Existing Proof Packs can still be reviewed from the inbox.</div> : null}
        <fieldset className="proof-authoring-fields" disabled={isClosed}>
          <label className="field"><span>Brief title</span><input value={draft.title} maxLength={180} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="For example: Debug a handoff decision" /></label>
          <label className="field"><span>Scenario</span><textarea value={draft.scenario} maxLength={3000} onChange={(event) => setDraft((current) => ({ ...current, scenario: event.target.value }))} placeholder="Give enough context to understand the decision without exposing client work." /></label>
          <label className="field"><span>Constraints and non-goals</span><textarea value={draft.constraints} maxLength={2000} onChange={(event) => setDraft((current) => ({ ...current, constraints: event.target.value }))} placeholder="State what the applicant must not build, research, or disclose." /></label>
          <div className="proof-authoring-split"><label className="field"><span>Time box</span><select value={draft.timeboxMinutes} onChange={(event) => setDraft((current) => ({ ...current, timeboxMinutes: Number(event.target.value) }))}>{[15, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label><label className="field"><span>Response guidance</span><input value={draft.responseInstructions} maxLength={2000} onChange={(event) => setDraft((current) => ({ ...current, responseInstructions: event.target.value }))} placeholder="Explain how to structure a useful response." /></label></div>
          <section className="proof-checkpoint-editor"><header><div><span>Review checkpoints</span><h3>What will be observed</h3></div><Button type="button" variant="secondary" disabled={draft.checkpoints.length >= 3} onClick={() => setDraft((current) => ({ ...current, checkpoints: [...current.checkpoints, { title: "", description: "", evidenceCriterionStableKey: "" }] }))}>Add checkpoint</Button></header>{draft.checkpoints.map((checkpoint, index) => <article key={`${index}-${checkpoint.title}`}><strong>{index + 1}</strong><div><input aria-label={`Checkpoint ${index + 1} title`} value={checkpoint.title} maxLength={180} onChange={(event) => setCheckpoint(index, "title", event.target.value)} placeholder="Checkpoint title" /><input aria-label={`Checkpoint ${index + 1} detail`} value={checkpoint.description} maxLength={800} onChange={(event) => setCheckpoint(index, "description", event.target.value)} placeholder="What does good evidence show?" /></div>{draft.checkpoints.length > 1 ? <Button type="button" variant="ghost" onClick={() => setDraft((current) => ({ ...current, checkpoints: current.checkpoints.filter((_, checkpointIndex) => checkpointIndex !== index) }))}>Remove</Button> : null}</article>)}</section>
        </fieldset>
        <footer>{brief?.status !== ProofBriefStatuses.Published && brief?.status !== ProofBriefStatuses.Closed ? <Button type="button" variant="secondary" isLoading={isSaving} onClick={() => void saveDraft()}>Save draft</Button> : null}{brief?.status !== ProofBriefStatuses.Closed ? <Button type="button" isLoading={isSaving} disabled={definitionIssues.length > 0} onClick={() => void saveDraft(true)}><Send size={16} aria-hidden="true" /> {brief?.status === ProofBriefStatuses.Published ? "Publish revised version" : "Publish Proof Brief"}</Button> : null}{brief?.status === ProofBriefStatuses.Published ? <Button type="button" variant="ghost" isLoading={isSaving} onClick={() => void closeBrief()}>Close to new responses</Button> : null}</footer>
      </main>
      <aside className="proof-review-inbox"><header><span>Provider review</span><h2>Proof Pack inbox</h2><p>Review the response against the stated boundary before deciding the application.</p></header>{submissions.length === 0 ? <div className="proof-empty-inbox"><ClipboardCheck size={25} /><strong>No Proof Packs yet</strong><p>Published Proof Briefs appear to eligible applicants as an optional application path.</p></div> : <div className="proof-submission-list">{submissions.map((submission) => <button type="button" className={selectedSubmissionId === submission.id ? "is-selected" : ""} key={submission.id} onClick={() => { setSelectedSubmissionId(submission.id); setProviderNote(submission.providerNote ?? ""); setReviewDecisions(Object.fromEntries(submission.checkpointReviews.map((review) => [review.checkpointId, review.decision]))); setReviewNotes(Object.fromEntries(submission.checkpointReviews.map((review) => [review.checkpointId, review.note ?? ""]))); }}><strong>{submission.applicantName}</strong><span>Revision {submission.revisionNumber} · {submission.status === ProofBriefSubmissionStatuses.ClarificationRequested ? "Clarification requested" : submission.status === ProofBriefSubmissionStatuses.Reviewed ? "Reviewed" : "Ready to review"}</span></button>)}</div>}</aside>
      </div>
      {selectedSubmission && brief ? <section className="proof-review-drawer"><header><div><span>Proof Pack review</span><h2>{selectedSubmission.applicantName}</h2><p>Revision {selectedSubmission.revisionNumber} · submitted {new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p></div><StatusBadge tone={reviewRemaining === 0 ? "green" : "amber"}>{reviewRemaining === 0 ? "Ready to save" : `${reviewRemaining} decision${reviewRemaining === 1 ? "" : "s"} remaining`}</StatusBadge><Button type="button" variant="ghost" onClick={() => setSelectedSubmissionId(null)}>Close</Button></header><div className="proof-review-response"><article><small>Approach</small><p>{selectedSubmission.approach}</p></article><article><small>Trade-offs</small><p>{selectedSubmission.tradeoffs}</p></article><article><small>Reflection</small><p>{selectedSubmission.reflection}</p></article>{selectedSubmission.artifactUrl ? <a href={selectedSubmission.artifactUrl} target="_blank" rel="noreferrer">Open supporting link</a> : null}</div><div className="proof-review-checkpoints">{brief.checkpoints.map((checkpoint) => <article key={checkpoint.id}><div><strong>{checkpoint.title}</strong><small>{checkpoint.description}</small></div><select value={reviewDecisions[checkpoint.id] ?? ProofBriefCheckpointDecisions.NotReviewed} onChange={(event) => setReviewDecisions((current) => ({ ...current, [checkpoint.id]: Number(event.target.value) as ProofBriefCheckpointDecision }))}>{Object.values(ProofBriefCheckpointDecisions).filter((value): value is ProofBriefCheckpointDecision => typeof value === "number").map((decision) => <option key={decision} value={decision}>{decisionLabel(decision)}</option>)}</select><input value={reviewNotes[checkpoint.id] ?? ""} maxLength={800} onChange={(event) => setReviewNotes((current) => ({ ...current, [checkpoint.id]: event.target.value }))} placeholder="Short supporting note" /></article>)}</div><label className="field"><span>Provider note</span><textarea value={providerNote} maxLength={1500} onChange={(event) => setProviderNote(event.target.value)} placeholder="Give specific, useful feedback. This remains private selection feedback." /></label><label className="proof-clarification"><input type="checkbox" checked={isClarification} onChange={(event) => setIsClarification(event.target.checked)} /> Request clarification instead of closing this review</label><footer><Button type="button" variant="secondary" onClick={() => setSelectedSubmissionId(null)}>Cancel</Button><Button type="button" isLoading={isSaving} disabled={reviewRemaining > 0} onClick={() => void submitReview()}>{isClarification ? "Request clarification" : "Save completed review"}</Button></footer></section> : null}
    </> : null}
  </section>;
}
