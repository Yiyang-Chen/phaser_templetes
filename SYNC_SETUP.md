# Template Sync Setup Guide

This repository automatically syncs individual templates to separate repositories using GitHub Actions.

## Setup Instructions

### 1. Create Individual Template Repositories

Create these repositories on GitHub:
- `Yiyang-Chen/2Dplatformer-template`
- `Yiyang-Chen/BaseTemplete-template`
- `Yiyang-Chen/2DTopDown_template`

### 2. Configure GitHub Secrets

In your main repository settings, add these secrets:

1. Go to Settings → Secrets and variables → Actions
2. Add a new repository secret:
   - Name: `TARGET_REPO_TOKEN`
   - Value: Your GitHub Personal Access Token (with repo permissions)

### 3. Update game.py Configuration

Update the agent configuration to use the individual template repositories:

```python
<2d_tilemap_game_development>
If the user wants to develop a 2D tilemap game, use: https://github.com/Yiyang-Chen/2Dplatformer-template.git
</2d_tilemap_game_development>

<2d_topdown_game_development>
If the user wants to develop a 2D top-down game, use: https://github.com/Yiyang-Chen/2DTopDown_template.git
</2d_topdown_game_development>

<general_game_development>
If there is no recorded game type, use: https://github.com/Yiyang-Chen/BaseTemplete-template.git
</general_game_development>
```

## How It Works

1. When you push changes to `2Dplatformer/`, `BaseTemplete/` or `2DTopDown/` directories
2. GitHub Actions automatically triggers
3. The workflow syncs the changes to the corresponding template repository
4. Agents can then clone the individual template repositories directly

## Manual Sync

You can also trigger manual sync by:
1. Going to Actions tab in your repository
2. Selecting "Sync Templates to Individual Repositories"
3. Clicking "Run workflow"

## Benefits

- ✅ Single source of truth (main repository)
- ✅ Individual template repositories for easy cloning
- ✅ Automatic synchronization
- ✅ Clean separation of concerns
- ✅ Easy to add new templates
