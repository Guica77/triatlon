export function calculateChurnRates(totalUsers: number, totalChurned: number) {
  const monthlyChurnRate = totalUsers > 0
    ? Math.round((Math.min(Math.max(totalChurned, 0), totalUsers) / totalUsers) * 1000) / 10
    : 0
  const quarterlyChurnRate = Math.round((1 - Math.pow(1 - monthlyChurnRate / 100, 3)) * 1000) / 10
  return { monthlyChurnRate, quarterlyChurnRate }
}
