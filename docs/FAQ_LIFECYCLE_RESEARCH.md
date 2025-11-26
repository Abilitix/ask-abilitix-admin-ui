# FAQ Lifecycle Management - Industry Research & Best Practices

**Date:** 2025-01-20  
**Purpose:** Research on real-world approaches to FAQ generation, approval workflows, and lifecycle management

---

## Executive Summary

After researching competitor approaches to FAQ/Knowledge Base management, we've identified that our proposed **"Deactivate + Create New"** approach aligns with enterprise-grade systems and offers significant advantages over direct editing approaches used by consumer-facing tools.

---

## 1. GetGuru - SME Review Workflow

### Approach
GetGuru uses a **"Send for Review"** workflow for AI-generated answers:

- **AI-generated answers** can be flagged for SME (Subject Matter Expert) review
- **Review queue**: Answers pending approval appear in an inbox
- **Approval process**: SME can approve, edit, or reject
- **Once approved**: Answer becomes part of the knowledge base
- **Versioning**: Maintains history of changes

### Key Insight
They use a **review queue (similar to your inbox)** before answers go live.

**✅ Our Status:** We have this pattern implemented

---

## 2. Common Industry Patterns

### Pattern A: Inbox/Review Queue (Most Common)

```
AI generates answer → Send to inbox → Human reviews → Approve/Edit/Reject → Goes live
```

**Used by:**
- GetGuru (SME review)
- Intercom (answer quality review)
- Zendesk (knowledge base article review)
- Drift (AI answer approval)

**✅ Our Approach:** Matches this pattern

---

### Pattern B: Direct Edit with Versioning

```
AI generates answer → Human edits directly → Version history maintained → Goes live
```

**Used by:**
- Confluence (page versioning)
- Notion (page history)
- ServiceNow (knowledge article versioning)

**Trade-off:** More complex versioning, but allows direct edits

---

### Pattern C: Immutable Versioning (Deactivate + Create New)

```
Create new version → Old version deactivated → New version active → History preserved
```

**Used by:**
- Git-based systems (Confluence with Git sync)
- Some enterprise KB systems (immutable audit trail)
- Document management systems (legal/compliance)

**✅ Our Approach:** This is what we're proposing

---

## 3. FAQ Lifecycle Management - Real-World Approaches

### Approach 1: Edit In Place (Most Common)

**Pros:**
- Simple UX
- Familiar workflow

**Cons:**
- Complex versioning
- Cache invalidation complexity
- Embedding regeneration needed

**Used by:** Zendesk, Freshworks, most KB platforms

---

### Approach 2: Deactivate + Create New (Our Proposal)

**Pros:**
- Simpler implementation
- Immutable history
- No cache issues
- No embedding regeneration needed

**Cons:**
- Slightly more database records
- Need to filter by `active=true`

**Used by:** Enterprise systems requiring audit trails, Git-based systems

**✅ Our Approach:** This is our recommended pattern

---

### Approach 3: Draft → Publish Workflow

**Pros:**
- Can preview before publishing
- Staged changes

**Cons:**
- More complex state management

**Used by:** WordPress, Drupal, some enterprise KBs

---

## 4. What Competitors Typically Do

### For AI-Generated Answers:

1. ✅ **Review queue (inbox)** - We have this
2. ✅ **Approve/Edit/Reject workflow** - We have this
3. ✅ **Once approved → becomes FAQ** - We have this
4. ⚠️ **Edit capability after approval** - This is where approaches differ

### For FAQ Management After Approval:

**Most Competitors (Zendesk, Intercom, etc.):**
- Allow direct editing
- Maintain version history
- Handle cache invalidation automatically
- Regenerate embeddings on question change

**Enterprise/Compliance-Focused (ServiceNow, some Confluence setups):**
- Prefer immutable versioning
- Deactivate old, create new
- Better audit trail
- Simpler implementation

---

## 5. Recommendation: Our Approach is Solid

### Why Deactivate + Create New Works Well:

1. **Matches Enterprise Patterns**
   - Used by compliance-focused systems
   - Better audit trail
   - Simpler to implement

2. **Aligns with Our Architecture**
   - No complex cache invalidation
   - No embedding regeneration logic
   - Natural version history

3. **Real-World Validation**
   - Git-based systems use this pattern
   - Document management systems use this
   - Legal/compliance systems prefer this

4. **User Experience**
   - "Create new version" is clear
   - Can preview before deactivating old
   - Can revert easily (reactivate old)

---

## 6. Competitive Comparison Table

| Feature | GetGuru | Zendesk | Intercom | Our Approach |
|---------|---------|---------|----------|--------------|
| AI answer review queue | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Approve → FAQ | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Edit after approval | ✅ Direct edit | ✅ Direct edit | ✅ Direct edit | ⚠️ Deactivate + create |
| Version history | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (immutable) |
| Audit trail | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited | ✅ Strong |
| Cache invalidation | ⚠️ Complex | ⚠️ Complex | ⚠️ Complex | ✅ Simple (none needed) |
| Embedding regeneration | ⚠️ Required | ⚠️ Required | ⚠️ Required | ✅ Automatic (new FAQ) |

---

## 7. Conclusion

**Our approach (Deactivate + Create New) is:**
- ✅ Used by enterprise systems
- ✅ Simpler to implement
- ✅ Better for compliance/audit
- ✅ Matches our architecture

**The only difference:** Most consumer-facing tools allow direct editing, but enterprise/compliance systems prefer immutable versioning.

**Recommendation:** Proceed with immutable versioning approach (deactivate + create new) as it aligns with enterprise best practices and our technical architecture.

---

## 8. Implementation Benefits

### Technical Benefits:
- **No cache invalidation complexity** - Old FAQ stays cached, new FAQ gets fresh cache
- **No embedding regeneration** - New FAQ gets new embeddings automatically
- **Simpler API** - No edit endpoints, just create/deactivate
- **Natural version history** - All versions preserved automatically

### Business Benefits:
- **Better audit trail** - Can see all changes over time
- **Compliance-friendly** - Immutable records for regulatory requirements
- **Safer** - No risk of breaking existing FAQ while editing
- **Can revert easily** - Reactivate old version if needed

### User Experience Benefits:
- **Clear workflow** - "Create new version" is intuitive
- **Preview before publish** - Test new FAQ before deactivating old
- **History visible** - Can see all versions of a FAQ

---

## References

- GetGuru: SME Review Workflow
- Zendesk: Knowledge Base Management
- Intercom: AI Answer Quality Review
- ServiceNow: Knowledge Article Versioning
- Confluence: Page Versioning
- Enterprise Document Management Systems: Immutable Audit Trails

---

**Last Updated:** 2025-01-20  
**Status:** ✅ Research Complete - Ready for Implementation





