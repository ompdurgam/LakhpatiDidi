# Dummy district logins (all 33 districts of Chhattisgarh)

`district-logins.csv` — one district officer (DPM, role `district`) per district, for
testing the app district by district. **Dummy data for development only.**

| Column | Meaning |
|---|---|
| `district_lgd` | LGD district code (links to the geography and map) |
| `district`, `district_hindi` | District name in English and Hindi |
| `role` | `district` — pick the **जिला / District** card on the login screen |
| `login_name` | Name shown after login |
| `mobile` | The login. Generated as `9100` + 6-digit LGD code (Raipur 387 → `9100000387`) |
| `designation` | `DPM` |

## How to log in

There is no password. Pick the **District** card, enter the `mobile`, press *Send OTP*, and
type the OTP. With `OTP_DEV_MODE=true` (the default in `.env`) the OTP is shown on the
login screen, so no SMS is needed. Each number allows 5 OTP requests per 15 minutes.

After login the sidebar, header and **Map** open on that officer's own district.

Bastar already had a district officer (सीमा बघेल, `9301245176`), so it keeps her.

## Regenerate

```bash
npm run geo:lgd                  # districts must exist with LGD codes
npm run seed:district-logins     # creates missing logins (idempotent) and rewrites the CSV
```

Turn this off in production: these accounts exist only for testing. Remove them with
`DELETE FROM master_users WHERE mobile LIKE '9100%'` (apart from real officers' numbers).
