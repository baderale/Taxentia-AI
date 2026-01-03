#!/usr/bin/env node
/**
 * Agent Runner - Executes specialized review agents for Taxentia
 *
 * Usage:
 *   npx tsx agents/run-agent.ts tax <file-or-directory>
 *   npx tsx agents/run-agent.ts ui <url>
 *   npx tsx agents/run-agent.ts backend <file-or-directory>
 *   npx tsx agents/run-agent.ts all
 */

import { query, ClaudeAgentOptions } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs/promises";
import * as path from "path";
import { execSync } from "child_process";

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

async function loadAgentConfig(agentName: string): Promise<any> {
  const configPath = path.join(process.cwd(), '.claude', 'agents', `${agentName}.json`);
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load agent config for ${agentName}: ${error}`);
  }
}

async function getChangedFiles(): Promise<string[]> {
  try {
    // Get files changed in the last commit or staged
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).trim();
    const unstaged = execSync('git diff --name-only', { encoding: 'utf-8' }).trim();
    const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf-8' }).trim();

    const files = new Set([
      ...staged.split('\n').filter(Boolean),
      ...unstaged.split('\n').filter(Boolean),
      ...untracked.split('\n').filter(Boolean),
    ]);

    return Array.from(files);
  } catch (error) {
    log('Warning: Could not get git changed files, using current directory', 'yellow');
    return [];
  }
}

async function runTaxConsultantAgent(target: string): Promise<void> {
  logSection('IRS/TAX CONSULTANT AGENT');

  const config = await loadAgentConfig('irs-tax-consultant');

  const prompt = target
    ? `Review the following for tax compliance and regulatory accuracy: ${target}

Focus on:
1. Tax calculation correctness
2. Authority reference accuracy (IRC, CFR, IRS guidance)
3. Compliance risk identification
4. Scope assumptions validation
5. Legal disclaimer adequacy

Provide specific IRC/CFR citations for any issues found.`
    : `Review recent code changes for tax compliance and regulatory accuracy.

Focus on:
1. Tax calculation correctness in server/services/hybrid-llm-service.ts
2. Authority reference handling
3. Response schema compliance (shared/taxResponseSchema.ts)
4. Confidence scoring accuracy
5. Legal disclaimer completeness

Provide a comprehensive compliance review with specific IRC/CFR citations.`;

  log('Starting IRS/Tax Consultant review...', 'blue');
  log(`Model: ${config.model}`, 'cyan');

  for await (const message of query({
    prompt,
    options: {
      allowedTools: config.tools || ["Read", "Edit", "Glob", "Grep", "Bash"],
      permissionMode: config.permissions || "acceptEdits",
      mcpServers: config.mcpServers || [],
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: config.instructions
      }
    } as ClaudeAgentOptions
  })) {
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if ("text" in block) {
          console.log(block.text);
        }
      }
    }
  }

  log('\n✅ Tax Consultant review complete', 'green');
}

async function runUIUXReviewerAgent(target: string): Promise<void> {
  logSection('UI/UX REVIEWER AGENT');

  const config = await loadAgentConfig('ui-ux-reviewer');

  const url = target || 'http://localhost:5173';

  const prompt = `Perform a comprehensive UI/UX review of the Taxentia application at ${url}.

Use Playwright to:
1. Navigate to the application and take screenshots at different viewport sizes (375px, 768px, 1440px)
2. Test keyboard navigation throughout the interface
3. Verify color contrast ratios (WCAG 2.1 AA: 4.5:1 for text, 3:1 for UI components)
4. Test interactive elements (buttons, forms, modals)
5. Check for console errors and network issues
6. Verify loading states and error handling

Focus on:
- Landing page conversion optimization
- Tax query interface usability
- Response readability and authority presentation
- Mobile responsiveness
- Accessibility (ARIA labels, keyboard navigation, screen reader support)

Provide findings organized by severity: Critical, Major, Minor.
Include specific WCAG violations and code-level recommendations.`;

  log('Starting UI/UX review...', 'blue');
  log(`Model: ${config.model}`, 'cyan');
  log(`Target: ${url}`, 'cyan');

  for await (const message of query({
    prompt,
    options: {
      allowedTools: config.tools || ["Read", "Edit", "Glob", "Bash"],
      permissionMode: config.permissions || "acceptEdits",
      mcpServers: config.mcpServers || ["playwright"],
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: config.instructions
      }
    } as ClaudeAgentOptions
  })) {
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if ("text" in block) {
          console.log(block.text);
        }
      }
    }
  }

  log('\n✅ UI/UX review complete', 'green');
}

async function runBackendDeveloperAgent(target: string): Promise<void> {
  logSection('BACKEND DEVELOPER EXPERT AGENT');

  const config = await loadAgentConfig('backend-developer');

  const changedFiles = target ? [target] : await getChangedFiles();
  const backendFiles = changedFiles.filter(f =>
    f.startsWith('server/') && (f.endsWith('.ts') || f.endsWith('.js'))
  );

  const filesList = backendFiles.length > 0
    ? backendFiles.join(', ')
    : 'server/services/hybrid-llm-service.ts, server/routes.ts, server/storage.ts';

  const prompt = `Review the following backend code for functionality, optimization, security, and best practices: ${filesList}

Perform these checks:
1. **Security**: SQL injection, XSS, authentication issues, secret exposure
2. **Performance**: N+1 queries, inefficient algorithms, blocking operations
3. **Functionality**: Logic correctness, edge case handling, error handling
4. **Code Quality**: Type safety, separation of concerns, maintainability
5. **Testing**: Run tests with 'npm test', verify TypeScript compilation

For the RAG pipeline:
- Check embedding generation efficiency
- Verify Qdrant query performance and similarity thresholds
- Review LLM prompt construction and response parsing
- Validate error handling for external services (OpenAI, Qdrant)

Provide findings organized by severity: Critical, High, Medium, Low.
Include specific file paths, line numbers, and code-level fixes.

After analysis, run tests and report results.`;

  log('Starting Backend Developer review...', 'blue');
  log(`Model: ${config.model}`, 'cyan');
  log(`Target files: ${filesList}`, 'cyan');

  for await (const message of query({
    prompt,
    options: {
      allowedTools: config.tools || ["Read", "Edit", "Glob", "Grep", "Bash"],
      permissionMode: config.permissions || "acceptEdits",
      mcpServers: config.mcpServers || [],
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: config.instructions
      }
    } as ClaudeAgentOptions
  })) {
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if ("text" in block) {
          console.log(block.text);
        }
      }
    }
  }

  log('\n✅ Backend Developer review complete', 'green');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('Usage:', 'yellow');
    log('  npx tsx agents/run-agent.ts tax <file-or-directory>   - Run tax compliance review');
    log('  npx tsx agents/run-agent.ts ui <url>                  - Run UI/UX review');
    log('  npx tsx agents/run-agent.ts backend <file-or-directory> - Run backend code review');
    log('  npx tsx agents/run-agent.ts all                       - Run all agents\n');
    process.exit(1);
  }

  const [agentType, ...targets] = args;
  const target = targets.join(' ');

  try {
    switch (agentType) {
      case 'tax':
        await runTaxConsultantAgent(target);
        break;

      case 'ui':
        await runUIUXReviewerAgent(target);
        break;

      case 'backend':
        await runBackendDeveloperAgent(target);
        break;

      case 'all':
        await runTaxConsultantAgent('');
        await runUIUXReviewerAgent('http://localhost:5173');
        await runBackendDeveloperAgent('');
        break;

      default:
        log(`Unknown agent type: ${agentType}`, 'red');
        log('Valid types: tax, ui, backend, all', 'yellow');
        process.exit(1);
    }

    log('\n🎉 All reviews complete!', 'green');
  } catch (error) {
    log(`\n❌ Error: ${error}`, 'red');
    process.exit(1);
  }
}

main();
