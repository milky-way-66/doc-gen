# Schema: 03-database.md

Output file for Step 1.2c — Database / Entity Discovery.

---

```markdown
# Database Discovery

**Analyzed:** <ISO datetime>

## Summary

| Field | Value |
|-------|-------|
| DBMS | PostgreSQL / MySQL / MongoDB / SQLite / etc. |
| ORM / Query Builder | Prisma / TypeORM / Sequelize / SQLAlchemy / etc. |
| Total Entities / Tables | N |
| Migration Tool | Prisma Migrate / Flyway / Alembic / etc. |
| Soft Delete Pattern | Yes — `deleted_at` timestamp / No |
| Audit Fields | `created_at`, `updated_at` on all tables / No |

## Entity Inventory

| Entity | Table Name | Purpose | Key Fields | Relationships |
|--------|-----------|---------|-----------|--------------|
| User | users | Stores registered user accounts | id, email, password_hash, role | hasMany Order, hasMany Session |
| Order | orders | Customer purchase orders | id, user_id, status, total | belongsTo User, hasMany OrderItem |

## Notes

<Describe UUID vs integer PKs, ENUM fields, JSONB/JSON columns, full-text search config, partitioning, read replicas, or multi-tenancy patterns.>
```
