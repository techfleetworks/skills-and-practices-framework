# Changelog

This is the plain-language history of the Skills & Practices Framework. The newest
changes are at the top. When something is added, changed, or fixed in the data or the
docs, it gets written here so anyone can see how the framework has grown over time.

## How the version numbers work

Versions look like **1.2.3**. Reading left to right:

- The **first number** changes when we make a big change that could break how people
  already use the data (for example, renaming a field everyone depends on).
- The **second number** changes when we add something new without breaking anything
  (for example, a new set of workshops).
- The **third number** changes for small fixes (for example, correcting a typo or a
  broken link).

So a jump from 1.2.3 to 1.3.0 means "new stuff, safe to update," and a jump to 2.0.0
means "read the notes before you update."

---

## Unreleased

Work in progress toward the first public release.

**Added**
- The repository structure, licensing (CC BY 4.0 for the data, Apache-2.0 for the code),
  and contribution guide.
- The full data layer: 19 data files exported from the framework's database, covering the
  15 data types plus the workshop steps and template sections, each row given a stable
  slug and human-readable labels on every relationship.
- A plain-language README for each of the 15 data types.

**Coming next**
- The three Tech Fleet handbooks (Agile, Teammate, Project Success) pulled in as Markdown.
- A cleanup pass on the data and a schema that checks every relationship points somewhere real.
- A documented API and a docs website anyone can browse.
- A one-click way to refresh the published data whenever the database changes.

---

*The first tagged release (v1.0.0) will be cut when the framework goes public.*
