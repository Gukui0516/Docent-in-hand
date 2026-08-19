# 📍 Project Guidelines (Docent-in-hand)

이 파일은 이 리포지토리의 협업 및 개발 규칙을 정의합니다. 에이전트(Gemini CLI)는 작업을 수행할 때 반드시 이 규칙을 준수해야 합니다.

## 🌿 Git & 브랜치 전략 (Branching Strategy)
- **메인 브랜치 직접 작업 금지**: `main` 브랜치에 직접 코드를 작성하거나 커밋을 푸시해서는 안 됩니다.
- **기능별 브랜치 사용 (Feature Branches)**: 새로운 기능을 개발하거나 버그를 수정할 때는 **항상 기능별 전용 브랜치**를 먼저 분리(예: `feature/something` 또는 `bugfix/something`)한 뒤 작업을 진행해야 합니다.
- **Pull Request(PR) 활용**: 기능 구현 완료 후에는 PR을 통해 `main` 브랜치로 병합되도록 유도합니다.
