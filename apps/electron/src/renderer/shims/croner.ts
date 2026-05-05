export class Cron {
  constructor(_expression: string) {}

  nextRuns(count: number = 3): Date[] {
    const runs: Date[] = []
    const start = Date.now()
    for (let index = 1; index <= count; index += 1) {
      runs.push(new Date(start + index * 60 * 60 * 1000))
    }
    return runs
  }
}
