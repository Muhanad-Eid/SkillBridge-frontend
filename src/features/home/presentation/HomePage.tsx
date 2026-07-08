import Button from "../../../shared/components/Button";

export default function HomePage() {
  return (
    <section className="about-page">
      <div className="about-hero">
        <p className="eyebrow">About SkillBridge</p>
        <h1>SkillBridge helps companies and learners meet through real opportunities.</h1>
        <p>
          Companies can post internships, training offers, and project work.
          Job seekers can create an account, apply, and build proof from the
          work they complete.
        </p>
        <div className="home-actions">
          <Button to="/login" variant="secondary">
            Log in
          </Button>
          <Button to="/register" variant="primary">
            Register
          </Button>
        </div>
      </div>

      <div className="about-grid">
        <article>
          <h2>For companies</h2>
          <p>
            Post opportunities, review applicants, and support trainees through
            structured project-based work.
          </p>
        </article>
        <article>
          <h2>For job seekers</h2>
          <p>
            Apply to internships and training, show your skills, and turn
            completed work into portfolio evidence.
          </p>
        </article>
      </div>
    </section>
  );
}
