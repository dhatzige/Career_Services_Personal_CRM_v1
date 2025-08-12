# Developer Profile - Career Services CRM Project

## User Context
- **Technical Level**: Non-developer, but understands high-level concepts
- **Decision Maker**: Yes - makes architectural and feature decisions
- **Primary Concern**: Development velocity and flexibility
- **Communication Style**: Prefers clear explanations of what's possible/not possible

## Project Background
- **Project Type**: Career Services CRM for university career offices
- **Current Phase**: Active development with feature additions
- **Team Size**: Solo developer (AI-assisted)

## Current Pain Points
1. **Supabase Database Inflexibility**
   - Strict type constraints causing constant 400 errors
   - Cannot iterate quickly on features
   - Every change requires database migration
   - Schema mismatches between frontend expectations and database

2. **Development Friction**
   - "Clear Tag" feature broken due to connection issues
   - Need to constantly work around database constraints
   - Hard to add new types or fields

## Technical Environment
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: Currently using Supabase (both auth + data)
- **Local Database**: SQLite already set up and ready
- **Authentication**: Supabase Auth (working well, want to keep)
- **Deployment**: Local development environment

## Development Philosophy
- Prioritizes **flexibility** during development phase
- Values **security** and **best practices**
- Prefers **pragmatic solutions** over perfect ones
- Wants to **move fast** without breaking things

## Decision Making Criteria
When presenting options, consider:
1. **Development Speed**: Can we implement features quickly?
2. **Flexibility**: Can we change things without major rework?
3. **Security**: Is user data and authentication secure?
4. **Maintainability**: Will this create technical debt?
5. **Migration Path**: Can we easily move to production later?

## Communication Preferences
- Explain technical concepts in business terms
- Always provide pros/cons for decisions
- Be explicit about what's possible vs not possible
- Suggest best practices but be pragmatic
- Document important decisions and plans

## Current Goals
1. Remove database constraints blocking development
2. Complete core CRM features without interruption
3. Maintain secure authentication
4. Prepare for eventual production deployment