export function calculateNextReviewDate(repetitionCount: number): Date {
  const now = new Date()

  switch (repetitionCount) {
    case 1:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 gün
    case 2:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 hafta
    case 3:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 1 ay
    case 4:
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 3 ay
    case 5:
      return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000) // 6 ay
    case 6:
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 yıl
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000) // varsayılan 1 gün
  }
}

export function getSpacedRepetitionIntervals(): { [key: number]: string } {
  return {
    1: "1 gün",
    2: "1 hafta",
    3: "1 ay",
    4: "3 ay",
    5: "6 ay",
    6: "1 yıl",
  }
}
