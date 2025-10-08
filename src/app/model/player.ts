export interface Player {
    profileId: number,
    name: string,
    gameId: number,
    buyIns: number,
    returnBuyIns?: number,
    balance?: number,
    isSettled: boolean,
    isHost: boolean,
    canAddExpenses: boolean,
    expenseBuyIns?: number
  }