# Layered Payments Simulator — VISA? preset (single preset, full features)

This is a minimalist, client side simulator UI for stress testing layered Bitcoin payment designs. 
It keeps all the original features and removes every preset except one named VISA?. 
Use it to show whether a VISA scale scenario can be supported by a Lightning centered, multi layer stack.

## What this page does

- Sliders for population, activity, LN touch, graph envelope, and enforcement windows
- Live derived metrics
  - HTLC demand per second
  - Total HTLC slots and effective capacity per second
  - Slot utilization percent
  - L1 backstop load per day
  - Unsafe region flags for LN CSV and key layer CLTV windows
- Two charts drawn with canvas
  - HTLC demand vs capacity
  - L1 backlog vs enforcement window
- Shareable URL. State is embedded in the hash as Base64 JSON
- Export and Copy of the preset JSON for use in your simulator
- Only the VISA? preset is present

Everything runs in the browser. No build step, no dependencies.

## Quick start

Open the page locally or publish on GitHub Pages.

### Open locally
1. Download the repo ZIP and unzip it.  
2. Open `index.html` in your browser.

### Publish on GitHub Pages
1. Create a new repository on GitHub, for example `visa-pages-site`.
2. Upload `index.html` and `.nojekyll` from this folder.
3. Go to Settings -> Pages.
4. Under Build and deployment set Source to Deploy from a branch.
5. Choose Branch `main` and folder `/` (root). Save.
6. Wait for deploy. Your site will be at `https://<your-username>.github.io/<repo-name>/`.

Optional: add a `CNAME` file for a custom domain.

## The preset and parameters

The single preset is called VISA?. Its values initialize the UI. You can tweak them at runtime.

```json
{
  "id": "visa",
  "name": "VISA?",
  "values": {
    "users_millions": 100,
    "share_self_ln_pct": 33,
    "share_key_layer_pct": 25,
    "share_custodial_pct": 42,
    "payments_per_active_user_per_day": 1.5,
    "active_users_daily_pct": 60,
    "self_ln_touch_pct": 100,
    "self_ln_aggregation_ratio": 1,
    "key_layer_touch_ln_pct": 80,
    "key_layer_user_to_ln_aggregation_ratio": 8,
    "custodial_touch_ln_pct": 80,
    "custodial_aggregation_ratio": 200,
    "avg_path_hops": 4,
    "mpp_splits_per_payment": 6,
    "avg_inflight_seconds": 60,
    "network_routers_count": 300,
    "channels_per_router_avg": 150,
    "htlc_slots_per_channel": 211,
    "usable_slot_fraction_pct": 50,
    "min_htlc_sats": 1000,
    "self_ln_forced_closure_pct": 5,
    "key_layer_backstop_users_per_tx": 200,
    "key_layer_backstop_users_pct": 5,
    "l1_capacity_tx_per_day": 150000,
    "avg_tx_per_ln_channel_closure": 4,
    "user_channels_per_self_ln_user": 1,
    "self_ln_enforcement_window_days": 14,
    "key_layer_backstop_window_days": 30,
    "jamming_target_slot_pct": 50
  }
}
```

### What each group means

- Population and Activity
  - Users (millions), daily active percent, payments per active user
- LN demand mapping
  - Fractions that actually touch LN
  - Aggregation ratios that compress many end user payments into one HTLC
- LN graph envelope
  - Hops, MPP splits, average in flight seconds
  - Routers, channels per router, HTLC slots per channel
  - Usable slot fraction for safety headroom
- Enforcement and shock
  - Forced closure rate, key layer backstop users per transaction
  - L1 capacity per day and transaction cost per closure
- Enforcement windows
  - LN CSV window in days
  - Key layer CLTV backstop window in days
  - Jamming target percent if you want to simulate load on slots

## Derived metrics and simple math

The math is intentionally lightweight so it is easy to verify and port to your simulator.

- Map user activity to total payments per day
- Select the fractions that touch LN for self custodial, key layer, and custodial cohorts
- Apply aggregation ratios to convert payments into HTLC attempts
- HTLC demand per second is HTLC per day divided by 86400
- Capacity per second is effective slots divided by average in flight seconds  
  Effective slots = routers * channels per router * htlc slots per channel * usable fraction
- Utilization is demand per second divided by capacity per second
- L1 backstop load per day = key layer backstop users divided by users per tx + forced LN closures multiplied by transactions per closure
- Backlog and window plots compare L1 load per day vs assumed L1 throughput per day and simulate accumulation over the window

These formulas give order of magnitude intuition and are not a protocol implementation.

## Sharing and exporting

- Shareable URL: click Copy Shareable Link. The current state is in the URL hash as Base64 JSON.
- Export JSON: click Export JSON, then Copy JSON. Paste into your simulator as a preset payload.

## Customization

Everything is one file, `index.html`.

- Change default values by editing the `presetVisa.values` object
- Change slider ranges by editing the schema array
- To add more presets later, add more objects and a selector. The current build intentionally keeps a single preset

## Troubleshooting

- If copy to clipboard fails, the page falls back to a hidden textarea and a user gesture copy
- If charts do not draw, ensure your browser allows canvas in a local file context
- If GitHub Pages does not serve the index, make sure `.nojekyll` is present and Pages is set to use the root of the main branch

## License

MIT. Use it, fork it, change it.

## Credits

Authored for simulation and communication about LN and layered payment scaling limits.
