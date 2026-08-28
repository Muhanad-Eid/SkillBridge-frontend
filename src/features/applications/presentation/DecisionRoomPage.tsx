import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useParams } from "react-router-dom";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { JobSeekerProfile } from "../../profiles/domain/profileTypes";
import { getPublicJobSeekerProfileAsync } from "../../profiles/infrastructure/profileApi";
import { getMyCompanyProjectsAsync } from "../../projects/infrastructure/projectApi";
import type { Project } from "../../projects/domain/projectTypes";
import {
  ProofBriefCheckpointDecisions,
  type ProofBriefSubmission,
} from "../../proof-briefs/domain/proofBriefTypes";
import { getProofBriefSubmissionsAsync } from "../../proof-briefs/infrastructure/proofBriefApi";
import {
  ApplicationStatuses,
  WorkSubmissionStatuses,
  type Application,
} from "../domain/applicationTypes";
import {
  downloadApplicationCvAsync,
  getProjectApplicationsAsync,
  updateApplicationStatusAsync,
} from "../infrastructure/applicationApi";
import ApplicationDecisionDialog from "./ApplicationDecisionDialog";
import "./decisionRoom.css";

function workLabel(status: Application["workStatus"]) {
  if (status === WorkSubmissionStatuses.Approved) return "Work approved";
  if (status === WorkSubmissionStatuses.AwaitingUniversityApproval) return "University approval pending";
  if (status === WorkSubmissionStatuses.ChangesRequested) return "Changes requested";
  if (status === WorkSubmissionStatuses.Submitted) return "Work submitted";
  return "No work yet";
}

function checkpointLabel(decision: number) {
  if (decision === ProofBriefCheckpointDecisions.Demonstrated) return "Demonstrated";
  if (decision === ProofBriefCheckpointDecisions.NeedsClarification) return "Clarification needed";
  if (decision === ProofBriefCheckpointDecisions.NotObserved) return "Not observed";
  return "Not reviewed";
}

export default function DecisionRoomPage() {
  const projectId = Number(useParams().projectId);
  const applicationId = Number(useParams().applicationId);
  const [project, setProject] = useState<Project | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [proofPack, setProofPack] = useState<ProofBriefSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingCv, setIsDownloadingCv] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [decision, setDecision] = useState<typeof ApplicationStatuses.Accepted | typeof ApplicationStatuses.Rejected | null>(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(projectId) || !Number.isInteger(applicationId) || projectId < 1 || applicationId < 1) {
      setError("The decision room address is invalid.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true); setError("");
    try {
      const [projects, applications, submissions] = await Promise.all([
        getMyCompanyProjectsAsync(),
        getProjectApplicationsAsync(projectId),
        getProofBriefSubmissionsAsync(projectId).catch(() => []),
      ]);
      const nextProject = projects.items.find((item) => item.id === projectId) ?? null;
      const nextApplication = applications.items.find((item) => item.id === applicationId) ?? null;
      setProject(nextProject); setApplication(nextApplication);
      setProofPack(nextApplication ? submissions.filter((item) => item.projectApplicationId === nextApplication.id).sort((left, right) => right.revisionNumber - left.revisionNumber)[0] ?? null : null);
      if (nextApplication?.jobSeekerId) setProfile(await getPublicJobSeekerProfileAsync(nextApplication.jobSeekerId).catch(() => null));
      else setProfile(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to open the decision room."); }
    finally { setIsLoading(false); }
  }, [applicationId, projectId]);

  useEffect(() => { const timeoutId = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timeoutId); }, [load]);

  const sources = useMemo(() => application ? [
    { label: "Profile", detail: profile ? `${profile.skills.length} skills listed` : "Profile unavailable", ready: Boolean(profile) },
    { label: "Application", detail: application.coverLetter || application.shortTaskResponse ? "Response provided" : "No written response", ready: Boolean(application.coverLetter || application.shortTaskResponse) },
    { label: "Proof Pack", detail: proofPack ? `Revision ${proofPack.revisionNumber}` : "Not included", ready: Boolean(proofPack) },
    { label: "Evidence Contract", detail: application.acceptedEvidenceContractVersionNumber ? `Version ${application.acceptedEvidenceContractVersionNumber} pinned` : "Pinned after acceptance", ready: Boolean(application.acceptedEvidenceContractVersionNumber) },
  ] : [], [application, profile, proofPack]);

  async function downloadCv() {
    if (!application) return;
    setIsDownloadingCv(true); setError("");
    try { await downloadApplicationCvAsync(application.id); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to download the CV."); }
    finally { setIsDownloadingCv(false); }
  }

  async function confirmDecision(decisionNote?: string) {
    if (!application || decision === null) return;
    setIsUpdating(true); setError("");
    try {
      await updateApplicationStatusAsync(application.id, { status: decision, decisionNote });
      setApplication((current) => current ? { ...current, status: decision, decisionNote: decisionNote ?? null, decidedAt: new Date().toISOString() } : current);
      setMessage(decision === ApplicationStatuses.Accepted ? "Applicant accepted. The Work Hub is now available to both sides." : "Application rejected with the recorded reason.");
      setDecision(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save the decision."); }
    finally { setIsUpdating(false); }
  }

  const messagePath = application && profile ? `/company/messages?${new URLSearchParams({ receiverId: profile.userId, receiverName: application.jobSeekerName, projectId: String(application.projectId), projectTitle: application.projectTitle })}` : "/company/messages";
  const isPending = application?.status === ApplicationStatuses.Pending;

  return <section className="page decision-room-page">
    <Button to={`/company/projects/${projectId}/applications`} variant="ghost" className="decision-room-back"><ArrowLeft size={17} aria-hidden="true" />Applications</Button>
    <DataState isLoading={isLoading} error={error} empty={!application || !project} emptyTitle="Decision context not found" emptyDescription="This application may no longer belong to an opportunity you manage." />
    {application && project ? <>
      <PageHeader eyebrow="Provider decision record" title="Decision Room" description={`Review ${application.jobSeekerName} against the records that actually belong to ${project.title}.`} actions={isPending ? <div className="decision-room-actions"><Button type="button" variant="secondary" onClick={() => setDecision(ApplicationStatuses.Rejected)}><X size={16} aria-hidden="true" />Reject</Button><Button type="button" onClick={() => setDecision(ApplicationStatuses.Accepted)}><Check size={16} aria-hidden="true" />Accept</Button></div> : <StatusBadge tone={application.status === ApplicationStatuses.Accepted ? "green" : "red"}>{application.status === ApplicationStatuses.Accepted ? "Accepted" : "Decision recorded"}</StatusBadge>} />
      {message ? <div className="notice notice-success">{message}</div> : null}{error ? <div className="notice notice-error">{error}</div> : null}
      <section className="decision-room-rail" aria-label="Decision sources">{sources.map((source) => <article key={source.label} className={source.ready ? "is-ready" : ""}><span>{source.ready ? <ShieldCheck size={16} aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}</span><div><strong>{source.label}</strong><small>{source.detail}</small></div></article>)}</section>
      <div className="decision-room-grid"><main className="decision-room-records"><section><header><span>Applicant record</span><h2>{application.jobSeekerName}</h2></header><div className="decision-profile-summary"><span className="decision-avatar">{application.jobSeekerName.charAt(0).toUpperCase()}</span><div><strong>{profile?.fullName ?? application.jobSeekerName}</strong><p>{profile?.bio ?? "No public profile summary provided."}</p><div className="decision-skill-list">{profile?.skills.map((skill) => <span key={skill}>{skill}</span>) ?? <small>No skills listed.</small>}</div></div></div><div className="decision-record-actions"><Button to={profile ? `/company/talent/${profile.id}` : "/company/talent"} variant="secondary"><UserRound size={16} aria-hidden="true" />Open profile</Button><Button to={messagePath} variant="secondary"><MessageSquare size={16} aria-hidden="true" />Message</Button>{application.hasCv && application.canViewCv ? <Button type="button" variant="secondary" isLoading={isDownloadingCv} onClick={() => void downloadCv()}><Download size={16} aria-hidden="true" />Download CV</Button> : null}</div></section>
        <section><header><span>Application response</span><h2>What they submitted</h2></header>{application.coverLetter ? <article className="decision-text-record"><strong>Introduction</strong><p>{application.coverLetter}</p></article> : null}{application.shortTaskResponse ? <article className="decision-text-record"><strong>Application task</strong><p>{application.shortTaskResponse}</p></article> : null}{application.workSampleUrl ? <a className="button button-secondary" href={application.workSampleUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" />Open work sample</a> : null}{!application.coverLetter && !application.shortTaskResponse && !application.workSampleUrl ? <p className="decision-empty">No separate written application material was submitted.</p> : null}</section>
        <section><header><span>Evidence boundary</span><h2>What this decision can rely on</h2></header><div className="decision-contract"><ClipboardCheck size={22} aria-hidden="true" /><div><strong>{application.acceptedEvidenceContractVersionNumber ? `Evidence Contract version ${application.acceptedEvidenceContractVersionNumber}` : "Contract pins on acceptance"}</strong><p>{application.acceptedEvidenceContractVersionNumber ? "This participation is governed by a pinned version. Later opportunity changes will not change the evaluation basis." : "Accepting the application pins the current Evidence Contract. The Work Hub then uses that version as its evidence boundary."}</p></div></div></section>
        {proofPack ? <section><header><span>Optional Proof Pack</span><h2>Bounded thinking exercise</h2><StatusBadge tone={proofPack.status === 3 ? "green" : proofPack.status === 2 ? "amber" : "blue"}>{proofPack.status === 3 ? "Reviewed" : proofPack.status === 2 ? "Clarification requested" : "Submitted"}</StatusBadge></header><div className="decision-proof-response"><article><small>Approach</small><p>{proofPack.approach}</p></article><article><small>Trade-offs</small><p>{proofPack.tradeoffs}</p></article><article><small>Reflection</small><p>{proofPack.reflection}</p></article></div>{proofPack.checkpointReviews.length ? <div className="decision-checkpoints">{proofPack.checkpointReviews.map((review) => <article key={review.checkpointId}><strong>{review.checkpointTitle}</strong><StatusBadge tone={review.decision === ProofBriefCheckpointDecisions.Demonstrated ? "green" : review.decision === ProofBriefCheckpointDecisions.NeedsClarification ? "amber" : "neutral"}>{checkpointLabel(review.decision)}</StatusBadge><small>{review.note ?? "No supporting note recorded."}</small></article>)}</div> : <div className="decision-next-step"><Sparkles size={17} aria-hidden="true" /><span>This Proof Pack has not been reviewed yet. Review it against the published checkpoints before making a selection decision.</span><Button to={`/company/projects/${project.id}/proof-brief`} variant="secondary">Review Proof Pack</Button></div>}</section> : null}</main>
        <aside className="decision-room-sidebar"><section><span>Decision protocol</span><h2>Decide with a record</h2><ol><li>Review only the submitted material and named Proof Brief checkpoints.</li><li>Use the applicant’s actual response, not an inferred score.</li><li>Acceptance pins the Evidence Contract and opens real managed work.</li></ol></section><section><span>Current state</span><h2>{isPending ? "Awaiting provider decision" : application.status === ApplicationStatuses.Accepted ? "Accepted" : "Rejected"}</h2><p>{isPending ? "No decision has been recorded. You can request clarification through the relevant response workspace before deciding." : application.decisionNote ?? "A decision was recorded without a shared note."}</p><strong className="decision-work-state">{workLabel(application.workStatus)}</strong>{application.decidedAt ? <small>Recorded {new Date(application.decidedAt).toLocaleString()}</small> : null}</section>{application.status === ApplicationStatuses.Accepted ? <Button to={`/company/projects/${project.id}/work`} fullWidth>Open Work Hub</Button> : null}</aside></div>
      {decision !== null ? <ApplicationDecisionDialog application={application} includedRevisions={project.includedRevisions} isLoading={isUpdating} status={decision} onCancel={() => setDecision(null)} onConfirm={confirmDecision} /> : null}
    </> : null}
  </section>;
}
