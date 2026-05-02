# 🔑 GitHub Deploy Key Setup

## Problem

The deployment is failing because the Droplet cannot clone the private repository:
```
git@github.com: Permission denied (publickey).
```

## Solution

Add the Droplet's SSH public key as a **Deploy Key** in your GitHub repository.

---

## Step 1: Get the Public Key from Droplet

The public key is already in `~/.ssh/authorized_keys` on the Droplet. We need to extract it:

```bash
# On your Droplet
cat ~/.ssh/authorized_keys
```

You should see something like:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCdsbmy6raM/fDEZYdSycwaxcgzuEc1L7gWC5IxCROtiYS9DV8OjWVXCqNuMXLf/mu4g/T2HH
```

Copy this entire line (it's the public key).

---

## Step 2: Add as Deploy Key in GitHub

1. Go to your GitHub repository: https://github.com/EVzone-Group-Dev/livedealzbackend
2. Click **Settings** (top right)
3. Click **Deploy keys** (left sidebar)
4. Click **Add deploy key**
5. Fill in:
   - **Title**: `livedealzdrop` (or any name)
   - **Key**: Paste the public key from Step 1
   - ✅ **Allow write access** (check this if you want deployments to push)
6. Click **Add key**

---

## Step 3: Test

The next time you push to `main`, GitHub Actions will:
1. SSH to Droplet
2. Droplet will clone using its SSH key
3. Deployment succeeds! 🎉

---

## Alternative: Use GitHub Token

If you don't want to use Deploy Keys, you can use a GitHub Personal Access Token:

1. Create token: https://github.com/settings/tokens (with `repo` scope)
2. Store in GitHub Secrets as `GH_TOKEN`
3. Clone using: `https://${GH_TOKEN}@github.com/EVzone-Group-Dev/livedealzbackend.git`

But Deploy Keys are simpler and more secure! 🔒

---

## Quick Command

To get the public key from Droplet:

```bash
ssh root@143.244.153.27 "cat ~/.ssh/authorized_keys"
```

Copy the output and add it as a Deploy Key in GitHub.

---

**After adding the Deploy Key, automated deployment will work!** 🚀
