type MarketAction = "start" | "pause" | "reset" | "interest";

export type MarketState = {
  running: boolean;
  resetNonce: number;
  lastAction: MarketAction;
  updatedAt: string;
  interestRate: number;
};

const DEFAULT_INTEREST_RATE = 0.0425;
export { DEFAULT_INTEREST_RATE };

const createState = (overrides?: Partial<MarketState>): MarketState => ({
  running: true,
  resetNonce: 0,
  lastAction: "start",
  updatedAt: new Date().toISOString(),
  interestRate: DEFAULT_INTEREST_RATE,
  ...overrides,
});

const marketState: MarketState = createState();

const stamp = () => new Date().toISOString();

export function getMarketState(): MarketState {
  return { ...marketState };
}

export function setMarketRunning(running: boolean): MarketState {
  marketState.running = running;
  marketState.lastAction = running ? "start" : "pause";
  marketState.updatedAt = stamp();
  return getMarketState();
}

export function setInterestRate(rate: number): MarketState {
  marketState.interestRate = rate;
  marketState.lastAction = "interest";
  marketState.updatedAt = stamp();
  return getMarketState();
}

export function getInterestRate(): number {
  return marketState.interestRate;
}

export function resetMarket(): MarketState {
  marketState.running = true;
  marketState.resetNonce += 1;
  marketState.lastAction = "reset";
  marketState.updatedAt = stamp();
  return getMarketState();
}
