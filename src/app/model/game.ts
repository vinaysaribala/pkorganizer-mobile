import { Player } from "./player"
import { Settlement } from "./settlement"

export interface Game {
    id: number,
    playDate: string,
    buyInValue: number,
    buyInPoints: number,
    expenses: number,
    hostId?: number,
    totalBuyIns: number,
    isSettled: boolean,
    playersCount: number,
    players: Player[]
    settlements: Settlement[]
  }