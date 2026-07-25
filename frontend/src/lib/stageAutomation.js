export class StageAutomation {
  constructor(steps) {
    this.steps = steps // [{id, name, fee_kes, fee_usd, days, agency, phase, automated, portal}]
  }

  getStatus(stepIndex, completedIds) {
    if (completedIds.includes(this.steps[stepIndex]?.id)) return 'completed'
    const firstIncomplete = this.steps.findIndex(s => !completedIds.includes(s.id))
    if (firstIncomplete === stepIndex) return 'active'
    if (stepIndex < firstIncomplete) return 'completed'
    return 'pending'
  }

  cumulativeDays(upToIndex, completedIds) {
    return this.steps.slice(0, upToIndex + 1)
      .filter(s => !completedIds.includes(s.id))
      .reduce((acc, s) => acc + (parseInt(s.days) || 7), 0)
  }

  totalBudgetUsd(steps) {
    return steps.reduce((acc, s) => acc + (s.fee_usd || 0), 0)
  }

  nextStep(completedIds) {
    return this.steps.find(s => !completedIds.includes(s.id)) || null
  }
}
