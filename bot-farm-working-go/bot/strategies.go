package bot

import "math/rand"

// Strategy defines a bot's personality — how much it bets, when it cashes out,
// and how often it participates. Mixing these across 20 bots produces organic-
// looking activity in the leaderboard and bet history.
type Strategy struct {
	Name         string
	MinBet       float64 // XLM
	MaxBet       float64 // XLM
	CashoutMin   float64 // multiplier (e.g. 1.2)
	CashoutMax   float64 // multiplier (e.g. 5.0)
	ParticipRate float64 // 0–1: probability of betting any given round
	BustRate     float64 // 0–1: probability of holding until crash (no cashout)
}

var strategies = []Strategy{
	{
		// Grinds small profits, rarely busts.
		Name:         "conservative",
		MinBet:       0.001,
		MaxBet:       0.008,
		CashoutMin:   1.15,
		CashoutMax:   1.60,
		ParticipRate: 0.90,
		BustRate:     0.04,
	},
	{
		// Mid-range, balanced risk.
		Name:         "steady",
		MinBet:       0.005,
		MaxBet:       0.025,
		CashoutMin:   1.40,
		CashoutMax:   2.80,
		ParticipRate: 0.75,
		BustRate:     0.10,
	},
	{
		// Chases big multipliers, busts often.
		Name:         "aggressive",
		MinBet:       0.020,
		MaxBet:       0.080,
		CashoutMin:   2.00,
		CashoutMax:   6.00,
		ParticipRate: 0.60,
		BustRate:     0.28,
	},
	{
		// Diamond hands — waits for the moon, usually wrecked.
		Name:         "moonshot",
		MinBet:       0.005,
		MaxBet:       0.030,
		CashoutMin:   8.00,
		CashoutMax:   50.0,
		ParticipRate: 0.40,
		BustRate:     0.55,
	},
}

// Assign gives bot i a deterministic strategy (round-robin).
func Assign(botID int) Strategy {
	return strategies[botID%len(strategies)]
}

func (s Strategy) rollBet(rng *rand.Rand) float64 {
	return s.MinBet + rng.Float64()*(s.MaxBet-s.MinBet)
}

func (s Strategy) rollCashout(rng *rand.Rand) float64 {
	return s.CashoutMin + rng.Float64()*(s.CashoutMax-s.CashoutMin)
}

func (s Strategy) shouldBet(rng *rand.Rand) bool {
	return rng.Float64() < s.ParticipRate
}

func (s Strategy) willBust(rng *rand.Rand) bool {
	return rng.Float64() < s.BustRate
}
