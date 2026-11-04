import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getComplianceChecklist, listComplianceFrameworks } from "../src/tools/compliance-checklist.js";
import { FRAMEWORKS, checklistSchema } from "../src/utils/validation.js";

describe("compliance checklists", () => {
  it("covers the five requested frameworks and rejects others", () => {
    assert.deepEqual(listComplianceFrameworks().map((item) => item.framework_id), [...FRAMEWORKS]);
    assert.equal(checklistSchema.safeParse({ framework: "pci" }).success, false);
  });

  it("uses server question ids and does not invent ISO annex control numbers", () => {
    for (const framework of FRAMEWORKS) {
      const checklist = getComplianceChecklist(framework);
      assert.ok(checklist.questions.length >= 6);
      assert.ok(checklist.source_url.startsWith("https://"));
      assert.ok(checklist.not_a.includes("independent certification"));
      for (const question of checklist.questions) {
        assert.match(question.id, /^ELATRE-READINESS-/);
        assert.ok(question.recommended_evidence.length > 0);
        assert.equal(/\bA\.\d+(?:\.\d+)?\b/.test(question.official_reference), false);
      }
    }
    const iso = getComplianceChecklist("iso_42001");
    assert.match(iso.version, /42001:2023/);
    assert.match(iso.applicability_note, /Annex A/);
    const nist = getComplianceChecklist("nist_ai_rmf");
    assert.match(nist.questions[0]?.official_reference ?? "", /Not an official subcategory identifier/);
    const hipaa = getComplianceChecklist("hipaa");
    assert.match(hipaa.questions.map((question) => question.official_reference).join(" "), /45 CFR 164\.312/);
    const eu = getComplianceChecklist("eu_ai_act");
    assert.match(eu.version, /2024\/1689/);
    assert.match(eu.applicability_note, /does not decide/i);
  });
});
