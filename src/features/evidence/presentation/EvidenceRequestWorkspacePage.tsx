import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, ClipboardList, MessageSquareText, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import Button from "../../../shared/components/Button";
import DataState from "../../../shared/components/DataState";
import PageHeader from "../../../shared/components/PageHeader";
import StatusBadge from "../../../shared/components/StatusBadge";
import type { EvidenceActionRequest } from "../domain/evidenceTypes";
import { createEvidenceActionRequestAsync, getEvidenceActionRequestsAsync, resolveEvidenceActionRequestAsync, respondToEvidenceActionRequestAsync } from "../infrastructure/evidenceApi";
import "./EvidenceRequestWorkspacePage.css";

const requestTypes = [
  ["FinalSubmission", "Submit final work"],
  ["EvidenceClarification", "Clarify evidence claim"],
  ["TrainingReport", "Add training report"],
  ["ContributionDeclaration", "Confirm team contribution"],
] as const;

export default function EvidenceRequestWorkspacePage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const applicationId = Number(params.get("applicationId"));
  const [requests, setRequests] = useState<EvidenceActionRequest[]>([]);
  const [selected, setSelected] = useState<EvidenceActionRequest | null>(null);
  const [response, setResponse] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<EvidenceActionRequest["requestType"]>("EvidenceClarification");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const isParticipant = user?.role === "JobSeeker";
  const canCreate = !isParticipant && Number.isInteger(applicationId) && applicationId > 0;

  const visibleRequests = useMemo(
    () =>
      Number.isInteger(applicationId) && applicationId > 0
        ? requests.filter((item) => item.applicationId === applicationId)
        : requests,
    [applicationId, requests],
  );
  const counts = useMemo(
    () => ({
      open: visibleRequests.filter((item) => item.status === "Open").length,
      responded: visibleRequests.filter((item) => item.status === "Responded").length,
      resolved: visibleRequests.filter((item) => item.status === "Resolved").length,
    }),
    [visibleRequests],
  );

  useEffect(() => {
    let isCurrent = true;

    getEvidenceActionRequestsAsync()
      .then((items) => {
        if (isCurrent) {
          setRequests(items);
          setSelected(
            items.find((item) => item.applicationId === applicationId) ??
              items[0] ??
              null,
          );
        }
      })
      .catch((caught: unknown) => {
        if (isCurrent) {
          setError(caught instanceof Error ? caught.message : "Unable to load evidence requests.");
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [applicationId]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canCreate) return;
    setIsSaving(true); setError("");
    try {
      const item = await createEvidenceActionRequestAsync(applicationId, { requestType: type, title, instructions, dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : null });
      setRequests((current) => [item, ...current]); setSelected(item); setTitle(""); setInstructions(""); setDueAt("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create the evidence request."); }
    finally { setIsSaving(false); }
  }

  async function respond(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    setIsSaving(true); setError("");
    try { const item = await respondToEvidenceActionRequestAsync(selected.id, response); setRequests((current) => current.map((currentItem) => currentItem.id === item.id ? item : currentItem)); setSelected(item); setResponse(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to send your response."); }
    finally { setIsSaving(false); }
  }

  async function resolve(isResolved: boolean) {
    if (!selected) return; setIsSaving(true); setError("");
    try { const item = await resolveEvidenceActionRequestAsync(selected.id, isResolved, note); setRequests((current) => current.map((currentItem) => currentItem.id === item.id ? item : currentItem)); setSelected(item); setNote(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to review this response."); }
    finally { setIsSaving(false); }
  }

  return <section className="page evidence-request-workspace">
    <PageHeader
      eyebrow="Actionable proof requests"
      title="Evidence Requests"
      description="Ask for a specific record or correction while keeping every request attached to the real work and its evidence lineage."
    />
    <div className="evidence-request-stats"><article><span>Open requests</span><strong>{counts.open}</strong></article><article><span>Waiting for review</span><strong>{counts.responded}</strong></article><article><span>Resolved</span><strong>{counts.resolved}</strong></article></div>
    {canCreate ? <form className="evidence-request-create" onSubmit={create}><header><ShieldCheck size={19} /><div><span>New request</span><h2>Ask for a specific piece of proof</h2></div></header><div className="evidence-request-create-fields"><label><span>Request type</span><select value={type} onChange={(event) => setType(event.target.value as EvidenceActionRequest["requestType"])}>{requestTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>Title</span><input value={title} minLength={5} maxLength={180} required onChange={(event) => setTitle(event.target.value)} placeholder="What needs attention?" /></label><label className="wide"><span>Instructions</span><textarea value={instructions} minLength={10} maxLength={2000} required onChange={(event) => setInstructions(event.target.value)} placeholder="Explain the requested proof and point to the expected work." /></label><label><span>Due date</span><input type="date" value={dueAt} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDueAt(event.target.value)} /></label><Button type="submit" isLoading={isSaving}>Send request <ArrowRight size={16} /></Button></div></form> : null}
    {!isParticipant && !canCreate ? <section className="evidence-request-launch"><ClipboardList size={20} /><div><strong>Start from a work record.</strong><p>Open an accepted participation in Work Hub, then launch an evidence request for that exact participant.</p></div></section> : null}
    {error ? <p className="notice notice-error">{error}</p> : null}
    <div className="evidence-request-layout"><section className="evidence-request-list"><DataState isLoading={isLoading} error="" empty={!isLoading && visibleRequests.length === 0} emptyTitle="No evidence requests" emptyDescription="Requests will appear here when work needs a focused proof response." />{visibleRequests.map((item) => <button type="button" className={selected?.id === item.id ? "selected" : ""} key={item.id} onClick={() => setSelected(item)}><div><span>{item.requestType.replace(/([A-Z])/g, " $1").trim()}</span><strong>{item.title}</strong><small>{item.opportunityTitle} · {isParticipant ? item.requesterName : item.participantName}</small></div><StatusBadge tone={item.status === "Resolved" ? "green" : item.status === "Responded" ? "blue" : "amber"}>{item.status}</StatusBadge></button>)}</section>
    <aside className="evidence-request-inspector">{selected ? <><header><span>Request #{selected.id}</span><h2>{selected.title}</h2><p>{selected.instructions}</p></header><div className="evidence-request-meta"><span>Requested by <strong>{selected.requesterName}</strong></span><span>{selected.dueAt ? `Due ${new Date(selected.dueAt).toLocaleDateString()}` : "No due date"}</span></div>{isParticipant && selected.status === "Open" ? <form onSubmit={respond}><label><span>Your response</span><textarea value={response} required minLength={5} maxLength={2000} onChange={(event) => setResponse(event.target.value)} placeholder="State what you completed, then use the work link below to provide the actual evidence." /></label><Button type="submit" isLoading={isSaving}><MessageSquareText size={16} /> Send response</Button><Link to={selected.recipientActionPath}>Open the real work workflow <ArrowRight size={15} /></Link></form> : null}{!isParticipant && selected.status === "Responded" ? <div className="evidence-request-review"><p><strong>Participant response</strong>{selected.response}</p><label><span>Resolution note</span><textarea value={note} required minLength={5} maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Explain what is resolved or what is still missing." /></label><div><Button type="button" variant="secondary" isLoading={isSaving} onClick={() => void resolve(false)}>Request more work</Button><Button type="button" isLoading={isSaving} onClick={() => void resolve(true)}>Resolve request</Button></div></div> : null}{selected.status === "Resolved" ? <p className="evidence-request-resolution"><ShieldCheck size={17} /> {selected.resolutionNote}</p> : null}</> : <div className="evidence-request-empty"><ClipboardList size={26} /><strong>Select a request</strong><p>Each request keeps the proof discussion attached to the relevant work record.</p></div>}</aside></div>
  </section>;
}
