# Schema: 01-screens.md

Output file for Step 1.2a — Screen / UI Discovery.

---

```markdown
# Screen Discovery

**Analyzed:** <ISO datetime>

## Summary

| Field | Value |
|-------|-------|
| Total Screens | N |
| Main Areas | auth · dashboard · settings · admin · ... |
| Routing Approach | React Router v6 / Next.js App Router / etc. |
| Route Guards | Yes — JWT check on all /dashboard/* routes / No |

## Screen Inventory

| ID   | Name | Route / Path | Area | User Role | Purpose |
|------|------|-------------|------|-----------|---------|
| S-01 | Login | /login | auth | guest | User enters credentials to authenticate |
| S-02 | Dashboard | /dashboard | main | authenticated | Overview of key metrics and recent activity |

## Navigation Notes

<Describe layout wrappers, nested routes, modal routing, dynamic routes with params, or any unusual navigation patterns.>
```
