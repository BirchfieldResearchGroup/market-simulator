# Game Guide

## Overview

The Power Market Simulator models a simplified electricity wholesale market. Each student acts as a power plant owner with a portfolio of generators. Every period, students set offer prices for their generators. The market then clears using **merit-order dispatch** — the cheapest generators are dispatched first to meet demand. Profits depend on which generators are dispatched and the selected **payment method**.

The goal: maximize your total money across all periods.

## Game Flow

1. **Instructor creates a market** — names it and configures payment method, generator preset, load profile, number of periods, and other settings.
2. **Players join** — students sign in with their name and UIN and join from the market list (or a join link for unlisted markets).
3. **Instructor starts the game** — generators are distributed and period 1 opens.
4. **Each period:**
   - Students see the forecast load (MW) for the period and set offer prices for each of their generators.
   - When the period advances (manually or by auto-timer), the market clears using the current offers.
   - Results show revenue, costs, and profit for the period.
5. **Game ends** when the final period clears. Final rankings are displayed.

### Game States

| State         | Description                                               |
| ------------- | --------------------------------------------------------- |
| **Forming**   | Lobby is open; players can join until the maximum is met. |
| **Running**   | Periods are being played.                                 |
| **Completed** | All periods finished; results are final.                  |

## Market Clearing (Merit Order Dispatch)

Each period, the system:

1. **Shuffles** all generators randomly (Fisher-Yates) for fair tie-breaking.
2. **Sorts** by offer price ascending — this is the **merit order** (cheapest first).
3. **Dispatches** generators in order, each producing up to its capacity, until total demand (load) is met.
4. The offer price of the **last dispatched generator** becomes the **marginal cost** (clearing price).

Generators with offers above the clearing price are not dispatched and earn nothing.

### Supply Shortage

If demand exceeds total supply (all generators at full capacity), all generators are dispatched and the clearing price equals the highest offer. Unserved demand is silently dropped.

If the admin has configured a **scarcity price** (> 0), the clearing price is overridden to that value during supply shortages, providing a stronger price signal.

## Payment Methods

The payment method determines how dispatched generators are compensated. This is the central strategic variable of the simulation.

### Last Accepted Offer (LAO) — Uniform Pricing

All dispatched generators are paid the **marginal cost** (the clearing price), regardless of their individual offer.

**Revenue per generator** = marginal cost x MW dispatched

This models real-world uniform-price auctions (used in most U.S. wholesale markets like ERCOT). Key strategic implications:

- Generators with low offers dispatched below the clearing price earn a **surplus** (revenue above their cost).
- There is incentive to offer near or above your cost, since the clearing price is set by the most expensive dispatched unit.
- Offering too high risks not being dispatched at all.

**Example:** Three generators are dispatched at offers of $20, $35, and $50. The clearing price is $50. All three are paid $50/MW.

### Pay As Offered (PAO) — Discriminatory Pricing

Each dispatched generator is paid its **own offer price**.

**Revenue per generator** = generator's offer x MW dispatched

This models pay-as-bid auctions. Key strategic implications:

- There is no surplus from the clearing price — you earn exactly what you offer.
- Offering at cost yields zero profit. Players must offer above cost to profit.
- Players must **guess** what the clearing price will be to set profitable offers without pricing themselves out.

**Example:** Three generators are dispatched at offers of $20, $35, and $50. Each is paid its own offer: $20/MW, $35/MW, and $50/MW respectively.

### Comparison

| Aspect                     | LAO (Uniform)                  | PAO (Discriminatory)                      |
| -------------------------- | ------------------------------ | ----------------------------------------- |
| Payment basis              | Clearing price (marginal cost) | Each generator's own offer                |
| Low-cost generator surplus | Yes — paid above their offer   | No — paid exactly their offer             |
| Optimal strategy           | Offer near true cost           | Offer above cost, estimate clearing price |
| Real-world analogue        | ERCOT, PJM, most U.S. ISOs     | UK Balancing Mechanism, some gas markets  |

## Financial Calculations

For each dispatched generator in a period:

- **Revenue** = (payment price) x (MW dispatched)
  - LAO: payment price = marginal cost
  - PAO: payment price = generator's offer
- **Costs** = generator's production cost x MW dispatched
- **Profit** = revenue - costs
- **Money** = cumulative total across all periods (starts at the configured starting money)

## Generator Presets

Each player receives an identical portfolio based on the selected preset.

### Standard (5 generators, 100 MW total)

| Capacity | Production Cost |
| -------- | --------------- |
| 50 MW    | $20/MW          |
| 20 MW    | $30/MW          |
| 10 MW    | $40/MW          |
| 10 MW    | $50/MW          |
| 10 MW    | $65/MW          |

### Simple (3 generators, 100 MW total)

| Capacity | Production Cost |
| -------- | --------------- |
| 50 MW    | $20/MW          |
| 30 MW    | $35/MW          |
| 20 MW    | $55/MW          |

### Competitive (7 generators, 100 MW total)

| Capacity | Production Cost |
| -------- | --------------- |
| 30 MW    | $15/MW          |
| 20 MW    | $25/MW          |
| 15 MW    | $30/MW          |
| 10 MW    | $40/MW          |
| 10 MW    | $50/MW          |
| 10 MW    | $60/MW          |
| 5 MW     | $75/MW          |

### Default Offers

When a game starts, each generator's initial offer is set to its **production cost**. This means a completely passive player (one who never changes their offers) will have different outcomes depending on the payment method:

- **LAO:** A passive player's generators are dispatched at cost and paid the clearing price. They still earn profit whenever the clearing price exceeds their cost — which is common for low-cost generators.
- **PAO:** A passive player's generators are dispatched at cost and paid exactly that cost. Revenue equals cost, so profit is **$0** every period.

This asymmetry is intentional and illustrates a key difference between uniform and discriminatory pricing.

## Load Profiles

Load (demand) varies each period based on a 24-hour cycle that repeats. The formula is:

**Load = floor(number of players x 100 x profile multiplier)**

Each player contributes a base of 100 MW of potential demand, scaled by the profile.

### Realistic

Models a typical daily demand curve with morning and evening peaks and an overnight valley. Multipliers range from ~0.44 to ~0.85.

### Flat

Constant demand at 65% of capacity every period. Useful for isolating pricing strategy from demand variability.

### Peak

Extreme peaks (up to 95%) and deep valleys (down to 30%). Tests how players respond to dramatic demand swings.

### Volatile

Demand jumps unpredictably between 30% and 95% with no smooth pattern. Tests adaptability under uncertainty.

### Load Cycling

The profile repeats on a 24-period cycle: `profile[(periodNumber - 1) % 24]`. A 48-period game plays through the profile twice. Players who memorize the pattern can anticipate demand.

### Load Jitter

When **load jitter** is enabled (1–30%), each period's actual demand is randomly varied from the profile value by up to ±X%. The forecast shown to players uses the base profile value (no jitter), so there is a surprise element at clearing time. This reduces the advantage of memorizing the load profile.

## Instructor Features

- **Auto-advance timer** — periods advance automatically on a configurable countdown (default 180 seconds). Can be toggled on/off mid-game; re-enabling restarts the full countdown.
- **Manual advance** — clear the current period at any time.
- **Remove players** — during the lobby phase.
- **Adjust balances** — add or subtract money during a running or completed game.
- **Visibility** — public markets appear in the market list; unlisted markets are joined with a copied link.
- **Settings** — every game parameter is editable in the lobby and locked once the game starts.
- **CSV export** — download the period-by-period data for all players and generators.
- **Delete market** — removes the market and its data. Markets are also deleted automatically 48 hours after their last activity.

## Player Features

- **Offer submission** — set and update offers until the period clears.
- **Period results** — clearing price, load, and your profit for every period.
- **Results chart** — revenue, profit, load, and clearing price per period.
- **Rank** — your position among all players; other players' balances stay hidden.
- **Auto-reconnect** — a dropped connection reconnects automatically, and a page refresh resumes the session.

### Information Visibility

Players see only their own balance, generators, and period results. Other players' balances, offers, and dispatch are hidden.

### Offer Validation

Offers are clamped to `[0, offer cap]`. Malformed submissions and offers for a period that has already cleared are rejected.
