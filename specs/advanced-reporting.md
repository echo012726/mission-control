# Advanced Reporting - Feature Specification

## Overview
Build a custom report builder allowing users to create, visualize, and export reports from task data.

## Features

### 1. Report Builder UI
- Modal with report configuration options
- Select data source: Tasks, Portfolios, Time Entries, Karma
- Choose metrics: counts, completion rates, time spent, karma earned
- Group by: status, priority, portfolio, tag, date range

### 2. Chart Types
- Bar chart (horizontal/vertical)
- Pie/Donut chart
- Line chart (over time)
- Stat cards with big numbers

### 3. Report Templates
- Weekly Productivity Report
- Portfolio Health Overview
- Time Tracking Summary
- Karma & Engagement Report

### 4. Export Options
- Export as PNG (chart image)
- Export as CSV (raw data)
- Export as PDF (full report)
- Copy to clipboard

## Implementation
- Add "Reports" button in header
- Use Chart.js for visualizations (CDN)
- Build report configuration UI
- Add export functionality
- Store custom reports in localStorage

## Success Criteria
- [x] Report builder modal opens
- [x] Can select data source and metrics
- [x] Charts render correctly
- [x] At least 3 built-in templates
- [x] Export to PNG/CSV works
