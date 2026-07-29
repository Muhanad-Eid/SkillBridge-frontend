import { type FormEvent, useState } from "react";
import { Check, CircleDollarSign, Clock3, RotateCcw, X } from "lucide-react";
import Button from "../../../shared/components/Button";
import {
  getFreelancePricingLabel,
  OpportunityTypes,
} from "../../projects/domain/projectTypes";
import {
  ApplicationStatuses,
  type Application,
} from "../domain/applicationTypes";

type DecisionStatus =
  | typeof ApplicationStatuses.Accepted
  | typeof ApplicationStatuses.Rejected;

type Props = {
  application: Application;
  includedRevisions?: number | null;
  isLoading: boolean;
  status: DecisionStatus;
  onCancel: () => void;
  onConfirm: (decisionNote?: string) => void | Promise<void>;
};

export default function ApplicationDecisionDialog({
  application,
  includedRevisions,
  isLoading,
  status,
  onCancel,
  onConfirm,
}: Props) {
  const [decisionNote, setDecisionNote] = useState("");
  const isAccepting = status === ApplicationStatuses.Accepted;
  const isFreelance =
    application.opportunityType === OpportunityTypes.FreelanceTask;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onConfirm(
      decisionNote.trim() ? decisionNote.trim() : undefined,
    );
  }

  return (
    <div className="company-drawer-backdrop" role="presentation">
      <section
        className="company-application-decision-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-decision-title"
      >
        <header>
          <div>
            <span>
              {isAccepting ? "Confirm selection" : "Close the application"}
            </span>
            <h2 id="application-decision-title">
              {isAccepting
                ? `Accept ${application.jobSeekerName}?`
                : `Reject ${application.jobSeekerName}?`}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="company-icon-action"
            aria-label="Close application decision"
            title="Close"
            onClick={onCancel}
          >
            <X size={19} aria-hidden="true" />
          </Button>
        </header>

        <form onSubmit={submit}>
          <div className="company-application-decision-summary">
            <span>Opportunity</span>
            <strong>{application.projectTitle}</strong>
          </div>

          {isAccepting && isFreelance ? (
            <>
              <div className="company-proposal-accept-terms">
                <div>
                  <CircleDollarSign size={17} aria-hidden="true" />
                  <span>
                    {getFreelancePricingLabel(
                      application.freelancePricingType,
                    )}
                  </span>
                  <strong>
                    {application.proposedBudget
                      ? `$${application.proposedBudget}`
                      : "Not set"}
                  </strong>
                </div>
                <div>
                  <Clock3 size={17} aria-hidden="true" />
                  <span>Delivery</span>
                  <strong>
                    {application.proposedDeliveryDays ?? "-"} days
                  </strong>
                </div>
                <div>
                  <RotateCcw size={17} aria-hidden="true" />
                  <span>Revision rounds</span>
                  <strong>{includedRevisions ?? 1}</strong>
                </div>
              </div>
              <p>
                These terms become the agreed work terms. Payment remains
                outside SkillBridge.
              </p>
            </>
          ) : isAccepting ? (
            <p>
              The applicant will gain access to the work hub after you confirm.
            </p>
          ) : (
            <label className="field">
              <span>Reason for the decision</span>
              <textarea
                autoFocus
                required
                minLength={10}
                maxLength={1000}
                value={decisionNote}
                placeholder="Give a short, useful reason the applicant can learn from."
                onChange={(event) => setDecisionNote(event.target.value)}
              />
              <small>{decisionNote.length}/1000 characters</small>
            </label>
          )}

          <footer>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isAccepting ? "primary" : "secondary"}
              className={[
                "button-with-icon",
                isAccepting ? "" : "company-decision-reject-confirm",
              ]
                .filter(Boolean)
                .join(" ")}
              isLoading={isLoading}
            >
              {isAccepting ? (
                <Check size={17} aria-hidden="true" />
              ) : (
                <X size={17} aria-hidden="true" />
              )}
              {isAccepting
                ? isFreelance
                  ? "Accept proposal"
                  : "Accept applicant"
                : isFreelance
                  ? "Decline proposal"
                  : "Reject application"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
