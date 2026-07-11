# AGENTS.md

## Code Style Guide

**编码时必须查看**
@.agents/STYLE_GUIDE.md

## Icons

- 使用规范（强制）: @.agents/rules/icons-usage.md
- 设计规范（按需）: 调用 `icons-design` skill —— 视觉原则、registry 设计、自定义 SVG、迁移与验收策略

## Playwright

**使用 Playwright 前必读**
@.agents/PLAYWRIGHT_GUIDE.md

## Packages

### @packages/shared

简介：跨应用共享基础设施层——错误类型（InfraError）、缓存系统（CacheCore、MetaStore、QuotaManager）、日志（Logger）、HTTP请求抽象（IRequest、FetchRequest）。
指令：@packages/shared/AGENTS.md

### @packages/drive115

简介：115网盘API客户端，封装所有115 API调用（文件、视频、离线、用户、图片等）及加密逻辑，通过Drive115门面类统一暴露。
指令：@packages/drive115/AGENTS.md

### @packages/utils

简介：提供跨应用共享的通用工具函数（数组、字符串、数字、Promise、格式化、时间、文件等）。
指令：@packages/utils/AGENTS.md

### @packages/subtitle-source

简介：字幕来源客户端，对接各字幕网站（thunder射手网、subtitlecat等），提供统一字幕搜索与下载接口。
指令：@packages/subtitle-source/AGENTS.md

### @packages/tsconfig

简介：共享TypeScript配置（base.json、node.json、vue-app.json），各包通过extends引用。
指令：@packages/tsconfig/AGENTS.md

### @packages/eslint-config

简介：共享ESLint配置，基于@antfu/eslint-config，集成tailwindcss与格式化插件。
指令：@packages/eslint-config/AGENTS.md

---

## Apps

### @apps/monkey

简介：115网盘用户脚本（Tampermonkey），基于Vue 3 + Vite + vite-plugin-monkey构建，集成视频播放、字幕、文件管理等增强功能。
