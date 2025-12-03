# NurdWerks Chess

## Purpose
This repository contains **NurdWerks Chess**. The primary objective is to build a competitive chess engine from scratch using **Node.js**.

## A Note on Benchmarking
Benchmarking functions can be written and verified, but performance-critical benchmarking should not be performed within the standard development environment or be a part of development tests.

## UI Standards
*   **No `alert()`:** Never use the native `alert()` function. Instead, implement and use a non-blocking toast notification system.
*   **No `prompt()`:** Never use the native `prompt()` function. Instead, implement and use a proper modal dialog for user input.
