# Git Flow Workflow - WVideos Frontend

## Tổng quan

Dự án sử dụng Git Flow workflow để quản lý source code một cách có tổ chức và hiệu quả.

## Các Branch chính

### 1. master (Production)
- Branch chứa code production
- Chỉ merge từ release hoặc hotfix branches
- Mỗi commit trên master là một version release
- Được tag với version number (v1.0.0, v1.1.0, ...)

### 2. develop (Development)
- Branch phát triển chính
- Tích hợp tất cả features đã hoàn thành
- Base branch cho tất cả feature branches
- Luôn ở trạng thái stable và có thể deploy

## Các Branch hỗ trợ

### 3. feature/* (Feature branches)
- Tạo từ: `develop`
- Merge về: `develop`
- Naming: `feature/ten-tinh-nang`
- Mục đích: Phát triển tính năng mới

**Ví dụ:**
- `feature/video-player`
- `feature/user-authentication`
- `feature/comment-system`

### 4. release/* (Release branches)
- Tạo từ: `develop`
- Merge về: `master` và `develop`
- Naming: `release/v1.0.0`
- Mục đích: Chuẩn bị cho production release

### 5. hotfix/* (Hotfix branches)
- Tạo từ: `master`
- Merge về: `master` và `develop`
- Naming: `hotfix/ten-bug`
- Mục đích: Fix bug khẩn cấp trên production

## Quy trình làm việc

### 1. Phát triển tính năng mới

```bash
# Checkout develop và pull latest
git checkout develop
git pull origin develop

# Tạo feature branch
git checkout -b feature/video-player

# Làm việc và commit
git add .
git commit -m 'feat: thêm video player component'

# Push lên remote
git push origin feature/video-player

# Tạo Pull Request trên GitHub
# Sau khi review, merge vào develop
```

### 2. Chuẩn bị Release

```bash
# Tạo release branch từ develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# Fix bugs, update version, update docs
git commit -m 'chore: chuẩn bị release v1.0.0'

# Merge vào master
git checkout master
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m 'Release version 1.0.0'

# Merge lại vào develop
git checkout develop
git merge --no-ff release/v1.0.0

# Push tất cả
git push origin master develop --tags

# Xóa release branch
git branch -d release/v1.0.0
```

### 3. Hotfix khẩn cấp

```bash
# Tạo hotfix branch từ master
git checkout master
git pull origin master
git checkout -b hotfix/fix-video-crash

# Fix bug
git commit -m 'fix: sửa lỗi video crash khi load'

# Merge vào master
git checkout master
git merge --no-ff hotfix/fix-video-crash
git tag -a v1.0.1 -m 'Hotfix version 1.0.1'

# Merge vào develop
git checkout develop
git merge --no-ff hotfix/fix-video-crash

# Push
git push origin master develop --tags

# Xóa hotfix branch
git branch -d hotfix/fix-video-crash
```

## Commit Message Convention

Sử dụng Conventional Commits format:

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

- **feat**: Thêm tính năng mới
- **fix**: Sửa bug
- **docs**: Thay đổi documentation
- **style**: Thay đổi formatting, không ảnh hưởng code logic
- **refactor**: Refactor code, không fix bug hay thêm feature
- **perf**: Cải thiện performance
- **test**: Thêm hoặc sửa tests
- **chore**: Thay đổi build process, dependencies, etc.

### Ví dụ

```bash
# Feature
git commit -m 'feat: thêm chức năng upload video'

# Bug fix
git commit -m 'fix: sửa lỗi video không play trên mobile'

# Documentation
git commit -m 'docs: cập nhật hướng dẫn cài đặt'

# Refactor
git commit -m 'refactor: tối ưu VideoCard component'

# Performance
git commit -m 'perf: lazy load video thumbnails'

# Chore
git commit -m 'chore: cập nhật dependencies'
```

## Best Practices

### 1. Branch Naming
- Sử dụng lowercase và dấu gạch ngang
- Tên ngắn gọn, mô tả rõ ràng
- Prefix đúng loại branch

### 2. Commits
- Commit nhỏ, tập trung vào một thay đổi
- Message rõ ràng, mô tả được thay đổi
- Sử dụng tiếng Việt cho message (theo quy định dự án)

### 3. Pull Requests
- Tạo PR khi feature hoàn thành
- Mô tả chi tiết thay đổi
- Request review từ team members
- Đảm bảo CI/CD pass

### 4. Merge Strategy
- Sử dụng `--no-ff` để giữ lịch sử branch
- Squash commits nếu có quá nhiều commits nhỏ
- Rebase feature branch trước khi merge

## Workflow Diagram

```
master     ─────●────────────●─────────●────
                │            │         │
                │            │         │
release    ─────┼────────●───┘         │
                │        │             │
                │        │             │
develop    ──●──┴──●─────┴──●──●───────┴────
             │     │        │  │
             │     │        │  │
feature    ──┴─────┘        └──┘
```

## Commands Cheat Sheet

```bash
# Xem tất cả branches
git branch -a

# Xem branch hiện tại
git branch

# Tạo và checkout branch mới
git checkout -b feature/new-feature

# Switch branch
git checkout develop

# Merge branch (no fast-forward)
git merge --no-ff feature/new-feature

# Xóa branch local
git branch -d feature/new-feature

# Xóa branch remote
git push origin --delete feature/new-feature

# Tạo tag
git tag -a v1.0.0 -m 'Version 1.0.0'

# Push tags
git push origin --tags

# Xem tags
git tag -l

# Pull với rebase
git pull --rebase origin develop

# Stash changes
git stash
git stash pop
```

## Troubleshooting

### Conflict khi merge

```bash
# Xem files conflict
git status

# Resolve conflicts trong editor
# Sau đó:
git add .
git commit -m 'fix: resolve merge conflicts'
```

### Undo commit

```bash
# Undo commit nhưng giữ changes
git reset --soft HEAD~1

# Undo commit và xóa changes
git reset --hard HEAD~1
```

### Revert commit đã push

```bash
# Tạo commit mới revert changes
git revert <commit-hash>
git push origin <branch>
```

## Liên hệ

Nếu có thắc mắc về Git Flow, liên hệ team lead hoặc tạo issue trên GitHub.
