import { CheckCircle2, Clock3, Lightbulb, ShieldCheck } from "lucide-react";
import type { ProofBrief } from "../domain/proofBriefTypes";
import "./proofBrief.css";

type Props = {
  brief: ProofBrief;
  enabled: boolean;
  approach: string;
  tradeoffs: string;
  reflection: string;
  artifactUrl: string;
  onEnabledChange: (value: boolean) => void;
  onApproachChange: (value: string) => void;
  onTradeoffsChange: (value: string) => void;
  onReflectionChange: (value: string) => void;
  onArtifactUrlChange: (value: string) => void;
};

export default function ProofBriefPack({
  brief, enabled, approach, tradeoffs, reflection, artifactUrl,
  onEnabledChange, onApproachChange, onTradeoffsChange, onReflectionChange, onArtifactUrlChange,
}: Props) {
  const approachReady = approach.trim().length >= 30;
  const tradeoffsReady = tradeoffs.trim().length >= 30;
  const reflectionReady = reflection.trim().length >= 20;
  const completedResponses = [approachReady, tradeoffsReady, reflectionReady].filter(Boolean).length;
  return (
    <section className="proof-pack" aria-labelledby="proof-pack-title">
      <header className="proof-pack-header">
        <div>
          <span>Optional Proof Brief</span>
          <h3 id="proof-pack-title">{brief.title}</h3>
          <p>Show how you think in a bounded scenario. This is selection context, not unpaid client work.</p>
        </div>
        <div className="proof-pack-timebox"><Clock3 size={18} aria-hidden="true" /><strong>{brief.timeboxMinutes} min</strong><small>maximum</small></div>
      </header>

      <div className="proof-pack-brief">
        <article><small>Scenario</small><p>{brief.scenario}</p></article>
        <article><small>Constraints</small><p>{brief.constraints}</p></article>
      </div>
      <div className="proof-pack-checkpoints">
        <span><Lightbulb size={16} aria-hidden="true" /> What the provider will look for</span>
        <ol>{brief.checkpoints.map((checkpoint) => <li key={checkpoint.id}><CheckCircle2 size={15} aria-hidden="true" /><div><strong>{checkpoint.title}</strong>{checkpoint.description ? <small>{checkpoint.description}</small> : null}</div></li>)}</ol>
      </div>
      <ol className="proof-pack-flow" aria-label="Proof Pack process">
        <li><span>1</span><div><strong>Respond within the time box</strong><small>Use the scenario and constraints above. Do not produce client-ready work.</small></div></li>
        <li><span>2</span><div><strong>The provider reviews named checkpoints</strong><small>They assess only the criteria shown here, then decide your application separately.</small></div></li>
        <li><span>3</span><div><strong>Your response stays private</strong><small>It is selection context, not a portfolio item or public evidence card.</small></div></li>
      </ol>
      <label className="proof-pack-toggle">
        <input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
        <span><strong>Include a Proof Pack with my application</strong><small>I understand this is limited to {brief.timeboxMinutes} minutes and may not be used as production work.</small></span>
      </label>

      {enabled ? <div className="proof-pack-workbench">
        <div className="proof-pack-progress"><span><strong>{completedResponses}/3</strong> response sections ready</span><small>Minimum: approach 30 characters, trade-offs 30, reflection 20.</small></div>
        <p className="proof-pack-instructions"><ShieldCheck size={17} aria-hidden="true" />{brief.responseInstructions}</p>
        <label className={`field proof-pack-response ${approachReady ? "is-ready" : ""}`}><span>Your approach</span><textarea value={approach} onChange={(event) => onApproachChange(event.target.value)} maxLength={3000} minLength={30} required placeholder="Describe the first steps you would take and why." /><small>{approach.length}/3000 · {approachReady ? "ready" : "30 characters minimum"}</small></label>
        <label className={`field proof-pack-response ${tradeoffsReady ? "is-ready" : ""}`}><span>Trade-offs and constraints</span><textarea value={tradeoffs} onChange={(event) => onTradeoffsChange(event.target.value)} maxLength={3000} minLength={30} required placeholder="Name the decisions you made, alternatives you rejected, and constraints you respected." /><small>{tradeoffs.length}/3000 · {tradeoffsReady ? "ready" : "30 characters minimum"}</small></label>
        <label className={`field proof-pack-response ${reflectionReady ? "is-ready" : ""}`}><span>Reflection</span><textarea value={reflection} onChange={(event) => onReflectionChange(event.target.value)} maxLength={2000} minLength={20} required placeholder="What would you validate or improve with more time?" /><small>{reflection.length}/2000 · {reflectionReady ? "ready" : "20 characters minimum"}</small></label>
        <label className="field"><span>Optional supporting link</span><input type="url" value={artifactUrl} onChange={(event) => onArtifactUrlChange(event.target.value)} maxLength={500} placeholder="https://..." /></label>
      </div> : null}
    </section>
  );
}
