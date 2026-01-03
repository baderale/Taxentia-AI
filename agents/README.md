# Taxentia AI - Specialized Review Agents

This directory contains the specialized AI agents that automatically review code changes for quality, compliance, and best practices.

## Quick Start

### Prerequisites

- Node.js and npm installed
- Claude Agent SDK installed (`npm install @anthropic-ai/claude-agent-sdk`)
- Anthropic API key configured in environment

### Basic Usage

```bash
# Run tax compliance review on a specific file
npx tsx agents/run-agent.ts tax server/services/hybrid-llm-service.ts

# Run UI/UX review on the application
npx tsx agents/run-agent.ts ui http://localhost:5173

# Run backend code review
npx tsx agents/run-agent.ts backend server/routes.ts

# Run all agents in sequence
npx tsx agents/run-agent.ts all
```

## Available Agents

### 1. IRS/Tax Consultant Agent

**Purpose**: Ensures tax calculation accuracy and regulatory compliance

**What it reviews:**
- Tax calculation logic and formulas
- IRC/CFR authority references
- Confidence scoring accuracy
- Legal disclaimers and scope assumptions
- Compliance with tax regulations

**When to use:**
```bash
# After modifying tax calculation logic
npx tsx agents/run-agent.ts tax server/services/hybrid-llm-service.ts

# After updating authority retrieval
npx tsx agents/run-agent.ts tax server/services/qdrant-service.ts

# After changing response schema
npx tsx agents/run-agent.ts tax shared/taxResponseSchema.ts

# Review all tax-related changes
npx tsx agents/run-agent.ts tax .
```

**Example output:**
```
==============================================================
  IRS/TAX CONSULTANT AGENT
==============================================================
Starting IRS/Tax Consultant review...
Model: claude-opus-4-5-20251101

## Tax Compliance Review: server/services/hybrid-llm-service.ts

### CRITICAL ISSUES

1. **IRC Citation Format Inconsistency**
   - **Severity**: High
   - **Location**: Line 142
   - **Issue**: IRC section referenced as "162(a)" should be "IRC §162(a)"
   - **Regulatory Basis**: Bluebook citation standards for legal documents
   - **Fix**: Update citation format to include "IRC §" prefix

   ```typescript
   // Before
   const citation = "162(a)";

   // After
   const citation = "IRC §162(a)";
   ```

2. **Confidence Score Calculation**
   - **Severity**: Medium
   - **Location**: Lines 230-245
   - **Issue**: Confidence score doesn't account for conflicting authority
   - **Recommendation**: Reduce confidence when multiple authorities conflict

   [Additional findings...]

✅ Tax Consultant review complete
```

---

### 2. UI/UX Reviewer Agent

**Purpose**: Analyzes visual design, usability, and accessibility compliance

**What it reviews:**
- WCAG 2.1 AA accessibility compliance
- Responsive design across breakpoints
- Color contrast ratios
- Keyboard navigation
- Visual design consistency
- User experience patterns

**When to use:**
```bash
# Review the landing page
npx tsx agents/run-agent.ts ui http://localhost:5173

# Review the tax query interface
npx tsx agents/run-agent.ts ui http://localhost:5173/query

# Review a specific component (requires local server running)
npx tsx agents/run-agent.ts ui http://localhost:5173
```

**Example output:**
```
==============================================================
  UI/UX REVIEWER AGENT
==============================================================
Starting UI/UX review...
Model: claude-opus-4-5-20251101
Target: http://localhost:5173

## UI/UX Review Report

### CRITICAL ISSUES

1. **Color Contrast Violation (WCAG 2.1 AA)**
   - **Category**: Accessibility
   - **Severity**: Critical
   - **WCAG Criterion**: 1.4.3 Contrast (Minimum)
   - **Location**: Submit button on query form
   - **Issue**: Contrast ratio 2.8:1 (requires 4.5:1 minimum)
   - **Colors**: #64B5F6 text on #FFFFFF background
   - **Fix**:
   ```css
   .submit-button {
     /* Before: #64B5F6 */
     color: #1976D2; /* Contrast: 4.52:1 ✅ */
   }
   ```

2. **Missing Keyboard Navigation**
   - **Category**: Accessibility
   - **Severity**: Critical
   - **Issue**: Citation panel cannot be navigated with keyboard
   - **Fix**: Add tabIndex and keyboard handlers

   [Additional findings with screenshots...]

### MAJOR ISSUES

1. **Mobile Responsiveness**
   - **Category**: Responsive Design
   - **Severity**: Major
   - **Breakpoint**: 375px (mobile)
   - **Issue**: Query history panel overlaps chat interface
   - **Fix**: Implement stacked layout for mobile viewports

   [Additional findings...]

✅ UI/UX review complete
```

---

### 3. Backend Developer Expert Agent

**Purpose**: Reviews backend code for functionality, performance, and security

**What it reviews:**
- Code correctness and logic errors
- Security vulnerabilities (SQL injection, XSS, auth bypass)
- Performance bottlenecks (N+1 queries, inefficient algorithms)
- Database query optimization
- Error handling and logging
- API design and validation
- Integration with external services

**When to use:**
```bash
# Review a specific service
npx tsx agents/run-agent.ts backend server/services/hybrid-llm-service.ts

# Review API routes
npx tsx agents/run-agent.ts backend server/routes.ts

# Review database operations
npx tsx agents/run-agent.ts backend server/storage.ts

# Review multiple files
npx tsx agents/run-agent.ts backend "server/services/*.ts"
```

**Example output:**
```
==============================================================
  BACKEND DEVELOPER EXPERT AGENT
==============================================================
Starting Backend Developer review...
Model: claude-opus-4-5-20251101
Target files: server/services/hybrid-llm-service.ts

## Backend Code Review

### CRITICAL ISSUES

1. **SQL Injection Vulnerability**
   - **Category**: Security
   - **Severity**: Critical
   - **Location**: server/storage.ts:89
   - **Issue**: User input concatenated directly into SQL query
   - **Risk**: Attacker could execute arbitrary SQL commands
   - **Fix**:
   ```typescript
   // Before (VULNERABLE)
   const query = `SELECT * FROM queries WHERE userId = '${userId}'`;

   // After (SECURE)
   const query = db.select().from(queries).where(eq(queries.userId, userId));
   ```

2. **Unhandled Promise Rejection**
   - **Category**: Functionality
   - **Severity**: High
   - **Location**: server/services/qdrant-service.ts:142
   - **Issue**: Qdrant query failure not caught
   - **Impact**: Server crash on vector DB timeout
   - **Fix**: Add try/catch with fallback

   [Additional findings...]

### HIGH PRIORITY

1. **N+1 Query Problem**
   - **Category**: Performance
   - **Severity**: High
   - **Location**: server/routes.ts:67-82
   - **Issue**: Loading authorities in a loop (N+1 queries)
   - **Impact**: 500ms+ response time for 5 authorities
   - **Fix**: Use batch loading with single query

   [Additional findings...]

### TEST RESULTS

Running: npm test
✅ All 24 tests passed
⚠️  Code coverage: 67% (target: 80%)

✅ Backend Developer review complete
```

---

## Running All Agents

To run a comprehensive review with all three agents:

```bash
npx tsx agents/run-agent.ts all
```

This will:
1. Run tax compliance review on recent backend changes
2. Run UI/UX review on http://localhost:5173
3. Run backend code review on all server files

**Expected duration**: 5-15 minutes depending on scope

---

## Automatic Agent Triggering

Agents can run automatically via hooks when you edit files.

### How Hooks Work

When you use the `Edit` or `Write` tools in Claude Code, the hook system:
1. Detects which file was modified
2. Matches the file pattern against agent triggers
3. Recommends running the appropriate agent

### Hook Configuration

Located in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cmd /c D:\\Taxentia-AI\\.claude\\hooks\\auto-agent-trigger.bat \"$TOOL_NAME\" \"$TOOL_INPUT_file_path\""
          }
        ]
      }
    ]
  }
}
```

### Example Hook Output

```
[Hook] Tax compliance review recommended for: server/services/hybrid-llm-service.ts
[Hook] Run: npx tsx agents/run-agent.ts tax "server/services/hybrid-llm-service.ts"
```

**Note**: Hooks are non-blocking and informational only. They won't interrupt your workflow.

---

## Integration with Development Workflow

### Recommended Workflow

```bash
# 1. Start development server
npm run dev

# 2. Make code changes
# ... edit files ...

# 3. Run relevant agent review
npx tsx agents/run-agent.ts tax server/services/hybrid-llm-service.ts

# 4. Fix any critical/high issues
# ... apply recommended fixes ...

# 5. Re-run agent to verify
npx tsx agents/run-agent.ts tax server/services/hybrid-llm-service.ts

# 6. Run tests
npm test

# 7. Run all agents before committing
npx tsx agents/run-agent.ts all

# 8. Commit changes
git add .
git commit -m "feat: improve tax calculation logic"
```

---

## Agent Configuration

### Agent Definitions

Agent configuration files are located in `.claude/agents/`:

- `irs-tax-consultant.json` - Tax compliance agent
- `ui-ux-reviewer.json` - UI/UX review agent
- `backend-developer.json` - Backend code review agent

### Customizing Agents

Each agent configuration includes:

```json
{
  "name": "agent-name",
  "description": "Agent description",
  "model": "claude-opus-4-5-20251101",
  "instructions": "Detailed system prompt with expertise...",
  "tools": ["Read", "Edit", "Glob", "Grep", "Bash"],
  "permissions": "acceptEdits",
  "mcpServers": ["playwright"]
}
```

**To customize:**
1. Edit the `.json` file for the agent
2. Modify the `instructions` field to adjust review criteria
3. Save the file (changes take effect immediately)

---

## Troubleshooting

### Agent Not Running

**Problem**: `npx tsx agents/run-agent.ts tax file.ts` fails

**Solutions**:
1. Ensure Claude Agent SDK is installed:
   ```bash
   npm install @anthropic-ai/claude-agent-sdk
   ```

2. Verify TypeScript is available:
   ```bash
   npx tsx --version
   ```

3. Check that agent configuration exists:
   ```bash
   ls .claude/agents/
   ```

### Playwright Issues (UI/UX Agent)

**Problem**: UI/UX agent fails with Playwright errors

**Solutions**:
1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. Ensure development server is running:
   ```bash
   npm run dev
   ```

3. Verify the URL is accessible:
   ```bash
   curl http://localhost:5173
   ```

### Agent Timeout

**Problem**: Agent runs for too long and times out

**Solutions**:
1. Review smaller file scopes:
   ```bash
   # Instead of reviewing entire directory
   npx tsx agents/run-agent.ts backend .

   # Review specific files
   npx tsx agents/run-agent.ts backend server/routes.ts
   ```

2. Increase timeout in `agents/run-agent.ts` (advanced)

---

## Best Practices

### 1. Run Agents Before Committing

Always run `npx tsx agents/run-agent.ts all` before creating a commit to catch issues early.

### 2. Prioritize Critical Issues

Focus on fixing Critical and High severity issues first. Medium and Low can be addressed iteratively.

### 3. Review Agent Recommendations

Agents provide expert recommendations, but you make the final decision. Not all suggestions need to be implemented immediately.

### 4. Use Agents Iteratively

After fixing issues, re-run the agent to verify your changes and catch any new problems introduced.

### 5. Customize for Your Needs

Edit agent configuration files to adjust review criteria, add domain-specific checks, or change severity thresholds.

### 6. Document Agent Findings

When agents identify issues, document them in code comments or issue tracker for team awareness.

---

## Testing the Agent System

### Test Tax Consultant Agent

```bash
# Create a test file with intentional issues
cat > server/test-tax-issue.ts << 'EOF'
// Test file with tax compliance issues
export function calculateTax(income: number) {
  // Missing IRC citation
  const standardDeduction = 12950;

  // Hardcoded confidence (should be calculated)
  return {
    taxOwed: income * 0.22,
    confidence: 85
  };
}
EOF

# Run tax agent
npx tsx agents/run-agent.ts tax server/test-tax-issue.ts

# Expected: Agent should flag missing IRC citation and hardcoded confidence
```

### Test UI/UX Agent

```bash
# Ensure dev server is running
npm run dev

# Run UI agent
npx tsx agents/run-agent.ts ui http://localhost:5173

# Expected: Agent should analyze landing page and provide accessibility feedback
```

### Test Backend Agent

```bash
# Run backend agent on existing file
npx tsx agents/run-agent.ts backend server/routes.ts

# Expected: Agent should review routes and provide security/performance feedback
```

---

## Extending the Agent System

### Creating a New Agent

1. **Create agent configuration**:
   ```bash
   touch .claude/agents/my-custom-agent.json
   ```

2. **Define agent configuration**:
   ```json
   {
     "name": "my-custom-agent",
     "description": "Custom agent description",
     "model": "claude-opus-4-5-20251101",
     "instructions": "You are a specialized agent that...",
     "tools": ["Read", "Edit", "Glob", "Grep", "Bash"],
     "permissions": "acceptEdits",
     "mcpServers": []
   }
   ```

3. **Add runner function** in `agents/run-agent.ts`:
   ```typescript
   async function runMyCustomAgent(target: string): Promise<void> {
     logSection('MY CUSTOM AGENT');
     const config = await loadAgentConfig('my-custom-agent');
     // ... implementation ...
   }
   ```

4. **Update switch statement** in `main()`:
   ```typescript
   case 'custom':
     await runMyCustomAgent(target);
     break;
   ```

5. **Update hook** in `.claude/hooks/auto-agent-trigger.bat` (optional)

---

## FAQ

### Q: Do agents modify my code automatically?

**A**: No, agents only provide recommendations. You decide which changes to implement.

### Q: How long do agent reviews take?

**A**:
- Single file: 30 seconds - 2 minutes
- Multiple files: 2-5 minutes
- All agents: 5-15 minutes

### Q: Can I run agents in CI/CD?

**A**: Yes, but you'll need to configure API keys and handle streaming output appropriately.

### Q: What model do agents use?

**A**: All agents use Claude Opus 4.5 (`claude-opus-4-5-20251101`) for highest quality reviews.

### Q: Can I disable specific agents?

**A**: Yes, simply don't run them. Or modify `.claude/hooks/auto-agent-trigger.bat` to remove recommendations.

### Q: Do agents have access to my API keys?

**A**: Agents run locally and only access files you specify. They use your configured Anthropic API key.

---

## Resources

- **Claude Agent SDK**: https://github.com/anthropics/claude-agent-sdk
- **Agent SDK Documentation**: https://docs.anthropic.com/agent-sdk
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **IRC Database**: https://www.law.cornell.edu/uscode/text/26
- **CFR Database**: https://www.ecfr.gov/current/title-26

---

## Support

For issues or questions about the agent system:

1. Check this README for troubleshooting steps
2. Review agent configuration in `.claude/agents/*.json`
3. Check CLAUDE.md for development guidelines
4. Create an issue in the project repository

---

**Last Updated**: 2025-01-03
**Version**: 1.0.0
