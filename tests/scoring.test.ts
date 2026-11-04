import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONTROL_CATALOG, scoreControls } from "../src/services/scoring-engine.js";
import { InputValidationError } from "../src/utils/validation.js";

const allImplemented = CONTROL_CATALOG.map((control) => ({
  control_id: control.id,
  status: "implemented" as const,
}));

const allMissing = CONTROL_CATALOG.map((control) => ({
  control_id: control.id,
  status: "missing" as const,
}));

describe("scoring engine", () => {
  it("uses ten categories and a stable catalog", () => {
    const categories = new Set(CONTROL_CATALOG.map((control) => control.categoryId));
    assert.equal(categories.size, 10);
    assert.equal(CONTROL_CATALOG.length, 51);
  });

  it("gives full points to implemented controls", () => {
    const result = scoreControls(allImplemented);
    assert.equal(result.score, 100);
    assert.equal(result.coverage_percent, 100);
    assert.equal(result.readiness_category, "strong_evidence");
    assert.equal(result.verified_controls.length, CONTROL_CATALOG.length);
    assert.equal(result.missing_controls.length, 0);
    assert.equal(result.unknown_controls.length, 0);
    assert.equal(result.critical_findings.length, 0);
    assert.match(result.score_explanation, /not a certification/i);
  });

  it("gives missing controls zero points and keeps them distinct from unknown", () => {
    const result = scoreControls(allMissing);
    assert.equal(result.score, 0);
    assert.equal(result.coverage_percent, 100);
    assert.equal(result.readiness_category, "not_ready");
    assert.equal(result.missing_controls.length, CONTROL_CATALOG.length);
    assert.equal(result.unknown_controls.length, 0);
    assert.ok(result.critical_findings.some((finding) => finding.kind === "missing_control"));
  });

  it("does not treat unknown controls as implemented", () => {
    const result = scoreControls([]);
    assert.equal(result.score, 0);
    assert.equal(result.coverage_percent, 0);
    assert.equal(result.readiness_category, "insufficient_evidence");
    assert.equal(result.unknown_controls.length, CONTROL_CATALOG.length);
    assert.equal(result.missing_controls.length, 0);
    assert.equal(result.verified_controls.length, 0);
    assert.ok(result.critical_findings.every((finding) => finding.kind === "evidence_gap"));
  });

  it("awards half weight to a partial control and averages categories", () => {
    const result = scoreControls([{ control_id: "elatre-iam-01", status: "partial", evidence: "Pilot group only" }]);
    const identity = result.assessed_categories.find((category) => category.category_id === "identity_and_access_management");
    assert.equal(identity?.score, 10);
    assert.equal(result.score, 1);
    assert.equal(result.coverage_percent, 1.96);
    assert.equal(identity?.partial_controls[0], "ELATRE-IAM-01");
    assert.equal(result.missing_controls.includes("ELATRE-IAM-02"), false);
    assert.equal(result.unknown_controls.includes("ELATRE-IAM-02"), true);
    assert.equal(result.critical_findings.some((finding) => finding.control_id === "ELATRE-IAM-01"), false);
    assert.equal(result.critical_findings.some((finding) => finding.control_id === "ELATRE-IAM-02" && finding.kind === "evidence_gap"), true);
  });

  it("records a missing critical control without assuming the rest", () => {
    const result = scoreControls([{ control_id: "ELATRE-VEC-03", status: "missing" }]);
    assert.equal(result.score, 0);
    assert.equal(result.readiness_category, "not_ready");
    assert.ok(result.critical_findings.some((finding) => finding.control_id === "ELATRE-VEC-03" && finding.severity === "critical"));
    assert.ok(result.recommendations.some((item) => item.includes("authorization filter")));
  });

  it("rejects duplicate control ids and ignores unrecognized ids", () => {
    assert.throws(
      () => scoreControls([
        { control_id: "ELATRE-IAM-01", status: "implemented" },
        { control_id: "ELATRE-IAM-01", status: "missing" },
      ]),
      InputValidationError,
    );
    const baseline = scoreControls([]);
    const extra = scoreControls([{ control_id: "NOT-A-CONTROL", status: "implemented" }]);
    assert.equal(extra.score, baseline.score);
    assert.deepEqual(extra.unrecognized_controls, ["NOT-A-CONTROL"]);
  });

  it("is deterministic", () => {
    const evidence = [
      { control_id: "ELATRE-AUD-01", status: "implemented" as const },
      { control_id: "ELATRE-LLM-01", status: "partial" as const },
      { control_id: "ELATRE-DOC-01", status: "missing" as const },
    ];
    assert.equal(JSON.stringify(scoreControls(evidence)), JSON.stringify(scoreControls(evidence)));
  });
});
