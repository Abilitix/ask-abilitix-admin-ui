# Quick Rollback Reference

**Tag:** `v1.0.0-before-faq-creation`  
**Rollback Time:** < 1 minute

---

## 🚨 Emergency Rollback (Copy-Paste)

### Fastest Rollback (If no one else pulled):
```bash
git checkout main
git reset --hard v1.0.0-before-faq-creation
git push origin main --force
```
**⏱️ Time:** < 30 seconds

### Safe Rollback (If others may have pulled):
```bash
git checkout main
git revert HEAD -m 1
git push origin main
```
**⏱️ Time:** < 1 minute

---

## ✅ Verify Rollback

```bash
# Check current commit
git log -1 --oneline

# Should show tag commit or revert commit
```

---

## 📞 Need Help?

1. Check tag exists: `git tag -l "v1.0.0-before-faq-creation"`
2. See full plan: `docs/SAFE_DEPLOYMENT_PLAN.md`





